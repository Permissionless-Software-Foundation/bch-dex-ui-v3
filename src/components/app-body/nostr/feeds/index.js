/*
  Component for reading the nostr feeds.
*/

// Global npm libraries
import React, { useState, useEffect } from 'react'
import { Container, Nav, Tab, Spinner } from 'react-bootstrap'

// Local libraries
import Feed from './feed'
import Following from './following'

function Feeds (props) {
  const { appData } = props
  const [activeTab, setActiveTab] = useState(appData.lastFeedTab)

  const [posts, setPosts] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [profiles, setProfiles] = useState({})

  // Load data on component mount.
  useEffect(() => {
    const loadData = async () => {
      // Get feeds
      const feeds = await appData.nostrQueries.getGlobalFeeds()
      setPosts(feeds)
      setLoaded(true)

      const loadedProfiles = [] // fetched profiles ( this will be used for prevent load the same profile multiple times.)
      // Map feeds and get feed owner profile.
      for (let i = 0; i < feeds.length; i++) {
        const pubKey = feeds[i].pubkey

        const exist = loadedProfiles.find((val) => { return val === pubKey })
        if (exist) { continue }
        // Fech profile.
        const profile = await appData.nostrQueries.getProfile(pubKey)
        loadedProfiles.push(pubKey) // mark as loaded

        // Update profile state
        setProfiles(currentProfiles => {
          const newProfiles = { ...currentProfiles }
          newProfiles[pubKey] = profile
          return newProfiles
        })
      }
    }
    if (!loaded) {
      loadData()
    }
  }, [loaded, appData])

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
