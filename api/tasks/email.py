from celery import Task
from django.core.mail import EmailMessage
from django.template.loader import render_to_string

from core.celery import app


@app.task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 10},
)
def email_task(
    self: Task,
    subject: str,
    to: str,
    content: str | None = None,
    template_name: str | None = None,
    template_context: dict[str, str] | None = None,
    from_email: str | None = None,
    mime: str = "html",
):
    """Send an email_msg following a given template"""

    email_content = (
        content or render_to_string(template_name, template_context)
        if template_name
        else None
    )
    if not email_content:
        return

    email_msg = EmailMessage(
        subject=subject, body=email_content, to=(to,), from_email=from_email
    )
    email_msg.content_subtype = mime

    if not email_msg.send():
        raise self.retry(countdown=5)
