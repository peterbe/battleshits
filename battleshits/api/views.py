import copy
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
                state=game,
                ai=game['opponent']['ai'],
            )
            game_obj.state['id'] = game_obj.id

            game_obj.save()
        else:
            game_obj = Game.objects.get(id=game_id)
            if game_obj.player2 == request.user:
                # If you're player2, we need to invert the state.
                # But had player1 finished designing?
                designmode = game_obj.state['you']['designmode']
                game = invert_state(game)
            # raise Exception
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
    states = []
    waiting = []
    for game in games:
        if not game.player2 and not game.ai:
            waiting.append(game.id)
        elif game.player2 == request.user:
            states.append(invert_state(game.state))
        else:
            states.append(game.state)

    # if not waiting and states:
    #     print "WAITING"
    #     print waiting
    #     print "STATES"
    #     from pprint import pprint
    #     pprint(states[0])
    wins = games_base_qs.filter(gameover=True).filter(winner=request.user)
    losses = games_base_qs.filter(gameover=True).exclude(winner=request.user)
    stats = {
        'wins': wins.count(),
        'losses': losses.count(),
    }
    return http.JsonResponse({
        'games': states,
        'stats': stats,
        'waiting': waiting,
    })


@require_POST
@xhr_login_required
def profile(request):
    data = json.loads(request.body)
    if data.get('name'):
        request.user.first_name = data['name']
        request.user.save()
    return http.JsonResponse({
        'first_name': request.user.first_name,
        'email': request.user.email,
        'username': request.user.username,
    })


def invert_state(state):
    """if you have the state of a game, it's written such that there's keys
    called "you", "your" and "opponent". Let's create a copy of this state
    where the "you" and "opponent" is inverted."""
    inverted = copy.deepcopy(state)
    inverted['yourturn'] = not inverted['yourturn']
    opponent = state['opponent']
    you = state['you']
    inverted['opponent'] = you
    inverted['you'] = opponent
    return inverted


@require_POST
@xhr_login_required
def start_game(request):
    data = json.loads(request.body)
    if data.get('ids'):
        # if you have a game ID, you're waiting for that game to start
        raise NotImplementedError
    elif data.get('game'):
        game = data['game']
        if not request.user.first_name:
            return http.HttpResponseBadRequest("you haven't set your name yet")
        # should do some sanity checks here perhaps

        # find any started games that don't have a player2
        games = Game.objects.filter(
            ai=False,
            gameover=False,
            player2__isnull=True
        )
        for other in games:
            # If the person who started it hasn't "designed" it yet
            # (aka. placed their ships) then this isn't ready yet.
            if other.state['you']['designmode']:
                print "Skip game that is still in design mode"
                continue
            # print "COMPARE"
            # print other.state['rules']
            # print '-' * 20
            # print game['rules']
            if other.state['rules'] == game['rules']:
                # we have a match!
                other.player2 = request.user
                other.state['opponent']['name'] = request.user.first_name
                other.save()
                # should we send a notification to player1?
                return http.JsonResponse({'game': invert_state(other.state)})

        # still here :(
        # have you created one before?
        games = Game.objects.filter(
            ai=False,
            player1=request.user,
            player2__isnull=True,
            gameover=False,
        )
        for game_obj in games:
            if game_obj.state['rules'] == game['rules']:
                return http.JsonResponse({'game': game_obj.state})

        game_obj = Game.objects.create(
            player1=request.user,
            state=game,
        )
        game_obj.state['id'] = game_obj.id
        game_obj.save()
        return http.JsonResponse({'game': game_obj.state})
    else:
        return http.HttpResponseBadRequest('neither id or game')
