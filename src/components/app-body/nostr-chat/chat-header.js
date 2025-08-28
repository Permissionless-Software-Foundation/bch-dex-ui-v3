/*
  Component for the chat header displaying chat info
*/

// Global npm libraries
import React, { useState, useCallback, useEffect } from 'react'
import { Spinner } from 'react-bootstrap'
function ChatHeader (props) {
  const { selectedChannel, channelsData } = props
  const [chInfo, setChInfo] = useState() // channel data
  const getShortName = useCallback((str) => {
    return str.slice(0, 8) + '...' + str.slice(-5)
  }, [])

  // Restore ch info
  useEffect(() => {
    setChInfo(null)
  }, [selectedChannel])

  // get channel info
  useEffect(() => {
    if (!chInfo && channelsData[selectedChannel]) {
      setChInfo(channelsData[selectedChannel])
    }
  }, [chInfo, channelsData, selectedChannel])
  return (
    <div className='p-3 d-flex justify-content-between align-items-center' style={{ backgroundColor: '#ffffff' }}>
      {chInfo &&
        <div className='flex-grow-1'>
          <h5 className='mb-1 text-dark'>{chInfo?.name || getShortName(selectedChannel)}</h5>
          <small className='text-muted'>{chInfo?.about || ''}</small>
        </div>}

      {!chInfo &&
        <div className='flex-grow-1 ps-4'>
          <Spinner animation='border' size='sm' />

        </div>}
    </div>
  )
}

export default ChatHeader
