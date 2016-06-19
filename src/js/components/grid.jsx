import React from 'react';
import Cell from './cell.jsx';
import Ship from './ship.jsx';
import Bomb from './bomb.jsx';


const Grid = ({
  width,
  grid,
  ships,
  canMove,
  hideShips,
  opponent,
  cellClicked,
  onMove,
  onRotate
}) => {

  console.log({
    width,
    grid,
    ships,
    canMove,
    hideShips,
    opponent,
  });
  let prefix = opponent ? 'opponent' : 'yours'
  let rows = [];
  for (let i=0; i < 10; i++) {
    let row = [];
    for (let j=0; j < 10; j++) {
      row.push(grid[i * 10 + j]);
    }
    rows.push(row);
  }

  let gridWidth = width
  if (!gridWidth) {
    throw new Error('width of grid not known')
  }
  // the whole gridWidth is document.clientWidth - 2px for the whole table
  width = (gridWidth - 2) / 10;
  let height = (gridWidth - 2) / 10;
  let shipComponents = []

  if (hideShips) {
    // only show the ships if they have been fully bombed
    // ships = []
    for (let ship of ships) {
      if (ship.bombed) {
        shipComponents.push(
          <Ship
            key={prefix + ship.id}
            prefix={prefix}
            ship={ship}
            width={width}
            height={height}
            canMove={false}
            onMove={onMove}
            onRotate={onRotate}
            />
         )
       }
    }
  } else {
    for (let ship of ships) {
      shipComponents.push(
        <Ship
          key={prefix + ship.id}
          prefix={prefix}
          ship={ship}
          width={width}
          height={height}
          canMove={canMove}
          onMove={onMove}
          onRotate={onRotate}
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
                      hideShips={hideShips}
                      cellClicked={() => cellClicked(i * 10 + j)}
                      />
                  })
                }
              </tr>
            )
          })
        }
        </tbody>
      </table>

      {shipComponents}
      {bombs}
    </div>
  )
}

export default Grid
