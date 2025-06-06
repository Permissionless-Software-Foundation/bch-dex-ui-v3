/*
Component for read nostr information.
*/

// Global npm libraries
import React, { useState } from 'react'
import { Container } from 'react-bootstrap'
import ProfileRead from './profile-read.js'
import PublicRead from './public-read.js'

function NostrRead (props) {
  const [profile, setProfile] = useState(false)
  return (
    <>
      <Container>
        <ProfileRead {...props} setProfile={setProfile} />
        <PublicRead {...props} profile={profile} />
      </Container>
    </>
  )
}

export default NostrRead
