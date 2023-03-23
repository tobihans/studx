from functools import reduce
from uuid import uuid4

from django.contrib.auth import get_user_model
from notifications.models import Notification
from notifications.signals import notify
from rest_framework import serializers

from apps.auth.serializers import UserSerializer
from apps.studx.models import Event, Organization, OrganizationMembership
from helpers import generate_slug


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ("name", "slug", "about", "picture", "created_at")

    def update(self, instance, validated_data):
        slug = instance.slug
        name = instance.name

        for field, value in validated_data.items():
            setattr(instance, field, value or getattr(instance, field))

        if validated_data["name"] != name:
            slug = generate_slug(instance, "name")
            print(slug)

        instance.slug = slug
        instance.save()

        return instance


class CreateOrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ("name", "about")

    def create(self, validated_data):
        data = {**validated_data}

        return Organization.objects.create(**data)

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value or getattr(instance, field))
        instance.save()

        return instance


class OrganizationMembershipSerializer(serializers.ModelSerializer):
    org = OrganizationSerializer()
    user = UserSerializer()

    class Meta:
        model = OrganizationMembership
        fields = ("org", "user", "role", "joined_at")


class OrganizationMembersSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = OrganizationMembership
        fields = ("user", "role", "joined_at")


class AddMemberSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=255)
    role = serializers.ChoiceField(choices=OrganizationMembership.Role.choices)

    class Meta:
        fields = ("username", "role")


class GenericNotificationRelatedField(serializers.RelatedField):
    def to_representation(self, value):
        data = None

        if isinstance(value, get_user_model()):
            data = {**UserSerializer(value).data, "type": "User"}
        elif isinstance(value, Organization):
            data = {**OrganizationSerializer(value).data, "type": "Organization"}
        elif isinstance(value, Event):
            data = {**EventSerializer(value).data, "type": "Event"}
        # TODO: Implements remaining serializers that will be used in notifications
        return data


class NotificationSerializer(serializers.ModelSerializer):
    actor = GenericNotificationRelatedField(read_only=True)
    target = GenericNotificationRelatedField(read_only=True)
    action_object = GenericNotificationRelatedField(read_only=True)

    class Meta:
        model = Notification
        fields = ("pk", "actor", "action_object", "verb", "target", "timestamp")


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = (
            "pk",
            "title",
            "description",
            "meeting_id",
            "attendees",
            "starts_at",
            "ends_at",
            "created_at",
        )


class CreateEventSerializer(serializers.ModelSerializer):
    attendees = serializers.CharField()
    add_meeting_link = serializers.BooleanField()

    class Meta:
        model = Event
        fields = (
            "title",
            "description",
            "add_meeting_link",
            "attendees",
            "starts_at",
            "ends_at",
        )

    def create(self, validated_data):
        if validated_data["add_meeting_link"]:
            validated_data["meeting_id"] = f"{uuid4()}"

        del validated_data["add_meeting_link"]

        attendees = filter(
            None,
            reduce(
                lambda acc, val: [*acc, *val],
                [
                    string.split(",")
                    for string in validated_data["attendees"].split("\n")
                ],
                [],
            ),
        )
        attendees = [
            member.user
            for member in OrganizationMembership.objects.prefetch_related(
                "user"
            ).filter(org=validated_data["org"], user__username__in=attendees)
        ]

        del validated_data["attendees"]

        event = Event.objects.create(**validated_data)
        event.attendees.set(attendees)
        event.save()

        # Notify users that they have been added to the event
        for user in attendees:
            notify.send(
                validated_data["created_by"],
                verb="added",
                action_object=event,
                target=validated_data["org"],
                recipient=user,
            )

        return event
