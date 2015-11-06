import React from 'react';
import ReactDOM from 'react-dom';
import { Router, IndexRoute, Route, Link } from 'react-router';
import createBrowserHistory from 'history/lib/createBrowserHistory';
import 'whatwg-fetch';
// import Draggabilly from 'draggabilly';

console.log('Draggabilly', Draggabilly);

const SHIPS = ['2', '3-1', '3-2', '4', '5']

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
    console.log('Render Homepage');
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
    console.log('Render Games')
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
      opponent: {
        name: null,
        grid: [],
      },
    }
  }

  componentDidMount() {
    console.log('Component did mount', this.props.params.id);
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

  render() {
    console.log('Render Game!', this.state.grid);
    let grids = null;
    if (!this.state.loading) {
      if (this.state.designmode) {
        grids = (
          <div className="designmode">
            <h4>Place your ships</h4>
            {
              SHIPS.map((ship, i) => {
                return <RenderShip key={'ship'+i} ship={ship}/>
              })
            }
            <ShowGrid
              grid={this.state.grid}
              canEdit={true}
              hideShips={false}
              cellClicked={this.cellClicked.bind(this, true)}
              />
          </div>
        )
      } else {
        grids = (
          <div className="grids">
            <h4>Your grid</h4>
            <ShowGrid
              grid={this.state.grid}
              canEdit={true}
              hideShips={false}
              cellClicked={this.cellClicked.bind(this, true)}
              />
            <h4>{`${this.state.opponent.name}'s`} grid</h4>
            <ShowGrid
              grid={this.state.opponent.grid}
              canEdit={false}
              hideShips={true}
              cellClicked={this.cellClicked.bind(this, false)}

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

class RenderShip extends React.Component {

  componentDidMount() {
    let element = document.querySelector('.ship.ship' + this.props.ship);
    let draggie = new Draggabilly(element, {
      containment: 'table'
    });
  }

  render() {
    return (
      <div className={'ship ship'+ this.props.ship} title={this.props.ship}></div>
    )
  }
}

class ShowGrid extends React.Component {

  render() {
    let grid = this.props.grid;

    let rows = [];
    for (let i=0; i < 10; i++) {
      let row = [];
      for (let j=0; j < 10; j++) {
        row.push(grid[i * 10 + j]);
      }
      rows.push(row);
    }
    return (
      <table className="grid">
        <tbody>
        {
          rows.map((row, i) => {
            return (
              <tr key={`row${i}`}>
                {
                  row.map((cell, j) => {
                    return <Cell
                      key={i * 10 + j}
                      state={cell}
                      hideShips={this.props.hideShips}
                      cellClicked={this.props.cellClicked.bind(this, i * 10 + j)}
                      />
                  })
                }
              </tr>
            )
          })
        }
        </tbody>
      </table>
    )
  }
}

class Cell extends React.Component {
  render() {
    let cellstate = this.props.state;
    if (this.props.hideShips) {
      // this means we can't reveal that there's a ship there
      if (cellstate === 1) {
        cellstate = 0
      }
    }
    let className = {
      3: 'B',
      2: 'M',
      1: 'S',
      0: 'E',
    }[cellstate];

    return (
      <td
        key={this.props.key}
        onClick={this.props.cellClicked.bind(this)}
        className={className}
        ></td>
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
