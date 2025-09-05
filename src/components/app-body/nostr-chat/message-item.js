/*
  Component for displaying a single chat message
*/

// Global npm libraries
import React, { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import { Spinner } from 'react-bootstrap'
import NostrFormat from '../../app-body/nostr/nostr-format'
import ProfileMenu from './profile-menu'

function MessageItem (props) {
  const { message, profiles, selectedChannel } = props
  const [profile, setProfile] = useState(null)

  const [isDm, setIsDm] = useState(false)

  // Define type between private or public
  useEffect(() => {
    const dmTo = profiles[selectedChannel]
    setIsDm(!!dmTo)
  }, [selectedChannel, profiles])

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  useEffect(() => {
    if (profiles[message.pubkey]) {
      setProfile(profiles[message.pubkey])
    }
  }, [profiles, message])

  return (
    <div className='mb-3 d-flex align-items-start'>
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
                  <ProfileMenu
                    profile={profile}
                    isDm={isDm}
                    {...props}
                  >
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
                  </ProfileMenu>
                  )
                : (
                  <ProfileMenu
                    profile={profile}
                    isDm={isDm}
                    {...props}

                  >
                    <FontAwesomeIcon
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
                    />
                  </ProfileMenu>
                  )}
            </div>
            {!profile && <span className='fw-bold text-dark me-2'>{message.pubkey}<Spinner animation='border' size='sm' /></span>}
            {profile && profile.name && (
              <ProfileMenu
                profile={profile}
                isDm={isDm}
                {...props}
              >
                <span className='fw-bold text-dark me-2'>
                  {profile.name}
                </span>
              </ProfileMenu>
            )}

            <small className='text-muted'>{formatTime(message.created_at * 1000)}</small>
          </div>
          <div style={{ lineHeight: '1.4', wordBreak: 'break-all' }}>
            <NostrFormat content={message.content} />

          </div>
        </div>
      </div>
    </div>
  )
}

export default MessageItem
