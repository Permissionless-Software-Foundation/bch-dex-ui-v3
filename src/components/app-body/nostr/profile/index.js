/*
Component for read nostr information.
*/

// Global npm libraries
import React, { useState, useCallback, useEffect } from 'react'
import config from '../../../../config/index.js'
import { Container } from 'react-bootstrap'
import ProfileRead from './profile-read.js'
import PublicRead from './public-read.js'
import { useParams } from 'react-router-dom'
import SlpTokensDisplay from './slp-tokens-display'
import NFTForSale from './nft-for-sale.js'
import axios from 'axios'

function Profile (props) {
  const { wallet, bchWalletState } = props.appData
  const { nostrKeyPair } = bchWalletState
  const [profile, setProfile] = useState(false)
  const [profileAddresses, setProfileAddresses] = useState(null)
  const { npub } = useParams()

  const getAddressByNpub = useCallback(async () => {
    try {
      // Validate if provided npub match with user npub
      if (npub === nostrKeyPair.npub) {
        // Use user addresses
        setProfileAddresses({
          bchAddr: bchWalletState.cashAddress,
          slpAddr: bchWalletState.slpAddress
        })
        return
      }

      // Fetch addresses for external npub.
      const url = `${config.dexServer}/sm/npub/${npub}`
      const response = await axios.get(url)
      const bchAddr = response.data.bchAddr
      const slpAddr = wallet.bchjs.SLP.Address.toSLPAddress(bchAddr)
      setProfileAddresses({ bchAddr, slpAddr })
    } catch (error) {
      console.error(error)
    }
  }, [npub, wallet, nostrKeyPair, bchWalletState])

  useEffect(() => {
    getAddressByNpub()
  }, [getAddressByNpub])
  return (
    <>
      <Container>
        <ProfileRead {...props} onProfileRead={setProfile} npub={npub} profileAddresses={profileAddresses} />
        <PublicRead {...props} profile={profile} npub={npub} profileAddresses={profileAddresses} />
        <SlpTokensDisplay {...props} npub={npub} profileAddresses={profileAddresses} />
        {profileAddresses && <NFTForSale {...props} npub={npub} profileAddresses={profileAddresses} />}
      </Container>
    </>
  )
}

export default Profile
