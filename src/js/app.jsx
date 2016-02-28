import React from 'react'
import ReactDOM from 'react-dom'
import 'whatwg-fetch'
import $ from 'jquery'
import Grid from './components/grid.jsx'
import Sounds from './components/sounds.js'
import { getOneElement } from './components/utils.js'
import Message from './components/message.jsx';
import Chat from './components/chat.jsx';
import "babel-polyfill";



const SHIPS = [
  {id: '2',   length: 2, x: 0, y: 0, rotation: 0, overlapping: false},
  {id: '3-1', length: 3, x: 0, y: 1, rotation: 0, overlapping: false},
  {id: '3-2', length: 3, x: 0, y: 2, rotation: 0, overlapping: false},
  {id: '4',   length: 4, x: 0, y: 3, rotation: 0, overlapping: false},
  {id: '5',   length: 5, x: 0, y: 4, rotation: 0, overlapping: false},
]


const _YOUR = []
const _OPP = []
const _EMPTY_GRID = []
for (let i = 0; i < 100; i++) {
  _EMPTY_GRID.push(0)
  _YOUR.push(0);
  _OPP.push(0);
}

const _GAME1 = {
  id: 1,
  yourturn: false,
  designmode: true,
  grid: Array.from(_YOUR),
  ships: Array.from(SHIPS),
  opponent: {
    grid: Array.from(_OPP),
    name: 'Computer',
    ai: true,
    designmode: true,
    ships: Array.from(SHIPS),
  }
}
const _GAME2 = {
  id: 2,
  yourturn: false,
  designmode: true,
  grid: Array.from(_YOUR),
  ships: Array.from(SHIPS),
  opponent: {
    grid: Array.from(_OPP),
    name: 'Jim',
    ai: false,
    designmode: false,
    ships: Array.from(SHIPS),
  }
}

const _GAME3 = {
  id: 3,
  yourturn: false,
  designmode: true,
  grid: Array.from(_YOUR),
  ships: Array.from(SHIPS),
  opponent: {
    grid: Array.from(_OPP),
    name: 'Holy Acorn',
    ai: true,
    designmode: true,
    ships: Array.from(SHIPS),
  }
}


let _getAllCoordinates = (ship) => {
  let coords = new Set()
  let vertical = ship.rotation === 90 || ship.rotation === 270 ? 1 : 0
  let horizontal = vertical ? 0 : 1
  for (let i=0; i < ship.length; i++) {
    coords.add(
      (ship.x + i * horizontal) + ',' +
      (ship.y + i * vertical)
    )
  }
  return coords
}

let _getAllPoints = (ship) => {
  // a ship has x, y, length and a rotation
  let points = []
  let vertical = ship.rotation === 90 || ship.rotation === 270 ? 1 : 0
  let horizontal = vertical ? 0 : 1
  let x = ship.x
  let y = ship.y
  for (let i = 0; i < ship.length; i++) {
    points.push(
      (x + i * horizontal) + (y + i * vertical) * 10
    )
  }
  return points
}

let _isBombed = (grid, ship) => {
  for (let point of _getAllPoints(ship)) {
    if (grid[point] !== 2) {
      return false
    }
  }
  return true
}

let _isAllBombed = (ships) => {
  for (let ship of ships) {
    if (!ship.bombed) {
      return false
    }
  }
  return true
}

let _isOverlapping = (ship1, ship2) => {
  // list ALL their coordinates and compare if any of them match
  let coords1 = _getAllCoordinates(ship1)
  let coords2 = _getAllCoordinates(ship2)
  let intersection = [...coords1].filter(x => coords2.has(x))
  return intersection.length > 0
}

let _randomlyPlaceShips = (ships) => {
  // return a new array of ships randomly placed

  let prev = {}  // remember what previous numbers we have generated
  let randomPosition = (type) => {
    if (!prev[type]) {
      prev[type] = []
    }
    let r = Math.floor(Math.random() * 10)
    if (prev[type].indexOf(r) > -1) {
      return randomPosition(type)
    }
    prev[type].push(r)
    return r
  }
  let randomRotation = () => {
    let rotations = [0, 90]
    return rotations[Math.floor(Math.random() * rotations.length)]
  }
  for (var ship of ships) {
    // randomly place the ship somewhere
    ship.x = randomPosition('x')
    ship.y = randomPosition('y')
    ship.rotation = randomRotation()

    // now need to change that this doesn't put the ship outside the grid
    if (ship.rotation === 90 || ship.rotation === 270) {
      // first check if it's y number + length is too long
      if ((ship.y + ship.length) > 10) {
        ship.y -= ship.y + ship.length - 10
      }
    } else {
      // ship lies horizontal
      if (ship.x + ship.length > 10) {
        ship.x -= ship.x + ship.length - 10
      }
    }
    // now compare this to all other ships
    for (var other of ships) {
      if (other.id != ship.id) {
        // overlap! Bail and try again!
        if (_isOverlapping(ship, other)) {
          return _randomlyPlaceShips(ships)
        }
      }
    }
  }
  return ships
}

let apiGet = (url) => {
  if (url.charAt(0) !== '/') {
    throw new Error('URLs must start with /')
  }
  if (__API_HOST__) {
    url = __API_HOST__ + url
  }
  return fetch(url, {
    credentials: __API_HOST__ && 'include' || 'same-origin',
  })
  .then((r) => {
    if (r.ok) {
      return r.json()
    } else {
      return r.json()
      .then((msg) => {
        throw new Error(
          'GET failed ' + r.status + '("' + msg.error + '") (' + url + ')'
        )
      })
    }

  })
  .catch((ex) => {
    console.error('FETCH API GET error', ex)
    throw ex
  })
}

let apiSet = (url, data) => {
  if (__API_HOST__) {
    url = __API_HOST__ + url
  }
  if (!sessionStorage.getItem('csrfmiddlewaretoken')) {
    throw new Error('No csrfmiddlewaretoken in sessionStorage')
  }
  return fetch(url, {
    method: 'post',
    // credentials: 'same-origin',
    credentials: __API_HOST__ && 'include' || 'same-origin',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-CSRFToken': sessionStorage.getItem('csrfmiddlewaretoken'),
    },
    body: JSON.stringify(data)
  })
  .then((r) => {
    if (r.status === 200 || r.status === 201) {
      return r.json()
    }
    console.error(r)
    throw new Error(r.status)
  })
  .catch((ex) => {
    console.error('FETCH API POST error', ex)
    throw ex
  })
}


class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      game: null,
      // loadedGames: {},
      games: [],
      stats: {},
      synced: -1,
      waitingGames: [],
      othersWaitingGames: 0,
      serverError: false,
      newMessages: [],
      gridWidth: null,
      // loginCode: null,
    }
  }


  updateDimensions() {
    // console.log('Running updateDimensions() in App component')
    if ($('.grid tr').length && $('.grid tr').width()) {
      // console.log('NEW WIDTH', $('.grid tr').width())
      this.setState({gridWidth: $('.grid tr').width()})
    }
  }

  componentDidMount() {
    // console.log('App component did mount');
    window.addEventListener("resize", this.updateDimensions.bind(this))
  }

  // componentWillUnmount() {
  //   console.log('App component will unmount');
  //   window.removeEventListener("resize", this.updateDimensions.bind(this))
  // }


  // componentDidMount() {
  //   setTimeout(() => {
  //     // XXX replace this with service worker or manifest or something
  //     Sounds.preLoadSounds()
  //   }, 1000)
  //
  // }
  onGameSelect(game) {
    // let loadedGames = this.state.loadedGames
    // if (game) {
    //   loadedGames[game.id] = 1 + (loadedGames[game.id] || 0)
    // }
    // XXX perhaps set a sessionStorage so that it continues this game
    // if you refresh the page
    this.setState({game: game})

    // Not sure if this is needed
    // if (game.id && game.id > 0) {
    //   apiGet('/api/game?id=' + game.id)
    //   .then((result) => {
    //     console.log('COMPARE', result.game, game)
    //   })
    // }

  }

  onGameExit() {
    this.setState({game: null})
    this.loadGames()
  }

  onGamesChange(games) {
    // because a game has been added or removed
  }

  changeGame(game, save = true) {
    this.setState({game: game})
    if (save) {
      if (sessionStorage.getItem('csrfmiddlewaretoken')) {
        // we can save if we have made server contact at least once
        apiSet('/api/save', {game: game})
        .then((response) => {
          if (response.id !== game.id) {
            game.id = response.id
          }
          this.setState({synced: 0})
        })
        .catch((ex) => {
          console.warn('Saving game failed. Update state anyway')
          this.setState({synced: this.state.synced + 1})
        })
      } else {
        this.initServerGames()
        .catch((ex) => {
          console.warn('Unable to initialize server games')
        })
      }
    }
  }

  gotoGameOnMessage(message) {
    let newMessages = this.state.newMessages
    // the ones to keep
    newMessages = newMessages.filter((newMessage) => {
      return newMessage.game_id !== message.game_id
    })
    this.setState({newMessages: newMessages})
    for (let game of this.state.games) {
      if (game.id === message.game_id) {
        return this.changeGame(game, false)
      }
    }
  }

  // setupSocket(username) {
  //   // console.log('SUBSCRIBED /'+username)
  //   FANOUT_CLIENT.subscribe('/' + username, (data) => {
  //     console.log('INCOMING ON', username, data)
  //     if (data.game) {
  //       if (this.state.game === null) {
  //         this.setState({game: data.game})
  //       } else if (data.game.id === this.state.game.id) {
  //         this.setState({game: data.game})
  //         // console.log('Turn?', data.game.yourturn)
  //         if (data.game.yourturn) {
  //           setTimeout(() => {
  //             getOneElement('#opponents').scrollIntoView()
  //           }, 1000)
  //         }
  //       } else {
  //         console.warn('Socket updated a game which is not the one being played', data.game.id)
  //       }
  //     }
  //   })
  // }
  setupSocket(username) {
    // console.log('SUBSCRIBED /'+username)
    FANOUT_CLIENT.subscribe('/' + username, (data) => {
      console.log('GENERAL INCOMING ON', username, data)
      if (data.game) {
        if (this.state.game === null) {
          // were you waiting for this game?!
          let waitingGames = this.state.waitingGames
          let pos = waitingGames.indexOf(data.game.id)
          if (pos > -1) {
            waitingGames.splice(pos, 1);
          }
          this.setState({game: data.game, waitingGames: waitingGames})

        } else if (data.game.id === this.state.game.id) {
          this.setState({game: data.game})
          // console.log('Turn?', data.game.yourturn)
          if (data.game.yourturn) {
            setTimeout(() => {
              getOneElement('#opponents').scrollIntoView()
            }, 1000)
          }
        } else {
          console.warn('Socket updated a game which is not the one being played', data.game.id)
        }
      } else if (data.message) {
        // console.log('REALLY should do something about there being a new message coming in', data.message);
        Sounds.play('alert')
        if (this.state.game && this.state.game.id && this.state.game.id === data.message.game_id) {
          // console.log('Currently playing the game')
        } else {
          // Sounds.play('alert')
          let newMessages = this.state.newMessages
          newMessages.push(data.message)
          this.setState({newMessages: newMessages})
        }
        // let newMessages = this.state.newMessages
        // newMessages.push(data.message)
        // this.setState({newMessages: newMessages})
      }
    })
  }

  initServerGames() {
    return apiGet('/api/signedin')
    .then((result) => {
      // if it worked, we know we're at least not offline
      this.setState({synced: 0})
      sessionStorage.setItem('csrfmiddlewaretoken', result.csrf_token)
      if (result.username) {
        sessionStorage.setItem('username', result.username)
        sessionStorage.setItem('logincode', result.logincode)
        if (result.first_name) {
          sessionStorage.setItem('yourname', result.first_name)
        } else if (sessionStorage.getItem('yourname')) {
          this.syncSavedNamed(sessionStorage.getItem('yourname'))
        }
        this.loadGames()
        try {
          this.setupSocket(result.username)
        } catch(ex) {
          console.error('failed to setupSocket', ex)
        }
      } else {
        apiSet('/api/login', {})
        .then((result) => {
          sessionStorage.setItem('csrfmiddlewaretoken', result.csrf_token)
          sessionStorage.setItem('username', result.username)
          sessionStorage.setItem('logincode', result.logincode)
          if (sessionStorage.getItem('yourname')) {
            this.syncSavedNamed(sessionStorage.getItem('yourname'))
          }
          this.setState({games: [], stats: {}})
          this.setupSocket(result.username)
        })
      }
      if (window.trackJs) {
        trackJs.configure({userId: result.username})
      } else if (window.Rollbar) {
        Rollbar.configure({
          payload: {
            person: {
              username: result.username,
            }
          }
        })
      }

    })
    .catch((ex) => {
      console.warn(ex)
      this.setState({serverError: true})
    })
  }

  syncSavedNamed(name) {
    apiSet('/api/profile', {name: name})
    .then((result) => {
      sessionStorage.setItem('yourname', result.first_name)
    })
  }

  loadGames() {
    apiGet('/api/games?minimum=true')
    .then((result) => {
      // if (!this) throw new Error('no this?!')
      this.setState({
        games: result.games,
      })
      apiGet('/api/games')
      .then((result) => {
        this.setState({
          games: result.games,
          stats: result.stats,
          waitingGames: result.waiting,
          othersWaitingGames: result.others_waiting,
        })
      })
    })
  }

  onWaitingGame(id, clear = false) {
    if (clear) {
      this.setState({waitingGames: []})
    } else {
      let waitingGames = new Set(this.state.waitingGames)
      waitingGames.add(id)
      this.setState({waitingGames: Array.from(waitingGames)})
      // this.waitForGames()
    }
  }

  componentWillMount() {
    this.initServerGames()
  }

  abandonGame() {
    this.setState({
      game: null,
      games: this.state.games.filter(g => g.id !== this.state.game.id)
    })
    apiSet('/api/abandon', {game: this.state.game})
    .then(this.loadGames.bind(this))
    .catch((ex) => {
      alert('Sorry, it seems that game could not be abandoned')
    })
  }

  reload() {
    this.initServerGames()
  }

  render() {

    let synced = null
    if (this.state.synced > 0) {
      synced = (
        <p className="syncstatus not-synced">
          not synced to server
        </p>
      )
    } else if (this.state.synced < 0) {
      synced = (
        <p className="syncstatus offline">
          offline
        </p>
      )
    } else {
      synced = (
        <p className="syncstatus synced">
          online
        </p>
      )
    }

    let waitingForGames = null
    if (!this.state.game) {
      if (this.state.waitingGames.length) {
        waitingForGames = (
          <section className="section waiting-for-games">
            <p className="is-text-centered">
              <img src="/static/images/radar.gif"/>
              <br/>
              Waiting for someone to play with
            </p>
            {
              this.state.waitingGames.length > 1 ?
              <p className="is-text-centered">{this.state.waitingGames} games started</p> :
              null
            }
          </section>
        )
      } else if (this.state.othersWaitingGames) {
        waitingForGames = (
          <section className="section others-waiting-for-games">
            <p className="is-text-centered">
              This is currently <strong>{
                  this.state.othersWaitingGames === 1 ?
                  '1 other' :
                  `${this.state.othersWaitingGames} others`
                }</strong> waiting to play against somebody.<br/>
              Go ahead! Start a new game!
            </p>
          </section>
        )

      }
    }

    let serverError = null
    if (this.state.serverError) {
      serverError = (
        <section className="section server-error">
          <h4 className="title is-4">Hey! Fix your darn Internet!</h4>
          <p>
            It was not possible to connect you to the server so
            some things might not work.
          </p>
        </section>
      )
    }

    let newMessages = null
    if (this.state.newMessages.length) {
      newMessages = (
        <section className="section new-messages">
          <h4 className="title is-4">
            You have <strong>{this.state.newMessages.length}</strong> {
              this.state.newMessages.length === 1 ? 'message' : 'messages'
            }.
          </h4>
          {
            this.state.newMessages.map((message, i) => {
              return (
                <div key={'newmsg' + message.id} className="content">
                  <h5 className="title is-5">From: {message.name}</h5>
                  <blockquote>{message.message}</blockquote>
                  <button
                    className="button is-primary"
                    type="button"
                    onClick={this.gotoGameOnMessage.bind(this, message)}>Go to game</button>
                </div>
              )
            })
          }
        </section>
      )
    }

    let newGame = true
    // if (this.state.game) {
    //   if (this.state.loadedGames[this.state.game.id] > 1) {
    //     newGame = false
    //   }
    // }

    let loginCode = sessionStorage.getItem('logincode')

    return (
        <div>
          <h1 className="title is-1 is-text-centered">Battleshits</h1>
          <h3 className="title is-3 is-text-centered">You Will Never Shit in Peace</h3>

          { newMessages }

          { serverError }

          { waitingForGames }

          {
            this.state.game ?
            <Game
              game={this.state.game}
              gridWidth={this.state.gridWidth}
              newGame={newGame}
              onGameExit={this.onGameExit.bind(this)}
              changeGame={this.changeGame.bind(this)}
              onWaitingGame={this.onWaitingGame.bind(this)}
              onGameSelect={this.onGameSelect.bind(this)}
              onAdandonGame={this.abandonGame.bind(this)}/> :
            <Games
              games={this.state.games}
              stats={this.state.stats}
              loginCode={loginCode}
              reload={this.reload.bind(this)}
              onWaitingGame={this.onWaitingGame.bind(this)}
              onGamesChange={this.onGamesChange.bind(this)}
              onGameSelect={this.onGameSelect.bind(this)}/>
          }

          { synced }

        </div>
    )
  }
}

class Games extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      askYourName: false,
      changeYourName: false,
      changeYourEmail: false,
      startLogin: false,
      loginError: null,
    }
  }

  componentDidMount() {
  }

  startRandomGame(ai) {
    if (!ai) {
      // if you're not going to play against the computer we need your name
      let yourName = sessionStorage.getItem('yourname') || null
      if (!yourName) {
        this.setState({askYourName: true})
        return
      }
    }

    const _copyArrayOfObjects = (seq) => {
      return Array.from(seq, item => Object.assign({}, item))
    }
    if (ai) {
      let game = {
        id: -1,
        saved: false,
        you: {
          designmode: true,
          winner: false,
          grid: Array.from(_EMPTY_GRID),
          ships: _copyArrayOfObjects(SHIPS),
        },
        yourturn: false,
        rules: {
          drops: 3,
        },
        gameover: false,
        _drops: 0,  //
        opponent: {
          name: 'Computer',
          ai: true,
          winner: false,
          grid: Array.from(_EMPTY_GRID),
          ships: _copyArrayOfObjects(SHIPS),
          designmode: true
        }
      }
      game.you.ships = _randomlyPlaceShips(game.you.ships)
      game.opponent.ships = _randomlyPlaceShips(game.opponent.ships)
      if (__DEV__) {
        console.log('CHEATING:', game.opponent.ships)
      }
      let games = this.props.games
      games.push(game)
      this.props.onGamesChange(games)
      this.props.onGameSelect(game)
    } else {
      // create a game and send it to the server
      let game = {
        you: {
          name: sessionStorage.getItem('yourname'),
          designmode: true,
          winner: false,
          grid: Array.from(_EMPTY_GRID),
          ships: _copyArrayOfObjects(SHIPS),
        },
        yourturn: false,
        rules: {
          drops: 3,
        },
        gameover: false,
        _drops: 0,  //
        opponent: {
          name: '',
          ai: false,
          winner: false,
          grid: Array.from(_EMPTY_GRID),
          ships: _copyArrayOfObjects(SHIPS),
          designmode: true
        }
      }
      game.you.ships = _randomlyPlaceShips(game.you.ships)
      game.opponent.ships = _randomlyPlaceShips(game.opponent.ships)

      // If we were waiting for games, let's not do that whilst designing
      this.props.onWaitingGame(null, true)  // clears the list
      // We can't inform the server to start the game until we have
      // designed it.
      // let games = this.props.games
      // games.push(game)
      // this.props.onGamesChange(games)
      this.props.onGameSelect(game)

      // apiSet('/api/start', {game: game})
      // .then((result) => {
      //   // This should return a game. Either it was the one you
      //   // started or a similar one, with the same rules, that someone
      //   // else started.
      //   if (result.id) {
      //     // A new game was created, with the rules you chose.
      //     this.props.onWaitingGame(result.id)
      //   } else if (result.game) {
      //     console.log('MATCHED GAME', result.game)
      //     this.props.onGameSelect(result.game)
      //     // this.props.onGamesChange(games)
      //   }
      // })
    }
  }

  cancelAskYourName() {
    this.setState({askYourName: false})
  }

  onSaveYourName(e) {
    e.preventDefault()
    let name = this.refs.your_name.value.trim()
    if (name.length) {
      apiSet('/api/profile', {name: name})
      .then((result) => {
        sessionStorage.setItem('yourname', result.first_name)
        this.setState({askYourName: false})
        this.startRandomGame(false)
      })
    }
  }

  onChangeYourName(e) {
    e.preventDefault()
    let name = this.refs.change_your_name.value.trim()
    if (name.length) {
      apiSet('/api/profile', {name: name})
      .then((result) => {
        sessionStorage.setItem('yourname', result.first_name)
        this.setState({changeYourName: false})
      })
    }
  }

  logIn(e) {
    e.preventDefault()
    let code_or_email = this.refs.code_or_email.value.trim()
    if (code_or_email.length) {
      apiSet('/api/login', {code_or_email: code_or_email})
      .then((result) => {
        if (result.first_name) {
          sessionStorage.setItem('yourname', result.first_name)
          sessionStorage.setItem('logincode', result.logincode)
          this.setState({startLogin: false})
          this.props.reload()
        } else {
          this.setState({loginError: result.error})
        }
      })
    }
  }

  cancelChangeYourName() {
    this.setState({changeYourName: false})
  }

  cancelChangeYourEmail() {
    this.setState({changeYourEmail: false})
  }

  changeYourName() {
    this.setState({changeYourName: true})
  }

  changeYourEmail() {
    this.setState({changeYourEmail: true})
  }

  onChangeYourEmail(e) {
    e.preventDefault()
    let email = this.refs.change_your_email.value.trim()
    if (email.length) {
      apiSet('/api/profile', {email: email})
      .then((result) => {
        if (result.error) {
          alert(result.error)
        } else {
          sessionStorage.setItem('youremail', result.email)
          this.setState({changeYourEmail: false})
          apiSet('/api/mailme')
          .then((result) => {
            if (result.error) {
              alert(result.error)
            } else {
              alert('Check your inbox')
            }
          })
        }
      })
    }
  }

  startLogin() {
    this.setState({startLogin: true})
  }

  cancelStartLogin() {
    this.setState({startLogin: false})
  }

  render() {

    // let ongoingGames = null
    let ongoingGamesYourTurn = null
    let ongoingGamesTheirTurn = null
    if (this.props.games.length) {
      let yourturns = []
      let theirturns = []
      // could just a filter primitive but then we'd need to loop twice
      for (let game of this.props.games) {
        if (game.yourturn) {
          yourturns.push(game)
        } else {
          theirturns.push(game)
        }
      }
      if (yourturns.length) {
        ongoingGamesYourTurn = (
          <section className="section">
            <h4 className="title is-4">Ongoing games, your turn:</h4>
            <ListOngoingGames
              games={yourturns}
              onGameSelect={this.props.onGameSelect}
              />
          </section>
        )
      }
      if (theirturns.length) {
        ongoingGamesTheirTurn = (
          <section className="section">
            <h4 className="title is-4">Ongoing games, waiting:</h4>
            <ListOngoingGames
              games={theirturns}
              onGameSelect={this.props.onGameSelect}
              />
          </section>
        )
      }
      // ongoingGames = (
      //   <section className="section">
      //     { ongoingGamesYourTurn }
      //     { ongoingGamesTheirTurn }
      //   </section>
      // )
    }

    let nameForm = (
      <form onSubmit={this.onSaveYourName.bind(this)}>
        <p className="control is-grouped">
        {/*<label htmlFor="id_your_name">You must enter your name:</label>*/}
        <input
          type="text"
          className="input"
          name="your_name"
          ref="your_name"
          placeholder="Enter your name..."
          />
        <button
          type="submit"
          className="button is-primary"
          >Save</button>
        <button
          type="button"
          className="button"
          onClick={this.cancelAskYourName.bind(this)}>Cancel</button>
        </p>
      </form>
    )

    let startButtons = (
      <div>
        <p className="one-button">
          <button
            className="button is-primary is-fullwidth"
            onClick={this.startRandomGame.bind(this, false)}
            >Play against next available random person</button>
        </p>
        <p className="one-button">
          <button
            className="button is-primary is-fullwidth"
            onClick={this.startRandomGame.bind(this, true)}
            >Play against the computer</button>
        </p>
      </div>
    )
    /* <br/>
    <button>Invite someone to play with</button> (no f'ing Facebook!) */

    let startNewForm = (
      <section className="section">
        <h3 className="title">Start a new game</h3>

        { this.state.askYourName ? nameForm : startButtons}

      </section>
    )

    let stats = null
    if (this.props.stats.wins || this.props.stats.losses) {
      stats = (
        <section className="section">
          <h3 className="title">Stats</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Ongoing</th>
                <th>Wins</th>
                <th>Losses</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{this.props.stats.ongoing}</td>
                <td>{this.props.stats.wins}</td>
                <td>{this.props.stats.losses}</td>
              </tr>
            </tbody>
          </table>
        </section>
      )
    }

    let yourName = sessionStorage.getItem('yourname') || null

    let userDetails = null
    if (yourName) {
      let yourEmail = sessionStorage.getItem('youremail') || null
      if (this.state.changeYourEmail) {
        userDetails = (
          <section className="section">
            <form onSubmit={this.onChangeYourEmail.bind(this)}>
              <p className="control is-grouped">
                <input
                  type="email"
                  className="input"
                  name="change_your_email"
                  ref="change_your_email"
                  defaultValue={yourEmail || ''}
                  placeholder={yourEmail || 'Your email...'}/>
                <button className="button is-primary">Save</button>
                <button
                  type="button"
                  className="button"
                  onClick={this.cancelChangeYourEmail.bind(this)}>Cancel</button>
              </p>
            </form>
          </section>
        )
      } else if (this.state.changeYourName) {
        userDetails = (
          <section className="section">
            <form onSubmit={this.onChangeYourName.bind(this)}>
              <p className="control is-grouped">
                <input
                  type="text"
                  className="input"
                  name="change_your_name"
                  ref="change_your_name"
                  placeholder={yourName}/>
                <button className="button is-primary">Save</button>
                <button
                  type="button"
                  className="button"
                  onClick={this.cancelChangeYourName.bind(this)}>Cancel</button>
              </p>
            </form>
          </section>
        )
      } else {
        userDetails = (
          <section className="section">
            <p>
              You're signed in as <strong>{ yourName }</strong>.
            </p>
            <button
              className="button"
              type="button" onClick={this.changeYourName.bind(this)}>
              Change your name
            </button>
            <p>
              If you ever lose your phone; write down and remember your
              secret log in code: <code>{ this.props.loginCode }</code>.
            </p>
            <button
              className="button"
              type="button" onClick={this.changeYourEmail.bind(this)}>
              Email that to me
            </button>
          </section>
        )
      }

    } else {
      if (this.state.startLogin) {
        userDetails = (
          <section className="section">
            { this.state.loginError ?
              <h4 style={{color: "red"}}>{ this.state.loginError }</h4> : null
            }
            <form onSubmit={this.logIn.bind(this)}>
              <p className="control is-grouped">
                  <input
                    type="text"
                    className="input"
                    name="code_or_email"
                    ref="code_or_email"
                    placeholder="Code or Email"/>
                  <button
                    type="submit"
                    className="button is-primary">Get back in!</button>
                  <button
                    type="button"
                    className="button"
                    onClick={this.cancelStartLogin.bind(this)}>Cancel</button>
              </p>
              <p>
                When you first started you should have received a code. <br/>
                If you can't remember your code, enter your email. <br/>
              If you never entered your email; <b>you're screwed</b>.
              </p>
            </form>
          </section>
        )
      } else {
        userDetails = (
          <section className="section">
            <button
              className="button is-primary"
              type="button"
              onClick={this.startLogin.bind(this)}>
              Log back in
            </button>
          </section>
        )
      }

    }

    return (
      <div>
        {/*<h2 className="title">Games</h2>*/}

          { ongoingGamesYourTurn }

          { ongoingGamesTheirTurn }

          { startNewForm }

          { stats }

          { userDetails }
      </div>
    )
  }
}

class ListOngoingGames extends React.Component {
  render() {
    return (
      <div>
      {
        this.props.games.map((game) => {
          let bombsDropped = game.you.grid.filter(cell => {
            return cell > 0
          }).length
          bombsDropped += game.opponent.grid.filter(cell => {
            return cell > 0
          }).length
          return (
            <p className="one-button" key={game.id}>
              <button
                className="button is-primary is-fullwidth"
                onClick={this.props.onGameSelect.bind(this, game)}>
                {
                  game.yourturn ?
                  `Your turn against ${game.opponent.name}` :
                  `${game.opponent.name}'s turn`
                }
                {` (${bombsDropped} bombs dropped)`}
              </button>
            </p>
          )
        })
      }
      </div>
    )
  }
}


class Game extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: true,
      message: null,
      sound: localStorage.getItem('soundoff') ? false : true,
      subscription: null,
      confirmAbandon: false,
      messages: [],
    }
  }

  setupSocket(game, username) {
    // console.log('SUBSCRIBED /'+username)
    let channel = '/game-' + game.id + '-' + username
    console.log('Create subscription on:', channel)
    let subscription = FANOUT_CLIENT.subscribe(channel, (data) => {
      // console.log('INCOMING GAME ON', channel, data)
      // console.log('INDEX', data.index, 'YOURS', data.yours)
      if (data.message) {
        // console.log('New incoming message!', data.message);
        let messages = this.state.messages
        messages.push(data.message)
        this.setState({messages: messages})
        this.scrollChatToBottom()
        Sounds.play('alert')
      } else {
        this.bombSlot(data.index, data.yours, false, data.cell)
      }
      // if (data.game) {
      //   if (this.state.game === null) {
      //     this.setState({game: data.game})
      //   } else if (data.game.id === this.state.game.id) {
      //     this.setState({game: data.game})
      //     // console.log('Turn?', data.game.yourturn)
      //     if (data.game.yourturn) {
      //       setTimeout(() => {
      //         getOneElement('#opponents').scrollIntoView()
      //       }, 1000)
      //     }
      //   } else {
      //     console.warn('Socket updated a game which is not the one being played', data.game.id)
      //   }
      // }
    })
    this.setState({subscription: subscription})
  }

  componentWillUnmount() {
    if (this.state.subscription) {
      console.log('Cancel subscription on', this.state.subscription)
      this.state.subscription.cancel()
    }
  }

  componentDidMount() {
    // The game component has been mounted. Perhaps the game was between
    // a human and the computer and it's the computer's turn.
    let game = this.props.game
    if (game.opponent.ai) {
      if (!game.yourturn && !game.you.designmode && !game.opponent.designmode && !game.gameover) {
        setTimeout(() => {
          getOneElement('#yours').scrollIntoView()
          this.makeAIMove()
        }, 400)
      }
    } else {
      if (game.you.designmode) {
        getOneElement('#yours').scrollIntoView()
      } else if (!game.opponent.designmode) {
        // scroll to the grid whose turn it is
        setTimeout(() => {
          if (game.yourturn) {
            getOneElement('#opponents').scrollIntoView()
          } else {
            getOneElement('#yours').scrollIntoView()
          }
        }, 400)
      }

      // if (this.props.newGame) {
      if (game.id && game.id > 0) {
        this.setupSocket(game, sessionStorage.getItem('username'))
      }
    }

    if (game.id && game.id > 0) {
      apiGet('/api/messages?id=' + game.id)
      .then((response) => {
        this.setState({messages: response.messages})
      })
      .catch((ex) => {
        console.error('Failed to load messages', ex)
      })
    }

  }

  cellClicked(yours, index) {
    // you clicked, so if it's not your turn ignore
    let game = this.props.game
    if (!game.yourturn || yours || game.gameover) {
      console.log('ignore click')
      return
    }
    this.bombSlot(index, yours)
    if (!game.opponent.ai) {
      apiSet('/api/bomb', {
        id: game.id,
        index: index,
        cell: game.opponent.grid[index]
      })
    }

  }

  shipMoved(ship) {
    let game = this.props.game
    // This'll render the ships with their new position.
    // Now we need to figure out if any of the ships are overlapping
    // and thus mark them as such.

    game.you.ships.forEach((ship) => {
      ship.overlapping = false
    })
    game.you.ships.forEach((outer) => {
      game.you.ships.forEach((inner) => {
        if (inner.id !== outer.id) {
          // now we can compare two ships
          if (_isOverlapping(inner, outer)) {
            inner.overlapping = true
          }
        }
      })
    })
    this.props.changeGame(game, false)
  }

  shipRotated(ship) {
    // Sometimes when you rotate, the bottom part of the ship might
    // stick out outside the grid. We'll move it back into the grid then.
    if (ship.rotation === 90 || ship.rotation === 270) {
      // first check if it's y number + length is too long
      if ((ship.y + ship.length) > 10) {
        ship.y -= ship.y + ship.length - 10
      }
    } else {
      // ship lies horizontal
      if (ship.x + ship.length > 10) {
        ship.x -= ship.x + ship.length - 10
      }
    }
    if (this.state.sound) {
      Sounds.play('click')
    }
    this.shipMoved(ship)
  }

  _countOverlaps() {
    let overlaps = 0
    this.props.game.you.ships.forEach((ship) => {
      overlaps += ship.overlapping
    })
    return overlaps
  }

  onDoneButtonClick() {
    let game = this.props.game
    let overlaps = this._countOverlaps()
    if (overlaps) {
      alert(overlaps + ' ships are still overlapping you big fart!')
    } else {
      game.you.designmode = false

      // When the game starts, and the second grid appears, the browser
      // will, for some reason, sometimes scroll down a bit. Prevent that.
      if (game.opponent.ai) {
        // You're playing against the computer, let the computer
        // make the next move.
        game.opponent.designmode = false
        this.props.changeGame(game)
        setTimeout(() => {
          getOneElement('#yours').scrollIntoView()
          this.makeAIMove()
        }, 1000)
      } else {
        this.props.changeGame(null, false)
        apiSet('/api/start', {game: game})
        .then((result) => {
          if (result.id) {
            // no match, but a reference to your created game
            this.props.onWaitingGame(result.id)
            this.props.changeGame(null, false)
          } else if (result.game) {
            this.props.changeGame(result.game, false)
            // this.props.onGamesChange(null)
          } else {
            console.warn('Unrecognized result upon start', result);
            throw new Error('Unrecognized result')
          }
        })
        .catch((ex) => {
          console.error('Unable to start game :(', ex)
          throw ex
        })
        // // But if you can't start the game until your opponent has
        // // also designed theirs.
        // if (game.opponent.designmode) {
        //   this.props.onGameSelect(null)
        //   if (!game.id) throw new Error("Game not saved yet")
        //   this.props.onWaitingGame(game.id)
        // } else {
        //   // let it start
        // }
      }
    }
  }

  makeAIMove() {
    let game = this.props.game
    if (game.yourturn) {
      throw new Error("Not the AI's turn")
    }

    // let's make a move for the computer
    // XXX make this NOT random or next available one
    let slots = []
    game.you.grid.forEach((slot, i) => {
      if (slot === 0) {
        slots.push(i)
      }
    })
    // now we know all the slots that haven't been bombed yet
    let i = slots[Math.floor(Math.random() * slots.length)]
    this.bombSlot(i, true)
  }

  _newCellState(index, ships, chance) {
    let x = index % 10
    let y = Math.floor(index / 10)
    let xy = x + ',' + y
    for (let ship of ships) {
      let coords = _getAllCoordinates(ship)
      if (coords.has(xy)) {
        return [2, ship] // explosion
      }
    }
    if (chance && Math.random() > 0.92) {
      return [3, null] // missed but toilet paper
    }

    return [1, null] // missed
  }

  bombSlot(index, opponentmove, save = true, newCellstate = null) {
    let game = this.props.game
    let yourturn
    let yoursElement = getOneElement('#yours')
    let opponentsElement = getOneElement('#opponents')
    let element
    let nextElement
    // let newCellstate
    let ship

    if (opponentmove) {
      element = yoursElement
      nextElement = opponentsElement;
      if (newCellstate === 3) {
        ship = null
      } else {
        [newCellstate, ship] = this._newCellState(index, game.you.ships, false)
      }
      game.you.grid[index] = newCellstate
    } else {
      element = opponentsElement
      nextElement = yoursElement;
      [newCellstate, ship] = this._newCellState(index, game.opponent.ships, true)
      game.opponent.grid[index] = newCellstate
    }

    let closeMessage = null

    if (newCellstate === 2) {
      let bombed
      let allBombed = false
      if (opponentmove) {
        bombed = _isBombed(game.you.grid, ship)
        if (bombed) {
          this.setState({message: `
            ${game.opponent.name} sunk your battleshit (${ship.length})!
          `})
          closeMessage = setTimeout(() => {
            this.setState({message: null})
          }, 5000)
        }
      } else {
        bombed = _isBombed(game.opponent.grid, ship)
        if (bombed) {
          this.setState({message: `
            I sunk your battleshit (${ship.length})!\nHa ha!`
          })
          closeMessage = setTimeout(() => {
            this.setState({message: null})
          }, 5000)
          // setTimeout(() => {
          //   alert(`You sunk my battleshit you jerk!`)
          // }, 400)
        }
      }
      ship.bombed = bombed
      if (bombed) {
        // XXX might need to figure out if the game is over
        if (opponentmove) {
          allBombed = _isAllBombed(game.you.ships)
        } else {
          allBombed = _isAllBombed(game.opponent.ships)
        }
        if (allBombed) {
          game.gameover = true
          if (opponentmove) {
            this.setState({message: `You lost!\n(aka. you suck)`})
            game.opponent.winner = true
            Sounds.play('booing')
          } else {
            if (closeMessage) {
              clearTimeout(closeMessage)
            }
            this.setState({message: `Congratulations!\nYou are Lord of the Toilet!`})
            game.you.winner = true
            Sounds.play('flush')
          }
        }
      }
    } else if (newCellstate === 3) {
      if (opponentmove) {
        this.setState({message: `
          Toilet paper!\n${game.opponent.name} gets ${game.rules.drops} more drops`
        })
      } else {
        this.setState({message: `
          Toilet paper!\nYou get ${game.rules.drops} more drops`
        })
      }
      setTimeout(() => {
        this.setState({message: null})
      }, 3000)
      game._drops -= game.rules.drops
    }


    // the turn only changes if you've dropped as many as the rules
    // call for.
    game._drops = game._drops || 0
    game._drops++
    let turnchange = false
    if (game._drops == game.rules.drops) {
      game.yourturn = opponentmove
      turnchange = true
      game._drops = 0
    }

    if (this.state.sound && !game.gameover) {
      // play a sound about the bomb attempt
      if (newCellstate === 3) {
        // toilet
        Sounds.play('yes')
      } else if (newCellstate === 2) {
        // explosion!
        Sounds.play('explosion')
      } else {
        Sounds.play('fart')
      }
    }

    if (!turnchange && !game.gameover) {
      save = false
    }

    setTimeout(() => {
      this.props.changeGame(game, save)
      if (!game.gameover) {
        setTimeout(() => {
          if (turnchange) {
            nextElement.scrollIntoView({block: "end", behavior: "smooth"})
          }
          if (!game.yourturn && game.opponent.ai && !game.gameover) {
            setTimeout(() => {
              this.makeAIMove()
            }, 800)
          }
        }, 800)
      }
    }, 400)
  }

  toggleSound() {
    if (this.state.sound) {
      localStorage.setItem('soundoff', true)
    } else {
      localStorage.removeItem('soundoff')
    }
    this.setState({sound: !this.state.sound})
  }

  toggleAbandonGameConfirm() {
    this.setState({confirmAbandon: !this.state.confirmAbandon})
  }

  onNewMessage(message) {
    let messages = this.state.messages
    messages.push({
      id: -messages.length,
      you: true,
      message: message
    })
    this.setState({messages: messages})
    this.scrollChatToBottom()

    return apiSet('/api/messages', {id: this.props.game.id, message: message})
    .then((response) => {
      this.setState({messages: response.messages})
    })
  }

  scrollChatToBottom() {
    let container = document.querySelector('.chat .messages')
    container.scrollTop = container.scrollHeight
    setTimeout(() => {
      // do it again a little bit later to really make sure it's down.
      container.scrollTop = container.scrollHeight
    }, 300)
  }

  render() {
    let game = this.props.game
    let grids = null;

    let yourHeader = null
    let drops = game.rules.drops
    let _drops = game._drops
    if (game.you.designmode) {
      yourHeader = "Design where to put your shits"
    } else {
      yourHeader = "Your grid"
      // while (_drops < 0) {
      //   drops++
      //   _drops++
      // }
      // if (_drops < 0) {
      //   drops += -1 * _drops
      //   _drops = 1
      // }
      if (!game.yourturn && !game.gameover) {
        yourHeader += `(${game.opponent.name}'s turn, ${_drops} of ${drops})`
      }
    }

    let opponentHeader = `${game.opponent.name}'s grid`
    if (game.yourturn && !game.gameover) {
      // if (game._drops && game._drops < game.rules.drops) {
        opponentHeader += ` (Your turn, ${_drops} of ${drops})`
      // } else {
      //   opponentHeader += ` (Your turn)`
      // }
    }

    let statusHead
    if (game.gameover) {
      statusHead = <h3 className="title">Status: Game Over</h3>
    } else if (game.you.designmode) {
      statusHead = null //<h3>Status: Place your shitty ships!</h3>
    } else if (game.opponent.designmode) {
      statusHead = <h3 className="title">Status: {game.opponent.name + '\u0027'}s placing ships</h3>
    } else {
      if (game.yourturn) {
        statusHead = <h3 className="title">Status: Your turn</h3>
      } else {
        statusHead = <h3 className="title">Status: {game.opponent.name + '\u0027'}s turn</h3>
      }
    }

    let opponent = null
    if (!game.you.designmode) {
      if (game.opponent.designmode) {
        opponent = <p>{game.opponent.name} is scheming and planning</p>
      } else {
        opponent = (
          <div id="opponents">
            <h5 className="title is-5 grid-header">
              {opponentHeader}
            </h5>
            <Grid
              grid={game.opponent.grid}
              ships={game.opponent.ships}
              canMove={false}
              hideShips={true}
              opponent={true}
              cellClicked={this.cellClicked.bind(this, false)}
              onMove={this.shipMoved.bind(this)}
              onRotate={this.shipRotated.bind(this)}
              />
          </div>
        )
      }
    // } else {
    //   opponent = <p>No opponent yet</p>
    }
    let doneButton = null

    if (game.you.designmode) {
      let disabledDoneButton = this._countOverlaps() > 0
      doneButton = (
        <section className="section" style={{paddingTop: 10}}>
          <p className="is-text-centered">
            When you're done...<br/>
            <button
                className="button done-button is-medium is-fullwidth is-success"
                onClick={this.onDoneButtonClick.bind(this)}
                disabled={disabledDoneButton}>
              I have placed my shitty ships
            </button>
          </p>
          <p>
            Rules are...
          </p>
          <ul>
            <li>Number of drops per turn: <b>{game.rules.drops}</b></li>
          </ul>
        </section>
      )
    }
    // { !game.you.designmode ? <h4>{yourHeader}</h4> : null}
    let yours = (
      <div id="yours">
        <h5 className="title is-5 grid-header">{ yourHeader }</h5>
        <Grid
          grid={game.you.grid}
          ships={game.you.ships}
          canMove={game.you.designmode}
          hideShips={false}
          opponent={false}
          cellClicked={this.cellClicked.bind(this, true)}
          onMove={this.shipMoved.bind(this)}
          onRotate={this.shipRotated.bind(this)}
          />
        { doneButton }
      </div>
    )

    let abandonment = null
    if (game.id && game.id > 0) {
      abandonment = (
        <p>
        <button
          className="button"
          onClick={this.toggleAbandonGameConfirm.bind(this)}>Abandon Game</button>
        </p>
      )
      if (this.state.confirmAbandon) {
        abandonment = (
          <div>
            <p>This will delete the game as if it never happened</p>
            <button
              className="button is-primary"
              onClick={this.props.onAdandonGame.bind(this)}>Just do it already!</button>
            <button
              className="button"
              onClick={this.toggleAbandonGameConfirm.bind(this)}>Actually, cancel</button>
          </div>
        )
      }
    }

    let chat = null
    if (!this.props.game.opponent.ai && this.props.game.id) {
      chat = (
        <section className="section chat" style={{paddingTop: 10}}>
          <Chat
            messages={this.state.messages}
            onNewMessage={this.onNewMessage.bind(this)}
            />
        </section>
      )
    }

    return (
      <div>
        <button
          className="button is-primary is-fullwidth"
          onClick={this.props.onGameExit.bind(this)}>Exit game</button>

        { statusHead }
        <Message message={this.state.message}/>
        <div className="grids">

          { opponent }

          { yours }

        </div>

        { chat }

        <section className="section">
          <h5 className="title is-5">You and your game options!</h5>
          <p>
            <button
              className="button"
              onClick={this.toggleSound.bind(this)}>
              { this.state.sound ? 'Turn sound off' : 'Turn sound on' }
            </button>
          </p>

          { abandonment }

        </section>

      </div>
    )
  }
}


ReactDOM.render(<App/>, document.getElementById('mount-point'))
