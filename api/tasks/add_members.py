from apps.studx.models import Organization
from core.celery import app


@app.task(
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 10},
)
def add_member(organization_slug: str):
    try:
        Organization.objects.get(slug=organization_slug)
    except Organization.DoesNotExist:
        return
    ...
