# -*- coding: utf-8 -*-
# Generated by Django 1.9.1 on 2016-02-02 17:01
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0002_game_turn'),
    ]

    operations = [
        migrations.AddField(
            model_name='game',
            name='abandoned',
            field=models.BooleanField(default=False),
        ),
    ]
