import React from 'react';
import $ from 'jquery';


export default class Bomb extends React.Component {
  constructor() {
    super()
    this.state = {
      width: null,
    }
  }

  componentDidMount() {
    this.setState({
      width: $('.grid tr').width()/10,
      height: $('.grid table').height()/10,
    })
  }


  render() {
    let src = {
      1: "static/images/poop.png",
      2: "static/images/explosion.png",
    }[this.props.state]

    let index = this.props.index
    let x = (index + 1) % 10
    let y = Math.floor((index + 1) / 10)

    let width = this.state.width || this.props.width
    let height = this.state.height || this.props.width
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
