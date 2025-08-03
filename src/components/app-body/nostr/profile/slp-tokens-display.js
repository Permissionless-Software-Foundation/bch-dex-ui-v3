/**
 * Component for displaying SLP tokens in a grid layout
 */
import React, { useState, useEffect, useCallback } from 'react'
import { Container, Row, Col, Spinner } from 'react-bootstrap'
import config from '../../../../config'
import axios from 'axios'
import TokenCard from '../../slp-tokens/token-card'

function SlpTokensDisplay (props) {
  const { appData } = props
  const { bchWalletState, wallet } = props.appData
  const { npub } = props
  const [loaded, setLoaded] = useState(false)
  const [tokens, setTokens] = useState([])
  const [iconsAreLoaded, setIconsAreLoaded] = useState(false)

  // Get Cid from url
  const parseCid = (url) => {
    // get the cid from the url format 'ipfs://bafybeicem27xbzs65uvbcgykcmscsgln3lmhbfrcoec3gdttkdgtxv5acq
    if (url && url.includes('ipfs://')) {
      const cid = url.split('ipfs://')[1]
      return cid
    }
    return url
  }

  // Fetch mutable data if it exist and get the token icon url
  const fetchTokenIcon = useCallback(async (token) => {
    try {
      // Get the token data
      const tokenData = await appData.wallet.getTokenData(token.tokenId)
      if (!tokenData.mutableData) return false // Return false if no mutable data
      // Get the token icon from the mutable data
      const cid = parseCid(tokenData.mutableData)
      console.log('mutable data cid', cid)

      const { json } = await appData.wallet.cid2json({ cid })

      if (!json) return false

      const iconUrl = json.tokenIcon
      // Return icon url
      return iconUrl
    } catch (error) {
      return false
    }
  }, [appData])

  //  This function loads the token icons from the ipfs gateways.
  const lazyLoadTokenIcons = useCallback(async (tokenList) => {
    try {
      setIconsAreLoaded(false)

      // map each token and fetch the icon url
      for (let i = 0; i < tokenList.length; i++) {
        try {
          const thisToken = tokenList[i]

          // Incon does not  need to be downloaded, so continue with the next one
          if (thisToken.iconAlreadyDownloaded) continue

          // Try to get token icon url from mutable data.
          const iconUrl = await fetchTokenIcon(thisToken)
          console.log('iconUrl', iconUrl)
          if (iconUrl) {
            // Set the icon url to the token , this can be used to display the icon in the token card component.
            thisToken.icon = iconUrl
          }

          // Mark token to prevent fetch token icon again.
          thisToken.iconAlreadyDownloaded = true
          // replace the token in the tokens array
          const updatedTokens = [...tokenList]
          updatedTokens[i] = thisToken
          setTokens(updatedTokens)
        } catch (error) {
          continue
        }
      }

      setIconsAreLoaded(true)
    } catch (error) {
      console.warn(error)
      setIconsAreLoaded(true)
    }
  }, [fetchTokenIcon, setTokens])

  useEffect(() => {
    // setTokens(bchWalletState.slpTokens || [])
    const getTokens = async () => {
      try {
        const { nostrKeyPair } = bchWalletState
        if (nostrKeyPair?.npub === npub) {
          setTokens(bchWalletState.slpTokens)
          setLoaded(true)
          return
        }
        setLoaded(false)
        const url = `${config.dexServer}/sm/npub/${npub}`
        const response = await axios.get(url)
        console.log('response', response.data)
        const addr = response.data.bchAddr

        const tokenList = await wallet.listTokens(addr)
        setTokens(tokenList)
        // setTokens(response.data)
        setLoaded(true)

        lazyLoadTokenIcons(tokenList)
      } catch (error) {
        console.error('Error fetching tokens:', error)
        setLoaded(true)
      }
    }
    if (!loaded) {
      getTokens()
    }
  }, [bchWalletState, npub, loaded, lazyLoadTokenIcons, wallet])

  return (
    <Container>
      {!loaded && (
        <div className='d-flex justify-content-center align-items-center h-100 mb-4'>
          <Spinner />
        </div>
      )}
      {loaded && tokens.length !== 0 &&
        <div className='bg-white rounded-1 shadow-sm border mb-4'>
          <div className='p-3 border-bottom bg-light rounded-top-4'>
            <h5 className='mb-0 fw-bold text-dark'>SLP Tokens</h5>
          </div>
          <div
            className='p-3'
            style={{
              height: '800px',
              overflowY: 'auto',
              maxHeight: '800px'
            }}
          >
            <Row>
              {!iconsAreLoaded &&
                <Col xs={12} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ borderRadius: '10px', backgroundColor: '#f0f0f0', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'fit-content' }}>
                    <span style={{ marginRight: '10px' }}>Loading Token Icons </span>
                    <Spinner animation='border' />
                  </div>

                </Col>}

              {tokens.map(thisToken => (
                <TokenCard
                  appData={appData}
                  token={thisToken}
                  key={`${thisToken.tokenId}`}
                  refreshTokens={() => { }}
                  hideSendBtn
                />
              ))}

            </Row>

          </div>
        </div>}
    </Container>
  )
}

export default SlpTokensDisplay
