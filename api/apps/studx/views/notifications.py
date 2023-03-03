from notifications.models import Notification
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.request import Request
from rest_framework.response import Response

from apps.studx.serializers import NotificationSerializer


class NotificationsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request: Request):
        paginator = LimitOffsetPagination()
        queryset = request.user.notifications.all()
        page = paginator.paginate_queryset(queryset, request)
        serializer = NotificationSerializer(page, many=True)

        return paginator.get_paginated_response(serializer.data)

    @action(detail=False)
    def unread(self, request: Request):
        paginator = LimitOffsetPagination()
        queryset = request.user.notifications.unread()
        page = paginator.paginate_queryset(queryset, request)
        serializer = NotificationSerializer(page, many=True)

        return paginator.get_paginated_response(serializer.data)

    @action(detail=False)
    def read(self, request: Request):
        paginator = LimitOffsetPagination()
        queryset = request.user.notifications.read()
        page = paginator.paginate_queryset(queryset, request)
        serializer = NotificationSerializer(page, many=True)

        return paginator.get_paginated_response(serializer.data)

    @action(detail=True, methods=["POST"])
    def mark_as_read(self, request: Request, pk: int):
        if Notification.objects.filter(unread=True, pk=pk).update(unread=False):
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=["POST"])
    def mark_all_as_read(self, request: Request):
        request.user.notifications.all().mark_all_as_read()
        return Response(status=status.HTTP_202_ACCEPTED)

    def destroy(self, request: Request, pk: int):
        if Notification.objects.filter(unread=True, pk=pk).delete():
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=["DELETE"])
    def delete_all(self, request: Request):
        request.user.notifications.all().delete()
        print(request.user.notifications.all())
        return Response(status=status.HTTP_202_ACCEPTED)
