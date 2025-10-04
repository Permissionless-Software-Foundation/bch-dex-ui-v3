/*
This component renders as a button. When clicked, it opens a modal to send a sell form .
*/

// Global npm libraries
import React, { useState, useEffect } from 'react'
import { Button, Modal, Container, Row, Col, Form, Spinner } from 'react-bootstrap'
import axios from 'axios'

function SellButton ({ token, appData, refreshTokens }) {
  const [show, setShow] = useState(false)
  const [sellQty, setSellQty] = useState('1')
  const [pricePerToken, setPricePerToken] = useState('0.01')
  const [statusMsg, setStatusMsg] = useState('')
  const [hideSpinner, setHideSpinner] = useState(true)
  const [denyClose, setDenyClose] = useState(false)
  const [shouldRefreshOnModalClose, setShouldRefreshOnModalClose] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [noteId, setNoteId] = useState('')

  const handleClose = () => {
    if (denyClose) return
    if (shouldRefreshOnModalClose) {
      refreshTokens()
    }
    setShow(false)
  }
  const handleOpen = () => setShow(true)

  useEffect(() => {
    resetState()
  }, [show])

  const resetState = () => {
    setSellQty('1')
    setPricePerToken('0.01')
    setStatusMsg('')
    setHideSpinner(true)
    setDenyClose(false)
    setShouldRefreshOnModalClose(false)
    setOrderSuccess(false)
    setNoteId('')
  }

  const handleSell = async () => {
    console.log('Sell button clicked.')

    try {
      setStatusMsg(<p>Preparing to sell tokens...</p>)
      setHideSpinner(false)
      setDenyClose(true)
      setShouldRefreshOnModalClose(false)

      // Validate the quantity input
      const qty = parseFloat(sellQty)
      if (isNaN(qty) || qty <= 0) throw new Error('Invalid sell quantity')

      if (qty > token.qty) {
        throw new Error('Sell quantity is greater than your current balance.')
      }

      const bchSpotPrice = appData.bchWalletState.bchUsdPrice
      console.log('BCH spot price: ', bchSpotPrice)

      // Validate the price-per-token input
      const pricePerTokenFloat = parseFloat(pricePerToken)
      if (isNaN(pricePerTokenFloat) || pricePerTokenFloat <= 0) {
        throw new Error('Invalid price per token')
      }

      // Calculate the other fields
      const bchjs = appData.wallet.bchjs
      const bchPerToken = bchjs.Util.floor8(pricePerTokenFloat / bchSpotPrice)
      // console.log('bchPerToken: ', bchPerToken)
      const satsPerToken = bchjs.BitcoinCash.toSatoshi(bchPerToken)
      // console.log('satsPerToken: ', satsPerToken)

      // Construct order object
      const order = {
        lokadId: 'SWP',
        messageType: 1,
        messageClass: 1,
        tokenId: token.tokenId,
        buyOrSell: 'sell',
        rateInBaseUnit: satsPerToken,
        minUnitsToExchange: Math.ceil(satsPerToken * qty),
        numTokens: qty
      }

      await bchjs.Util.sleep(3000)
      console.log('order', order)

      setStatusMsg(<p>Submitting order to bch-dex API (this can take a few minutes)...</p>)

      const userData = appData.userData

      console.log('appData.dexServerUrl: ', appData.dexServerUrl)

      const options = {
        method: 'post',
        headers: {
          Authorization: `Bearer ${userData.token}`
        },
        url: `${appData.dexServerUrl}/order`,
        data: { order }
      }
      // console.log('options', options)
      const result = await axios(options)
      // console.log('result', result.data)
      const { eventId, noteId } = result.data
      setNoteId(noteId)

      console.log(`Order uploaded to Nostr with this event ID: ${eventId}`)
      console.log(`https://astral.psfoundation.info/${noteId}`)

      setStatusMsg('')
      setHideSpinner(true)
      setSellQty('')
      setPricePerToken('')
      setShouldRefreshOnModalClose(true)
      setDenyClose(false)
      setOrderSuccess(true)
    } catch (err) {
      console.error('Error in handleSell(): ', err)
      setStatusMsg(<p style={{ color: 'red' }}><b>Error!</b> Error selling tokens: {err.message}</p>)
      setHideSpinner(true)
      setDenyClose(false)
    }
  }

  return (
    <>
      <Button variant='success' onClick={handleOpen}>Sell</Button>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Token Information</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {hideSpinner && (
            <Container>
              <Row>
                <Col xs={4}><b>Ticker</b>:</Col>
                <Col xs={8}>{token.ticker}</Col>
              </Row>

              <Row style={{ backgroundColor: '#eee' }}>
                <Col xs={4}><b>Name</b>:</Col>
                <Col xs={8}>{token.name}</Col>
              </Row>

              <Row>
                <Col xs={4}><b>Token ID</b>:</Col>
                <Col xs={8} style={{ wordBreak: 'break-all' }}>{token.tokenId}</Col>
              </Row>

              <Row style={{ backgroundColor: '#eee' }}>
                <Col xs={4}><b>Balance</b>:</Col>
                <Col xs={8}>{token.qty}</Col>
              </Row>
              <br />

              <Row>
                <Col xs={4}><b>Sell Qty</b>:</Col>
                <Col xs={8}>
                  <Form>
                    <Form.Group controlId='sellQty'>
                      <Form.Control
                        type='text'
                        placeholder='1'
                        onChange={e => setSellQty(e.target.value)}
                        value={sellQty}
                      />
                    </Form.Group>
                  </Form>
                </Col>
              </Row>
              <br />

              <Row>
                <Col xs={4}><b>Price per Token (USD)</b>:</Col>
                <Col xs={8}>
                  <Form>
                    <Form.Group controlId='pricePerToken'>
                      <Form.Control
                        type='text'
                        placeholder='0.01'
                        onChange={e => setPricePerToken(e.target.value)}
                        value={pricePerToken}
                      />
                    </Form.Group>
                  </Form>
                </Col>
              </Row>
              <br />

              {!orderSuccess && (
                <Row>
                  <Col style={{ textAlign: 'center' }}>
                    <Button onClick={handleSell} variant='success' style={{ minWidth: '100px' }}>Sell</Button>
                  </Col>
                </Row>
              )}
              {orderSuccess && (
                <>
                  <p>
                    Note ID:
                    <a
                      href={`https://astral.psfoundation.info/${noteId}`}
                      target='_blank'
                      rel='noreferrer'
                      style={{ wordBreak: 'break-all' }}
                    >
                      {' '}
                      {noteId}
                    </a>
                  </p>
                </>
              )}
              <br />
            </Container>
          )}
          <Row>
            <Col style={{ textAlign: 'center' }}>
              {statusMsg}
            </Col>
          </Row>
          {!hideSpinner && (
            <Container>
              <Row>
                <Col style={{ textAlign: 'center' }}>
                  <br /><Spinner animation='border' className='mt-2' />
                </Col>
              </Row>
            </Container>)}
        </Modal.Body>
        <Modal.Footer />
      </Modal>
    </>
  )
}

export default SellButton
