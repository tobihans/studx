import uuid
from pathlib import Path

from django.contrib.auth import get_user_model
from django.utils import timezone
from notifications.signals import notify
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.request import Request
from rest_framework.response import Response

from apps.studx.models import Organization, OrganizationMembership

from ..serializers import (
    AddMemberSerializer,
    CreateOrganizationSerializer,
    OrganizationMembershipSerializer,
    OrganizationMembersSerializer,
    OrganizationSerializer,
)

User = get_user_model()


class OrganizationViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "slug"

    def list(self, request: Request):
        paginator = LimitOffsetPagination()
        queryset = Organization.objects.filter(
            deleted_at=None, archived_at=None, members=request.user
        )
        page = paginator.paginate_queryset(queryset, request)
        serializer = OrganizationSerializer(page, many=True)

        return paginator.get_paginated_response(serializer.data)

    def create(self, request: Request):
        serializer = CreateOrganizationSerializer(data=request.data)

        if serializer.is_valid():
            organization = serializer.save(created_by=request.user)
            OrganizationMembership.objects.create(
                org=organization,
                user=request.user,
                role=OrganizationMembership.Role.ADMIN,
            )
            return Response(
                OrganizationSerializer(organization).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request: Request, slug: str):
        membership = (
            request.user.org_membership.prefetch_related("org")
            .filter(org__slug=slug)
            .first()
        )

        return (
            Response(status=status.HTTP_404_NOT_FOUND)
            if membership is None
            else Response(OrganizationSerializer(membership.org).data)
        )

    def update(self, request: Request, slug: str):
        try:
            organization = Organization.objects.get(slug=slug)
            serializer = OrganizationSerializer(organization, data=request.data)

            if serializer.is_valid():
                serializer.save()
                return Response(status=status.HTTP_204_NO_CONTENT)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Organization.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=["POST"])
    def picture(self, request: Request, slug: str):
        try:
            org = Organization.objects.get(slug=slug)
            org.picture.save(
                f"{uuid.uuid4()}{Path(request.FILES['image'].name).suffix}",
                request.FILES["image"],
            )
            org.save()
            return Response({"picture": org.picture.url}, status=status.HTTP_200_OK)
        except Organization.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=["POST"])
    def archive(self, request: Request, slug: str):
        count = Organization.objects.filter(slug=slug).update(
            archived_at=timezone.now()
        )

        return (
            Response(status=status.HTTP_204_NO_CONTENT)
            if count
            else Response(status=status.HTTP_404_NOT_FOUND)
        )

    def destroy(self, request: Request, slug: str):
        count = Organization.objects.filter(slug=slug).update(deleted_at=timezone.now())

        return (
            Response(status=status.HTTP_204_NO_CONTENT)
            if count
            else Response(status=status.HTTP_404_NOT_FOUND)
        )

    #######################################
    # Membership Endpoints
    #######################################

    @action(detail=True, url_path=r"members", methods=["GET"])
    def members(self, request: Request, slug: str):
        paginator = LimitOffsetPagination()
        queryset = OrganizationMembership.objects.filter(org__slug=slug)
        page = paginator.paginate_queryset(queryset, request)
        serializer = OrganizationMembersSerializer(page, many=True)

        return paginator.get_paginated_response(serializer.data)

    @members.mapping.post
    def add_or_update_member(self, request: Request, slug: str):
        serializer = AddMemberSerializer(data=request.data)
        if serializer.is_valid():
            try:
                org = Organization.objects.get(slug=slug)
                user = User.objects.get(username=serializer.validated_data["username"])
                membership, created = OrganizationMembership.objects.update_or_create(
                    org=org,
                    user=user,
                    defaults={"role": serializer.validated_data["role"]},
                )

                if created:
                    notify.send(
                        request.user,
                        verb="added",
                        action_object=User.objects.get(
                            username=serializer.validated_data["username"]
                        ),
                        target=Organization.objects.get(slug=slug),
                        recipient=User.objects.filter(organizations__slug=slug),
                    )
                else:
                    notify.send(
                        request.user,
                        verb="changed the status of",
                        action_object=User.objects.get(
                            username=serializer.validated_data["username"]
                        ),
                        target=Organization.objects.get(slug=slug),
                        recipient=User.objects.filter(organizations__slug=slug),
                    )

                return Response(
                    OrganizationMembersSerializer(membership).data,
                    status=status.HTTP_201_CREATED,
                )
            except (User.DoesNotExist, Organization.DoesNotExist):
                return Response(
                    {"nonFieldErrors": ["Invalid data"]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, url_path=r"membership/(?P<username>\w+)", methods=["GET"])
    def membership(self, request: Request, slug: str, username: str):
        membership = OrganizationMembership.objects.filter(
            org__slug=slug, user__username=username
        ).first()

        return (
            Response(status=status.HTTP_404_NOT_FOUND)
            if membership is None
            else Response(OrganizationMembershipSerializer(membership).data)
        )

    @membership.mapping.delete
    def delete_membership(self, request: Request, slug: str, username: str):
        count = OrganizationMembership.objects.filter(
            user__username=username, org__name=slug
        ).delete()

        if count:
            notify.send(
                request.user,
                verb="removed",
                action_object=User.objects.get(username=username),
                target=Organization.objects.get(slug=slug),
                recipient=User.objects.filter(organizations__slug=slug),
            )

        return Response(status=status.HTTP_202_ACCEPTED)
