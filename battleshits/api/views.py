import json
import logging
import uuid

from django import http
from django.template.context_processors import csrf
from django.utils.functional import wraps
from django.views.decorators.http import require_POST
from django.forms.models import model_to_dict
from django.views.decorators.csrf import csrf_exempt
from django.contrib import auth
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.conf import settings

from battleshits.base.models import Game


logger = logging.getLogger('battleshits.api')


def xhr_login_required(view_func):
    """similar to django.contrib.auth.decorators.login_required
    except instead of redirecting it returns a 403 message if not
    authenticated."""
    @wraps(view_func)
    def inner(request, *args, **kwargs):
        if not request.user.is_authenticated():
            return http.HttpResponse(
                json.dumps({'error': "You must be logged in"}),
                content_type='application/json',
                status=403
            )
        return view_func(request, *args, **kwargs)

    return inner


def signedin(request):
    if request.user.is_authenticated():
        data = {
            'username': request.user.username,
            'email': request.user.email,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
        }
    else:
        data = {
            'username': None,
        }
    t = csrf(request)
    data['csrf_token'] = str(t['csrf_token'])
    return http.JsonResponse(data)


def random_username():
    return uuid.uuid4().hex[:30]


@require_POST
def login(request):
    assert not request.user.is_authenticated()
    user = get_user_model().objects.create(
        username=random_username(),
    )
    user.set_unusable_password()
    user.save()
    user.backend = settings.AUTHENTICATION_BACKENDS[0]
    request.user = user
    auth.login(request, user)
    # data = json.loads(request.body)
    return signedin(request)


def csrfmiddlewaretoken(request):
    t = csrf(request)
    return http.JsonResponse({
        'csrf_token': str(t['csrf_token'])
    })


@require_POST
@xhr_login_required
def save(request):
    data = json.loads(request.body)
    # print "DATA"
    # from pprint import pprint
    # pprint(data)
    if 'game' in data:
        game = data['game']
        game_id = game['id']
        if game_id < 0:
            # it's never been saved before
            player2_id = game['opponent'].get('id')
            if player2_id:
                player2 = get_user_model().objects.get(id=player2_id)
            else:
                player2 = None
            game_obj = Game.objects.create(
                player1=request.user,
                player2=player2,
                state=game
            )
            game_obj.state['id'] = game_obj.id
            game_obj.save()
        else:
            game_obj = Game.objects.get(id=game_id)
            game_obj.state = game
            if game['gameover']:
                game_obj.gameover = True
                if game['you']['winner']:
                    game_obj.winner = request.user
                elif game['opponent']['winner']:
                    if player2:
                        game_obj.winner = player2
                    else:
                        assert game['opponent']['ai']
            game_obj.save()
        return http.JsonResponse({'id': game_obj.id})
    else:
        raise NotImplementedError(data)


@xhr_login_required
def list_games(request):
    games_base_qs = Game.objects.filter(
        Q(player1=request.user) | Q(player2=request.user)
    )
    games = games_base_qs.filter(gameover=False).order_by('-modified')
    states = [x.state for x in games]
    wins = games_base_qs.filter(gameover=True).filter(winner=request.user)
    losses = games_base_qs.filter(gameover=True).exclude(winner=request.user)
    stats = {
        'wins': wins.count(),
        'losses': losses.count(),
    }
    return http.JsonResponse({'games': states, 'stats': stats})


@require_POST
@xhr_login_required
def profile(request):
    data = json.loads(request.body)
    if data.get('name'):
        request.user.first_name = data['name']
        request.user.save()
    return http.JsonResponse({'ok': True})
