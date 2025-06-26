/*
  This React components downloads the active Offers from the REST API and
  displays them in a data table.
*/

// Global npm libraries
import React, { useState, useEffect, useCallback } from 'react'
import { Container, Row, Col, Table, Button, Spinner } from 'react-bootstrap'
import axios from 'axios'
import { DatatableWrapper, TableBody, TableHeader } from 'react-bs-datatable'

// Local libraries
import config from '../../../config'
import WaitingModal from '../../waiting-modal'

// Global variables and constants
const SERVER = `${config.dexServer}/`

const TABLE_HEADERS = [
  {
    prop: 'ticker',
    title: 'Ticker',
    isFilterable: true
  },
  {
    prop: 'tokenId',
    title: 'Token ID'
  },
  {
    prop: 'buyOrSell',
    title: 'Type'
  },
  {
    prop: 'smallNostrEventId',
    title: 'Event ID'
  },
  {
    prop: 'numTokens',
    title: 'Quantity'
  },
  {
    prop: 'usdPrice',
    title: 'Price (USD)'
  },
  {
    prop: 'button',
    title: 'Action'
  }
]

function Offers (props) {
  const [appData] = useState(props.appData)
  const [offers, setOffers] = useState([])

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [modalBody, setModalBody] = useState([])
  const [hideSpinner, setHideSpinner] = useState(false)
  const [denyClose, setDenyClose] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Given a large string, it will return a string with the first and last
  // four characters.
  const cutString = (str) => {
    try {
      const subTxid = str.slice(0, 4)
      const subTxid2 = str.slice(-4)
      return `${subTxid}...${subTxid2}`
    } catch (err) {
      console.warn('Error in cutString() ', err)
    }
  }

  // REST request to get data from avax-dex
  const getOffers = async () => {
    try {
      const options = {
        method: 'GET',
        url: `${SERVER}offer/list/fungible/0`,
        data: {}
      }
      const result = await axios.request(options)
      return result.data
    } catch (err) {
      console.warn('Error in getOffers() ', err)
    }
  }
  const handleBuy = useCallback(async (event) => {
    try {
      console.log('Buy button clicked. Event: ', event)

      const targetOfferEventId = event.target.id
      console.log('targetOfferEventId: ', targetOfferEventId)

      // Initialize modal
      setShowModal(true)
      setModalBody(['Generating Counter Offer...', '(This can take a couple minutes)'])
      setHideSpinner(false)
      setDenyClose(true)

      // Generate a counter offer.
      const bchDexLib = appData.dexLib
      const { offerData, partialHex } = await bchDexLib.take.takeOffer(
        targetOfferEventId
      )

      // Upload the counter offer to Nostr.
      const nostr = appData.nostr
      const { eventId, noteId } = await nostr.testNostrUpload({
        offerData,
        partialHex
      })

      console.log('eventId: ', eventId)
      console.log('noteId: ', noteId)

      // update output modal
      const newModalBody = []
      newModalBody.push('Success!')
      newModalBody.push('What happens next:')
      newModalBody.push('The money has not yet left your wallet! It is still under your control.')
      newModalBody.push('If the sellers node is online, they will accept the Counter Offer you just generated in a few minutes.')
      newModalBody.push('If the tokens never show up, you can sweep the funds back into your wallet.')

      setModalBody(newModalBody)
      setHideSpinner(true)
      setDenyClose(false)
    } catch (error) {
      console.warn('Error in handleBuy() ', error)
      setModalBody(['Buy failed: ', error.message])
      setHideSpinner(true)
      setDenyClose(false)
    }
  }, [appData]) // Dependencies: appData since it's used inside the callback

  // Get Offer data and manipulate it for the sake of presentation.
  const handleOffers = useCallback(async () => {
    setIsLoading(true)
    // Get raw offer data.
    const offerRawData = await getOffers()
    console.log('offerRawData: ', offerRawData)
    if (!offerRawData || offerRawData.length === 0) {
      setIsLoading(false)
      setOffers([])
      return
    }
    // Formatted Data
    const formattedOffers = []

    for (let i = 0; i < offerRawData.length; i++) {
      const thisOffer = offerRawData[i]

      // Get and format the token ID
      const tokenId = thisOffer.tokenId
      const smallTokenId = cutString(tokenId)
      thisOffer.tokenId = (<a href={`https://token.fullstack.cash/?tokenid=${tokenId}`} target='_blank' rel='noreferrer'>{smallTokenId}</a>)

      // Get and format the P2WDB ID
      const nostrEventId = thisOffer.nostrEventId
      const smallNostrEventId = cutString(nostrEventId)
      thisOffer.smallNostrEventId = smallNostrEventId
      thisOffer.button = (<Button text='Buy' variant='success' size='lg' id={nostrEventId} onClick={handleBuy}>Buy</Button>)

      // thisOffer.p2wdbHash = (<a href={`https://p2wdb.fullstack.cash/entry/hash/${p2wdbHash}`} target='_blank' rel='noreferrer'>{smallP2wdbHash}</a>)

      // Convert sats to BCH, and then calculate cost in USD.
      const bchjs = appData.wallet.bchjs
      const rateInSats = parseInt(thisOffer.rateInBaseUnit)
      const bchCost = bchjs.BitcoinCash.toBitcoinCash(rateInSats)
      const usdPrice = bchCost * appData.bchWalletState.bchUsdPrice
      const priceStr = `$${usdPrice.toFixed(3)}`
      thisOffer.usdPrice = priceStr

      formattedOffers.push(thisOffer)
    }

    setOffers(formattedOffers)
    setIsLoading(false)
  }, [appData, handleBuy])

  useEffect(() => {
    // Retrieve initial offer data
    handleOffers()

    // Get data and update the table periodically.
    const interval = setInterval(() => {
      handleOffers()
    }, 30000)

    // Cleanup interval on component unmount
    return () => clearInterval(interval)
  }, [handleOffers]) // Empty dependency array means this effect runs once on mount

  const heading = 'Generating Counter Offer...'

  return (
    <>
      {showModal && (
        <WaitingModal
          heading={heading}
          body={modalBody}
          hideSpinner={hideSpinner}
          denyClose={denyClose}
        />
      )}
      <Container>
        <Row>
          <Col className='text-break' style={{ textAlign: 'center' }}>
            {!isLoading && (
              <DatatableWrapper body={offers} headers={TABLE_HEADERS}>
                <Table>
                  <TableHeader />
                  <TableBody />
                </Table>
              </DatatableWrapper>
            )}
          </Col>
        </Row>
        {isLoading && (
          <Row>
            <Col className='text-break' style={{ textAlign: 'center' }}>
              <Spinner animation='border' />
            </Col>
          </Row>
        )}
      </Container>
    </>
  )
}

export default Offers
