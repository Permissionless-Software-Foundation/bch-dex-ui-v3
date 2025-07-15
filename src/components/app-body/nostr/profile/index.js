/*
Component for read nostr information.
*/

// Global npm libraries
import React, { useState } from 'react'
import { Container } from 'react-bootstrap'
import ProfileRead from './profile-read.js'
import PublicRead from './public-read.js'
import { useParams } from 'react-router-dom'
import SlpTokensDisplay from './slp-tokens-display'

function Profile (props) {
  const [profile, setProfile] = useState(false)
  const { npub } = useParams()
  console.log('npub', npub)
  return (
    <>
      <Container>
        <ProfileRead {...props} setProfile={setProfile} npub={npub} />
        <PublicRead {...props} profile={profile} npub={npub} />
        <SlpTokensDisplay {...props} npub={npub} />
      </Container>
    </>
  )
}

export default Profile
