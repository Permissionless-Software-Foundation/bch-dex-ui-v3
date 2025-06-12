/*
  Shows NFTs for sale on the DEX.

   workflow:
   1. Load offers
   2. Display token cards with current Offer data
   3. Load tokens data
   4. Add data to offers and update card with new data
   5. Load tokens icons
   6. Add icons to offers and update card with new icons
*/

// Global npm libraries
import React, { useState, useEffect, useCallback } from 'react'
import { Container, Row, Col, Button, Spinner } from 'react-bootstrap'
import axios from 'axios'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRedo } from '@fortawesome/free-solid-svg-icons'

// Local libraries
import config from '../../../config'
import TokenCard from './token-card'

// Global variables and constants
const SERVER = config.dexServer

function NftsForSale (props) {
  // Dependency injection through props
  const appData = props.appData

  const [offers, setOffers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [offersAreLoaded, setOffersAreLoaded] = useState(false)
  const [iconsAreLoaded, setIconsAreLoaded] = useState(false)
  const [dataAreLoaded, setDataAreLoaded] = useState(false)

  // Handler for refresh button
  const handleRefresh = () => {
    console.log('handling refresh')
    loadNftOffers()
  }

  // Function to process token data
  const processTokenData = useCallback(async (offer) => {
    try {
      const { wallet, bchWalletState } = appData
      const { bchjs } = wallet

      // Calculate USD price
      const rateInSats = parseInt(offer.rateInBaseUnit)
      const bchCost = bchjs.BitcoinCash.toBitcoinCash(rateInSats)
      const usdPrice = bchCost * bchWalletState.bchUsdPrice * offer.numTokens
      offer.usdPrice = `$${usdPrice.toFixed(3)}`

      return offer
    } catch (err) {
      console.error('Error processing token:', err)
      return offer
    }
  }, [appData])

  //  Fetch offers
  const getNftOffers = useCallback(async (page = 0) => {
    try {
      setOffersAreLoaded(false)

      const result = await axios.get(`${SERVER}/offer/list/nft/${page}`)
      const rawOffers = result.data
      console.log('rawOffers: ', rawOffers)

      // Process each offer
      const processedOffers = []
      for (let i = 0; i < rawOffers.length; i++) {
        const offer = rawOffers[i]
        const processedOffer = await processTokenData(offer)
        processedOffers.push(processedOffer)
      }

      setOffersAreLoaded(true)

      return processedOffers
    } catch (err) {
      console.error('getNftOffers error:', err)
      setOffersAreLoaded(true)
      throw err
    }
  }, [processTokenData])

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
          thisToken.tokenData.userData = userData
        }

        // Mark token to prevent fetch token icon again.
        thisToken.iconAlreadyDownloaded = true
      }

      setIconsAreLoaded(true)
    } catch (error) {
      setIconsAreLoaded(true)
    }
  }, [fetchTokenMutableData, appData])

  //  Check if token data exists in the cache and add it to the tokens object.
  const reviewNftCachedData = useCallback(async (offers) => {
    const cacheData = appData.nftForSaleCacheData
    console.log(`Token data from cache: ${JSON.stringify(cacheData, null, 2)}`)
    // Map all offers
    for (let i = 0; i < offers.length; i++) {
      const thisToken = offers[i]
      const cacheToken = cacheData[thisToken.tokenId]
      // If cache data exists, add it to the token object
      if (cacheToken) {
        thisToken.tokenData = cacheToken.tokenData
        thisToken.icon = cacheToken.tokenIcon
      }
    }
  }, [appData])

  //  Check if token data exists in the cache and add it to the tokens object.
  const updateNFTCachedData = useCallback(async (offers) => {
    // Map all offers
    for (let i = 0; i < offers.length; i++) {
      const thisToken = offers[i]
      // save token icon and token data in cache
      const newTokenCacheData = {
        tokenIcon: thisToken.icon,
        tokenData: thisToken.tokenData
      }

      console.log('newTokenCacheData: ', newTokenCacheData)
      appData.updateNFTCachedData(thisToken.tokenId, newTokenCacheData)
    }
  }, [appData])

  // Main function to load NFT offers
  const loadNftOffers = useCallback(async () => {
    try {
      setIsLoading(true)
      // Get tokens in offers
      const offers = await getNftOffers()
      console.log('offers: ', offers)
      // Review cached data to populate token data from cached data
      await reviewNftCachedData(offers)
      // set state to start displaying tokens cards.
      setOffers(offers)
      // Load tokens data for any updates to the token data
      await lazyLoadTokenData(offers)
      // Load tokens icons from mutable data
      await lazyLoadMutableData(offers)

      //  Update cached data with the latest retrieved data
      await updateNFTCachedData(offers)
      setIsLoading(false)
    } catch (err) {
      setIsLoading(false)
      console.error('Error loading NFT offers:', err)
    }
  }, [lazyLoadTokenData, lazyLoadMutableData, getNftOffers, reviewNftCachedData, updateNFTCachedData])

  // Effect to load NFTs on component mount
  useEffect(() => {
    console.log('loading nfts for sale')
    loadNftOffers()
  }, [loadNftOffers])

  // Get Cid from url
  const parseCid = (url) => {
    // get the cid from the url format 'ipfs://bafybeicem27xbzs65uvbcgykcmscsgln3lmhbfrcoec3gdttkdgtxv5acq
    if (url && url.includes('ipfs://')) {
      const cid = url.split('ipfs://')[1]
      return cid
    }
    return url
  }

  // This function generates a Token Card for each token in the wallet.
  function generateCards (offers) {
    console.log('generateCards() offerData: ', offers)

    const tokens = offers

    const tokenCards = []

    for (let i = 0; i < tokens.length; i++) {
      const thisToken = tokens[i]

      const thisTokenCard = (
        <TokenCard
          appData={appData}
          token={thisToken}
          handleRefresh={handleRefresh}
          key={`${thisToken.tokenId + i}`}
        />
      )
      tokenCards.push(thisTokenCard)
    }

    return tokenCards
  }

  return (
    <Container>
      <Row>
        <Col>
          <h1>NFTs for Sale</h1>
        </Col>
      </Row>
      <Row>
        <Col xs={12} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {/** Show spinner info if tokens are loaded but data is not loaded */
            offersAreLoaded && !dataAreLoaded && (
              <div style={{ borderRadius: '10px', backgroundColor: '#f0f0f0', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'fit-content' }}>
                <span style={{ marginRight: '10px' }}>Loading Token Data </span>
                <Spinner animation='border' />
              </div>
            )
          }
          {/** Show spinner info if tokens are loaded but icons are not loaded */
            dataAreLoaded && !iconsAreLoaded && (
              <div style={{ borderRadius: '10px', backgroundColor: '#f0f0f0', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'fit-content' }}>
                <span style={{ marginRight: '10px' }}>Loading Token Icons </span>
                <Spinner animation='border' />
              </div>
            )
          }

        </Col>
      </Row>

      {!isLoading && (
        <Row>
          <Col xs={6}>
            <Button variant='success' onClick={handleRefresh}>
              <FontAwesomeIcon icon={faRedo} size='lg' /> Refresh
            </Button>
          </Col>
        </Row>
      )}

      {!offersAreLoaded && (
        <Row className='d-block text-center'>
          <Spinner animation='border' variant='primary' style={{ maegin: '0 auto' }} />
        </Row>
      )}
      <Row>
        {offersAreLoaded && generateCards(offers)}
      </Row>

      {/** Display a message if no tokens are found */}
      {offersAreLoaded && offers.length === 0 && (
        <Row className='text-center'>
          <span> No Offers found. </span>
        </Row>
      )}
    </Container>
  )
}

export default NftsForSale
