import React from 'react'
// import shallowCompare from 'react-addons-shallow-compare'

let width = 1
let height = 1

window.addEventListener("resize", () => {
  width = 1
  height = 1
})

const getWidthHeight = () => {
  if (width === 1 && height === 1) {
    let trElement = document.querySelector('.grid tr')
    if (trElement !== null) {
      width = trElement.clientWidth / 10
    }
    let tableElement = document.querySelector('.grid table')
    if (tableElement !== null) {
      height = tableElement.clientHeight / 10
    }
  }
  return { width, height }
}


// map "state" to image URL
const imageURLs = {
  1: "static/images/poop.png",
  2: "static/images/explosion.png",
  3: "static/images/toiletroll.png",
}

const Bomb = ({ state, index }) => {

  let src = imageURLs[state]
  let x = index % 10
  let y = Math.floor(index / 10)

  let { width, height } = getWidthHeight()

  let borderWidth = 0 // for each <td> (collapsed table)
  let style = {
    top: y * height + y * borderWidth,
    left: x * width + x * borderWidth,
    width: width, height: height,
  }
  return <img
    className="bomb"
    src={src}
    style={style}
    />
}
export default Bomb
