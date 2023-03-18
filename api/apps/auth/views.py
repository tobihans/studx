from operator import itemgetter

import jwt
from apps.auth.serializers import SignupRequestSerializer, UserSerializer
from django.conf import settings
from django.contrib.auth import get_user_model, login
from django.http import Http404, QueryDict
from django.shortcuts import render
from django.urls import reverse
from drf_spectacular.utils import extend_schema
from knox.views import LoginView as KnoxLoginView
from rest_framework import permissions, status
from rest_framework.authtoken.serializers import AuthTokenSerializer
from rest_framework.views import APIView, Request, Response
from tasks.email import email_task

User = get_user_model()


class SignupView(APIView):
    @extend_schema(
        request=SignupRequestSerializer,
        responses={201: None, 400: dict},
    )
    def post(self, request: Request) -> Response:
        serializer = SignupRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username, email, password = itemgetter("username", "email", "password")(
            serializer.validated_data
        )

        _ = User.objects.create_user(username, email, password, is_active=False)
        query_params = QueryDict("", mutable=True)
        query_params["token"] = jwt.encode(
            {"email": email},
            settings.SECRET_KEY,
            algorithm=settings.JWT_ALGORITHMS[0],
        )
        link = request.build_absolute_uri(
            f"{reverse('studx_auth:verify_email')}?{query_params.urlencode()}"
        )

        email_task.delay(
            "Email verification",
            email,
            template_name="emails/verification.html",
            template_context={
                "link": link,
                "username": username,
            },
        )
        return Response(None, status=status.HTTP_201_CREATED)


class SigninView(KnoxLoginView):
    permission_classes = (permissions.AllowAny,)

    @extend_schema(
        request=AuthTokenSerializer,
        responses={200: dict, 400: dict},
    )
    def post(self, request):
        serializer = AuthTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        login(request, user)
        return super(SigninView, self).post(request, format=format)


class VerifyEmailView(APIView):
    def get(self, request: Request):
        token = request.GET["token"]
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=settings.JWT_ALGORITHMS
        )
        user = User.objects.get(email=(payload["email"]))

        if not user.is_active:
            user.is_active = True
            user.save()

            return render(
                request,
                "blank.html",
                {"text": "Email verified. You can close this page now."},
            )

        raise Http404()


class WhoAmIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request):
        serializer = UserSerializer(request.user)

        return Response(serializer.data)
