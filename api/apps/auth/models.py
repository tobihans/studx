from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    picture = models.ImageField(null=True, blank=True)
    settings = models.JSONField(default=dict)

    def __str__(self) -> str:
        return self.username
