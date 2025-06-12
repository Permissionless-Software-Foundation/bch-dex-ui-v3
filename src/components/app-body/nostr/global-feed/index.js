/*
Component for reading the nostr global feed.
*/

// Global npm libraries
import React from 'react'
import { Container } from 'react-bootstrap'
import Feed from './feed'

function GlobalFeed (props) {
  const { appData } = props

  return (
    <>
      <Container>
        <h2 style={{
          textAlign: 'center',
          margin: '20px 0 50px 0',
          padding: '10px',
          borderBottom: '2px solid #ccc'
        }}
        >
          Global Feed
        </h2>
        <Feed appData={appData} />
      </Container>
    </>
  )
}

export default GlobalFeed
