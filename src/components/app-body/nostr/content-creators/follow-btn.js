import React, { useState, useEffect } from 'react'
import { Spinner } from 'react-bootstrap'
import { finalizeEvent } from 'nostr-tools/pure'
import { hexToBytes } from '@noble/hashes/utils'
import NostrRestClient from '../../../../services/nostr-rest-client.js'

function FollowBtn (props) {
  const [onFetch, setOnFetch] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const { creator, appData, creatorProfile, followList, refreshFollowList } = props
  // Initialize REST client for publishing
  const restClient = new NostrRestClient()

  useEffect(() => {
    const isFollowing = followList.find(item => item[1] === creator.pubkey)
    setIsFollowing(isFollowing)
  }, [followList, creator.pubkey])

  // Add creator to the follow list
  const handleFollow = async () => {
    try {
      setOnFetch(true)
      // Get current follow list
      const currentList = followList
      console.log('currentList', currentList)

      // find if creator is in the list
      const existing = currentList.find(item => item[1] === creator.pubkey)
      if (!existing) {
        const creatorName = creatorProfile.name || ''

        // add creator to the list (relay URL in tag is optional, REST API handles relay selection)
        currentList.push(['p', creator.pubkey, '', creatorName])
        await submitFollowList(currentList)
        await refreshFollowList()
      } else {
        console.log('Already Followed')
      }

      setOnFetch(false)
    } catch (error) {
      console.warn(error)
      setOnFetch(false)
    }
  }

  // Add creator to the follow list
  const handleUnfollow = async () => {
    try {
      setOnFetch(true)
      // Get current follow list
      const currentList = followList
      console.log('currentList', currentList)

      // find if creator is in the list
      const existing = currentList.find(item => item[1] === creator.pubkey)
      if (existing) {
        // remove creator from the list
        currentList.splice(currentList.indexOf(existing), 1)
        await submitFollowList(currentList)
        await refreshFollowList()
      }

      setOnFetch(false)
    } catch (error) {
      console.warn(error)
      setOnFetch(false)
    }
  }

  const submitFollowList = async (newList) => {
    try {
      const { nostrKeyPair } = appData.bchWalletState

      // Convert private key to binary
      const privateKeyBin = hexToBytes(nostrKeyPair.privHex)

      // Generate a follow list event.
      const eventTemplate = {
        kind: 3,
        created_at: Math.floor(Date.now() / 1000),
        tags: newList,
        content: ''
      }
      console.log(`eventTemplate: ${JSON.stringify(eventTemplate, null, 2)}`)

      // Sign the post
      const signedEvent = finalizeEvent(eventTemplate, privateKeyBin)
      console.log('signedEvent: ', signedEvent)

      // Publish the follow list via REST API (handles broadcasting to multiple relays)
      const result = await restClient.publishEvent(signedEvent)
      console.log('result: ', result)

      if (!result.accepted) {
        throw new Error(`Failed to publish follow list: ${result.message || 'Unknown error'}`)
      }

      setTimeout(() => {
        setOnFetch(false)
      }, 1000)
    } catch (error) {
      console.warn(error)
      setOnFetch(false)
    }
  }

  return (
    <>
      {onFetch && (
        <div className='d-flex justify-content-center'>
          <Spinner animation='border' />
        </div>
      )}
      {!onFetch && !isFollowing && (
        <button
          className='btn btn-outline-danger btn-sm rounded-pill px-3'
          style={{ fontSize: '0.875rem', minWidth: '100px' }}
          onClick={handleFollow}
        >
          <i className='bi bi-person-plus me-1' />
          Follow
        </button>
      )}
      {!onFetch && isFollowing && (
        <button
          className='btn btn-outline-danger btn-sm rounded-pill px-3'
          style={{ fontSize: '0.875rem', minWidth: '100px' }}
          onClick={handleUnfollow}
        >
          <i className='bi bi-person-plus me-1' />
          Unfollow
        </button>
      )}
    </>
  )
}

export default FollowBtn
