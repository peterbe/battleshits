import React from 'react';


export default class Cell extends React.Component {

  _indexToCoord(index) {
    let x = index % 10
    let y = Math.floor(index / 10)
    return x + ',' + y
  }
  render() {
    let height = this.props.width
    let style = {width: this.props.width, height: height}

    let _coord = this._indexToCoord(this.props.index)  // used for debugging
    _coord=''  // XXX wish this could depend on an environment variable

    return (
      <td
        onClick={this.props.cellClicked.bind(this)}
        style={style}
        >{_coord}</td>
    )
  }
}
