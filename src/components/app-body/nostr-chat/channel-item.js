/*
  Component for displaying channel item
*/

// Global npm libraries
import React, { useCallback, useEffect, useState } from 'react'
import { Spinner } from 'react-bootstrap'

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

  const handleClick = () => {
    if (onChangeChannel) {
      onChangeChannel(channel)
    }
  }

  return (
    <div
      className={`d-flex align-items-center p-2 rounded-3 mb-2 cursor-pointer ${selectedChannel === channel ? 'bg-primary text-white' : ''}`}
      style={{
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        backgroundColor: selectedChannel === channel ? '#0d6efd' : 'transparent',
        border: '1px solid transparent'
      }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (selectedChannel !== channel) {
          e.currentTarget.style.backgroundColor = '#e9ecef'
          e.currentTarget.style.borderColor = '#dee2e6'
        }
      }}
      onMouseLeave={(e) => {
        if (selectedChannel !== channel) {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.borderColor = 'transparent'
        }
      }}
    >
      {/* Channel Avatar/Icon */}
      <div className='me-3 flex-shrink-0 d-flex align-items-center'>
        {chInfo?.picture
          ? (
            <img
              src={chInfo.picture}
              alt={chInfo.name || 'Channel'}
              className='rounded-circle'
              style={{ width: '32px', height: '32px' }}
            />
            )
          : (
            <div
              className='rounded-circle d-flex align-items-center justify-content-center'
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#e9ecef',
                color: '#6c757d',
                fontSize: '14px'
              }}
            >
              #
            </div>
            )}
      </div>

      {/* Channel Info */}
      <div className='flex-grow-1 min-w-0'>
        <div
          className={`${selectedChannel === channel ? 'text-white' : 'text-dark'} fw-medium`}
          style={{ fontSize: '14px' }}
        >
          {chInfo?.name || getShortName(channel)}
        </div>
        {!chInfo?.name && (
          <div
            className={`small ${selectedChannel === channel ? 'text-white-50' : 'text-muted'}`}
            style={{ fontSize: '12px' }}
          >
            Loading channel...
          </div>
        )}
      </div>

      {/* Loading indicator */}
      {!chInfo?.name && (
        <div className='ms-2'>
          <Spinner animation='border' size='sm' />
        </div>
      )}
    </div>
  )
}
