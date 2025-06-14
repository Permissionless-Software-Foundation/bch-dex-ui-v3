/**
 * Component for reading global nostr posts
 */
// Global npm libraries
import React, { useEffect, useState, useCallback } from 'react'
import { Container, Spinner } from 'react-bootstrap'

import { RelayPool } from 'nostr'

import FeedCard from './feed-card'

function Feed (props) {
  const { appData } = props
  const { bchWalletState } = appData
  const [posts, setPosts] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [profiles, setProfiles] = useState({})

  // function to fetch profile and set it to profiles state
  const fetchProfile = useCallback((pubkey) => {
    // no fetch profile again if it exist
    if (profiles[pubkey]) {
      console.log('profile exists', profiles[pubkey])
      return profiles[pubkey]
    }

    const psf = 'wss://nostr-relay.psfoundation.info'

    const pool = RelayPool([psf])
    pool.on('open', relay => {
      relay.subscribe('subid', { limit: 5, kinds: [0], authors: [pubkey] })
    })

    pool.on('eose', relay => {
      console.log('Closing Relay')
      relay.close()
    })

    pool.on('event', (relay, subId, ev) => {
      try {
        const profile = JSON.parse(ev.content)
        const newProfiles = { ...profiles }
        newProfiles[pubkey] = profile
        setProfiles(newProfiles)
      } catch (error) {
        console.log('Error parsing profile', error)
      }
    })
  }, [profiles])

  // Get global feed posts
  useEffect(() => {
    const start = () => {
      const psf = 'wss://nostr-relay.psfoundation.info'

      const pool = RelayPool([psf])
      pool.on('open', relay => {
        relay.subscribe('REQ', { limit: 10, kinds: [1], '#t': ['slpdex-socialmedia'] })
      })

      pool.on('eose', relay => {
        console.log('Closing Relay')
        setLoaded(true)
        relay.close()
      })

      pool.on('event', async (relay, subId, ev) => {
        console.log('Received event:', ev)

        setPosts(currentPosts => [...currentPosts, ev])
        // fetch post profile and set it to profiles state
        fetchProfile(ev.pubkey)
      })
    }

    if (!loaded) {
      start()
    }
  }, [bchWalletState, loaded, fetchProfile])

  return (
    <Container className='mt-4 mb-5' style={{ marginBottom: '50px' }}>
      <div>
        {posts.map((post, index) => (
          <FeedCard key={index} post={post} appData={props.appData} profiles={profiles} />
        ))}
        {!posts.length && loaded && (
          <div className='text-center text-muted py-5 bg-light rounded-4 shadow-sm'>
            <i className='bi bi-inbox-fill fs-1 mb-3 d-block opacity-50' />
            <div>No posts found</div>
          </div>
        )}

        {!loaded && (
          <div className='text-center text-muted py-5 bg-light rounded-4 shadow-sm'>
            <Spinner animation='border' />
          </div>
        )}
      </div>
    </Container>
  )
}

export default Feed
