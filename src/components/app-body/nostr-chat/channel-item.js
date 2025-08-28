/*
  Component for displaying channel item
*/

// Global npm libraries
import React, { useCallback, useEffect, useState } from 'react'
import { ListGroup, Spinner } from 'react-bootstrap'

export default function ChannelItem (props) {
  const { channel, selectedChannel, onChangeChannel, channelsData } = props
  const [chInfo, setChInfo] = useState()

  const getShortName = useCallback((str) => {
    return str.slice(0, 8) + '...' + str.slice(-5)
  }, [])

  useEffect(() => {
    if (!chInfo && channelsData[channel]) {
      setChInfo(channelsData[channel])
    }
  }, [chInfo, channelsData, channel])

  return (
    <ListGroup.Item
      onClick={() => { onChangeChannel(channel) }}
      key={channel}
      className='border-0 bg-transparent text-dark'
      style={{
        cursor: 'pointer',
        backgroundColor: selectedChannel === channel ? '#6f42c1' : 'transparent',
        borderRadius: '8px',
        marginBottom: '4px',
        padding: '10px 12px',
        transition: 'all 0.2s ease',
        border: selectedChannel === channel ? 'none' : '1px solid transparent',
        boxShadow: selectedChannel === channel ? '0 2px 4px rgba(111, 66, 193, 0.15)' : 'none'
      }}
    >
      {chInfo?.name &&
        <div className='d-flex align-items-center'>
          <span
            className='fw-medium'
            style={{
              fontSize: '14px',
              color: selectedChannel === channel ? '#444444' : '#495057',
              fontWeight: selectedChannel === channel ? '600' : '500'
            }}
          >
            {chInfo?.name || getShortName(channel)}
          </span>
        </div>}
      {!chInfo?.name &&
        <div className='d-flex align-items-center'>
          {getShortName(channel)} <Spinner animation='border' size='sm' style={{ marginLeft: '5px' }} />
        </div>}
    </ListGroup.Item>
  )
}
