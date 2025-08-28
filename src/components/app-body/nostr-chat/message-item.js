/*
  Component for displaying a single chat message
*/

// Global npm libraries
import React, { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'

function MessageItem (props) {
  const { message, profiles } = props
  const [profile, setProfile] = useState(null)

  const msgRef = useRef(null)

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  useEffect(() => {
    if (!profile && profiles[message.pubkey]) {
      setProfile(profiles[message.pubkey])
    }
  }, [profiles, message])

  useEffect(() => {
    if (msgRef.current && message.latest) {
      msgRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      })
    }
  }, [msgRef.current, message])

  return (
    <div className='mb-3 d-flex align-items-start' ref={msgRef}>
      {/* Message Content */}
      <div className='flex-grow-1'>
        <div
          className='text-dark p-3 rounded-3'
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e9ecef',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            maxWidth: '85%',
            wordWrap: 'break-word'
          }}
        >
          <div className='d-flex align-items-center mb-2'>
            {/* Avatar */}
            <div className='me-2 flex-shrink-0'>
              {profile?.picture
                ? (
                  <img
                    src={profile.picture}
                    alt={`${profile.name} Avatar`}
                    className='rounded-circle'
                    style={{ width: '24px', height: '24px' }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'block'
                    }}
                  />
                  )
                : <FontAwesomeIcon
                    icon={faUser}
                    className='rounded-circle d-flex align-items-center justify-content-center'
                    style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: '#e9ecef',
                      color: '#6c757d',
                      fontSize: '12px',
                      display: message.avatar ? 'none' : 'flex'
                    }}
                  />}
            </div>
            {!profile && <span className='fw-bold text-dark me-2'>{message.pubkey}</span>}
            {profile && profile.name && <span className='fw-bold text-dark me-2'>{profile.name}</span>}

            <small className='text-muted'>{formatTime(message.created_at * 1000)}</small>
          </div>
          <div style={{ lineHeight: '1.4', wordBreak: 'break-all' }}>
            {message.content}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessageItem
