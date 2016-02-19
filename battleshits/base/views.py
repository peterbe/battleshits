import re
import json
import logging
from pprint import pprint

from django import http
from django.views.defaults import page_not_found
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

from .models import Game


logger = logging.getLogger('battleshits.base')


def home(request):
    return http.HttpResponse('Nothing to see here\n')


def handler404(request, *args, **kwargs):
    if 1 or '/api/' in request.path:
        uri = request.path
        if request.META.get('QUERY_STRING'):
            uri += '?' + request.META['QUERY_STRING']
        return http.JsonResponse(
            {'error': 'Page not found {}'.format(uri)},
            status=404
        )
    return page_not_found(request, *args, **kwargs)


@csrf_exempt
def postmarkwebhook(request):
    print "REQUEST METHOD:", request.method
    payload = request.body
    try:
        body = json.loads(payload)
        print "PAYLOAD"
        pprint(body)
    except ValueError:
        print "Payload was not JSON"
    data = request.method == 'POST' and request.POST or request.GET
    for key, value in data.items():
        if value:
            print key.ljust(20), repr(value)
    return http.HttpResponse('OK')
