from celery import Task
from core.celery import app


@app.task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 10},
)
def add_member(self: Task):
    ...
