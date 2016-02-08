import json

import mock

from django.core.urlresolvers import reverse
from django.test import TestCase
from django.conf import settings
from django.contrib.auth import get_user_model

from battleshits.base.models import Game, Message

import fanout
# just to be sure it never works
fanout.realm = 'COMPLETE'
fanout.key = 'GIBBERISH'

# patched = mock.patch('battleshits.api.views.fanout')




class Tests(TestCase):

    def setUp(self):
        super(Tests, self).setUp()
        self.fanout_patcher = mock.patch('battleshits.api.views.fanout')
        self.fanout = self.fanout_patcher.start()

        self._fanout_published = []
        def mocked_publish(*args):
            self._fanout_published.append(args)
        self.fanout.publish.side_effect = mocked_publish

    def tearDown(self):
        super(Tests, self).tearDown()
        self.fanout_patcher.stop()

    def post_json(self, path, data=None, **extra):
        data = data or {}
        extra['content_type'] = 'application/json'
        data['csrfmiddlewaretoken'] = 'anything'
        return self.client.post(path, json.dumps(data), **extra)

    def login(self, user=None):
        if not user:
            user = get_user_model().objects.create(
                username='player'
            )
        elif isinstance(user, basestring):
            user = get_user_model().objects.create(
                username=user
            )
        user.set_password('secret')
        user.save()
        assert self.client.login(username=user.username, password='secret')
        return user

    @mock.patch('battleshits.api.views.fanout')
    def test_bombed(self, m_fanout):

        player1 = get_user_model().objects.create(
            username='player1',
        )
        player2 = get_user_model().objects.create(
            username='player2',
        )
        game_obj = Game.objects.create(
            player1=player1,
            player2=player2,
            state={},
        )

        url = reverse('api:bombed')
        response = self.post_json(url, {
            'id': game_obj.id,
            'index': 12,
            'yours': False,
        })
        self.assertEqual(response.status_code, 403)

        self.login(player1)
        response = self.post_json(url, {
            'id': game_obj.id,
            'index': 12,
            'yours': False,
        })
        self.assertEqual(response.status_code, 200)

        # The output isn't important. What's sent to fanout is.
        channel = 'game-{}-{}'.format(game_obj.id, player2.username)
        m_fanout.publish.assert_called_with(
            channel,
            {'index': 12, 'yours': True}
        )

        self.login(player2)
        response = self.post_json(url, {
            'id': game_obj.id,
            'index': 24,
            'yours': False,
        })
        self.assertEqual(response.status_code, 200)
        # The channel for player1.
        channel = 'game-{}-{}'.format(game_obj.id, player1.username)
        m_fanout.publish.assert_called_with(
            channel,
            {'index': 24, 'yours': True}
        )

    @mock.patch('battleshits.api.views.fanout')
    def test_start(self, m_fanout):
        # When two different players create games (with the same rules),
        # one will always be slightly later than the other.
        # When a match is made, we need to inform both players with fanout.

        url = reverse('api:start')
        response = self.post_json(url, {})
        # not signed in
        self.assertEqual(response.status_code, 403)

        user = self.login('player1')
        # no 'game'
        response = self.post_json(url, {})
        self.assertEqual(response.status_code, 400)

        game = {
            'you': {
                'name': 'Peter',
                'designmode': True,
                'ships': [
                    {'player1': 'stuff'},
                ],
                'grid': [],
            },
            'opponent': {
                'designmode': True,
                'ships': [
                    {'not': 'important'},
                ],
                'grid': [],
            },
            'ai': False,
            'yourturn': False,
            'rules': {
                'drops': 10,
            },
            'gameover': False
        }
        response = self.post_json(url, {'game': game})
        # you haven't picked a name yet
        self.assertEqual(response.status_code, 400)

        profile_url = reverse('api:profile')
        response = self.post_json(profile_url, {
            'name': 'Peter'
        })
        self.assertEqual(response.status_code, 200)

        response = self.post_json(url, {'game': game})
        # because you haven't designed it yet
        self.assertEqual(response.status_code, 400)

        game['you']['designmode'] = False
        response = self.post_json(url, {'game': game})
        self.assertEqual(response.status_code, 200)

        # this should have created a game where you're player1
        assert Game.objects.all().count()
        game_obj, = Game.objects.filter(player1=user)
        assert json.loads(response.content)['id'] == game_obj.id
        assert game_obj.state['rules'] == game['rules']
        assert game_obj.state['id'] == game_obj.id
        assert game_obj.player1 == user
        assert game_obj.player2 == None
        assert game_obj.turn == None
        # the opponent clearly hasn't design theirs yet
        assert game_obj.state['opponent']['designmode']

        # clumsily try to start it again
        response = self.post_json(url, {'game': game})
        self.assertEqual(response.status_code, 200)
        assert Game.objects.all().count() == 1

        # Now a second player comes on the scene and wants to join a game
        user2 = self.login('player2')
        profile_url = reverse('api:profile')
        response = self.post_json(profile_url, {
            'name': 'Number 2'
        })
        self.assertEqual(response.status_code, 200)

        # let's design that second game
        game2 = {
            'you': {
                'name': 'Number 2',
                'designmode': True,
                'ships': [
                    {'player2': 'things'},
                ],
                'grid': [],
            },
            'opponent': {
                'designmode': True,
                'ships': [
                    {'not': 'important'},
                ],
                'grid': [],
            },
            'ai': False,
            'yourturn': False,
            'rules': {
                'drops': 10,
            },
            'gameover': False
        }
        response = self.post_json(url, {'game': game2})
        # because you haven't designed it yet
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {'error': "you haven't designed it yet"}
        )

        game2['you']['designmode'] = False
        response = self.post_json(url, {'game': game2})
        self.assertEqual(response.status_code, 200)
        # this should have sent back a game that the user can load
        inverted_game = json.loads(response.content)['game']
        self.assertEqual(inverted_game['id'], game_obj.id)
        self.assertTrue(inverted_game['yourturn'])
        self.assertTrue(not inverted_game['gameover'])
        self.assertTrue(not inverted_game['ai'])
        self.assertEqual(inverted_game['rules'], game['rules'])
        self.assertEqual(inverted_game['rules'], game2['rules'])
        self.assertEqual(inverted_game['opponent'], game['you'])
        self.assertEqual(
            inverted_game['you'],
            game2['you']
        )
        self.assertEqual(
            inverted_game['opponent'],
            game['you']
        )
        # still just the one
        self.assertEqual(Game.objects.all().count(), 1)

        # reload that game object
        game_obj = Game.objects.get(id=game_obj.id)  # isn't there a better way
        assert game_obj.player1 == user
        assert game_obj.player2 == user2
        self.assertEqual(game_obj.turn, user2)
        self.assertEqual(game_obj.state['yourturn'], False)
        self.assertEqual(game_obj.state['you']['designmode'], False)
        self.assertEqual(game_obj.state['opponent']['designmode'], False)

        # this should have informed player1
        m_fanout.publish.assert_called_with(
            user.username,
            {'game': game_obj.state}
        )

    def test_start_avoid_same_current_player(self):
        """Suppose User1 and User2 are in a battle, but both of them
        want to start a second new game. They should not match each
        other whilst they have an open game."""

        user2 = self.login('user2')
        user2.first_name = 'User2'
        user2.save()
        user1 = self.login('user1')
        user1.first_name = 'User1'
        user1.save()
        game = {
            'you': {
                'name': 'User1',
                'designmode': False,
                'ships': [
                    {'player1': 'stuff'},
                ],
                'grid': [],
            },
            'opponent': {
                'designmode': False,
                'name': 'User2',
                'ships': [
                    {'not': 'important'},
                ],
                'grid': [],
            },
            'ai': False,
            'yourturn': False,
            'rules': {
                'drops': 10,
            },
            'gameover': False
        }
        game_obj = Game.objects.create(
            player1=user1,
            player2=user2,
            state=game,
        )

        # let's say user1 starts a new game
        url = reverse('api:start')
        game = {
            'you': {
                'name': 'User1',
                'designmode': False,
                'ships': [
                    {'player1': 'stuff'},
                ],
                'grid': [],
            },
            'opponent': {
                'designmode': True,
                'ships': [
                    {'not': 'important'},
                ],
                'grid': [],
            },
            'ai': False,
            'yourturn': False,
            'rules': {
                'drops': 10,
            },
            'gameover': False
        }
        response = self.post_json(url, {'game': game})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            Game.objects.all().count(),
            2
        )
        self.assertEqual(
            Game.objects.filter(player1=user1).count(),
            2
        )
        self.assertEqual(
            Game.objects.filter(player1=user1, player2__isnull=True).count(),
            1
        )
        # log back in as user2 and also start a game
        self.login(user2)
        response = self.post_json(url, {'game': game})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            Game.objects.all().count(),
            3
        )
        self.assertEqual(
            Game.objects.filter(player1=user2).count(),
            1
        )
        self.assertEqual(
            Game.objects.filter(player1=user2, player2__isnull=True).count(),
            1
        )

    @mock.patch('battleshits.api.views.fanout')
    def test_save_game(self, m_fanout):

        published = []

        def mock_publish(channel, stuff):
            published.append((channel, stuff))
            return True

        m_fanout.publish.side_effect = mock_publish

        game = {
            'you': {
                'name': 'Peter',
                'designmode': False,
                'ships': [
                    {'player1': 'stuff'},
                ],
                'grid': [0, 0, 0],
            },
            'opponent': {
                'designmode': True,
                'ships': [
                    {'not': 'important'},
                ],
                'grid': [0, 0, 0],
            },
            'ai': False,
            'yourturn': False,
            'rules': {
                'drops': 1,
            },
            'gameover': False
        }
        user = self.login('player1')
        user.first_name = 'Peter'
        user.save()
        url = reverse('api:start')
        response = self.post_json(url, {'game': game})
        self.assertEqual(response.status_code, 200)
        game_id = json.loads(response.content)['id']

        user2 = self.login('player2')
        user2.first_name = 'Opponent'
        user2.save()
        game2 = {
            'you': {
                'name': 'Opponent',
                'designmode': False,
                'ships': [
                    {'player2': 'stuff'},
                ],
                'grid': [0, 0, 0],
            },
            'opponent': {
                'designmode': True,
                'ships': [
                    {'not': 'important'},
                ],
                'grid': [0, 0, 0],
            },
            'ai': False,
            'yourturn': False,
            'rules': {
                'drops': 1,
            },
            'gameover': False
        }
        response = self.post_json(url, {'game': game2})
        self.assertEqual(response.status_code, 200)
        game_state = json.loads(response.content)['game']
        self.assertEqual(game_state['id'], game_id)
        self.assertTrue(game_state['yourturn'])
        game_obj = Game.objects.get(id=game_id)
        self.assertEqual(game_obj.turn, user2)

        assert len(published) == 1
        # print m_fanout.mock_calls

        # It's player 2's turn. It means player1 should not be able to
        # save and change the state. This is basically preventing cheating
        # and makes sure we can keep track of state correctly.
        self.login(user)
        game['you']['grid'] = [1, 0, 0]
        url = reverse('api:save')
        response = self.post_json(url, {})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.content), {'error': 'No game'})
        response = self.post_json(url, {'game': game})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.content), {'error': 'No game id'})
        game['id'] = game_state['id']
        response = self.post_json(url, {'game': game})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {'error': 'Opponent game is not designed'}
        )
        game['opponent']['designmode'] = False
        response = self.post_json(url, {'game': game})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {'error': 'Not your turn'}
        )
        game['you']['yourturn'] = True
        # can't fool it like that
        response = self.post_json(url, {'game': game})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {'error': 'Not your turn'}
        )

        # the one who can save it is player2
        self.login(user2)
        game_state['yourturn'] = False
        game_state['opponent']['grid'] = [1, 0, 0]
        game_state['_drops'] = 1
        response = self.post_json(url, {'game': game_state})
        self.assertEqual(response.status_code, 200)
        game_obj = Game.objects.get(id=game_id)
        assert game_obj.turn == user

        assert len(published) == 2
        # the latest message is for player1
        last_published = published[-1]
        self.assertEqual(last_published[0], user.username)

        self.login(user)
        game_state = last_published[1]['game']
        assert game_state['yourturn']
        # player1 bombs a bit on player2's grid
        game_state['opponent']['grid'] = [0, 0, 2]
        game_state['yourturn'] = False
        response = self.post_json(url, {'game': game_state})
        self.assertEqual(response.status_code, 200)
        game_obj = Game.objects.get(id=game_id)
        assert game_obj.turn == user2

        assert len(published) == 3
        last_published = published[-1]
        self.assertEqual(last_published[0], user2.username)
        game_state = last_published[1]['game']
        assert game_state['yourturn']
        self.assertEqual(game_state['you']['grid'], [0, 0, 2])

    def test_player1_wins(self):
        """let's pretend player1 wins"""
        game = {
            'you': {
                'name': 'Player1',
                'designmode': False,
                'ships': [
                    {'player1': 'stuff'},
                ],
                'grid': [0, 0, 0],
                'winner': True,
            },
            'opponent': {
                'name': 'Player2',
                'designmode': False,
                'ships': [
                    {'not': 'important'},
                ],
                'grid': [2, 2, 2],
                'winner': False,
            },
            'ai': False,
            'yourturn': True,
            'rules': {
                'drops': 1,
            },
            'gameover': True,
        }
        player2 = self.login('Player2')
        # note that this becomes the user logged in
        player1 = self.login('Player1')
        game_obj = Game.objects.create(
            player1=player1,
            player2=player2,
            state=game,
            turn=player1,
        )
        game['id'] = game_obj.id
        url = reverse('api:save')
        response = self.post_json(url, {'game': game})
        self.assertEqual(response.status_code, 200)

        game_obj = Game.objects.get(id=game_obj.id)
        self.assertEqual(game_obj.winner, player1)
        self.assertTrue(game_obj.gameover)

    def test_player2_wins(self):
        """let's pretend player2 wins"""
        game = {
            # Remember, this is from player2's perspective
            'you': {
                'name': 'Player2',
                'designmode': False,
                'ships': [
                    {'player2': 'stuff'},
                ],
                'grid': [0, 0, 0],
                'winner': True,
            },
            'opponent': {
                'name': 'Player1',
                'designmode': False,
                'ships': [
                    {'not': 'important'},
                ],
                'grid': [2, 2, 2],
                'winner': False,
            },
            'ai': False,
            'yourturn': False,
            'rules': {
                'drops': 1,
            },
            'gameover': True,
        }
        player1 = self.login('Player1')
        player2 = self.login('Player2')
        game_obj = Game.objects.create(
            player1=player1,
            player2=player2,
            state=game,
            turn=player2,
        )
        game['id'] = game_obj.id
        url = reverse('api:save')
        response = self.post_json(url, {'game': game})
        self.assertEqual(response.status_code, 200)

        game_obj = Game.objects.get(id=game_obj.id)
        self.assertEqual(game_obj.winner, player2)
        self.assertTrue(game_obj.gameover)

    def test_receive_messages(self):
        game = {
            # Remember, this is from player2's perspective
            'you': {
                'name': 'Player2',
                'designmode': False,
                'ships': [
                    {'player2': 'stuff'},
                ],
                'grid': [0, 0, 0],
                'winner': True,
            },
            'opponent': {
                'name': 'Player1',
                'designmode': False,
                'ships': [
                    {'not': 'important'},
                ],
                'grid': [2, 2, 2],
                'winner': False,
            },
            'ai': False,
            'yourturn': False,
            'rules': {
                'drops': 1,
            },
            'gameover': True,
        }
        player1 = self.login('Player1')
        player1.first_name = 'P 1'
        player1.save()
        player2 = self.login('Player2')
        player2.first_name = 'P 2'
        player2.save()
        game_obj = Game.objects.create(
            player1=player1,
            player2=player2,
            state=game,
            turn=player2,
        )

        self.login('otherplayer')
        url = reverse('api:messages')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {'error': 'No game id'}
        )
        response = self.client.get(url, {'id': 999999})
        self.assertEqual(response.status_code, 404)
        self.assertEqual(
            json.loads(response.content),
            {'error': 'Page not found /api/messages?id=999999'}
        )
        response = self.client.get(url, {'id': game_obj.id})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {'error': 'Not your game'}
        )

        self.login(player1)
        response = self.client.get(url, {'id': game_obj.id})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {'messages': []}
        )

        # create a message
        msg1 = Message.objects.create(
            game=game_obj,
            user=player1,
            message="Player1's message"
        )
        msg2 = Message.objects.create(
            game=game_obj,
            user=player2,
            message="Player2's message"
        )
        response = self.client.get(url, {'id': game_obj.id})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {'messages': [
                {'id': msg1.id, 'message': "Player1's message", 'you': True},
                {'id': msg2.id, 'message': "Player2's message", 'name': 'P 2'},
            ]}
        )
        # reload and check that they got marked as read
        msg1 = Message.objects.get(id=msg1.id)
        msg2 = Message.objects.get(id=msg2.id)
        self.assertEqual(msg1.read, False)
        self.assertEqual(msg2.read, True)

    def test_send_messages(self):
        game = {
            # Remember, this is from player2's perspective
            'you': {
                'name': 'Player2',
                'designmode': False,
                'ships': [
                    {'player2': 'stuff'},
                ],
                'grid': [0, 0, 0],
                'winner': True,
            },
            'opponent': {
                'name': 'Player1',
                'designmode': False,
                'ships': [
                    {'not': 'important'},
                ],
                'grid': [2, 2, 2],
                'winner': False,
            },
            'ai': False,
            'yourturn': False,
            'rules': {
                'drops': 1,
            },
            'gameover': True,
        }
        player1 = self.login('Player1')
        player1.first_name = 'P 1'
        player1.save()
        player2 = self.login('Player2')
        player2.first_name = 'P 2'
        player2.save()
        game_obj = Game.objects.create(
            player1=player1,
            player2=player2,
            state=game,
            turn=player2,
        )
        url = reverse('api:messages')
        response = self.post_json(url, {})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {'error': 'No game id'}
        )
        response = self.post_json(url, {'id': '999999'})
        self.assertEqual(response.status_code, 404)
        response = self.post_json(url, {'id': game_obj.id})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {'error': 'Empty message'}
        )
        response = self.post_json(url, {'id': game_obj.id, 'message': 'Hi!'})
        self.assertEqual(response.status_code, 200)
        msg, = Message.objects.all()
        assert msg.user == player2
        self.assertEqual(
            json.loads(response.content),
            {
                'messages': [
                    {'id': msg.id, 'message': 'Hi!', 'you': True},
                ]
            }
        )
        message = {
            'game_id': game_obj.id,
            'message': u'Hi!',
            'id': msg.id,
            'name': player2.first_name,
        }

        user_channel = player1.username
        self.assertTrue(
            (user_channel, {'message': message}) in self._fanout_published
        )
        game_channel = 'game-{}-{}'.format(game_obj.id, player1.username)
        self.assertTrue(
            (game_channel, {'message': message}) in self._fanout_published
        )
        assert len(self._fanout_published) == 2

        # post again, no new message
        response = self.post_json(url, {'id': game_obj.id, 'message': 'Hi!'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Message.objects.all().count(), 1)
        assert len(self._fanout_published) == 2  # still
