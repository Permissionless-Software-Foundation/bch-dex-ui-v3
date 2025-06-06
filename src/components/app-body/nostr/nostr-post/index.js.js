/*
Component for posting nostr information.
*/

// Global npm libraries
import React from 'react'
import { Container } from 'react-bootstrap'
import ProfilePost from './profile-post'
import PublicPost from './public-post'

function NostrPost (props) {
  return (
    <>
      <Container>
        <h2 style={{
          textAlign: 'center',
          margin: '20px 0',
          padding: '10px',
          borderBottom: '2px solid #ccc'
        }}
        >
          Nostr Post
        </h2>
        <ProfilePost {...props} />
        <PublicPost {...props} />
      </Container>
    </>
  )
}

export default NostrPost
