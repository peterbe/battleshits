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

    winner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='winner',
        null=True
    )

    # true if the opponent is the computer
    ai = models.BooleanField(default=False)
    turn = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='turn',
        null=True
    )

    state = JSONField()
    gameover = models.BooleanField(default=False)
    abandoned = models.BooleanField(default=False)

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)


class Message(models.Model):
    game = models.ForeignKey(Game)
    user = models.ForeignKey(settings.AUTH_USER_MODEL)
    read = models.BooleanField(default=False)
    message = models.TextField()
    created = models.DateTimeField(auto_now_add=True)
