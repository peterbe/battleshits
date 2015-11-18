import React from 'react';
import $ from 'jquery';
import Cell from './cell.jsx';
import Ship from './ship.jsx';


export default class Grid extends React.Component {
  constructor() {
    super()
    this.state = {
      width: $(window).width()
    }
  }

  updateDimensions() {
    this.setState({width: $(window).width()})
  }

  componentWillMount() {
    this.updateDimensions()
  }

  componentDidMount() {
      window.addEventListener("resize", this.updateDimensions.bind(this))
  }

  componentWillUnmount() {
      window.removeEventListener("resize", this.updateDimensions.bind(this))
  }


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
    // let gridWidth = $(window).width()
    let gridWidth = this.state.width
    // gridWidth=1000
    if (!gridWidth) {
      throw new Error('width of grid not known')
    }
    // the whole gridWidth is $(window).width() - 2px for the whole table
    let width = (gridWidth - 2) / 10;
    return (
      <div className="grid">
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
        {
          this.props.ships.map((ship) => {
            return <Ship
              key={ship.id}
              ship={ship}
              width={width}
              canMove={this.props.canMove}
              onMove={this.props.onMove.bind(this)}
              onRotate={this.props.onRotate.bind(this)}
              />
          })
        }
      </div>
    )
  }
}
