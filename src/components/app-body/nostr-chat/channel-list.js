/*
  Component for displaying the list of available channels
*/

// Global npm libraries
import React from 'react'
import { ListGroup } from 'react-bootstrap'
import ChannelItem from './channel-item'
function ChannelList (props) {
  const { groupChannels, selectedChannel } = props

  if (!groupChannels || groupChannels.length === 0) {
    return (
      <div className='text-muted small' style={{ fontStyle: 'italic' }}>
        No channels available
      </div>
    )
  }

  return (
    <ListGroup variant='flush' className='bg-transparent'>
      {groupChannels.map((channel, i) => (
        <ChannelItem key={`channel${i}`} channel={channel} selectedChannel={selectedChannel} {...props} />
      ))}
    </ListGroup>
  )
}

export default ChannelList
