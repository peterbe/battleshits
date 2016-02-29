import copy
import json
import logging
import uuid
import random

import fanout

from django import http
from django.template.context_processors import csrf
from django.utils.functional import wraps
from django.views.decorators.http import require_POST
from django.forms.models import model_to_dict
from django.views.decorators.csrf import csrf_exempt
from django.contrib import auth
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.conf import settings
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.contrib.sites.requests import RequestSite

from battleshits.base.models import (
    Game,
    Message,
    Bomb,
    LogInCode,
    Invitation,
)


logger = logging.getLogger('battleshits.api')


fanout.realm = settings.FANOUT_REALM_ID
fanout.key = settings.FANOUT_REALM_KEY


class VerboseHttpResponseBadRequest(http.HttpResponseBadRequest):
    """Overriding this because when it happens, I can't get the
    message in either the django runserver terminal or the
    console error in the React code."""
    def __init__(self, msg):
        if settings.DEBUG:
            print msg
        super(VerboseHttpResponseBadRequest, self).__init__(
            json.dumps({'error': msg}),
            content_type='application/json'
        )


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


def _random(length, pool):
    s = []
    while len(s) < length:
        random.shuffle(pool)
        s.append(pool[0])
    return ''.join(s)


def random_letters(length):
    return _random(length, list('ABCDEFGHIJKLMNOPQRSTUVWXYZ'))


def random_numbers(length):
    return _random(length, list('0123456789'))


def signedin(request):
    if request.user.is_authenticated():
        data = {
            'username': request.user.username,
            'email': request.user.email,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
        }
        codes = LogInCode.objects.filter(
            user=request.user,
            used=False,
        )
        for logincode in codes:
            break
        else:
            logincode = LogInCode.objects.create(
                user=request.user,
                code=random_letters(1) + random_numbers(4)
            )
        data['logincode'] = logincode.code
    else:
        data = {
            'username': None,
        }
    t = csrf(request)
    data['csrf_token'] = str(t['csrf_token'])
    print request.session.get('invitations')
    if request.session.get('invitations'):
        user_ids = request.session['invitations']
        invitations = []
        for user in get_user_model().objects.filter(id__in=user_ids):
            invitations.append({
                'id': user.id,
                'first_name': user.first_name,
                'email': user.email,
            })
        data['invitations'] = invitations
    return http.JsonResponse(data)


def random_username():
    return uuid.uuid4().hex[:30]


@require_POST
def login(request):
    assert request.method == 'POST', request.method
    data = json.loads(request.body)
    if data.get('code_or_email'):
        code_or_email = data['code_or_email'].strip()
        codes = LogInCode.objects.filter(
            code__iexact=code_or_email,
            used=False,
        )
        for code in codes:
            user = code.user
            user.backend = settings.AUTHENTICATION_BACKENDS[0]
            request.user = user
            auth.login(request, user)
            code.used = True
            code.save()
            return signedin(request)

        if '@' in code_or_email:
            if not valid_email(code_or_email):
                return http.JsonResponse({
                    'error': 'Email not valid'
                })

        if '@' in code_or_email:
            users = get_user_model().objects.filter(
                email__iexact=code_or_email
            )
            for user in users.order_by('-last_login'):
                user.backend = settings.AUTHENTICATION_BACKENDS[0]
                request.user = user
                auth.login(request, user)
                return signedin(request)

            return http.JsonResponse({
                'error': 'Code not recognized :('
            })

        return http.JsonResponse({
            'error': 'Code not recognized :('
        })

    assert not request.user.is_authenticated()
    user = get_user_model().objects.create(
        username=random_username(),
    )
    user.set_unusable_password()
    user.save()
    user.backend = settings.AUTHENTICATION_BACKENDS[0]
    request.user = user
    auth.login(request, user)
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
    try:
        game = data['game']
        try:
            game_id = game['id']
        except KeyError:
            return VerboseHttpResponseBadRequest('No game id')
    except KeyError:
        return VerboseHttpResponseBadRequest('No game')
    if game['you']['designmode']:
        return VerboseHttpResponseBadRequest('Your game is not designed')
    if game['opponent']['designmode']:
        return VerboseHttpResponseBadRequest('Opponent game is not designed')

    opponent = None
    if game_id < 0:
        # it's never been saved before
        opponent_id = game['opponent'].get('id')
        if opponent_id:
            opponent = get_user_model().objects.get(id=opponent_id)
        else:
            opponent = None
        game_obj = Game.objects.create(
            player1=request.user,
            player2=opponent,
            state=game,
            ai=game['opponent']['ai'],
        )
        game_obj.state['id'] = game_obj.id
        game_obj.save()
    else:
        game_obj = Game.objects.get(id=game_id)
        if game_obj.abandoned:
            return VerboseHttpResponseBadRequest('Game is abandoned')
        if not game_obj.ai:
            if game_obj.turn != request.user:
                return VerboseHttpResponseBadRequest('Not your turn')
        if game_obj.player2 == request.user:
            opponent = game_obj.player1
            # If you're player2, expect the 'yourturn' to be the opposite
            # If you're player2, we need to invert the state.
            # But had player1 finished designing?
            game = invert_state(game)
            if game['yourturn']:
                game_obj.turn = game_obj.player1
        elif game_obj.player2:
            opponent = game_obj.player2
            if not game['yourturn']:
                game_obj.turn = game_obj.player2

        game_obj.state = game
        if game['gameover']:
            game_obj.gameover = True
            if game['you']['winner']:
                game_obj.winner = request.user
            elif game['opponent']['winner']:
                if opponent:
                    if game_obj.player2 == request.user:
                        # player2 said the opponent won,
                        # considering that the state was reveresed,
                        # it actually means player2 won.
                        game_obj.winner = request.user
                    else:
                        game_obj.winner = opponent
                else:
                    assert game['opponent']['ai']
        game_obj.save()

        # Only send a websocket, to the opponent, if the opponent is not
        # AI.
        if opponent:
            if opponent == game_obj.player2:
                fanout.publish(opponent.username, {
                    'game': invert_state(game_obj.state),
                })
            else:
                fanout.publish(opponent.username, {
                    'game': game_obj.state,
                })

    return http.JsonResponse({'id': game_obj.id})


@xhr_login_required
def list_games(request):
    minimum = request.GET.get('minimum')
    games_base_qs = Game.objects.filter(
        Q(player1=request.user) | Q(player2=request.user)
    ).filter(
        abandoned=False
    )
    games = games_base_qs.filter(
        gameover=False,
        abandoned=False,
    ).order_by('-modified')
    if minimum:
        games = games.filter(turn=request.user)
    states = []
    waiting = []
    for game in games:
        if not game.player2 and not game.ai:
            waiting.append(game.id)
        elif game.player2 == request.user:
            states.append(invert_state(game.state))
        else:
            states.append(game.state)

    if minimum:
        return http.JsonResponse({
            'games': states,
        })

    ongoing = games_base_qs.filter(gameover=False)
    wins = games_base_qs.filter(gameover=True).filter(winner=request.user)
    losses = games_base_qs.filter(gameover=True).exclude(winner=request.user)
    stats = {
        'ongoing': ongoing.count(),
        'wins': wins.count(),
        'losses': losses.count(),
    }

    # we also want a count of the number of people waiting to play
    others_waiting = Game.objects.filter(
        abandoned=False,
        gameover=False,
        ai=False
    ).exclude(
        Q(player1=request.user) | Q(player2=request.user)
    ).extra(
        where=[
            '(player1_id IS NULL AND player2_id IS NOT NULL) OR '
            '(player1_id IS NOT NULL AND player2_id IS NULL)'
        ]
    )

    return http.JsonResponse({
        'games': states,
        'stats': stats,
        'waiting': waiting,
        'others_waiting': others_waiting.count(),
    })


@xhr_login_required
def game(request):
    if not request.GET.get('id'):
        return VerboseHttpResponseBadRequest('No game id')
    you = request.user
    game_obj = get_object_or_404(Game, id=request.GET['id'])
    if not (game_obj.player1 == you or game_obj.player2 == you):
        return VerboseHttpResponseBadRequest('Not your game')
    game = game_obj.state
    if you == game_obj.player2:
        game = invert_state(game)
    return http.JsonResponse({
        'game': game
    })


def valid_email(email):
    try:
        validate_email(email)
        return True
    except ValidationError:
        return False


@require_POST
@xhr_login_required
def profile(request):
    data = json.loads(request.body)
    if data.get('name', '').strip():
        request.user.first_name = data['name']
        request.user.save()
    if data.get('email', '').strip():
        email = data['email'].strip()
        if valid_email(email):
            request.user.email = email
            request.user.save()
        else:
            return http.JsonResponse({
                'error': 'Email not valid "{}"'.format(email)
            })

    return http.JsonResponse({
        'first_name': request.user.first_name,
        'email': request.user.email,
        'username': request.user.username,
    })


@require_POST
@xhr_login_required
def mailme(request):
    if not request.user.email:
        return VerboseHttpResponseBadRequest('No email')

    email = request.user.email
    codes = LogInCode.objects.filter(
        user=request.user,
        used=False,
    )
    for logincode in codes:
        break
    else:
        logincode = LogInCode.objects.create(
            user=request.user,
            code=random_letters(1) + random_numbers(4)
        )
    msg = """
Hi {first_name},

Next time you want to play Battleshits and for some reason you've forgotten
your login; use this code: {code}

--
Battleshits
https://btlsh.it
    """.format(
        first_name=request.user.first_name,
        code=logincode.code,
    )
    if not send_mail(
        'Welcome to Battleshits',
        msg.strip(),
        "Battlshits <{}>".format(settings.SERVER_EMAIL),
        [email]
    ):
        return http.JsonResponse({
            'error': 'Could not send email to "{}"'.format(email)
        })

    return http.JsonResponse({
        'ok': True
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
def start(request):
    """When you start a game you have to pick the rules and design your
    ships (i.e. place them).
    If there is a game with the same rules, waiting for an opponent,
    then return that game and then notify the one who created it.
    If no match, do nothing here. The user will be asked to go ahead
    and design their ships so that it's ready to be joined by someone else.
    """
    data = json.loads(request.body)
    if not data.get('game'):
        return VerboseHttpResponseBadRequest('no game')
    if not request.user.first_name:
        return VerboseHttpResponseBadRequest("you haven't set your name yet")

    invite = data.get('invite')

    game = data['game']
    if game['you']['designmode']:
        return VerboseHttpResponseBadRequest("you haven't designed it yet")

    # If the game already has an opponent, and an id, use that, we should
    # be good to go.
    if game.get('id') and game['opponent']['name']:
        game_obj = Game.objects.get(id=game['id'])
        # print game_obj.player1.first_name
        # print game_obj.player2.first_name

        # from pprint import pprint
        assert not game['you']['designmode']
        assert not game['opponent']['designmode']
        # print game['you']['name']
        # print game['opponent']['name']
        # game = invert_state(game)
        game_obj.state = invert_state(game)
        game_obj.save()
        # pprint(game)
        return http.JsonResponse({'game': invert_state(game_obj.state)})

    # find any started games that don't have a player2
    games = Game.objects.filter(
        ai=False,
        gameover=False,
        abandoned=False,
        player2__isnull=True,
    ).exclude(
        player1=request.user,
    )
    my_ongoing_games = Game.objects.filter(
        Q(player1=request.user) | Q(player2=request.user)
    ).filter(
        ai=False,
        gameover=False,
        abandoned=False,
    )
    my_ongoing_opponents = []
    for ongoing_game in my_ongoing_games:
        my_ongoing_opponents.append(ongoing_game.player1_id)
        if ongoing_game.player2_id:
            my_ongoing_opponents.append(ongoing_game.player2_id)

    if my_ongoing_opponents:
        games = games.exclude(player1_id__in=my_ongoing_opponents)

    if invite:
        games = games.filter(player1__id=invite['id'])

    for other in games:
        # all saved games should be designed
        assert not other.state['you']['designmode'], 'not designed'
        if other.state['rules'] == game['rules']:
            # we have a match!
            other.player2 = request.user
            other.state['opponent']['name'] = request.user.first_name
            other.state['opponent']['ships'] = game['you']['ships']
            other.state['opponent']['designmode'] = game['you']['designmode']
            if other.state['yourturn']:
                other.turn = other.player1
            else:
                other.turn = request.user
            other.save()
            # should we send a notification to player1?
            channel = other.player1.username
            fanout.publish(other.player1.username, {
                'game': other.state,
            })
            return http.JsonResponse({'game': invert_state(other.state)})

    # still here :(
    # have you created one before?
    games = Game.objects.filter(
        player1=request.user,
        player2__isnull=True,
        gameover=False,
        ai=False,
        abandoned=False,
    )

    if invite:
        games = games.filter(player2__id=invite['id'])

    for game_obj in games:
        if game_obj.state['rules'] == game['rules']:
            print "Found one with the same rules"
            return http.JsonResponse({'id': game_obj.id})

    # really still here, then you haven't created a game before
    game_obj = Game.objects.create(
        player1=request.user,
        state=game,
    )
    if invite:
        game_obj.player2 = get_user_model().objects.get(id=invite['id'])
        game_obj.turn = game_obj.player2
        game_obj.state['opponent']['name'] = game_obj.player2.first_name
    game_obj.state['id'] = game_obj.id
    game_obj.save()
    return http.JsonResponse({'id': game_obj.id})


@require_POST
@xhr_login_required
def bombed(request):
    data = json.loads(request.body)
    # print request.user.first_name
    # print data
    # print
    game_id = data['id']
    index = data['index']
    cell = data['cell']
    # yours = data['yours']
    # yours =False
    # game_obj = Game.objects.filter(
    #     Q(player1=request.user) | Q(player2=request.user)
    # ).get(
    #     id=game_id
    # )
    game_obj = Game.objects.get(id=game_id)
    if request.user == game_obj.player1:
        opponent = game_obj.player2
    else:
        assert request.user == game_obj.player2
        opponent = game_obj.player1
    Bomb.objects.create(
        game=game_obj,
        user=request.user,
        index=index,
        new_cell_state=cell,
    )
    channel = 'game-{}-{}'.format(game_obj.id, opponent.username)
    fanout.publish(channel, {
        'index': index,
        'yours': True,
        'cell': cell,
    })
    return http.JsonResponse({'ok': True})


@require_POST
@xhr_login_required
def abandon(request):
    data = json.loads(request.body)
    try:
        game = data['game']
        try:
            game_id = game['id']
        except KeyError:
            return VerboseHttpResponseBadRequest('No game id')
    except KeyError:
        return VerboseHttpResponseBadRequest('No game')
    game_obj = get_object_or_404(Game, id=game_id)
    if (
        not (
            game_obj.player1 == request.user or
            game_obj.player2 == request.user
        )
    ):
        return http.HttpResponseForbidden('Not your game to abandon')

    game_obj.abandoned = True
    game_obj.save()
    return http.JsonResponse({'ok': True})


@xhr_login_required
def messages(request):
    you = request.user

    if request.method == 'POST':
        data = json.loads(request.body)
        if not data.get('id'):
            return VerboseHttpResponseBadRequest('No game id')
        game_id = data['id']
        game_obj = get_object_or_404(Game, id=game_id)
        if not (game_obj.player1 == you or game_obj.player2 == you):
            return VerboseHttpResponseBadRequest('Not your game')

        message = data.get('message', '').strip()
        if not message:
            return VerboseHttpResponseBadRequest('Empty message')

        # To avoid allowing repeats, do nothing if the last message
        # in this game was from this user was the same message
        previous = Message.objects.filter(game=game_obj).order_by('-created')
        repeat = False
        for message_obj in previous[:1]:
            if (
                message_obj.user == request.user and
                message_obj.message == message
            ):
                repeat = True

        if not repeat:
            message_obj = Message.objects.create(
                game=game_obj,
                user=request.user,
                message=message
            )
            # we're going to want to inform the opponent
            if you == game_obj.player1:
                opponent = game_obj.player2
            else:
                opponent = game_obj.player1
            channel = 'game-{}-{}'.format(game_obj.id, opponent.username)
            msg = {
                'id': message_obj.id,
                'message': message_obj.message,
                'name': you.first_name,
                'game_id': game_obj.id,
            }
            fanout.publish(channel, {
                'message': msg,
            })
            # if that opponent is not watching the game right now,
            # update that too
            fanout.publish(opponent.username, {
                'message': msg,
            })
    else:
        if not request.GET.get('id'):
            return VerboseHttpResponseBadRequest('No game id')
        game_obj = get_object_or_404(Game, id=request.GET['id'])
        if not (game_obj.player1 == you or game_obj.player2 == you):
            return VerboseHttpResponseBadRequest('Not your game')

    items = []
    messages_ = Message.objects.filter(game=game_obj).order_by('created')
    for msg in messages_:
        item = {
            'id': msg.id,
            'message': msg.message,
        }
        if msg.user == you:
            item['you'] = True
        else:
            if not msg.read:
                msg.read = True
                msg.save()
            item['name'] = msg.user.first_name
        items.append(item)
    return http.JsonResponse({
        'messages': items,
    })


@require_POST
@xhr_login_required
def invite(request):
    invitation = None
    for each in Invitation.objects.filter(user=request.user):
        invitation = each
    if invitation is None:
        invitation = Invitation.objects.create(
            user=request.user,
            code=random_letters(1) + random_numbers(5),
        )
    return http.JsonResponse({
        'code': invitation.code,
    })

@require_POST
@xhr_login_required
def invitation(request):
    data = json.loads(request.body)
    code = data['code']
    invitations = Invitation.objects.filter(code__iexact=code)
    if not invitations.exists():
        return http.JsonResponse({
            'error': 'Code not find invitation "{}"'.format(
                code
            ),
        })

    for invitation in invitations:
        user_ids = request.session.get('invitations', [])
        if invitation.user.id not in user_ids:
            user_ids.append(invitation.user.id)
            request.session['invitations'] = user_ids
        return http.JsonResponse({
            'invitation': {
                'email': invitation.user.email,
                'first_name': invitation.user.first_name,
                'id': invitation.user.id,
            }
        })


@require_POST
@xhr_login_required
def sendinvitation(request):
    data = json.loads(request.body)
    email = data['email']
    if not valid_email(email):
        return http.JsonResponse({
            'error': 'Not a valid email addresses."{}"'.format(
                email
            ),
        })

    invitation = None
    for each in Invitation.objects.filter(user=request.user):
        invitation = each
    if invitation is None:
        invitation = Invitation.objects.create(
            user=request.user,
            code=random_letters(1) + random_numbers(5),
        )

    absolute_base_url = (
        '%s://%s' % (
            request.is_secure() and 'https' or 'http',
            RequestSite(request).domain
        )
    )
    url = absolute_base_url + '/#i={}'.format(invitation.code)
    msg = """
Hi!

To play a game of Battleshits against {first_name} you need this code:

{code}

Or if you're on your phone, just go to this linke:

{url}

--
Battleshits
https://btlsh.it
    """.format(
        first_name=request.user.first_name,
        code=invitation.code,
        url=url,
    )
    send_mail(
        'Play Battlshits against {}'.format(request.user.first_name),
        msg,
        "Battlshits <{}>".format(settings.SERVER_EMAIL),
        [email]
    )

    return http.JsonResponse({
        'email': email,
    })
