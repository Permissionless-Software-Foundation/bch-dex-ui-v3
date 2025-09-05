/*
  Component for the chat header displaying chat info
*/

// Global npm libraries
import React, { useState, useCallback, useEffect } from 'react'
import { Spinner } from 'react-bootstrap'
function ChatHeader (props) {
  const { selectedChannel, channelsData, selectedChannelIsDm, profiles } = props
  const [chInfo, setChInfo] = useState() // channel data
  const getShortName = useCallback((str) => {
    if (str.length < 20) return str
    return str.slice(0, 4) + '...' + str.slice(-4)
  }, [])

  // Restore ch info
  useEffect(() => {
    setChInfo(null)
  }, [selectedChannel])

  // get channel info
  useEffect(() => {
    // Public channel
    if (!chInfo && !selectedChannelIsDm && channelsData[selectedChannel]) {
      setChInfo(channelsData[selectedChannel])
    }
    // Dm Channel
    if (!chInfo && selectedChannelIsDm && profiles[selectedChannel]) {
      setChInfo(profiles[selectedChannel])
    }
  }, [chInfo, channelsData, selectedChannel, profiles, selectedChannelIsDm])
  return (
    <div className='p-3 d-flex justify-content-between align-items-center' style={{ backgroundColor: '#ffffff' }}>
      {chInfo &&
        <div className='d-flex justify-content-center align-items-center'>
          {chInfo.picture && <img src={chInfo.picture} alt={chInfo.name} style={{ width: '50px', marginRight: '10px', borderRadius: '50%' }} />}
          <div className='flex-grow-1'>
            <h5 className='mb-1 text-dark'>{getShortName(chInfo?.name || selectedChannel)}</h5>
            <small className='text-muted'>{chInfo?.about || ''}</small>
          </div>

        </div>}

      {!chInfo &&
        <div className='flex-grow-1 ps-4'>
          <Spinner animation='border' size='sm' />

        </div>}
    </div>
  )
}

export default ChatHeader
