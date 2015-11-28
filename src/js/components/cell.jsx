import React from 'react';


export default class Cell extends React.Component {
  render() {
    // let cellstate = this.props.state;
    // if (this.props.hideShips) {
    //   // this means we can't reveal that there's a ship there
    //   if (cellstate === 1) {
    //     cellstate = 0
    //   }
    // }
    // let className = {
    //   3: 'B',
    //   2: 'M',
    //   1: 'S',
    //   0: 'E',
    // }[cellstate]

    let height = this.props.width
    // console.log(height, $('.grid td').width())
    let style = {width: this.props.width, height: height}
    // let style = {height: height}
    return (
      <td
        key={this.props.key}
        onClick={this.props.cellClicked.bind(this)}
        style={style}
        ></td>
    )
  }
}
