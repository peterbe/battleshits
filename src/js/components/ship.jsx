import React from 'react'
import { getOneElement } from './utils.js'
// import shallowCompare from 'react-addons-shallow-compare'


// var hasOwnProperty = Object.prototype.hasOwnProperty;
//
// /**
//  * Performs equality by iterating through keys on an object and returning false
//  * when any key has values which are not strictly equal between the arguments.
//  * Returns true when the values of all keys are strictly equal.
//  */
// function shallowEqual(objA, objB) {
//   if (objA === objB) {
//     return true;
//   }
//
//   if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
//     console.log('A!')
//     return false;
//   }
//
//   var keysA = Object.keys(objA);
//   var keysB = Object.keys(objB);
//
//   if (keysA.length !== keysB.length) {
//     console.log('B!')
//     return false;
//   }
//
//   // Test for A's keys different from B.
//   var bHasOwnProperty = hasOwnProperty.bind(objB);
//   for (var i = 0; i < keysA.length; i++) {
//     if (!bHasOwnProperty(keysA[i]) || objA[keysA[i]] !== objB[keysA[i]]) {
//       console.log('C!', keysA[i])
//       return false;
//     }
//   }
//
//   return true;
// }

export default class Ship extends React.Component {
  constructor(props) {
    super(props)
    this.draggie = null
  }

  componentDidMount() {
    let element = getOneElement(
      '.ship.ship' + this.props.ship.id + `.${this.props.prefix}ship`
    )
    let draggie = new Draggabilly(element, {
      containment: '.grid',
    });
    draggie.on('dragEnd', () => this.dragEnd())
    draggie.on('staticClick', this.staticClick.bind(this))
    this.draggie = draggie
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
      ship.y = Math.max(0, ship.y)
    } else {
      ship.x -= movement
      ship.y += movement
      ship.x = Math.max(0, ship.x)
    }
    this.props.onRotate(ship)
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

  dragEnd() {
    let {width, height} = this.getWidthHeight()

    // let x = this.state.draggie.position.x
    // let y = this.state.draggie.position.y
    let x = this.draggie.position.x
    let y = this.draggie.position.y
    // These coordinates represent the top-left hand corner.
    // But we're going to ignore that and seek with the middle of the
    // first corner of the left-most (or top-most) square
    // let width = this.state.width
    // let height = this.state.height

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

    // XXX this is bad! this.props.ship should be immutable and
    // instead of changing this mutable prop, we should send the
    // new X,Y coordinates all the way back. Only then can we start
    // tackling the shouldComponentUpdate() with a custom comparison
    // on the ship data.
    this.props.ship.x = x1
    this.props.ship.y = y1
    this.props.onMove()
    // this.props.onMove(this.props.ship)
  }

  render() {
    let ship = this.props.ship

    let {width, height} = this.getWidthHeight()

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
    className += ` ${this.props.prefix}ship`

    // The draggabilly plugin will forcibly set the top and left
    // on the element and these might be different from what they
    // should be, so we make sure that gets set.
    if (this.draggie) {
      if (this.props.canMove) {
        this.draggie.element.style.left = style.left + 'px'
        this.draggie.element.style.top = style.top + 'px'
        this.draggie.enable();
      } else {
        this.draggie.disable();
      }
    }

    return (
      <img src={src}
        key={this.props.prefix + ship.id}
        className={className}
        title={this.props.prefix + ' ' + ship.id}
        style={style}/>
    )
  }
}
