import React from 'react';


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

  render() {
    let height = this.props.width

    let style = {width: this.props.width, height: height}
    let _coord = ''
    if (__DEV__) {
      _coord = this._indexToCoord(this.props.index)
    }

    return (
      <td
        onClick={this.props.cellClicked.bind(this)}
        style={style}
        >{_coord}</td>
    )
  }
}
