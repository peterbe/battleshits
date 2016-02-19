from django.conf.urls import patterns, include, url
from django.contrib import admin

import battleshits.base.urls
import battleshits.api.urls


handler404 = 'battleshits.base.views.handler404'


urlpatterns = [
    url(r'', include(battleshits.base.urls, namespace='base')),
    url(r'^api/', include(battleshits.api.urls, namespace='api')),
]
