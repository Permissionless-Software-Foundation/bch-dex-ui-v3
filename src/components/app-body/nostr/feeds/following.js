/**
 * Component for displaying following nostr posts
 */
// Global npm libraries
import React, { useEffect, useState } from 'react'
import { Container, Spinner } from 'react-bootstrap'

// Local libraries
import FeedCard from './feed-card'

function Following (props) {
  const { appData, posts, profiles } = props
  const { nostrQueries } = appData
  const [followingPosts, setFollowingPosts] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const getFollowingPosts = async () => {
      console.log('getFollowingPosts')
      const { nostrKeyPair } = appData.bchWalletState
      const followingList = await nostrQueries.getFollowList(nostrKeyPair.pubHex)

      // Filter posts by following list
      let filteredPosts = []
      for (let i = 0; i < followingList.length; i++) {
        const following = followingList[i]
        const filtered = posts.filter(post => {
          return following.includes(post.pubkey)
        })
        filteredPosts = [...filteredPosts, ...filtered]
      }
      // Sort filtered posts by created_at
      filteredPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setFollowingPosts(filteredPosts)
      setLoaded(true)
    }
    getFollowingPosts()
  }, [appData, posts, nostrQueries])

  return (
    <Container className='mt-4 mb-5' style={{ marginBottom: '50px' }}>
      <div>
        {loaded && followingPosts.map((post, index) => (
          <FeedCard key={index} post={post} appData={props.appData} profiles={profiles} />
        ))}
        {loaded && !followingPosts.length && (
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

export default Following
