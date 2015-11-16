import React from 'react';
import $ from 'jquery';


export default class RenderShip extends React.Component {
  constructor() {
    super()
    this.state = {
      draggie: null,
      width: null,
    }
  }

  componentDidMount() {
    let element = document.querySelector('.ship.ship' + this.props.ship.id);
    let draggie = new Draggabilly(element, {
      containment: '.grid',
    });
    draggie.on('dragEnd', this.dragEnd.bind(this, this.props.width))
    // draggie.on('dragEnd', this.dragEnd.bind(this, this.props.width))
    this.setState({
      draggie: draggie,
      width: $('.grid tr').width()/10,
      height: $('.grid table').height()/10,
    })
  }

  dragEnd() {
    let x = this.state.draggie.position.x
    let y = this.state.draggie.position.y
    // These coordinates represent the top-left hand corner.
    // But we're going to ignore that and seek with the middle of the
    // first corner of the left-most (or top-most) square
    let width = this.state.width
    let height = this.state.height
    x += width / 2
    y += height / 2
    let x1 = 0
    for (let i=0; i < 10; i++) {
      if (x > width * i && x < width * (i + 1)) {
        x1 = i;
      }
    }
    let y1 = 0
    for (let i=0; i < 10; i++) {
      if (y > height * i && y < height * (i + 1)) {
        y1 = i;
      }
    }
    this.props.ship.x = x1
    this.props.ship.y = y1
    // setTimeout(() => {
    //     this.props.onMove(this.props.ship)
    // }, 500);
    this.props.onMove(this.props.ship)
  }

  render() {
    let ship = this.props.ship
    let width = this.state.width || this.props.width
    let height = this.state.height || this.props.width

    let borderWidth = 0 // for each <td> (collapsed table)

    let style = {
      top: ship.y * height + ship.y * borderWidth,
      left: ship.x * width + ship.x * borderWidth,
    }
    // let x = ship.x * width + ship.x * borderWidth
    // let y = ship.y * height + ship.y * borderWidth
    // style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0)';

    if (ship.rotation === 90 || ship.rotation === 270) {
      style.width = width
      style.height = ship.length * height
    } else {
      style.width = ship.length * width
      style.height = height
    }
    // style.width = style.width + 'px';
    // style.height = style.height + 'px';
    style.backgroundSize = style.width
    let src = `static/images/ships/${ship.id}.png`
    // src += '?r=' + Math.random();
    let className = `ship ship${ship.id}`
    if (ship.overlapping) {
      className += ' overlapping'
    }
    if (ship.id=='5') {
      // pixelate(style)
      console.log(ship.id, height, style)
    }
    // let position = ship.id + style.top + style.left
    // console.log('POSITION', position)
    // className += ' ' + position
    return (
      <img src={src}
        key={ship.id}
        className={className}
        title={ship.id}
        style={style}/>
    )
  }
}
