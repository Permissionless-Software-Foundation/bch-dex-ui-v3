/*
  Component for the chat sidebar channels
*/

// Global npm libraries
import React from 'react'

// Local libraries
import ChannelList from './channel-list'

function ChatSidebar (props) {
  const { channels, selectedChannel } = props

  return (
    <div className='h-100 d-flex flex-column' style={{ backgroundColor: '#ffffff', borderRight: '1px solid #e9ecef' }}>
      {/* Channels Section */}
      <div className='flex-grow-1 d-flex flex-column'>
        <div className='p-4 flex-grow-1'>
          <div className='d-flex justify-content-between align-items-center mb-3'>
            <h5 className='mb-0 text-dark fw-semibold' style={{ fontSize: '16px', letterSpacing: '0.5px' }}>
              Channels
            </h5>
          </div>
          <ChannelList
            channels={channels}
            selectedChannel={selectedChannel}
            {...props}
          />
        </div>
      </div>
    </div>
  )
}

export default ChatSidebar
