import React from 'react';
import $ from 'jquery';
import Cell from './cell.jsx';
import Ship from './ship.jsx';
import Bomb from './bomb.jsx';

class Message extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hidden: false
    }
  }
  onClick() {
    this.setState({hidden: true})
  }
  render() {
    if (this.props.message && !this.state.hidden) {
      return (
        <div className="message" onClick={this.onClick.bind(this)}>
          <h3>{this.props.message}</h3>
        </div>
      )
    }
    return null

  }
}

export default class Grid extends React.Component {
  constructor() {
    super()
    this.state = {
      width: $(window).width()  // premliminary
      // width: $('.grid tr').width()

    }
  }

  updateDimensions() {
    if ($('.grid tr').width()) {
      this.setState({width: $('.grid tr').width()})
    }
  }

  componentWillMount() {
    this.updateDimensions()
  }

  componentDidMount() {
    window.addEventListener("resize", this.updateDimensions.bind(this))
    this.updateDimensions()
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions.bind(this))
  }


  render() {
    let grid = this.props.grid;
    let prefix = (this.props.opponent ? 'opponent' : 'yours')
    let rows = [];
    for (let i=0; i < 10; i++) {
      let row = [];
      for (let j=0; j < 10; j++) {
        row.push(grid[i * 10 + j]);
      }
      rows.push(row);
    }

    let gridWidth = this.state.width
    if (!gridWidth) {
      throw new Error('width of grid not known')
    }
    // the whole gridWidth is $(window).width() - 2px for the whole table
    let width = (gridWidth - 2) / 10;
    let height = (gridWidth - 2) / 10;
    let ships = []

    if (this.props.hideShips) {
      // only show the ships if they have been fully bombed
      // ships = []
      for (let ship of this.props.ships) {
        if (ship.bombed) {
          ships.push(
            <Ship
              key={prefix + ship.id}
              prefix={prefix}
              ship={ship}
              width={width}
              height={height}
              canMove={false}
              onMove={this.props.onMove.bind(this)}
              onRotate={this.props.onRotate.bind(this)}
              />
           )
         }
      }
    } else {
      for (let ship of this.props.ships) {
        ships.push(
          <Ship
            key={prefix + ship.id}
            prefix={prefix}
            ship={ship}
            width={width}
            height={height}
            canMove={this.props.canMove}
            onMove={this.props.onMove.bind(this)}
            onRotate={this.props.onRotate.bind(this)}
          />
        )
      }
    }
    let bombs = null
    bombs = grid.map((cell, i) => {
      if (cell > 0) {
        return <Bomb
          key={prefix + i}
          index={i}
          state={cell}
          width={width}
          height={height}
          />
      } else {
        return null
      }
    })
    return (
      <div className="grid">
        <Message message={this.props.message}/>
        <table>
          <tbody>
          {
            rows.map((row, i) => {
              return (
                <tr key={`row${i}`}>
                  {
                    row.map((cell, j) => {
                      return <Cell
                        key={i * 10 + j}
                        index={i * 10 + j}
                        state={cell}
                        width={width}
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

        {ships}
        {bombs}
      </div>
    )
  }
}
