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
  if (Math.random()>0.9) {
    _YOUR.push(2);
  } else if (Math.random()>0.9) {
    _YOUR.push(3);
  } else if (Math.random()>0.9) {
    _YOUR.push(1);
  } else {
    _YOUR.push(0);
  }
  if (Math.random()>0.92) {
    _OPP.push(2);
  } else if (Math.random()>0.92) {
    _OPP.push(3);
  } else if (Math.random()>0.92) {
    _OPP.push(1);
  } else {
    _OPP.push(0);
  }
}

class Homepage extends React.Component {
  constructor() {
    super();
    this.state = {
      games: [{
        id: 1,
        yourturn: false,
        yours: _YOUR,
        opponent: _OPP,
      }]
    };
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
      games: [1],
    };
  }

  render() {
    return (
      <div>
        <h2>Games</h2>
        <ul>
          {
            this.state.games.map((id) => {
              return (
                <li key={id}>
                  Hi! {id}
                  <Link to={`/game/${id}`}>Game {id}</Link>
                </li>
              )
            })
          }
        </ul>
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
      ships: SHIPS.copyWithin(0, 0),
      opponent: {
        name: null,
        grid: [],
        ships: SHIPS.copyWithin(0, 0),
      },
    }
  }

  componentDidMount() {
    this.setState({
      loading: false,
      yourturn: true,
      designmode: true,
      id: this.props.params.id,
      grid: _YOUR,
      opponent: {
        grid: _OPP,
        name: 'Jim'
      }
    })
  }

  cellClicked(yours, key) {

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

  shipMoved(ship) {
    // This'll render the ships with their new position.
    // Now we need to figure out if any of the ships are overlapping
    // and thus mark them as such.
    let getAllCoordinates = (ship) => {
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
    let isOverlapping = (ship1, ship2) => {
      // list ALL their coordinates and compare if any of them match
      let coords1 = getAllCoordinates(ship1)
      let coords2 = getAllCoordinates(ship2)
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
    console.log('Ship rotated!', ship)
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
    }
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
            <h4>Place your ships</h4>
            <Grid
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
      } else {
        console.log('OPPONENT', this.state.opponent)
        grids = (
          <div className="grids">
            <h4>Your grid</h4>
            <Grid
              grid={this.state.grid}
              ships={this.state.ships}
              canMove={true}
              hideShips={false}
              cellClicked={this.cellClicked.bind(this, true)}
              onMove={this.shipMoved.bind(this)}
              onRotate={this.shipRotated.bind(this)}
              />
            <h4>{`${this.state.opponent.name}'s`} grid</h4>
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
        )
      }
    }
    return (
      <div>
        <h2>Playing against <i>{this.state.opponent.name}</i></h2>
        <h3>Turn? {this.state.yourturn ? 'Yours' : `${this.state.opponent.name}'s`}</h3>
        {grids}
        {this.state.loading ? 'Loading...' : null}
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
