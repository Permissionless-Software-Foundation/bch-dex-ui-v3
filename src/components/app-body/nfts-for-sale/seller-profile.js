/*
  This component displays the seller's profile information for an NFT listing.
*/

// Global npm libraries
import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'

function SellerProfile (props) {
  const { npub, appData } = props
  const [profile, setProfile] = useState(null)
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const { nostrQueries } = appData

  // Get profile if npub is provided.
  useEffect(() => {
    const start = async () => {
      setIsLoading(true)
      try {
        const pubKey = nostrQueries.npubToHex(npub)
        const profile = await nostrQueries.getProfile(pubKey)
        setProfile(profile)
      } catch (error) {
        console.warn('Error fetching seller profile:', error)
      } finally {
        setIsLoading(false)
      }
    }
    if (npub) {
      start()
    } else {
      setIsLoading(false)
    }
  }, [npub, nostrQueries])

  // handle img url errors
  const handleImageError = (type) => {
    setImageError(true)
  }

  // go to profile
  const goToProfile = () => {
    if (npub) {
      const profileUrl = `${window.location.origin}/profile/${npub}#single-view`
      window.open(profileUrl, '_blank')
    }
  }

  // Get display name - use profile name, npub short form, or "Anonymous User"
  const getDisplayName = () => {
    if (profile?.name) return profile.name
    if (npub) {
      return npub.slice(0, 8) + '...' + npub.slice(-6)
    }
    return 'Anonymous User'
  }

  return (
    <div
      onClick={goToProfile}
      className='seller-profile-container'
      style={{
        padding: '4px 8px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        border: '1px solid #e9ecef',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        width: '100%'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#e9ecef'
        e.currentTarget.style.borderColor = '#dee2e6'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#f8f9fa'
        e.currentTarget.style.borderColor = '#e9ecef'
      }}
    >
      <div className='d-flex align-items-center justify-content-center gap-1'>
        {/* Seller Label */}
        <small
          className='text-muted fw-semibold'
          style={{
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.3px'
          }}
        >
          Seller:
        </small>

        {/* Profile Picture or Placeholder */}
        <div
          className='d-flex align-items-center justify-content-center'
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#e9ecef',
            border: '1.5px solid #dee2e6',
            overflow: 'hidden',
            flexShrink: 0,
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
          onClick={(e) => {
            e.stopPropagation()
            goToProfile()
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          {isLoading
            ? (
              <FontAwesomeIcon
                icon={faUser}
                style={{
                  color: '#adb5bd',
                  fontSize: '12px',
                  opacity: 0.5
                }}
              />
              )
            : (profile?.picture && !imageError)
                ? (
                  <img
                    src={profile.picture}
                    alt='Seller profile'
                    className='w-100 h-100'
                    style={{ objectFit: 'cover' }}
                    onError={() => handleImageError('picture')}
                  />
                  )
                : (
                  <FontAwesomeIcon
                    icon={faUser}
                    style={{
                      color: '#6c757d',
                      fontSize: '12px'
                    }}
                  />
                  )}
        </div>

        {/* Seller Name */}
        <span
          onClick={(e) => {
            e.stopPropagation()
            goToProfile()
          }}
          className='cursor-pointer fw-medium'
          style={{
            color: '#495057',
            fontSize: '0.8rem',
            transition: 'color 0.2s ease',
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#007bff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#495057'
          }}
          title={profile?.name || npub}
        >
          {getDisplayName()}
        </span>
      </div>
    </div>
  )
}

export default SellerProfile
