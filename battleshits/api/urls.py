from django.conf.urls import patterns, url

from . import views


urlpatterns = [
    url(
        r'^signedin$',
        views.signedin,
        name='signedin'
    ),
    url(
        r'^login$',
        views.login,
        name='login'
    ),
    url(
        r'^save$',
        views.save,
        name='save'
    ),
    url(
        r'^games$',
        views.list_games,
        name='list'
    ),
    url(
        r'^profile$',
        views.profile,
        name='profile'
    ),
    url(
        r'^start$',
        views.start,
        name='start'
    ),
    url(
        r'^bomb$',
        views.bombed,
        name='bombed'
    ),
    url(
        r'^abandon$',
        views.abandon,
        name='abandon'
    ),
]
