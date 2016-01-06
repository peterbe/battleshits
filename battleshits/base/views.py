import re
import json
import logging

from django import http
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

from .models import Game


logger = logging.getLogger('battleshits.base')


@csrf_exempt
def home(request):
    payload = request.body
    try:
        body = json.loads(payload)
    except ValueError:
        return http.HttpResponseBadRequest("Not a valid JSON payload")

    print repr(settings.AUTH_USER_MODEL)
    return http.HttpResponse("OK\n", status=201)
