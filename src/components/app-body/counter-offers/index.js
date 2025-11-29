/*
  This component displays the counter offers for the current wallet.
*/

// Global npm libraries
import React, { useState, useEffect, useCallback } from 'react'
import { Container, Row, Col, Spinner, Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import CounterOfferCard from './counter-offer-card'
import AsyncLoad from '../../../services/async-load'
import { faRedo } from '@fortawesome/free-solid-svg-icons'
// Local libraries

const CounterOffers = (props) => {
  const { appData } = props
  const [iconsAreLoaded, setIconsAreLoaded] = useState(false)
  const [dataAreLoaded, setDataAreLoaded] = useState(false)
  const [counterOffers, setCounterOffers] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Get Cid from url
  const parseCid = (url) => {
    // get the cid from the url format 'ipfs://bafybeicem27xbzs65uvbcgykcmscsgln3lmhbfrcoec3gdttkdgtxv5acq
    if (url && url.includes('ipfs://')) {
      const cid = url.split('ipfs://')[1]
      return cid
    }
    return url
  }

  //  This function loads the token data .
  const lazyLoadTokenData = useCallback(async (tokens) => {
    try {
      setDataAreLoaded(false)
      // map each token and fetch the token data
      for (let i = 0; i < tokens.length; i++) {
        const thisToken = tokens[i]

        // data does not  need to be downloaded, so continue with the next one
        if (thisToken.dataAlreadyDownloaded) continue

        // Try to get token data.
        const tokenData = await appData.wallet.getTokenData(thisToken.tokenId)
        console.log('tokenData', tokenData)
        if (tokenData) {
          // Set data to the token object , this can be used to display the token name in the token card component.
          thisToken.tokenData = tokenData
          thisToken.tokenId = tokenData.genesisData.tokenId
          thisToken.ticker = tokenData.genesisData.ticker
          thisToken.name = tokenData.genesisData.name
          thisToken.decimals = tokenData.genesisData.decimals
          thisToken.tokenType = tokenData.genesisData.type
          thisToken.url = tokenData.genesisData.documentUri
        }

        // Mark token to prevent fetch token data again.
        thisToken.dataAlreadyDownloaded = true
      }

      setDataAreLoaded(true)
    } catch (error) {
      setDataAreLoaded(true)
    }
  }, [appData])

  // Fetch mutable data if it exist and get the token icon url
  const fetchTokenMutableData = useCallback(async (token) => {
    try {
      // Get the token data
      const tokenData = token.tokenData

      if (!tokenData.mutableData) return false // Return false if no mutable data

      // Get the token icon from the mutable data
      const cid = parseCid(tokenData.mutableData)
      console.log('mutable data cid', cid)

      const { json } = await appData.wallet.cid2json({ cid })
      console.log('json: ', json)
      if (!json) return false

      let iconUrl = json.tokenIcon

      if (json.fullSizedUrl && json.fullSizedUrl.includes('http')) {
        iconUrl = json.fullSizedUrl
      }
      const userData = json.userData
      // Return icon url
      return { iconUrl, userData }
    } catch (error) {
      return false
    }
  }, [appData])

  //  This function loads the token icons from the ipfs gateways.
  const lazyLoadMutableData = useCallback(async (tokens) => {
    try {
      setIconsAreLoaded(false)
      // map each token and fetch the icon url
      for (let i = 0; i < tokens.length; i++) {
        const thisToken = tokens[i]

        // Incon does not  need to be downloaded, so continue with the next one
        if (thisToken.iconAlreadyDownloaded) continue

        // Try to get token icon url from mutable data.
        const { iconUrl, userData } = await fetchTokenMutableData(thisToken)
        console.log('iconUrl', iconUrl)
        if (iconUrl) {
          // Set the icon url to the token , this can be used to display the icon in the token card component.
          thisToken.icon = iconUrl
          thisToken.userData = userData
        }

        // Mark token to prevent fetch token icon again.
        thisToken.iconAlreadyDownloaded = true
      }

      setIconsAreLoaded(true)
    } catch (error) {
      setIconsAreLoaded(true)
    }
  }, [fetchTokenMutableData])

  // Load the counter offers for the current wallet.
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setCounterOffers([])
      // Get the wallet state and server url from the app data.
      const { bchWalletState, serverUrl } = appData
      // Create a new AsyncLoad instance.
      const asyncLoad = new AsyncLoad()
      // Load the wallet library.
      await asyncLoad.loadWalletLib()
      // Get the counter offer derivated wallet
      const counterOfferWallet = await asyncLoad.getDerivatedWallet(serverUrl, bchWalletState.mnemonic, "m/44'/245'/0'/0/1")
      // Get the utxos from the counter offer wallet.
      const utxos = await counterOfferWallet.getUtxos()
      const bchUtxos = utxos.bchUtxos
      // Get the counter offers data for the current wallet address.
      const { counterOffers } = await asyncLoad.getCounterOffersByAddress(bchWalletState.cashAddress)
      // Filter the counter offers to only include the ones that are in the utxos.
      const filteredCounterOffers = counterOffers.filter(val =>
        bchUtxos.some(utxo => utxo.txid === val.counterOfferUtxo)
      )

      setCounterOffers(filteredCounterOffers)
      setIsLoading(false)
      // Load the token data for the counter offers in background.
      await lazyLoadTokenData(filteredCounterOffers)
      // Load the token icons for the counter offers in background.
      await lazyLoadMutableData(filteredCounterOffers)
    } catch (error) {
      setIsLoading(false)
      console.error('Error loading counter offers:', error)
    }
  }, [appData, lazyLoadTokenData, lazyLoadMutableData])

  // Start to load the token icons when the component is mounted
  useEffect(() => {
    loadData()
  }, [loadData])

  // Handler for refresh button
  const handleRefresh = useCallback(() => {
    loadData()
  }, [loadData])
  // Generate the token cards for each token in the wallet.
  const generateCards = () => {
    return counterOffers.map(thisCounterOffer => (
      <CounterOfferCard
        appData={appData}
        token={thisCounterOffer}
        key={`${thisCounterOffer.id}`}
        refreshTokens={loadData}
      />
    ))
  }

  return (
    <>
      <Container>
        <Row>
          <Col xs={6} style={{ textAlign: 'start' }}>
            {!isLoading && (
              <Row>
                <Col xs={6}>
                  <Button variant='success' onClick={handleRefresh}>
                    <FontAwesomeIcon icon={faRedo} size='lg' /> Refresh
                  </Button>
                </Col>
              </Row>
            )}
          </Col>
        </Row>
        <Row>
          {appData.asyncInitSucceeded && (

            <Col xs={12} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {/** Show spinner info if tokens are loaded but data is not loaded */
                isLoading && (
                  <div style={{ borderRadius: '10px', backgroundColor: '#f0f0f0', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'fit-content' }}>
                    <span style={{ marginRight: '10px' }}>Loading Counter Offers </span>
                    <Spinner animation='border' />
                  </div>
                )
              }
              {/** Show spinner info if tokens are loaded but data is not loaded */
                !isLoading && !dataAreLoaded && counterOffers.length > 0 && (
                  <div style={{ borderRadius: '10px', backgroundColor: '#f0f0f0', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'fit-content' }}>
                    <span style={{ marginRight: '10px' }}>Loading Token Data </span>
                    <Spinner animation='border' />
                  </div>
                )
              }
              {/** Show spinner info if tokens are loaded but icons are not loaded */
                !isLoading && dataAreLoaded && !iconsAreLoaded && (
                  <div style={{ borderRadius: '10px', backgroundColor: '#f0f0f0', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'fit-content' }}>
                    <span style={{ marginRight: '10px' }}>Loading Token Icons </span>
                    <Spinner animation='border' />
                  </div>
                )
              }

            </Col>
          )}
        </Row>
        <br />

        <Row>
          {generateCards()}
        </Row>
        {/** Display a message if no tokens are found */}
        {!isLoading && counterOffers.length === 0 && (
          <Row className='text-center'>
            <span> No tokens found in wallet </span>
          </Row>
        )}

      </Container>
    </>
  )
}

export default CounterOffers
