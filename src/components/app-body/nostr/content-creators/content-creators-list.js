import React, { useState, useEffect, useCallback } from 'react'
import { Container, Spinner, Dropdown } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFilter } from '@fortawesome/free-solid-svg-icons'
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
  const [selectedFilter, setSelectedFilter] = useState('Most Followers')
  const { appData } = props

  const [followList, setFollowList] = useState([])

  const getFollowList = useCallback(async () => {
    const list = await new Promise((resolve, reject) => {
      let list = []
      const { nostrKeyPair } = appData.bchWalletState

      const pool = RelayPool(config.nostrRelays)
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

  const loadProfile = useCallback(async (pubKey) => {
    return new Promise((resolve) => {
      const pool = RelayPool(config.nostrRelays)
      pool.on('open', relay => {
        relay.subscribe('subid', { limit: 5, kinds: [0], authors: [pubKey] })
      })

      pool.on('eose', relay => {
        console.log('Closing Relay')
        relay.close()
        resolve(false)
      })

      pool.on('event', (relay, subId, ev) => {
        try {
          const profile = JSON.parse(ev.content)
          // console.log('profile', profile)
          resolve(profile)
        } catch (error) {
          resolve(false)
        }
      })
    })
  }, [])

  useEffect(() => {
    const loadCreators = async () => {
      try {
        const creatorsRes = await axios.get(`${SERVER}/sm/list/all/0`)
        const creators = creatorsRes.data
        // console.log('creators', creators)
        setCreators(creators)
        setLoaded(true)

        for (let i = 0; i < creators.length; i++) {
          try {
            const creator = creators[i]
            const profile = await loadProfile(creator.pubkey)

            // the folowing lines should re-render the ContentCard
            setCreators(prevCreators => {
              const updatedCreators = [...prevCreators]
              updatedCreators[i] = { ...updatedCreators[i], profile }
              return updatedCreators
            })
          } catch (error) {
            console.warn(error)
          }
        }
      } catch (error) {
        setLoaded(true)
      }
    }

    if (!loaded) {
      loadCreators()
      getFollowList()
    }
  }, [loaded, followList, getFollowList, loadProfile])

  const filteredCreators = useCallback(() => {
    if (!creators || creators.length === 0) {
      return []
    }

    let filtered = [...creators]

    if (selectedFilter === 'Most Followers') {
      filtered = filtered.sort((a, b) => (b.followerCnt || 0) - (a.followerCnt || 0))
    }

    return filtered
  }, [creators, selectedFilter])

  return (
    <Container className='mt-4 mb-5'>
      <div className='mb-4'>
        <h2 className='text-center mb-3'>Content Creators</h2>
        <p className='text-center text-muted'>
          Discover amazing creators tokenizing their content.
        </p>
      </div>

      <div className='mb-4 d-flex justify-content-end'>
        <Dropdown>
          <Dropdown.Toggle variant='outline-secondary' className='d-flex align-items-center gap-2'>
            <FontAwesomeIcon icon={faFilter} />
            <span>{selectedFilter}</span>
          </Dropdown.Toggle>

          <Dropdown.Menu>
            <Dropdown.Item onClick={() => setSelectedFilter('Most Followers')}>
              Most Followers
            </Dropdown.Item>
            <Dropdown.Item onClick={() => setSelectedFilter('Most Tokens')}>
              Most Tokens
            </Dropdown.Item>
            <Dropdown.Item onClick={() => setSelectedFilter('Most Likes')}>
              Most Likes
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {!loaded && (
        <div className='text-center text-muted py-5 bg-light rounded-4 shadow-sm'>
          <Spinner animation='border' />
          <div className='mt-3'>Loading content creators...</div>
        </div>
      )}

      {loaded && (
        <div>
          {filteredCreators().map((creator, i) => (
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

      {loaded && filteredCreators().length === 0 && (
        <div className='text-center text-muted py-5 bg-light rounded-4 shadow-sm'>
          <i className='bi bi-people-fill fs-1 mb-3 d-block opacity-50' />
          <div>No content creators found</div>
        </div>
      )}
    </Container>
  )
}

export default ContentCreators
