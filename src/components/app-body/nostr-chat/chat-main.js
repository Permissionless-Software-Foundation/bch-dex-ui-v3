/*
  Component for the main chat area
*/

// Global npm libraries
import React from 'react'

// Local libraries
import ChatHeader from './chat-header'
import MessageList from './message-list'
import MessageInput from './message-input'
import { Spinner } from 'react-bootstrap'

function ChatMain (props) {
  const { selectedChannel, messages } = props

  return (
    <>
      {!selectedChannel && (
        <div className='h-100 d-flex align-items-center justify-content-center' style={{ backgroundColor: '#f8f9fa', minHeight: '200px' }}>
          <div className='text-center text-muted'>
            <Spinner animation='border' size='sm' />
          </div>
        </div>
      )}

      {selectedChannel && (
        <div className='h-100 d-flex flex-column' style={{ backgroundColor: '#f8f9fa' }}>
          {/* Chat Header */}
          <div>
            <ChatHeader selectedChannel={selectedChannel} {...props} />
          </div>

          {/* Messages Area */}
          <div className='flex-grow-1 overflow-auto'>
            <MessageList messages={messages} {...props} />
          </div>

          {/* Message Input */}
          <div className='border-top border-tertiary'>
            <MessageInput {...props} />
          </div>
        </div>
      )}
    </>
  )
}

export default ChatMain
