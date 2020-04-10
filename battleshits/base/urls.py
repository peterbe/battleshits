from django.conf.urls import url

from . import views


app_name = "base"

urlpatterns = [
    url(r"^$", views.home, name="home"),
    url(r"^postmarkwebhook$", views.postmarkwebhook, name="postmarkwebhook"),
]
