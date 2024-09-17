#!/bin/sh

python manage.py collectstatic --no-input
# FIXME: starting celery in background here, since it doesn't have that much task for now.
celery -A core worker > /var/celery.log 2>&1 &
gunicorn core.wsgi:application --bind 0.0.0.0:"${PORT:-8000}"
