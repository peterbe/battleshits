import React from 'react'
import ReactDOM from 'react-dom'
import 'whatwg-fetch'
import Grid from './components/grid.jsx'
import Sounds from './components/sounds.js'
import $ from 'jquery'


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

  if (url==='/api/games/') {
    return new Promise((resolve) => {
        resolve({
          games: [
            //_GAME1, _GAME2, _GAME3
          ]
        })
    });
  }

  // if (url==='/api/games/0') {
  //   return new Promise((resolve) => {
  //       resolve({
  //         game:
  //       })
  //   });
  // }
  // if (url==='/api/games/1') {
  //   return new Promise((resolve) => {
  //       resolve({
  //         game:
  //       })
  //   });
  // }
  // if (url==='/api/games/3') {
  //   return new Promise((resolve) => {
  //       resolve({
  //         game: {
  //           id: 3,
  //           yourturn: false,
  //           designmode: true,
  //           grid: _YOUR,
  //           ships: SHIPS.copyWithin(0, 0),
  //           opponent: {
  //             grid: _OPP,
  //             name: 'Holy Acorn',
  //             ai: true,
  //             designmode: true,
  //             ships: SHIPS.copyWithin(0, 0),
  //           }
  //         }
  //       })
  //   });
  // }
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

// class Homepage extends React.Component {
//   constructor(props) {
//     super(props);
//     // this.state = {
//     //   games: []
//     // };
//   }
//
//   render() {
//     return (
//       <div>
//         <Link to="/games">Games</Link>
//       </div>
//     )
//   }
// }

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      game: null,
    }
  }

  onGameSelect(game) {
    // XXX perhaps set a sessionStorage so that it continues this game
    // if you refresh the page
    this.setState({game: game})
  }

  changeGame(game) {
    // XXX save this state on the server
    this.setState({game: game})
  }

  render() {
    return (
      <div>
        <div>
          <h1>Battleshits</h1>
          {
            this.state.game ?
            <Game game={this.state.game} changeGame={this.changeGame.bind(this)}/> :
            <Games onGameSelect={this.onGameSelect.bind(this)}/>
          }
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
    const _copyArrayOfObjects = (seq) => {
      return Array.from(seq, item => Object.assign({}, item))
    }
    if (ai) {
      let game = {
        id: -1,
        saved: false,
        designmode: true,
        yourturn: false,
        grid: Array.from(_EMPTY_GRID),
        ships: _copyArrayOfObjects(SHIPS),
        opponent: {
          name: 'Computer',
          ai: true,
          grid: Array.from(_EMPTY_GRID),
          ships: _copyArrayOfObjects(SHIPS),
          designmode: true
        }
      }
      game.ships = _randomlyPlaceShips(game.ships)
      game.opponent.ships = _randomlyPlaceShips(game.opponent.ships)
      let games = this.state.games
      games.push(game)
      this.setState({games: games})
      this.props.onGameSelect(game)
    }
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
                  <button onClick={this.props.onGameSelect.bind(this, game)}>
                    {
                      game.yourturn ?
                      `Your turn against ${game.opponent.name}` :
                      `${game.opponent.name}'s turn`
                    }
                    {
                      game.opponent.ai ?
                      ' (computer)' : null
                    }
                  </button>
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
  constructor(props) {
    super(props)
    this.state = {
      loading: true,
      // yourturn: false,
      // grid: [],  // your grid
      // ships: [],
      // opponent: {
      //   name: null,
      //   grid: [],
      //   ships: [],
      // },
    }
  }

  componentDidMount() {
    // console.log("GAME", this.props.game)
    // let state = this.props.game
    // state.loading = false
    // this.setState(state)
    // console.log('THIS.STATE', this.state)
    // this.setState({loading: false})
    // throw "work harder"

    // apiGet('/api/games/' + this.props.params.id)
    // .then((result) => {
    //   let game = result.game
    //   this.setState({
    //     loading: false,
    //     yourturn: game.yourturn,
    //     designmode: game.designmode,
    //     id: game.id,
    //     grid: game.grid,
    //     ships: game.ships,
    //     // ships: SHIPS.copyWithin(0, 0),
    //     opponent: {
    //       // grid: _OPP,
    //       grid: game.opponent.grid,
    //       name: game.opponent.name,
    //       ai: game.opponent.ai,
    //       designmode: game.opponent.designmode,
    //       // ships: SHIPS.copyWithin(0, 0),
    //       ships: game.opponent.ships
    //     }
    //   })
    // })

    // XXX replace this with service worker or manifest or something
    Sounds.preLoadSounds()
  }

  cellClicked(yours, index) {
    // you clicked, so if it's not your turn ignore
    if (!this.props.game.yourturn || yours) {
      console.log('ignore click')
      return
    }
    this.bombSlot(index, yours)
  }

  shipMoved(ship) {
    let game = this.props.game
    // This'll render the ships with their new position.
    // Now we need to figure out if any of the ships are overlapping
    // and thus mark them as such.

    game.ships.forEach((ship) => {
      ship.overlapping = false
    })
    game.ships.forEach((outer) => {
      game.ships.forEach((inner) => {
        if (inner.id !== outer.id) {
          // now we can compare two ships
          if (_isOverlapping(inner, outer)) {
            inner.overlapping = true
          }
        }
      })
    })
    this.props.changeGame(game)
    // this.setState({ships: this.state.game.ships}) // looks weird
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
    this.props.game.ships.forEach((ship) => {
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
      game.designmode = false
      this.props.changeGame(game)
      // this.setState({designmode: false})
      // apiSet('/api/games/' + this.state.id, {designed: true})
      if (game.opponent.ai) {
        // You're playing against the computer, let the computer
        // make the next move.
        game.opponent.designmode = false
        this.props.changeGame(game)
        setTimeout(() => {
          this.makeAIMove()
        }, 1000)
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
    game.grid.forEach((slot, i) => {
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
      let coords = _getAllCoordinates(ship)
      if (coords.has(xy)) {
        // XXX we should now investigate if all coords of this ship has had an explosion and if so say "You sank my..."
        return 2 // explosion
      }
    }
    return 1 // missed
  }

  bombSlot(index, opponentmove) {
    let game = this.props.game
    let yourturn
    let yoursElement = document.querySelector('#yours')
    let opponentsElement = document.querySelector('#opponents')
    let element
    let nextElement
    let newCellstate

    game.yourturn = opponentmove
    if (opponentmove) {
      element = yoursElement
      nextElement = opponentsElement
      newCellstate = this._newCellState(index, game.ships)
      game.grid[index] = newCellstate
    } else {
      element = opponentsElement
      nextElement = yoursElement
      newCellstate = this._newCellState(index, game.opponent.ships)
      game.opponent.grid[index] = newCellstate
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
      this.props.changeGame(game)
      setTimeout(() => {
        nextElement.scrollIntoView({block: "end", behavior: "smooth"})
        if (!game.yourturn && game.opponent.ai) {
          setTimeout(() => {
            this.makeAIMove()
          }, 1000)
        }
      }, 1000)
    }, 500)
  }

  render() {
    let game = this.props.game
    let grids = null;
    if (game.designmode) {
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
            ships={game.ships}
            grid={game.grid}
            canMove={true}
            hideShips={false}
            cellClicked={this.cellClicked.bind(this, true)}
            onMove={this.shipMoved.bind(this)}
            onRotate={this.shipRotated.bind(this)}
            />
        </div>
      )
    } else if (game.opponent.designmode) {
      <p>{game.opponent.name} is scheming and planning</p>
    } else {
      grids = (
        <div className="grids">
          <div id="yours">
            <h4>
              Your grid
              { !game.yourturn ?
                ` (${game.opponent.name}'s turn)` : null
              }
            </h4>
            <Grid
              grid={game.grid}
              ships={game.ships}
              canMove={false}
              hideShips={false}
              cellClicked={this.cellClicked.bind(this, true)}
              onMove={this.shipMoved.bind(this)}
              onRotate={this.shipRotated.bind(this)}
              />
          </div>
          <div id="opponents">
            <h4>
              {`${game.opponent.name}'s`} grid
              { game.yourturn ? ' (Your turn)' : null}
            </h4>
            <Grid
              grid={game.opponent.grid}
              ships={game.opponent.ships}
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
    // console.log(this.state)
    let statusHead
    if (game.designmode) {
      statusHead = <h3>Status: Place your shitty ships!</h3>
    } else if (game.opponent.designmode) {
      statusHead = <h3>Status: {game.opponent.name + '\u0027'}s placing ships</h3>
    } else {
      if (game.yourturn) {
        statusHead = <h3>Status: Your turn</h3>
      } else {
        statusHead = <h3>Status: {game.opponent.name + '\u0027'}s turn</h3>
      }
    }

    return (
      <div>
        <h2>Playing against <i>{game.opponent.name}</i></h2>
        {statusHead}
        {grids}
        <p>
          Bottom of the page this is!
        </p>
      </div>
    )
  }
}


ReactDOM.render(<App/>, document.getElementById('mount-point'))
