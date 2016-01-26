import json

from django import http
from django.conf import settings
from django.middleware.csrf import CsrfViewMiddleware


class JsonBodyCsrfViewMiddleware(CsrfViewMiddleware):

    def process_view(self, request, view_func, view_args, view_kwargs):
        if getattr(view_func, 'csrf_exempt', False):
            return None
        try:
            body = json.loads(request.body)
            request.POST = request.POST.copy()

            csrfmiddlewaretoken = (
                request.META.get('HTTP_X_CSRFTOKEN') or
                body.get('csrfmiddlewaretoken')
            )
            if not csrfmiddlewaretoken:
                return http.JsonResponse(
                    {'error': 'Missing csrfmiddlewaretoken'},
                    status=403
                )
            request.POST['csrfmiddlewaretoken'] = csrfmiddlewaretoken
        except ValueError:
            if request.body and not request.path.startswith('/admin'):
                return http.JsonResponse(
                    {'error': 'Invalid request body'},
                    status=400
                )
        return super(JsonBodyCsrfViewMiddleware, self).process_view(
            request, view_func, view_args, view_kwargs
        )


class CORSExceptionMiddleware(object):

    def process_response(self, request, response):
        if not settings.DEBUG:
            return response

        # print "RESPONSE"
        # print repr(response)
        # print dir(response)
        if response.has_header('content-type'):
            if response['content-type'] == 'application/json':
                # let's hack it!
                # let's make it as insecure as possible
                # Don't ever let this be on in production!!
                response['Access-Control-Allow-Credentials'] = 'true'
                response['Access-Control-Allow-Origin'] = '*'
                response['Access-Control-Allow-Methods'] = (
                    'POST,GET,OPTIONS,PUT,DELETE'
                )
        return response
