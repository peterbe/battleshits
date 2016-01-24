# -*- coding: utf-8 -*-
# Generated by Django 1.9.1 on 2016-01-24 01:20
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('base', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='game',
            name='turn',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='turn', to=settings.AUTH_USER_MODEL),
        ),
    ]