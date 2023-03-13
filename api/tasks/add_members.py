from celery.utils.log import logging
import polars as pl

from apps.studx.models import Organization
from core.celery import app
from core import settings


@app.task(
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 10},
)
def add_member(organization_slug: str, filepath: str):
    try:
        Organization.objects.get(slug=organization_slug)
    except Organization.DoesNotExist:
        logging.error("No such Organization: Organization(%s)", organization_slug)
        return

    absolute_path = settings.MEDIA_ROOT / filepath
    df = pl.read_csv(absolute_path)

    print(df.head())
