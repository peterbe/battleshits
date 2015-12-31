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
      let messages = this.props.message.trim().split('\n')
      let _messages = []
      messages.forEach((m, i) => {
        m = m.trim()
        _messages.push(<h3 key={'message' + i}>{m}</h3>)
      })
      return (
        <div className="message-modal" onClick={this.onClick.bind(this)}>
          <div>
            {_messages}
          </div>
        </div>
      )
    }
    return null

  }
}
