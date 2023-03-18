from apps.auth.models import User
from django.db import models
from helpers import generate_slug


class Organization(models.Model):
    """The entity which groups all the activities."""

    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=255, null=True, blank=True, unique=True)
    about = models.TextField(blank=True, null=True)
    picture = models.ImageField(max_length=255, null=True, blank=True)
    members = models.ManyToManyField(
        User, through="OrganizationMembership", related_name="organizations"
    )
    created_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    archived_at = models.DateTimeField(null=True)
    deleted_at = models.DateTimeField(null=True)


class OrganizationMembership(models.Model):
    """"""

    class Role(models.TextChoices):
        ADMIN = "admin", "ADMIN"
        TEACHER = "teacher", "TEACHER"
        STUDENT = "student", "STUDENT"

    org = models.ForeignKey(
        "Organization", db_column="organization_id", on_delete=models.CASCADE
    )
    user = models.ForeignKey(
        User, related_name="org_membership", on_delete=models.CASCADE
    )
    role = models.CharField(max_length=50, choices=Role.choices, default=Role.STUDENT)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("org", "user")


class Event(models.Model):
    title = models.CharField(max_length=100)
    description = models.CharField(max_length=255)
    meeting_id = models.CharField(max_length=100, null=True, blank=True)
    attendees = models.ManyToManyField(User, related_name="events")
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    org = models.ForeignKey(
        Organization,
        related_name="events",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
    )
    created_by = models.ForeignKey(
        User,
        related_name="created_events",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


def add_slug(sender, instance, *args, **kwargs):
    if not instance.slug:
        instance.slug = generate_slug(instance, "name")


# Generate slugs for the following models
models.signals.pre_save.connect(add_slug, Organization)
