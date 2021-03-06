from django.conf.urls import url

from . import views


app_name = "api"

urlpatterns = [
    url(r"^signedin$", views.signedin, name="signedin"),
    url(r"^login$", views.login, name="login"),
    url(r"^save$", views.save, name="save"),
    url(r"^games$", views.list_games, name="list"),
    url(r"^game$", views.game, name="game"),
    url(r"^profile$", views.profile, name="profile"),
    url(r"^mailme$", views.mailme, name="mailme"),
    url(r"^invite$", views.invite, name="invite"),
    url(r"^invitation$", views.invitation, name="invitation"),
    url(r"^invitations$", views.invitations, name="invitations"),
    url(r"^sendinvitation$", views.sendinvitation, name="sendinvitation"),
    url(r"^start$", views.start, name="start"),
    url(r"^bomb$", views.bombed, name="bombed"),
    url(r"^abandon$", views.abandon, name="abandon"),
    url(r"^messages$", views.messages, name="messages"),
]
