# Generated by Django 4.1.4 on 2023-02-03 22:10

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("studx", "0004_event_delete_assignment_remove_course_created_by_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="event",
            name="org",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="events",
                to="studx.organization",
            ),
        ),
    ]
