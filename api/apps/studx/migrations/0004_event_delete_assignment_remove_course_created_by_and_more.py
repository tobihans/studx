# Generated by Django 4.1.4 on 2023-02-03 21:32

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("studx", "0003_alter_organizationmembership_unique_together"),
    ]

    operations = [
        migrations.CreateModel(
            name="Event",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("title", models.CharField(max_length=100)),
                ("description", models.CharField(max_length=255)),
                ("meeting_id", models.CharField(blank=True, max_length=100, null=True)),
                ("starts_at", models.DateTimeField()),
                ("ends_at", models.DateTimeField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "attendees",
                    models.ManyToManyField(
                        related_name="events", to=settings.AUTH_USER_MODEL
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_events",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.DeleteModel(
            name="Assignment",
        ),
        migrations.RemoveField(
            model_name="course",
            name="created_by",
        ),
        migrations.RemoveField(
            model_name="course",
            name="members",
        ),
        migrations.RemoveField(
            model_name="coursemembership",
            name="course",
        ),
        migrations.RemoveField(
            model_name="coursemembership",
            name="user",
        ),
        migrations.DeleteModel(
            name="Submission",
        ),
        migrations.DeleteModel(
            name="Course",
        ),
        migrations.DeleteModel(
            name="CourseMembership",
        ),
    ]
