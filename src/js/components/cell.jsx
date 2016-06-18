import React from 'react'

const Cell = ({ width, index, cellClicked }) => {

  let height = width

  let style = {width: width, height: height}
  let _coord = ''
  if (__DEV__) {
    let x = index % 10
    let y = Math.floor(index / 10)
    _coord = x + ',' + y
  }

  return (
    <td
      onClick={(event) => cellClicked(event)}
      style={style}
      >{_coord}</td>
  )
}
export default Cell
