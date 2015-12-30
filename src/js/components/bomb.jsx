import React from 'react';
import $ from 'jquery';


export default class Bomb extends React.Component {

  render() {
    let src = {
      1: "static/images/poop.png",
      2: "static/images/explosion.png",
      3: "static/images/toiletroll.png",
    }[this.props.state]

    let index = this.props.index
    let x = index % 10
    let y = Math.floor(index / 10)

    // XXX this can be optimized
    let width = $('.grid tr').width()/10
    let height = $('.grid table').height()/10

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
