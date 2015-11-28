import React from 'react';
import ReactDOM from 'react-dom';
import { Router, IndexRoute, Route, Link } from 'react-router';
import createBrowserHistory from 'history/lib/createBrowserHistory';
import 'whatwg-fetch';
import Grid from './components/grid.jsx';
import $ from 'jquery';


const SHIPS = [
  {id: '2',   length: 2, x: 1, y: 0, rotation: 0, overlapping: false},
  {id: '3-1', length: 3, x: 7, y: 1, rotation: 0, overlapping: false},
  {id: '3-2', length: 3, x: 6, y: 2, rotation: 90, overlapping: false},
  {id: '4',   length: 4, x: 5, y: 3, rotation: 270, overlapping: false},
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
  constructor() {
    super();
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
  constructor() {
    super();
    this.state = {
      games: [],
    };
  }

  componentDidMount() {
    apiGet('/api/games/')
    .then((result) => this.setState({games: result.games}))
  }

  startRandomGame() {
    alert('Work harder')
    apiGet('/api/games/create/random')
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
        <button onClick={this.startRandomGame.bind(this)}
          >Play against next available random person</button>
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

  }

  cellClicked(yours, key) {
    THIS IS WHAT TO WORK ON NEXT
    // you clicked, so if it's not your turn ignore
    if (!this.state.yourturn) {
      console.log('ignore click')
      return
    }
    console.log('Clicked', yours, key)
    let grid
    if (yours) {
      grid = this.state.grid
    } else {
      grid = this.state.opponent.grid
    }

    //
    // let _sum = SHIPS.reduce((a, b) => { return a + b });
    // let countShipCells = 0;
    // grid.forEach((cell) => {
    //   // 1 if there's a ship
    //   // 2 if it's bombed
    //   // 3 if it's bombed on a ship
    //   // 0 if it's empty
    //   if (cell === 1 || cell === 3) {
    //     countShipCells++;
    //   }
    // });

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
    // console.log('Ship rotated!', ship)
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
        // you're playing against the computer, let the computer
        // make the next move
        // XXX here we should randomly place the AI's ships
        this.state.opponent.designmode = false
        this.setState({opponent: this.state.opponent})
        // console.log('yourturn?', this.state.yourturn)
        setTimeout(() => {
          this.startAIGame()
        }, 1000)
      }
    }
  }

  startAIGame() {
    console.log('START AI GAME!')
    if (!this.state.yourturn) {
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
  }

  _newCellState(index, ships) {
    let x = (index + 1) % 10
    let y = Math.floor((index + 1) / 10)
    let xy = x + ',' + y
    let newstate = 1 // missed
    ships.forEach((ship) => {
      let coords = this._getAllCoordinates(ship)
      if (coords.has(xy)) {
        newstate = 2 // explosion
      }
    })
    return newstate
  }

  bombSlot(index, opponentmove) {
    let yourturn
    let yoursElement = document.querySelector('#yours')
    let opponentsElement = document.querySelector('#opponents')
    let element
    let nextElement
    if (opponentmove) {
      yourturn = true
      element = yoursElement
      nextElement = opponentsElement
      this.state.grid[index] = this._newCellState(index, this.state.ships)
    } else {
      yourturn = false
      element = opponentsElement
      nextElement = yoursElement
      this.state.opponent.grid[index] = this_.newCellState(index, this.state.opponent.ships)
    }
    element.scrollIntoView({block: "end", behavior: "smooth"})
    setTimeout(() => {
      this.setState({
        grid: this.state.grid,
        opponent: this.state.opponent,
        yourturn: yourturn,
      })
      setTimeout(() => {
        nextElement.scrollIntoView({block: "end", behavior: "smooth"})
      }, 2000)
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
            <h4>Your grid</h4>
            <Grid
              domID="yours"
              grid={this.state.grid}
              ships={this.state.ships}
              canMove={false}
              hideShips={false}
              cellClicked={this.cellClicked.bind(this, true)}
              onMove={this.shipMoved.bind(this)}
              onRotate={this.shipRotated.bind(this)}
              />
            <h4>{`${this.state.opponent.name}'s`} grid</h4>
            <Grid
              domID="opponents"
              grid={this.state.opponent.grid}
              ships={this.state.opponent.ships}
              canMove={false}
              hideShips={true}
              cellClicked={this.cellClicked.bind(this, false)}
              onMove={this.shipMoved.bind(this)}
              onRotate={this.shipRotated.bind(this)}
              />
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
