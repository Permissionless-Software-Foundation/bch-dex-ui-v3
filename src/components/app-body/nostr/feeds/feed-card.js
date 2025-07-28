/**
 * Component for displaying nostr posts
 */
// Global npm libraries
import React, { useCallback, useEffect, useState } from 'react'
import { Card, Spinner } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons'
import { faHeart } from '@fortawesome/free-regular-svg-icons'
import * as nip19 from 'nostr-tools/nip19'
import NostrFormat from '../nostr-format'
import { finalizeEvent } from 'nostr-tools/pure'
import { Relay } from 'nostr-tools/relay'
import { hexToBytes } from '@noble/hashes/utils' // already an installed dependency
import { RelayPool } from 'nostr'

function FeedCard (props) {
  const { post, appData, profiles } = props
  const { nostrKeyPair } = appData.bchWalletState

  const [profile, setProfile] = useState(profiles[post.pubkey])

  const [npub, setNpub] = useState('')
  const [isClicked, setIsClicked] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(null)
  const [likesFetched, setLikesFetched] = useState(false)

  // function to fetch a post likes reaction
  const handleLikes = useCallback(async (post, userPubKey) => {
    try {
      const psf = 'wss://nostr-relay.psfoundation.info'
      const res = await new Promise((resolve) => {
        let likesCnt = 0
        let userLikedCnt = 0
        const pool = RelayPool([psf])
        pool.on('open', relay => {
          relay.subscribe('subid', { kinds: [7], '#e': [post.id] })
        })

        pool.on('eose', relay => {
          relay.close()
          resolve({
            count: likesCnt,
            userLiked: userLikedCnt > 0
          })
        })

        pool.on('event', (relay, subId, ev) => {
          try {
            // Count likes
            if (ev.content === '+') {
              likesCnt++
              // Count user likes
              if (ev.pubkey === userPubKey) {
                userLikedCnt++
              }
            }
            // Count dislikes
            if (ev.content === '-') {
              likesCnt--
              // Count user dislikes.
              if (ev.pubkey === userPubKey) {
                userLikedCnt--
              }
            }
          } catch (error) {
            // skip error
          }
        })
      })
      setLikesCount(res.count)
      setIsLiked(res.userLiked)
      setLikesFetched(true)
    } catch (error) {
      console.warn(error)
    }
  }, [])
  // Get npub from pubkey
  useEffect(() => {
    const npub = nip19.npubEncode(post.pubkey)
    setNpub(npub)

    // Handle post likes
    if (!likesFetched && nostrKeyPair.pubHex) {
      handleLikes(post, nostrKeyPair.pubHex)
    }
  }, [post, nostrKeyPair, handleLikes, likesFetched])

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

  const submitLike = async (e) => {
    // Post on nostr network
    e.preventDefault()
    try {
      const { nostrKeyPair } = appData.bchWalletState

      setLikesFetched(false)
      // Convert private key to binary
      const privateKeyBin = hexToBytes(nostrKeyPair.privHex)

      // Relay list
      const psf = 'wss://nostr-relay.psfoundation.info'

      // Define if like or dislike
      let content = '+'
      if (isLiked) { content = '-' }

      // Generate a post.
      const eventTemplate = {
        kind: 7,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['e', post.id, psf],
          ['p', psf, nostrKeyPair.pubHex]
        ],
        content
      }
      console.log(`eventTemplate: ${JSON.stringify(eventTemplate, null, 2)}`)

      // Sign the post
      const signedEvent = finalizeEvent(eventTemplate, privateKeyBin)
      console.log('signedEvent: ', signedEvent)

      // Connect to a relay.
      const relay = await Relay.connect(psf)
      console.log(`connected to ${relay.url}`)

      // Publish the message to the relay.
      const result = await relay.publish(signedEvent)
      console.log('result: ', result)

      // Close the connection to the relay.
      relay.close()

      await handleLikes(post, nostrKeyPair.pubHex)
      setLikesFetched(true)
    } catch (error) {
      console.warn(error)
      setLikesFetched(true)
    }
  }

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
        <div className='d-flex justify-content-end'>
          {likesFetched && (
            <button
              onClick={submitLike}
              className='btn btn-link text-decoration-none p-0 d-flex align-items-center gap-2'
              style={{
                border: 'none',
                background: 'transparent',
                transition: 'all 0.2s ease',
                color: isLiked ? '#e31b23' : '#536471',
                fontSize: '14px',
                fontWeight: '400'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)'
              }}
            >
              <FontAwesomeIcon
                icon={isLiked ? faHeartSolid : faHeart}
                style={{
                  fontSize: '16px',
                  color: isLiked ? '#e31b23' : '#536471',
                  transition: 'all 0.2s ease'
                }}
              />
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: '400',
                  color: isLiked ? '#e31b23' : '#536471',
                  transition: 'all 0.2s ease'
                }}
              >
                {likesCount || 0}
              </span>
            </button>
          )}
          {!likesFetched && (
            <Spinner animation='border' size='sm' className='ms-2' />
          )}
        </div>
      </Card.Body>
    </Card>

  )
}

export default FeedCard
