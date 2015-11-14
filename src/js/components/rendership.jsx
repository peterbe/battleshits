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
    // console.log('ComponentDidMount', this.props.width, $('.grid tr').width()/10, $('.grid td').width())
    let element = document.querySelector('.ship.ship' + this.props.ship.id);
    let draggie = new Draggabilly(element, {
      containment: '.grid',
      // grid: [ 119.2, 119.2 ]
    });
    draggie.on('dragEnd', this.dragEnd.bind(this, this.props.width))
    this.setState({
      draggie: draggie,
      width: $('.grid tr').width()/10,
      height: $('.grid table').height()/10,
    })
    // draggie.options.grid =[ 119.2, 119.2 ];
    // console.log(draggie);
  }

  dragEnd() {
    // console.log('dragEnd', arg1, arg2)
    let x = this.state.draggie.position.x
    let y = this.state.draggie.position.y
    // console.log('first x,y', [x,y])
    // These coordinates represent the top-left hand corner.
    // But we're going to ignore that and seek with the middle of the
    // first corner of the left-most (or top-most) square
    let width = this.state.width
    let height = this.state.height
    x += width / 2
    y += height / 2
    // console.log('secon x,y', [x,y])
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
    // let x1 = x / this.state.width
    // let y1 = y / this.state.height
    // console.log('x1,y1', [x1,y1])
    this.props.ship.x = x1
    this.props.ship.y = y1
    this.props.onMove(this.props.ship)

    // console.log(x,y,this.state.draggie.options.grid)
    // these are pixels, we need to convert that to integer coordinates
    // console.log('x,y', x,y)
    // console.log('x2', x / this.state.width)
    // console.log(this.state.draggie.position.x,this.state.draggie.position.y)
  }

  render() {

    let ship = this.props.ship
    let width = this.state.width || this.props.width
    let height = this.state.height || this.props.width
    // console.log('render RenderShip', this.props.ship.id, width, height)
    // console.log($('.grid tr').width()/10, $('.grid td').width())

    // let height = width
    // console.log('width', width, this.state.draggie)
    if (this.state.draggie) {
      // console.log('Setting grid', [width-1, width -1])
      // this.state.draggie.options.grid = [width, width]
    }

    let borderWidth = 0 // for each <td> (collapsed table)
    let style = {
      top: ship.y * height + ship.y * borderWidth,
      left: ship.x * width + ship.x * borderWidth,
    }
    if (ship.id==='2') console.log(ship.id, width, style.left)
    if (ship.rotation === 90 || ship.rotation === 270) {
      style.width = width
      style.height = ship.length * height
    } else {
      style.width = ship.length * width
      style.height = height
    }
    style.backgroundSize = style.width
    // console.log("RenderShip", ship.id, style)
    let src = `static/images/ships/${ship.id}.png`
    let className = `ship ship${ship.id}`
    if (ship.overlapping) {
      className += ' overlapping'
    }
    return (
      <img src={src}
        className={className}
        title={ship.id}
        style={style}/>
    )
  }
}
