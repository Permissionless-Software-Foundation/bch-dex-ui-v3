/**
 * Component for read nostr information kind 0
 */
// Global npm libraries
import React, { useEffect, useState } from 'react'
import { Container, Button } from 'react-bootstrap'
import CopyOnClick from '../../bch-wallet/copy-on-click.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import NostrFormat from '../nostr-format'
import { RelayPool } from 'nostr'
import * as nip19 from 'nostr-tools/nip19'

function ProfileRead (props) {
  const { npub } = props
  const { bchWalletState } = props.appData
  console.log('npub prop', npub)
  const { setProfile } = props
  const [post, setPost] = useState({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const start = () => {
      const pubHexData = nip19.decode(npub)
      const pubHex = pubHexData.data
      console.log('pubhex', pubHex)
      const psf = 'wss://nostr-relay.psfoundation.info'

      const pool = RelayPool([psf])
      pool.on('open', relay => {
        relay.subscribe('subid', { limit: 5, kinds: [0], authors: [pubHex] })
        setLoaded(true)
      })

      pool.on('eose', relay => {
        console.log('Closing Relay')
        relay.close()
      })

      pool.on('event', (relay, subId, ev) => {
        console.log('Received event:', ev)
        const profile = JSON.parse(ev.content)
        console.log('Profile:', profile)
        setPost(profile)
        setProfile(profile)
      })

      setLoaded(true)
    }

    if (!loaded && npub) {
      start()
    }
  }, [bchWalletState, loaded, setProfile, npub])

  return (
    <Container>
      <div className='d-flex flex-column flex-md-row align-items-center gap-4 mb-5 p-3 p-md-5 bg-light rounded-4 shadow-sm'>
        <div style={{ width: '100px', height: '100px' }} className='mb-3 mb-md-0'>
          <div
            className='rounded-circle bg-gradient shadow d-flex align-items-center justify-content-center'
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(45deg, #6c757d, #495057)'
            }}
          >
            <FontAwesomeIcon icon={faUser} size='3x' color='#7c7c7d' />
          </div>
        </div>
        <div className='flex-grow-1 text-center text-md-start mb-3 mb-md-0 d-flex flex-column align-items-center align-items-md-start'>
          <h3 className='mb-2 fw-bold'>{post.name}</h3>
          <div className='text-muted small mb-3 d-flex align-items-center flex-column flex-md-row'>
            <span className='text-truncate me-2 mb-2 mb-md-0'>
              <span className='d-md-none'>
                {`${bchWalletState.nostrKeyPair.npub.slice(0, 8)}...${bchWalletState.nostrKeyPair.npub.slice(-5)}`}
              </span>
              <span className='d-none d-md-inline'>
                {bchWalletState.nostrKeyPair.npub}
              </span>
            </span>
            <CopyOnClick walletProp='npub' appData={props.appData} value={bchWalletState.nostrKeyPair.npub} />
          </div>
          <div className='fs-6 text-secondary'>
            <NostrFormat content={post.about} />
          </div>
        </div>
        <div className='d-flex gap-2 align-items-center flex-wrap justify-content-center'>
          <Button
            variant='outline-danger'
            className='px-3 px-md-4 py-2 rounded-pill fw-semibold'
            style={{ minWidth: '120px' }}
          >
            <i className='bi bi-person-plus me-2' />
            Follow
          </Button>
          <Button
            variant='primary'
            className='px-3 px-md-4 py-2 rounded-pill fw-semibold'
            style={{ minWidth: '120px' }}
          >
            <i className='bi bi-chat-dots me-2' />
            Message
          </Button>
        </div>
      </div>
    </Container>
  )
}

export default ProfileRead
