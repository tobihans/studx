from django.db.models import Q
from django.http import Http404
from django.shortcuts import get_object_or_404
from notifications.signals import notify
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.studx.models import Event, Organization, OrganizationMembership
from apps.studx.serializers import CreateEventSerializer, EventSerializer


class EventsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request: Request, org_slug: str):
        return Response(
            EventSerializer(
                Event.objects.filter(
                    Q(org__slug=org_slug)
                    & (
                        Q(created_by=request.user)
                        | Q(attendees=request.user)
                        | Q(attendees=None)
                        # | Q(
                        #     org__members=request.user,
                        #     org__organizationmembership__role=OrganizationMembership.Role.ADMIN,
                        # )
                    )
                ),
                many=True,
            ).data
        )

    def create(self, request: Request, org_slug: str):
        serializer = CreateEventSerializer(data=request.data)

        try:
            org = Organization.objects.get(slug=org_slug)
        except Organization.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if serializer.is_valid():
            event = serializer.save(created_by=request.user, org=org)

            return Response(EventSerializer(event).data, status=status.HTTP_201_CREATED)
        else:
            return Response(status=status.HTTP_400_BAD_REQUEST)

    def update(self, request: Request, org_slug: str, pk: int):
        return Response(status=status.HTTP_204_NO_CONTENT)

    def destroy(self, request: Request, org_slug: str, pk: int):
        try:
            event = Event.objects.get(pk=pk, org__slug=org_slug)
        except Event.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if (
            request.user == event.created_by
            or OrganizationMembership.objects.filter(
                user=request.user, role=OrganizationMembership.Role.ADMIN
            ).exists()
        ):
            for attendee in event.attendees.all():
                notify.send(
                    request.user,
                    verb="removed the event",
                    action_object=event,
                    target=event.org,
                    recipient=attendee,
                )
            event.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

    # See https://stackoverflow.com/a/18516125/15021293 for UUID regex
    @action(
        detail=False,
        url_path=r"by-id/(?P<meeting_id>[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12})",
        methods=["GET"],
    )
    def event_by_meeting_id(self, request: Request, org_slug: str, meeting_id: str):
        event = get_object_or_404(
            Event, meeting_id__iexact=meeting_id, org__slug=org_slug
        )

        attendees = event.attendees.all()
        print(attendees, event.created_by)

        if (
            event.created_by != request.user
            and len(attendees) > 0
            and request.user not in attendees
        ):
            raise Http404()

        return Response(EventSerializer(event).data, status=status.HTTP_200_OK)
