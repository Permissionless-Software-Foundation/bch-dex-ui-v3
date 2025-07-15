/**
 *  Component for read nostr information kind 1
 */
// Global npm libraries
import React, { useEffect, useState } from 'react'
import { Container, Card, Spinner } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import NostrFormat from '../nostr-format'
import { RelayPool } from 'nostr'
import * as nip19 from 'nostr-tools/nip19'

function PublicRead (props) {
  const { npub } = props
  const { bchWalletState } = props.appData
  const [posts, setPosts] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Get Last post from a author
    const start = () => {
      const pubHexData = nip19.decode(npub)
      const pubHex = pubHexData.data
      console.log('pubhex', pubHex)
      const psf = 'wss://nostr-relay.psfoundation.info'

      const pool = RelayPool([psf])
      pool.on('open', relay => {
        relay.subscribe('subid', { limit: 5, kinds: [1], authors: [pubHex] })
        setLoaded(true)
      })

      pool.on('eose', relay => {
        console.log('Closing Relay')
        setLoaded(true)
        relay.close()
      })

      pool.on('event', (relay, subId, ev) => {
        console.log('Received event:', ev)
        setPosts(currentPosts => [...currentPosts, ev])
      })
    }

    if (!loaded && npub) {
      start()
    }
  }, [bchWalletState, loaded, npub])

  console.log('public-read.js bchWalletState', bchWalletState)

  return (
    <Container className='mt-4 mb-5'>
      {/* Nostr Feed Section */}
      <div className='bg-white rounded-1 shadow-sm border mb-4'>
        <div className='p-3 border-bottom bg-light rounded-top-4'>
          <h5 className='mb-0 fw-bold text-dark'>Nostr Feed</h5>
        </div>
        <div
          className='p-3'
          style={{
            height: '800px',
            overflowY: 'auto',
            maxHeight: '800px'
          }}
        >
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
                    <div className='fw-bold mb-1'>{props.profile?.name}</div>
                    <small className='text-muted'>
                      {`${bchWalletState.nostrKeyPair.npub.slice(0, 8)}...${bchWalletState.nostrKeyPair.npub.slice(-5)}`}
                    </small>
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
      </div>
    </Container>
  )
}

export default PublicRead
