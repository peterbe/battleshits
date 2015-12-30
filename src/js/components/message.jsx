import React from 'react';


export default class Message extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hidden: false
    }
  }
  onClick() {
    this.setState({hidden: true})
  }
  render() {
    if (this.props.message && !this.state.hidden) {
      return (
        <div className="message-modal" onClick={this.onClick.bind(this)}>
          <div>
            <h3>{this.props.message}</h3>
          </div>
        </div>
      )
    }
    return null

  }
}
