import React from 'react';
import $ from 'jquery';


export default class Ship extends React.Component {
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
    draggie.on('dragEnd', this.dragEnd.bind(this))
    draggie.on('staticClick', this.staticClick.bind(this))
    this.setState({
      draggie: draggie,
      width: $('.grid tr').width()/10,
      height: $('.grid table').height()/10,
    })
  }

  staticClick() {
    // single click on a ship
    if (!this.props.canMove) return
    let ship = this.props.ship
    ship.rotation += 90
    ship.rotation %= 360

    /* Rotation is always clockwise. The x,y coordinates of the ship is
     the ship's nose. If a ship is length 3 and located like this:
     1 2 3
     _|_|_  1
     *|*|*  2
     _|_|_  3
     _|_|_  4

    ...it will become this:

    1 2 3
    _|_|_  1
    *|_|_  2
    *|_|_  3
    *|_|_  4

    ...when in fact we want this:

    1 2 3
    _|*|_  1
    _|*|_  2
    _|*|_  3
    _|_|_  4
    */

    let movement = {
      2: 0,
      3: 1,
      4: 1,
      5: 2,
    }[ship.length]

    if (ship.rotation === 90 || ship.rotation === 270) {
      // went from horizontal to vertical
      ship.x += movement
      ship.y -= movement
    } else {
      ship.x -= movement
      ship.y += movement
    }
    this.props.onRotate(ship)
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

    let filename
    if (ship.rotation === 90 || ship.rotation === 270) {
      style.width = width
      style.height = ship.length * height
      filename = `${ship.id}v.png`
    } else {
      style.width = ship.length * width
      style.height = height
      filename = `${ship.id}.png`
    }
    style.backgroundSize = style.width

    let src = `static/images/ships/${filename}`
    let className = `ship ship${ship.id}`
    if (ship.overlapping) {
      className += ' overlapping'
    }
    className += ` rotation${ship.rotation}`

    // The draggabilly plugin will forcibly set the top and left
    // on the element and these might be different from what they
    // should be, so we make sure that gets set.
    if (this.state.draggie) {
      this.state.draggie.element.style.left = style.left + 'px'
      this.state.draggie.element.style.top = style.top + 'px'

      if (this.props.canMove) {
        this.state.draggie.enable();
      } else {
        this.state.draggie.disable();
      }
    }

    return (
      <img src={src}
        key={ship.id}
        className={className}
        title={ship.id}
        style={style}/>
    )
  }
}
