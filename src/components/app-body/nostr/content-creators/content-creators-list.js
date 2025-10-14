/*
  This component is used to display the list of content creators.

  TODO:
  - getFollowList() should aggregate all the followers from all the relays.
    Currently each relay overwrites the last one.

  - loadProfile() should use multiple relays. It should exit after the first
    successful retrieval of data from a relay. If the relay fails to give data,
    it should move on to the next relay.
*/

import React, { useState, useEffect, useCallback } from 'react'
import { Container, Spinner } from 'react-bootstrap'
import axios from 'axios'

// Local libraries
import config from '../../../../config'
import ContentCard from './content-card'
import FilterDropdown from './filter-dropdown'

// Global variables and constants
const SERVER = config.dexServer
function ContentCreators (props) {
  const [creators, setCreators] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('Most Followers')
  const { appData } = props

  const [followList, setFollowList] = useState([])

  // Get the list of profiles followed by the user.
  // It aggregates all the followers from all the relays.
  const getFollowList = useCallback(async () => {
    const { nostrKeyPair } = appData.bchWalletState

    const pubKeyHex = nostrKeyPair.pubHex
    const list = await appData.nostrQueries.getFollowList(pubKeyHex)
    setFollowList(list)
  }, [appData])

  useEffect(() => {
    const loadCreators = async () => {
      try {
        console.log('loadCreators()')
        const creatorsRes = await axios.get(`${SERVER}/sm/list/all/0`)
        const creators = creatorsRes.data
        // console.log('creators', creators)
        setCreators(creators)
        setLoaded(true)

        for (let i = 0; i < creators.length; i++) {
          try {
            const creator = creators[i]
            const profileRes = await appData.nostrQueries.getProfile(creator.pubkey)
            let profile = profileRes
            if (!profileRes) profile = {}
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
  }, [loaded, getFollowList, appData])

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
        <FilterDropdown
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
        />
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
