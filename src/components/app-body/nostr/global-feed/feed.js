/**
 * Component for reading global nostr posts
 */
// Global npm libraries
import React, { useEffect, useState } from 'react'
import { Container, Card, Spinner } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'

import { RelayPool } from 'nostr'

function Feed (props) {
  const { bchWalletState } = props.appData
  const [posts, setPosts] = useState([])
  const [loaded, setLoaded] = useState(false)

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

      pool.on('event', (relay, subId, ev) => {
        console.log('Received event:', ev)
        // const profile = JSON.parse(ev.content)
        setPosts(currentPosts => [...currentPosts, ev])
      })
    }

    if (!loaded) {
      start()
    }
  }, [bchWalletState, loaded])

  return (
    <Container className='mt-4 mb-5' style={{ marginBottom: '50px' }}>
      <div>
        {posts.map((post, index) => (
          <Card key={index} className='mb-4 bg-light rounded-4 shadow-sm border-0'>
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
                    {post.pubkey.slice(0, 8) + '...'}
                  </div>
                  <small className='text-muted'>
                    {`${post.pubkey.slice(0, 8)}...${post.pubkey.slice(-5)}`}
                  </small>
                </div>
                <small className='text-muted'>
                  {new Date(post.created_at * 1000).toLocaleString()}
                </small>
              </div>
              <div className='mb-4'>
                <div className='fs-5 ms-5 text-dark' style={{ lineHeight: '1.3' }}>
                  {post.content}
                </div>
              </div>
            </Card.Body>
          </Card>
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
