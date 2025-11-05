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
import { finalizeEvent } from 'nostr-tools/pure'
import { hexToBytes } from '@noble/hashes/utils' // already an installed dependency
import NostrRestClient from '../../../../services/nostr-rest-client.js'

// Local libraries
import CopyOnClick from '../../bch-wallet/copy-on-click.js'
import NostrFormat from '../nostr-format'
import AdminDeleteBtn from '../../nostr-chat/delete-btn.js'

function FeedCard (props) {
  const { post, appData, profiles } = props
  const { nostrKeyPair } = appData.bchWalletState
  // Initialize REST client for publishing
  const restClient = new NostrRestClient()
  const [profile, setProfile] = useState(profiles[post.pubkey])
  const [npub, setNpub] = useState('')
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(null)
  const [likesFetched, setLikesFetched] = useState(false)
  const [profilePictureError, setProfilePictureError] = useState(false)

  // function to fetch a post likes reaction
  const handleLikes = useCallback(async (post, userPubKey) => {
    try {
      // Get all post likes events
      const likesArr = await appData.nostrQueries.getPostLikes(post.id)
      const likesCount = likesArr.length

      // Verify if the users pubkey is in the likes array
      const userLikedPost = likesArr.find(val => { return val.pubkey === userPubKey })
      setLikesCount(likesCount)
      setIsLiked(userLikedPost)
      setLikesFetched(true)
    } catch (error) {
      console.warn(error)
    }
  }, [appData])

  const handleProfilePictureError = () => {
    setProfilePictureError(true)
  }

  const handleProfilePictureLoad = () => {
    setProfilePictureError(false)
  }

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

      // Define if like or dislike
      let content = '+'
      if (isLiked) { content = '-' }

      // Generate a post.
      const eventTemplate = {
        kind: 7,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['e', post.id],
          ['p', nostrKeyPair.pubHex]
        ],
        content
      }
      console.log(`eventTemplate: ${JSON.stringify(eventTemplate, null, 2)}`)

      // Sign the post
      const signedEvent = finalizeEvent(eventTemplate, privateKeyBin)
      console.log('signedEvent: ', signedEvent)

      // Publish the like via REST API (handles broadcasting to multiple relays)
      try {
        const result = await restClient.publishEvent(signedEvent)
        console.log('result: ', result)

        if (!result.accepted) {
          throw new Error(`Failed to publish like: ${result.message || 'Unknown error'}`)
        }
      } catch (err) {
        console.warn(`Error publishing like: ${err}`)
        throw err
      }

      await handleLikes(post, nostrKeyPair.pubHex)
      setLikesFetched(true)
    } catch (error) {
      console.warn(error)
      setLikesFetched(true)
    }
  }

  const goToProfile = () => {
    const profileUrl = `${window.location.origin}/profile/${npub}#single-view`
    window.open(profileUrl, '_blank')
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
            {profile?.picture && !profilePictureError
              ? (
                <img
                  src={profile.picture}
                  alt='Profile'
                  className='rounded-circle w-100 h-100'
                  style={{ objectFit: 'cover', cursor: 'pointer' }}
                  onError={handleProfilePictureError}
                  onLoad={handleProfilePictureLoad}
                  onClick={goToProfile}
                />
                )
              : (
                <FontAwesomeIcon icon={faUser} size='1x' color='#7c7c7d' style={{ cursor: 'pointer' }} onClick={goToProfile} />
                )}
          </div>
          <div className='flex-grow-1'>
            <div className='fw-bold mb-1'>
              {profile && profile.name && <span style={{ cursor: 'pointer' }} onClick={goToProfile}>{profile.name}</span>}
              {!profile?.name && (
                <span style={{ cursor: 'pointer' }} onClick={goToProfile}>
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
                    transition: 'transform 0.1s ease',
                    display: 'inline-block',
                    marginRight: '5px'
                  }}
                  onClick={goToProfile}

                >
                  {getShortNpub(npub)}
                </span>
                <CopyOnClick
                  walletProp='npub'
                  appData={props.appData}
                  value={npub}
                />
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
        {/** Show btn on kind 1 events. */}
        {profile && post && post.kind === 1 && (
          <AdminDeleteBtn
            npub={npub}
            pubkey={post.pubkey}
            eventId={post.id}
            deleteType='post'
            deletedData={props.deletedPost}
            refreshDeletedData={props.refreshDeletedPost}
            {...props}
          />
        )}
      </Card.Body>
    </Card>

  )
}

export default FeedCard
