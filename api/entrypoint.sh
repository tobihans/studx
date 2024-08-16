#!/bin/sh

python manage.py collectstatic --no-input
gunicorn app.wsgi:application --bind 0.0.0.0:"${PORT:-8000}"
