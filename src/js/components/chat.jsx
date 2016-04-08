import React from 'react';


export default class Chat extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      // synced: true
    }
  }

  componentDidMount() {
    // I don't know why I have to wait for this.
    setTimeout(() => {
      let element = document.querySelector('.chat .messages')
      if (element) {
        element.scrollTop = element.scrollHeight
      } else {
        console.warn('No .chat .messages container')
      }
    }, 1000)
  }

  sendMessage(e) {

    e.preventDefault()
    let message = this.refs.message.value.trim()
    if (message.length) {
      // XXX would be nice to do some state.synced and something that
      // indicates to the user that the message hasn't really been sent
      // properly to the server.
      this.refs.message.value = ''
      this.props.onNewMessage(message)
      .then(() => {
        document.querySelector('input[name="message"]').blur()
      })
      .catch((ex) => {
        this.refs.message.value = message
        throw ex
      })
    }
  }

  render() {
    return (
      <form onSubmit={this.sendMessage.bind(this)}>
        <div className="messages">
        {
          this.props.messages.map((message, i) => {
            return <ChatMessage message={message} key={'msg'+message.id}/>
          })
        }
        </div>
        <p className="control is-grouped">
          <input
            type="text"
            name="message"
            className="input"
            ref="message"
            placeholder="Message..."/>
          <button
            type="submit"
            className="button is-primary">Send</button>
        </p>

      </form>
    )
  }
}

const ChatMessage = (props) => {
  let msg = props.message
  if (msg.you) {
    return (
      <div className="you">
        <span>You</span>
        <p>{msg.message}</p>
      </div>
    )
  } else {
    return (
      <div className="them">
        <span>{msg.name}</span>
        <p>{msg.message}</p>
      </div>
    )
  }
}
