/*
  Component for displaying a list of direct messages
*/

// Global npm libraries
import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import DMItem from './dm-item'
import { Spinner } from 'react-bootstrap'

function DMList (props) {
  const { dmChannels, profiles, selectedChannel, onChangeChannel, dmListLoaded } = props

  if (dmChannels.length === 0 && dmListLoaded) {
    return (
      <div className='text-center p-3'>
        <div className='text-muted mb-2'>
          <FontAwesomeIcon icon={faUser} style={{ fontSize: '24px', opacity: 0.5 }} />
        </div>
        <div className='text-muted small'>No direct messages yet</div>
        <div className='text-muted small' style={{ fontSize: '11px' }}>
          Start a conversation to see it here
        </div>
      </div>
    )
  }

  return (
    <div className='dm-list'>
      {dmChannels.map((pubKey) => (
        <DMItem
          key={pubKey}
          dm={{ pubKey }}
          profiles={profiles}
          selectedChannel={selectedChannel}
          onChangeChannel={onChangeChannel}
          {...props}
        />
      ))}
      {!dmListLoaded && (
        <div className='text-center'>
          <Spinner animation='border' />
        </div>
      )}
    </div>
  )
}

export default DMList
