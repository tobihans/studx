import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv(
    "STUDX_SECRET_KEY",
    "django-insecure-(-%5bmj^4pf9_w&vw^-vol@#0sr6ncb--qg8)0(=*fg87)t=go",
)

DEBUG = os.getenv("DEBUG", False)

ALLOWED_HOSTS = list(filter(None, os.getenv("STUDX_ALLOWED_HOSTS", "").split(",")))

# Application definition

DEFAULT_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

FIRST_PARTY_APPS = ["apps.studx", "apps.auth"]

THIRD_PARTY_APPS = [
    "django_celery_beat",
    "drf_spectacular",
    "knox",
    "rest_framework",
    "notifications",
]

if DEBUG:
    THIRD_PARTY_APPS += ["django_extensions"]

INSTALLED_APPS = FIRST_PARTY_APPS + DEFAULT_APPS + THIRD_PARTY_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

FIXTURE_DIRS = [BASE_DIR / "fixtures"]

WSGI_APPLICATION = "core.wsgi.application"

# Database
# https://docs.djangoproject.com/en/4.1/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql_psycopg2",
        "NAME": os.getenv("STUDX_DB_NAME"),
        "USER": os.getenv("STUDX_DB_USER"),
        "PASSWORD": os.getenv("STUDX_DB_PASSWD"),
        "HOST": os.getenv("STUDX_DB_HOST"),
        "PORT": os.getenv("STUDX_DB_PORT"),
        "ATOMIC_REQUESTS": False,
        "AUTOCOMMIT": True,
        "CONN_MAX_AGE": 0,
        "CONN_HEALTH_CHECKS": False,
        "OPTIONS": {},
        "TIME_ZONE": "UTC",
    }
}

# Password validation
# https://docs.djangoproject.com/en/4.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
# https://docs.djangoproject.com/en/4.1/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.1/howto/static-files/

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "static"

MEDIA_ROOT = BASE_DIR / "media"
MEDIA_URL = "media/"

# Default primary key field type
# https://docs.djangoproject.com/en/4.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Based on https://learndjango.com/tutorials/django-custom-user-model
AUTH_USER_MODEL = "studx_auth.User"

REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.LimitOffsetPagination",
    "PAGE_SIZE": 100,
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "knox.auth.TokenAuthentication",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "djangorestframework_camel_case.render.CamelCaseJSONRenderer",
        "djangorestframework_camel_case.render.CamelCaseBrowsableAPIRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "djangorestframework_camel_case.parser.CamelCaseFormParser",
        "djangorestframework_camel_case.parser.CamelCaseMultiPartParser",
        "djangorestframework_camel_case.parser.CamelCaseJSONParser",
    ],
    "JSON_UNDERSCOREIZE": {
        "no_underscore_before_number": True,
    },
}

# OpenAPI 3.0 documentation
SPECTACULAR_SETTINGS = {
    "TITLE": "API for StudX SaaS",
    "DESCRIPTION": "An API for consuming a time tracking and management SaaS for schools",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "DISABLE_ERRORS_AND_WARNINGS": not DEBUG,
}

# Django notifications
DJANGO_NOTIFICATIONS_CONFIG = {"USE_JSONFIELD": True}

# Celery settings
CELERY_BROKER_URL = os.getenv("STUDX_REDIS_URL")

CELERY_RESULT_BACKEND = os.getenv("STUDX_REDIS_URL")

CELERY_IMPORTS = ("tasks",)

# JWT Settings
JWT_ALGORITHMS = ["HS256"]

# Email settings
DEFAULT_FROM_EMAIL = os.getenv("STUDX_DEFAULT_FROM_EMAIL")

if DEBUG:
    EMAIL_BACKEND = "django.core.mail.backends.filebased.EmailBackend"
    if not (EMAIL_FILE_PATH := BASE_DIR / "emails").exists():
        EMAIL_FILE_PATH.mkdir(parents=True, exist_ok=True)
else:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

    EMAIL_HOST = os.getenv("STUDX_EMAIL_HOST")

    EMAIL_HOST_USER = os.getenv("STUDX_EMAIL_HOST_USER")

    EMAIL_HOST_PASSWORD = os.getenv("STUDX_EMAIL_HOST_PASSWORD")

# Logging
LOGS_DIR = Path(BASE_DIR) / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[%(asctime)s] %(levelname)s [%(pathname)s: %(name)s.%(funcName)s:%(lineno)s]:%(message)s",
            "datefmt": "%d/%b/%Y %H:%M:%S",
        },
        "simple": {"format": "%(levelname)s %(message)s"},
    },
    "handlers": {
        "console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
        },
        "django_log_file": {
            "level": "DEBUG",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOGS_DIR / "django.log",
            "maxBytes": 1024 * 1024 * 100,  # 100 MB
            "backupCount": 10,
            "formatter": "verbose",
        },
        "application_log_file": {
            "level": "DEBUG",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOGS_DIR / "application.log",
            "maxBytes": 1024 * 1024 * 100,  # 100 MB
            "backupCount": 10,
            "formatter": "verbose",
        },
        "500_errors_log_file": {
            "level": "DEBUG",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOGS_DIR / "500_errors_log_file.log",
            "maxBytes": 1024 * 1024 * 100,  # 100 MB
            "backupCount": 10,
            "formatter": "verbose",
        },
    },
    "loggers": {
        "application": {
            "level": "DEBUG",
            "handlers": ["application_log_file"],
        },
        "django": {
            "level": "INFO",
            "handlers": ["console", "django_log_file"],
            "propagate": True,
        },
        "django.request": {
            "handlers": ["500_errors_log_file"],
            "level": "ERROR",
            "propagate": True,
        },
    },
}
