import React from 'react';


export default class Cell extends React.Component {
  render() {
    let height = this.props.width
    let style = {width: this.props.width, height: height}
    return (
      <td
        onClick={this.props.cellClicked.bind(this)}
        style={style}
        >{this.props.index}</td>
    )
  }
}
