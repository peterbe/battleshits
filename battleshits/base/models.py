from django.db import models
from django.utils import timezone
from django.conf import settings

from jsonfield import JSONField


class Game(models.Model):
    player1 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="player1",
        on_delete=models.deletion.CASCADE,
    )
    player2 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="player2",
        null=True,
        on_delete=models.deletion.CASCADE,
    )

    winner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="winner",
        null=True,
        on_delete=models.deletion.CASCADE,
    )

    # true if the opponent is the computer
    ai = models.BooleanField(default=False)
    turn = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="turn",
        null=True,
        on_delete=models.deletion.CASCADE,
    )

    state = JSONField()
    gameover = models.BooleanField(default=False)
    abandoned = models.BooleanField(default=False)

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)


class Message(models.Model):
    game = models.ForeignKey(Game, on_delete=models.deletion.CASCADE)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.deletion.CASCADE
    )
    read = models.BooleanField(default=False)
    message = models.TextField()
    created = models.DateTimeField(auto_now_add=True)


class Bomb(models.Model):
    game = models.ForeignKey(Game, on_delete=models.deletion.CASCADE)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.deletion.CASCADE
    )
    index = models.PositiveIntegerField()
    new_cell_state = models.PositiveIntegerField(default=1)
    created = models.DateTimeField(auto_now_add=True)


class LogInCode(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.deletion.CASCADE
    )
    code = models.CharField(max_length=100)
    used = models.BooleanField(default=False)
    created = models.DateTimeField(auto_now_add=True)


class Invitation(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.deletion.CASCADE
    )
    code = models.CharField(max_length=100)
    users = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="users")
    rules = JSONField()
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
