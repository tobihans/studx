from uuid import uuid4

from django.db import models
from django.utils.text import slugify


def generate_slug(instance: models.Model, from_field: str, slug_field: str = "slug"):
    """Generate a slug

    The slug is generated, based on a model field and checked against a given slug field.
    Inspired by https://studygyaan.com/django/how-to-create-a-unique-slug-in-django.
    """

    base_slug = slugify(getattr(instance, from_field), allow_unicode=False)
    slug = base_slug

    while instance.__class__.objects.filter(**{f"{slug_field}": slug}):
        slug = f"{base_slug}-${str(uuid4())[9:18]}"

    return slug
