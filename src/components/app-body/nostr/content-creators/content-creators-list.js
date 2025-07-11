import React, { useState, useEffect, useCallback } from 'react'
import { Container, Spinner } from 'react-bootstrap'

import axios from 'axios'
// Local libraries
import config from '../../../../config'
import ContentCard from './content-card'
import { RelayPool } from 'nostr'

// Global variables and constants
const SERVER = config.dexServer
function ContentCreators (props) {
  const [creators, setCreators] = useState([])
  const [loaded, setLoaded] = useState(false)
  const { appData } = props

  const [followList, setFollowList] = useState([])

  const getFollowList = useCallback(async () => {
    const list = await new Promise((resolve, reject) => {
      let list = []
      const { nostrKeyPair } = appData.bchWalletState
      const psf = 'wss://nostr-relay.psfoundation.info'

      const pool = RelayPool([psf])
      pool.on('open', relay => {
        relay.subscribe('subid', { limit: 1, kinds: [3], authors: [nostrKeyPair.pubHex] })
      })

      pool.on('eose', relay => {
        console.log('Closing Relay')
        relay.close()
        /** This ensures to return an empty array if no records are found!
         *  Applies for new users that don't have a follow list
        */
        resolve(list)
      })

      pool.on('event', (relay, subId, ev) => {
        console.log('Received event:', ev)
        list = ev.tags
        resolve(list)
      })
    })

    console.log('Follow List', list)
    setFollowList(list)
  }, [appData])

  useEffect(() => {
    const loadCreators = async () => {
      try {
        const creators = await axios.get(`${SERVER}/sm/list/all/0`)
        console.log(creators.data)
        setCreators(creators.data)
        setLoaded(true)
      } catch (error) {
        setLoaded(true)
      }
    }

    if (!loaded) {
      loadCreators()
      getFollowList()
    }
  }, [loaded, followList, getFollowList])

  return (
    <Container className='mt-4 mb-5'>
      <div className='mb-4'>
        <h2 className='text-center mb-3'>Content Creators</h2>
        <p className='text-center text-muted'>
          Discover amazing content creators in the Bitcoin Cash ecosystem
        </p>
      </div>

      {!loaded && (
        <div className='text-center text-muted py-5 bg-light rounded-4 shadow-sm'>
          <Spinner animation='border' />
          <div className='mt-3'>Loading content creators...</div>
        </div>
      )}

      {loaded && (
        <div>
          {creators.map((creator, i) => (
            <ContentCard
              key={`creator-key${i}`}
              creator={creator}
              appData={props.appData}
              followList={followList}
              refreshFollowList={getFollowList}
            />
          ))}
        </div>
      )}

      {loaded && creators.length === 0 && (
        <div className='text-center text-muted py-5 bg-light rounded-4 shadow-sm'>
          <i className='bi bi-people-fill fs-1 mb-3 d-block opacity-50' />
          <div>No content creators found</div>
        </div>
      )}
    </Container>
  )
}

export default ContentCreators
