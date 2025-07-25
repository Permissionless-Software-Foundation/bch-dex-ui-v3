/*
Component for reading the nostr feeds.
*/

// Global npm libraries
import React, { useState, useEffect, useCallback } from 'react'
import { Container, Nav, Tab, Spinner } from 'react-bootstrap'
import Feed from './feed'
import Following from './following'
import { RelayPool } from 'nostr'

function Feeds (props) {
  const { appData } = props
  const [activeTab, setActiveTab] = useState(appData.lastFeedTab)

  const { bchWalletState } = appData
  const [posts, setPosts] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [profiles, setProfiles] = useState({})

  // function to fetch profile and set it to profiles state
  const fetchProfile = useCallback((pubkey) => {
    // no fetch profile again if it exist
    setProfiles(currentProfiles => {
      if (currentProfiles[pubkey]) {
        return currentProfiles
      }
      return currentProfiles
    })

    const psf = 'wss://nostr-relay.psfoundation.info'

    const pool = RelayPool([psf])
    pool.on('open', relay => {
      relay.subscribe('subid', { limit: 5, kinds: [0], authors: [pubkey] })
    })

    pool.on('eose', relay => {
      relay.close()
      try {
      // Mark unknown profiles. From this way we can know which profile was fetched and not found.
        setProfiles(currentProfiles => {
          if (!currentProfiles[pubkey]) {
            const newProfiles = { ...currentProfiles }
            newProfiles[pubkey] = { loaded: true }
            return newProfiles
          }
          return currentProfiles
        })
      } catch (error) {
        // skip error
      }
    })

    pool.on('event', (relay, subId, ev) => {
      try {
        // update profiles data
        const profile = JSON.parse(ev.content)
        setProfiles(currentProfiles => {
          const newProfiles = { ...currentProfiles }
          newProfiles[pubkey] = profile
          return newProfiles
        })
      } catch (error) {
        // skip error
      }
    })
  }, [])

  // Get global feed posts
  useEffect(() => {
    const start = () => {
      const psf = 'wss://nostr-relay.psfoundation.info'

      const pool = RelayPool([psf])
      pool.on('open', relay => {
        relay.subscribe('REQ', { limit: 10, kinds: [1], '#t': ['slpdex-socialmedia'] })
      })

      pool.on('eose', relay => {
        setLoaded(true)
        relay.close()
      })

      pool.on('event', async (relay, subId, ev) => {
        setPosts(currentPosts => [...currentPosts, ev])
        // fetch post profile and set it to profiles state
        fetchProfile(ev.pubkey)
      })
    }

    if (!loaded) {
      start()
    }
  }, [bchWalletState, loaded, fetchProfile])

  const onChangeTab = (tab) => {
    setActiveTab(tab)
    appData.setLastFeedTab(tab)
    appData.updateLocalStorage({ lastFeedTab: tab })
  }

  return (
    <>
      <Container>
        <h2 style={{
          textAlign: 'center',
          margin: '20px 0 30px 0',
          padding: '10px',
          borderBottom: '2px solid #ccc'
        }}
        >
          Feeds
        </h2>

        {loaded && (
          <Tab.Container activeKey={activeTab} onSelect={onChangeTab}>
            <Nav variant='tabs' className='mb-4'>
              <Nav.Item>
                <Nav.Link eventKey='feed' className={activeTab === 'feed' ? 'active' : ''}>
                  Feeds
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey='following' className={activeTab === 'following' ? 'active' : ''}>
                  Following
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              <Tab.Pane eventKey='feed'>
                <Feed appData={appData} posts={posts} profiles={profiles} />
              </Tab.Pane>
              <Tab.Pane eventKey='following'>
                <Following appData={appData} posts={posts} profiles={profiles} />
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        )}

        {!loaded && (
          <div className='text-center text-muted py-5 bg-light rounded-4 shadow-sm'>
            <Spinner animation='border' />
          </div>
        )}
      </Container>
    </>
  )
}

export default Feeds
