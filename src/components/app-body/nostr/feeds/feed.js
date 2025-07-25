/**
 * Component for displaying global nostr posts
 */
// Global npm libraries
import React from 'react'
import { Container } from 'react-bootstrap'

import FeedCard from './feed-card'

function Feed (props) {
  const { posts, profiles } = props

  return (
    <Container className='mt-4 mb-5' style={{ marginBottom: '50px' }}>
      <div>
        {posts.map((post, index) => (
          <FeedCard key={index} post={post} appData={props.appData} profiles={profiles} />
        ))}
        {!posts.length && (
          <div className='text-center text-muted py-5 bg-light rounded-4 shadow-sm'>
            <i className='bi bi-inbox-fill fs-1 mb-3 d-block opacity-50' />
            <div>No posts found</div>
          </div>
        )}
      </div>
    </Container>
  )
}

export default Feed
