#!/bin/sh

python manage.py collectstatic --no-input
gunicorn core.wsgi:application --bind 0.0.0.0:"${PORT:-8000}"
