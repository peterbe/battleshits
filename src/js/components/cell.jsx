import React from 'react';
import $ from 'jquery';


export default class Cell extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      touched: false
    }
  }
  _indexToCoord(index) {
    let x = index % 10
    let y = Math.floor(index / 10)
    return x + ',' + y
  }

  // onTouchStart() {
  //   this.props.cellClicked()
  //   this.setState({touched: true})
  // }
  //
  // onClick() {
  //   /* This is a hack so that onClick works in non-touch browsers.
  //      The onTouchStart makes it instant clicks on mobiles.
  //      On devices that support onTouchStart we don't want both
  //      to fire. */
  //   if (!this.state.touched) {
  //     this.props.cellClicked()
  //   } else {
  //     console.log('Ignore click')
  //   }
  // }

  render() {
    let height = this.props.width

    let style = {width: this.props.width, height: height}
    let _coord = ''
    if (window.DEBUG) {
      _coord = this._indexToCoord(this.props.index)  // used for debugging
    }

    // onClick={this.props.cellClicked.bind(this)}
    //onTouchStart={this.onTouchStart.bind(this)}
    //onClick={this.onClick.bind(this)}
    return (
      <td
        onClick={this.props.cellClicked.bind(this)}
        style={style}
        >{_coord}</td>
    )
  }
}
