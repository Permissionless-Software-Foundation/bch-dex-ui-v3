/*
  Component for displaying direct message item
*/

// Global npm libraries
import React, { useCallback, useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'

export default function DMItem (props) {
  const { dm, profiles, selectedChannel, onChangeChannel } = props
  const { pubKey } = dm

  const [profile, setProfile] = useState(profiles[pubKey])
  const isSelected = selectedChannel === pubKey

  useEffect(() => {
    const profile = profiles[pubKey]

    if (profile) {
      setProfile(profile)
    }
  }, [profiles, pubKey])

  const getShortName = useCallback((str) => {
    if (!str || !str.startsWith('npub')) return str

    const prefix = 'npub'
    const first4 = str.slice(prefix.length, prefix.length + 4)
    const last4 = str.slice(-4)

    return `${prefix}:${first4}...${last4}`
  }, [])

  const handleClick = () => {
    if (onChangeChannel) {
      onChangeChannel(pubKey)
    }
  }

  return (
    <div
      className={`d-flex align-items-center p-2 rounded-3 mb-2 cursor-pointer ${isSelected ? 'bg-primary text-white' : ''}`}
      style={{
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        backgroundColor: isSelected ? '#0d6efd' : 'transparent',
        border: '1px solid transparent'
      }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = '#e9ecef'
          e.currentTarget.style.borderColor = '#dee2e6'
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.borderColor = 'transparent'
        }
      }}
    >
      {/* User Avatar */}
      <div className='me-3 flex-shrink-0 d-flex align-items-center'>
        {profile?.picture
          ? (
            <img
              src={profile.picture}
              alt={`${profile.name || 'User'} Avatar`}
              className='rounded-circle'
              style={{ width: '32px', height: '32px' }}
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
            )
          : <FontAwesomeIcon
              icon={faUser}
              className='rounded-circle d-flex align-items-center justify-content-center'
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: profile?.picture ? 'transparent' : '#e9ecef',
                color: profile?.picture ? 'transparent' : '#6c757d',
                fontSize: '14px',
                display: profile?.picture ? 'none' : 'flex'
              }}
            />}
      </div>

      {/* User Info */}
      <div className='flex-grow-1 min-w-0'>
        <div
          className={`${isSelected ? 'text-white' : 'text-dark'} ${dm.unreadCount > 0 ? 'fw-bold' : 'fw-medium'}`}
          style={{ fontSize: '14px' }}
        >
          {getShortName(profile?.name) || 'Unknown User'}
        </div>
        {/*         <div
          className={`small ${isSelected ? 'text-white-50' : 'text-muted'} ${dm.unreadCount > 0 ? 'fw-bold' : ''}`}
          style={{ fontSize: '12px' }}
        >
          No messages yet
        </div> */}
      </div>

      {/* Unread indicator */}
      {/* {dm.unreadCount > 0 && (
        <div className='ms-2'>
          <span
            className='badge rounded-pill'
            style={{
              backgroundColor: isSelected ? '#ffffff' : '#dc3545',
              color: isSelected ? '#0d6efd' : '#ffffff',
              fontSize: '10px',
              minWidth: '18px'
            }}
          >
            {dm.unreadCount > 99 ? '99+' : dm.unreadCount}
          </span>
        </div>
      )} */}
    </div>
  )
}
