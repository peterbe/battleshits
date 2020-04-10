from django.conf.urls import include, url


handler404 = "battleshits.base.views.handler404"


urlpatterns = [
    url(r"", include("battleshits.base.urls", namespace="base")),
    url(r"^api/", include("battleshits.api.urls", namespace="api")),
]
