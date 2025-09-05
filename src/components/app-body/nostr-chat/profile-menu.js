/*
  Component for displaying a profile menu
*/

// Global npm libraries
import React from 'react'
import Dropdown from 'react-bootstrap/Dropdown'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMessage, faUser } from '@fortawesome/free-solid-svg-icons'

function ProfileMenu (props) {
  const { profile, children, addPrivateMessage, isDm, dmListLoaded } = props

  const handlePrivateMessage = () => {
    addPrivateMessage(profile)
  }

  const handleUserProfile = () => {
    const profileUrl = `${window.location.origin}/profile/${profile.npub}#single-view`
    window.open(profileUrl, '_blank')
  }

  return (
    <>
      <style>
        {`
          .dropdown-toggle-no-arrow::after {
            display: none !important;
          }
        `}
      </style>

      <Dropdown>
        <Dropdown.Toggle
          as='div'
          className='d-inline-block dropdown-toggle-no-arrow'
          style={{
            cursor: 'pointer',
            '--bs-btn-padding-x': '0',
            '--bs-btn-padding-y': '0'
          }}
        >
          {children}
        </Dropdown.Toggle>

        <Dropdown.Menu className='shadow-sm' style={{ minWidth: '180px' }}>
          <Dropdown.Header className='text-muted fw-bold'>
            Profile Options
          </Dropdown.Header>
          {!isDm && (
            <Dropdown.Item onClick={handlePrivateMessage} disabled={!dmListLoaded}>
              <FontAwesomeIcon icon={faMessage} className='me-2' />
              Private Message
            </Dropdown.Item>
          )}
          <Dropdown.Item onClick={handleUserProfile}>
            <FontAwesomeIcon icon={faUser} className='me-2' />
            User Profile
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </>
  )
}

export default ProfileMenu
