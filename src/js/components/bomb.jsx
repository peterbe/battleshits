import React from 'react'
import shallowCompare from 'react-addons-shallow-compare'


// XXX rewrite this as a presentationl functional component since there is no state
export default class Bomb extends React.Component {

  shouldComponentUpdate(nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState)
  }

  getWidthHeight() {
    let trElement = document.querySelector('.grid tr')
    let width = 1
    if (trElement !== null) {
      width = trElement.clientWidth / 10
    }
    let tableElement = document.querySelector('.grid table')
    let height = 1
    if (tableElement !== null) {
      height = tableElement.clientHeight / 10
    }
    return {width: width, height: height}
  }

  render() {
    let src = {
      1: "static/images/poop.png",
      2: "static/images/explosion.png",
      3: "static/images/toiletroll.png",
    }[this.props.state]

    let index = this.props.index
    let x = index % 10
    let y = Math.floor(index / 10)

    let {width, height} = this.getWidthHeight()

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
}
