import React from 'react'
import ReactDOM from 'react-dom'
import { Router, IndexRoute, Route, Link, Navigation } from 'react-router'
import createBrowserHistory from 'history/lib/createBrowserHistory'
import 'whatwg-fetch'
import Grid from './components/grid.jsx'
import Sounds from './components/sounds.js'
import $ from 'jquery'


const SHIPS = [
  {id: '2',   length: 2, x: 1, y: 0, rotation: 0, overlapping: false},
  {id: '3-1', length: 3, x: 7, y: 1, rotation: 0, overlapping: false},
  {id: '3-2', length: 3, x: 6, y: 2, rotation: 90, overlapping: false},
  {id: '4',   length: 4, x: 5, y: 3, rotation: 90, overlapping: false},
  {id: '5',   length: 5, x: 4, y: 8, rotation: 0, overlapping: false},
]


const _YOUR = [];
const _OPP = [];
for (let i=0; i<100;i++) {
  // if (Math.random()>0.9) {
  //   _YOUR.push(2);
  // } else if (Math.random()>0.9) {
  //   _YOUR.push(3);
  // } else if (Math.random()>0.9) {
  //   _YOUR.push(1);
  // } else {
  //   _YOUR.push(0);
  // }
  _YOUR.push(0);
  // if (Math.random()>0.92) {
  //   _OPP.push(2);
  // } else if (Math.random()>0.92) {
  //   _OPP.push(3);
  // } else if (Math.random()>0.92) {
  //   _OPP.push(1);
  // } else {
  //   _OPP.push(0);
  // }
  _OPP.push(0);
}


let apiGet = (url) => {

  if (url==='/api/games/') {
    return new Promise((resolve) => {
        resolve({
          games: [
            {id: 1, designmode: true, yourturn: false, opponent: {name: 'Jim', designmode: false}},
            {id: 2, designmode: false, yourturn: true, opponent: {name: 'Matt C', designmode: false}},
            {id: 3, designmode: true, yourturn: false, opponent: {name: 'Holy Acorn', ai: true, designmode: true}},
          ]
        })
    });
  }
  if (url==='/api/games/0') {
    return new Promise((resolve) => {
        resolve({
          game: {
            id: 0,
            yourturn: false,
            designmode: true,
            grid: _YOUR,
            ships: SHIPS.copyWithin(0, 0),
            opponent: {
              grid: _OPP,
              name: 'Computer',
              ai: true,
              designmode: true,
              ships: SHIPS.copyWithin(0, 0),
            }
          }
        })
    });
  }
  if (url==='/api/games/1') {
    return new Promise((resolve) => {
        resolve({
          game: {
            id: 1,
            yourturn: false,
            designmode: true,
            grid: _YOUR,
            ships: SHIPS.copyWithin(0, 0),
            opponent: {
              grid: _OPP,
              name: 'Jim',
              ai: false,
              designmode: false,
              ships: SHIPS.copyWithin(0, 0),
            }
          }
        })
    });
  }
  if (url==='/api/games/3') {
    return new Promise((resolve) => {
        resolve({
          game: {
            id: 3,
            yourturn: false,
            designmode: true,
            grid: _YOUR,
            ships: SHIPS.copyWithin(0, 0),
            opponent: {
              grid: _OPP,
              name: 'Holy Acorn',
              ai: true,
              designmode: true,
              ships: SHIPS.copyWithin(0, 0),
            }
          }
        })
    });
  }
    // this.setState({
    //   loading: false,
    //   yourturn: game.yourturn,
    //   designmode: game.designmode,
    //   id: game.id,
    //   grid: game.grid,
    //   ships: game.ships,
    //   // ships: SHIPS.copyWithin(0, 0),
    //   opponent: {
    //     // grid: _OPP,
    //     grid: game.opponent.grid,
    //     name: game.opponent.name,
    //     // ships: SHIPS.copyWithin(0, 0),
    //     ships: game.opponent.ships
    //   }
    // })


  throw new Error('HACKING!' + url)
  return fetch(url)
  .then((r) => {
    if (r.status === 200) {
      return r.json()
    }
    throw new Error(r.status)
  })
  .catch((ex) => {
    console.error('FETCH API error', ex)
    throw ex
  })
}

let apiSet = (url, options) => {
  if (url==='/api/games/1' && options.designed) {
    return new Promise((resolve) => {
      resolve({ok: true})
    })
  }
  if (url==='/api/games/3' && options.designed) {
    return new Promise((resolve) => {
      resolve({ok: true})
    })
  }
  throw new Error('HACKING!' + url)
}

class Homepage extends React.Component {
  constructor(props) {
    super(props);
    // this.state = {
    //   games: []
    // };
  }

  render() {
    return (
      <div>
        <Link to="/games">Games</Link>
      </div>
    )
  }
}

class App extends React.Component {
  render() {
    return (
      <div>
        <div>
          <h1>Battleshits</h1>
          {this.props.children}
        </div>
      </div>
    )
  }
}

class Games extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      games: [],
    };
  }

  componentDidMount() {
    apiGet('/api/games/')
    .then((result) => this.setState({games: result.games}))
  }

  startRandomGame(ai) {
    console.log('Start random game', ai)
    console.log(this.state.games)
    if (ai) {
      let game = {
        id: 0,
        designmode: true,
        yourturn: false,
        opponent: {
          name: 'Computer',
          ai: true,
          designmode: true
        }
      }
    }
    // REDIRECT TO THE CREATED GAME this.props.history.replaceState(null, '/game/3')
    this.props.history.replaceState(null, '/game/0')
  }

  render() {
    let ongoingGames = null;
    if (this.state.games.length) {
      ongoingGames = (
        <ul>
          {
            this.state.games.map((game) => {
              return (
                <li key={game.id}>
                  <Link to={`/game/${game.id}`}>
                    {
                      game.yourturn ?
                      `Your turn against ${game.opponent.name}` :
                      `${game.opponent.name}'s turn`
                    }
                    {
                      game.opponent.ai ?
                      ' (computer)' : null
                    }
                  </Link>
                </li>
              )
            })
          }
        </ul>
      )
    }
    let startNewForm = (
      <div>
        <h3>Start a new game</h3>
        <button onClick={this.startRandomGame.bind(this, false)}
          >Play against next available random person</button>
        <br/>
        <button onClick={this.startRandomGame.bind(this, true)}
          >Play against the computer</button>
        <br/>
        <button>Invite someone to play with</button> (no f'ing Facebook!)
      </div>
    )
    return (
      <div>
        <h2>Games</h2>
          <div>
            <h3>Ongoing games you have</h3>
            {this.state.games.length ? ongoingGames : <i>none</i>}
          </div>
        <hr/>
        {startNewForm}
      </div>
    )

  }
}


class Game extends React.Component {
  constructor() {
    super();
    // this.state = {
    //   games: [1],
    //     id: 1,
    //     yourturn: false,
    //     yours: _YOUR,
    //     opponent: _OPP,
    //   }]
    // };
    this.state = {
      loading: true,
      yourturn: false,
      grid: [],  // your grid
      ships: [],
      opponent: {
        name: null,
        grid: [],
        ships: [],
      },
    }
  }

  componentDidMount() {
    apiGet('/api/games/' + this.props.params.id)
    .then((result) => {
      let game = result.game
      this.setState({
        loading: false,
        yourturn: game.yourturn,
        designmode: game.designmode,
        id: game.id,
        grid: game.grid,
        ships: game.ships,
        // ships: SHIPS.copyWithin(0, 0),
        opponent: {
          // grid: _OPP,
          grid: game.opponent.grid,
          name: game.opponent.name,
          ai: game.opponent.ai,
          designmode: game.opponent.designmode,
          // ships: SHIPS.copyWithin(0, 0),
          ships: game.opponent.ships
        }
      })
    })
    Sounds.preLoadSounds()
  }

  cellClicked(yours, index) {
    // you clicked, so if it's not your turn ignore
    if (!this.state.yourturn || yours) {
      console.log('ignore click')
      return
    }
    this.bombSlot(index, yours)
  }

  _getAllCoordinates(ship) {
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

  shipMoved(ship) {
    // This'll render the ships with their new position.
    // Now we need to figure out if any of the ships are overlapping
    // and thus mark them as such.

    let isOverlapping = (ship1, ship2) => {
      // list ALL their coordinates and compare if any of them match
      let coords1 = this._getAllCoordinates(ship1)
      let coords2 = this._getAllCoordinates(ship2)
      let intersection = [...coords1].filter(x => coords2.has(x))
      return intersection.length > 0
    }
    this.state.ships.forEach((ship) => {
      ship.overlapping = false
    })
    this.state.ships.forEach((outer) => {
      this.state.ships.forEach((inner) => {
        if (inner.id !== outer.id) {
          // now we can compare two ships
          if (isOverlapping(inner, outer)) {
            inner.overlapping = true
          }
        }
      })
    })
    this.setState({ships: this.state.ships}) // looks weird
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

    this.shipMoved(ship)
  }

  _countOverlaps() {
    let overlaps = 0
    this.state.ships.forEach((ship) => {
      overlaps += ship.overlapping
    })
    return overlaps
  }

  onDoneButtonClick() {
    let overlaps = this._countOverlaps()
    if (overlaps) {
      alert(overlaps + ' ships are still overlapping you big fart!')
    } else {
      this.setState({designmode: false})
      apiSet('/api/games/' + this.state.id, {designed: true})
      if (this.state.opponent.ai) {
        // You're playing against the computer, let the computer
        // make the next move.
        // First, randomly place the computer's ships.
        this._randomlyPlaceShips(
          this.state.opponent.ships
        )
        console.log('OPPONENTS SHIPS AFTERWARDS', this.state.opponent.ships)
        // XXX here we should randomly place the AI's ships
        this.state.opponent.designmode = false
        this.setState({opponent: this.state.opponent})
        // console.log('yourturn?', this.state.yourturn)
        setTimeout(() => {
          this.makeAIMove()
        }, 1000)
      }
    }
  }

  _randomlyPlaceShips(ships) {
    let isOverlapping = (ship1, ship2) => {
      // list ALL their coordinates and compare if any of them match
      let coords1 = this._getAllCoordinates(ship1)
      let coords2 = this._getAllCoordinates(ship2)
      let intersection = [...coords1].filter(x => coords2.has(x))
      return intersection.length > 0
    }

    let prev = {}  // remember what previous numbers we have generated
    let randomPosition = (type) => {
      if (!prev[type]) {
        prev[type] = []
      }
      let r = Math.floor(Math.random() * 100)
      if (prev[type].indexOf(r) > -1) {
        return randomPosition(type)
      }
      prev[type].push(r)
      return r
    }
    let randomRotation = () => {
      let rotations = [0, 0, 90]
      return rotations[Math.random() * rotations.length]
    }
    for (var ship of ships) {
      // randomly place the ship somewhere
      ship.x = randomPosition('x')
      ship.y = randomPosition('y')
      ship.rotation = randomRotation()

      // now compare this to all other ships
      for (var other in ships) {
        if (other.id != ship.id) {
          console.log(isOverlapping(ship, other))
        }
      }
    }
  }

  makeAIMove() {
    // console.log('START AI GAME!')
    if (this.state.yourturn) {
      throw new Error("Not the AI's turn")
    }

    // let's make a move for the computer
    // XXX make this NOT random or next available one
    let slots = []
    this.state.grid.forEach((slot, i) => {
      if (slot === 0) {
        slots.push(i)
      }
    })
    // now we know all the slots that haven't been bombed yet
    let i = slots[Math.floor(Math.random() * slots.length)]
    this.bombSlot(i, true)

  }

  _newCellState(index, ships) {
    let x = index % 10
    let y = Math.floor(index / 10)
    let xy = x + ',' + y
    for (var ship of ships) {
      let coords = this._getAllCoordinates(ship)
      if (coords.has(xy)) {
        // XXX we should now investigate if all coords of this ship has had an explosion and if so say "You sank my..."
        return 2 // explosion
      }
    }
    return 1 // missed
  }

  bombSlot(index, opponentmove) {
    let yourturn
    let yoursElement = document.querySelector('#yours')
    let opponentsElement = document.querySelector('#opponents')
    let element
    let nextElement
    let newCellstate
    if (opponentmove) {
      yourturn = true
      element = yoursElement
      nextElement = opponentsElement
      newCellstate = this._newCellState(index, this.state.ships)
      this.state.grid[index] = newCellstate
    } else {
      yourturn = false
      element = opponentsElement
      nextElement = yoursElement
      newCellstate = this._newCellState(index, this.state.opponent.ships)
      this.state.opponent.grid[index] = newCellstate
    }

    let audioElement
    if (newCellstate === 1) {
      // explosion!
      audioElement = Sounds.getRandomAudioElement('fart')
    } else {
      audioElement = Sounds.getRandomAudioElement('explosion')
    }
    audioElement.play()

    element.scrollIntoView({block: "end", behavior: "smooth"})
    setTimeout(() => {
      this.setState({
        grid: this.state.grid,
        opponent: this.state.opponent,
        yourturn: yourturn,
      })
      setTimeout(() => {
        nextElement.scrollIntoView({block: "end", behavior: "smooth"})
        if (!this.state.yourturn && this.state.opponent.ai) {
          setTimeout(() => {
            this.makeAIMove()
          }, 1000)
        }
      }, 1000)
    }, 500)
  }

  render() {
    let grids = null;
    if (!this.state.loading) {
      if (this.state.designmode) {
        let disabledDoneButton = this._countOverlaps() > 0
        let doneButton = (
            <button
                className="done-button"
                onClick={this.onDoneButtonClick.bind(this)}
                disabled={disabledDoneButton}>
              I have placed my shitty ships
            </button>
        )
        grids = (
          <div className="designmode">
            {doneButton}
            <Grid
              domID="yours"
              ships={this.state.ships}
              grid={this.state.grid}
              canMove={true}
              hideShips={false}
              cellClicked={this.cellClicked.bind(this, true)}
              onMove={this.shipMoved.bind(this)}
              onRotate={this.shipRotated.bind(this)}
              />
          </div>
        )
      } else if (this.state.opponent.designmode) {
        <p>{this.state.opponent.name} is scheming and planning</p>
      } else {
        grids = (
          <div className="grids">
            <div id="yours">
              <h4>
                Your grid
                { !this.state.yourturn ?
                  ` (${this.state.opponent.name}'s turn)` : null
                }
              </h4>
              <Grid
                grid={this.state.grid}
                ships={this.state.ships}
                canMove={false}
                hideShips={false}
                cellClicked={this.cellClicked.bind(this, true)}
                onMove={this.shipMoved.bind(this)}
                onRotate={this.shipRotated.bind(this)}
                />
            </div>
            <div id="opponents">
              <h4>
                {`${this.state.opponent.name}'s`} grid
                { this.state.yourturn ? ' (Your turn)' : null}
              </h4>
              <Grid
                grid={this.state.opponent.grid}
                ships={this.state.opponent.ships}
                canMove={false}
                hideShips={true}
                cellClicked={this.cellClicked.bind(this, false)}
                onMove={this.shipMoved.bind(this)}
                onRotate={this.shipRotated.bind(this)}
                />
            </div>
          </div>
        )
      }
    }
    // console.log(this.state)
    let statusHead
    if (this.state.designmode) {
      statusHead = <h3>Status: Place your shitty ships!</h3>
    } else if (this.state.opponent.designmode) {
      statusHead = <h3>Status: {this.state.opponent.name + '\u0027'}s placing ships</h3>
    } else {
      if (this.state.yourturn) {
        statusHead = <h3>Status: Your turn</h3>
      } else {
        statusHead = <h3>Status: {this.state.opponent.name + '\u0027'}s turn</h3>
      }
    }

    return (
      <div>
        <h2>Playing against <i>{this.state.opponent.name}</i></h2>
        {this.state.loading ? 'Loading...' : statusHead}
        {grids}
        <p>
          Bottom of the page this is!
        </p>

      </div>
    )
  }
}




/*<Router history={createBrowserHistory()}>*/
ReactDOM.render((
  <Router>
    <Route path="/" component={App}>
      <IndexRoute component={Homepage} />
      <Route path="games" component={Games}/>
      <Route path="/game/:id" component={Game}/>
    </Route>
  </Router>
), document.getElementById('mount-point'))
