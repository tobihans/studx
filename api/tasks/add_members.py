import polars as pl
from celery.utils.log import logging
from django.contrib.auth.hashers import make_password

from apps.auth.models import User
from apps.studx.models import Organization, OrganizationMembership
from core import settings
from core.celery import app


@app.task(
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 10},
)
def add_members(organization_slug: str, filepath: str) -> tuple[int, int]:
    """
    Add members to Organization in bulk.

    :param organization_slug: The slug of the corresponding organization.
    :param filepath: The name of the CSV file to pick from settings.MEDIA_ROOT for the operation.
    """

    count_updated, count_created = 0, 0

    try:
        org = Organization.objects.get(slug=organization_slug)
    except Organization.DoesNotExist:
        logging.error("No such Organization: Organization(%s)", organization_slug)
        return

    df = pl.read_csv(settings.MEDIA_ROOT / filepath)

    for row in df.iter_rows(named=False):
        print("iter")
        [username, role] = row

        user, _ = User.objects.get_or_create(
            username=username,
            defaults={
                "username": username,
                "password": make_password(f"{username}-t3m9p"),
            },
        )

        _, created = OrganizationMembership.objects.update_or_create(
            org=org,
            user=user,
            defaults={"user": user, "org": org, "role": role.lower()},
        )

        if created:
            count_created += 1
        else:
            count_updated += 1

    return count_updated, count_created
