/**
 * Component for displaying nostr posts
 */
// Global npm libraries
import React, { useCallback, useEffect, useState } from 'react'
import { Card, Spinner } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import * as nip19 from 'nostr-tools/nip19'
import NostrFormat from '../nostr-format'

function FeedCard (props) {
  const { post, appData, profiles } = props
  const [profile, setProfile] = useState(profiles[post.pubkey])

  const [npub, setNpub] = useState('')
  const [isClicked, setIsClicked] = useState(false)

  // Get npub from pubkey
  useEffect(() => {
    const npub = nip19.npubEncode(post.pubkey)
    setNpub(npub)
  }, [post])

  // Verify if pubkey profile exists into the profiles state
  useEffect(() => {
    if (profiles[post.pubkey]) {
      setProfile(profiles[post.pubkey])
    }
  }, [profiles, post])

  // copy to clipboard
  const copyToClipboard = useCallback((value) => {
    setIsClicked(true)
    appData.appUtil.copyToClipboard(value)
    setTimeout(() => setIsClicked(false), 200)
  }, [appData])

  // get short npub
  const getShortNpub = useCallback((npub) => {
    return npub.slice(0, 8) + '...' + npub.slice(-5)
  }, [])

  return (
    <Card className='mb-4 bg-light rounded-4 shadow-sm border-0'>
      <Card.Body className='p-3'>
        <div className='d-flex align-items-center gap-3 mb-3'>
          <div
            className='rounded-circle bg-gradient shadow d-flex align-items-center justify-content-center'
            style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(45deg, #6c757d, #495057)'
            }}
          >
            <FontAwesomeIcon icon={faUser} size='1x' color='#7c7c7d' />
          </div>
          <div className='flex-grow-1'>
            <div className='fw-bold mb-1'>
              {profile && profile.name && <span>{profile.name}</span>}
              {!profile?.name && (
                <span>
                  {post.pubkey.slice(0, 8) + '...'}
                  {!profile?.loaded && <Spinner animation='border' size='sm' className='ms-2' />}
                </span>
              )}
            </div>
            {npub && (
              <small className='text-muted'>
                <span
                  title='Copy to clipboard'
                  style={{
                    cursor: 'pointer',
                    transform: isClicked ? 'scale(0.95)' : 'scale(1)',
                    transition: 'transform 0.1s ease',
                    display: 'inline-block'
                  }}
                  onClick={() => copyToClipboard(npub)}
                >
                  {getShortNpub(npub)}
                </span>
              </small>
            )}
          </div>
          <small className='text-muted'>
            {new Date(post.created_at * 1000).toLocaleString()}
          </small>
        </div>
        <div className='mb-4'>
          <div className='fs-5 ms-5 text-dark' style={{ lineHeight: '1.3' }}>
            <NostrFormat content={post.content} />
          </div>
        </div>
      </Card.Body>
    </Card>

  )
}

export default FeedCard
