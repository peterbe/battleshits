from django.db import models
from django.utils import timezone
from django.conf import settings

from jsonfield import JSONField


class Game(models.Model):
    player1 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='player1',
    )
    player2 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='player2',
        null=True
    )

    state = JSONField()

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
