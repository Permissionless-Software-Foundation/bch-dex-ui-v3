/*
  This component renders as a button. When clicked, it initiates the
  purchase of the token. This is the Signal part of the SWaP protocol.
*/

// Global npm libraries
import React, { useState } from 'react'
import { Button, Modal, Container, Row, Col, Spinner } from 'react-bootstrap'
import AsyncLoad from '../../../services/async-load'

function BuyButton (props) {
  const { token, appData, onSuccess } = props
  console.log('props: ', props)
  const [show, setShow] = useState(false) // show the modal
  const [onFetch, setOnFetch] = useState(false) // show the spinner
  const [error, setError] = useState(false) // show the error message
  // const [eventId, setEventId] = useState(false) // show the event id
  const [noteId, setNoteId] = useState(false) // show the note id
  const [success, setSuccess] = useState(false) // show the success message
  const [showConfirmation, setShowConfirmation] = useState(true) // show the confirmation view
  const [progressMsg, setProgressMsg] = useState([]) // show the progress message

  // Handler for when user clicks the "Buy" button.
  const handleBuy = async () => {
    try {
      console.log('handleBuy()')
      console.log('token: ', token)
      console.log('appData: ', appData)
      setShowConfirmation(false)
      setOnFetch(true)

      /*        // dev-test success view
             setShowConfirmation(false)
             setSuccess(true)
             setNoteId('note12986q83gre76vl9dldpnnhej7y67h76xzw0tx0hm4mq6uradr6lskch7v9')
             setOnFetch(false)
             return
         */

      const progress = progressMsg
      progress.push(<p key='progress-msg1'>Generating counter offer transaction...</p>)
      setProgressMsg(progress)

      const targetOffer = token.nostrEventId
      console.log('targetOffer: ', targetOffer)

      // Generate a counter offer.
      const bchDexLib = appData.dexLib
      const { offerData, partialHex, counterOfferUtxo } = await bchDexLib.take.takeOffer(
        targetOffer
      )

      // Get counter offer data
      const asyncLoad = new AsyncLoad()
      const { takerAddr, takerNpub, counterOfferAddr } = await asyncLoad.getCounterOfferMetadata(appData)

      offerData.takerAddr = takerAddr
      offerData.takerNpub = takerNpub
      offerData.counterOfferAddr = counterOfferAddr
      offerData.counterOfferUtxo = counterOfferUtxo.txid

      progress.push(<p key='progress-msg2'>Uploading counter offer to Nostr...</p>)
      setProgressMsg(progress)

      console.log('offerData: ', offerData)
      console.log('partialHex: ', partialHex)

      // Upload the counter offer to Nostr.
      const nostr = appData.nostr
      const { eventId, noteId } = await nostr.testNostrUpload({
        offerData,
        partialHex
      })

      console.log(
        `Counter Offer uploaded to Nostr with this event ID: ${eventId}`
      )
      console.log(`https://astral.psfoundation.info/${noteId}`)

      setNoteId(noteId)
      setSuccess(true)
      setOnFetch(false)
    } catch (error) {
      setOnFetch(false)
      setError(error.message)
    }
  }

  // Handler for when user requests to close the modal.
  const handleClose = () => {
    console.log('handleClose()')
    // Deny close if the purchase is in progress.
    if (onFetch) {
      return
    }

    // Call onSuccess() callback  if the modal close after a success purchase.
    if (success && onSuccess) {
      onSuccess()
    }
    // Reset the state.
    setError(false)
    setSuccess(false)
    setNoteId(false)
    setShow(false)
    setOnFetch(false)
    setShowConfirmation(true)
  }
  // Replace with dummy button until token data is loaded.
  if (!props.token.tokenData) {
    return (
      <>
        <Button variant='success'>Buy</Button>
      </>
    )
  }

  return (
    <>
      <Button
        variant='success'
        disabled={props.disabled}
        onClick={() => {
          setShow(true)
        }}
      >
        Buy
      </Button>

      <Modal show={show} onHide={handleClose} dialogClassName='buy-modal'>
        <Modal.Header closeButton>
          <Modal.Title>
            {success
              ? (
                <span style={{ color: 'green' }}>Successful Purchase</span>
                )
              : (
                  'Processing Purchase'
                )}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className='text-center'>

          {/** If the purchase is not confirmed, display the token details. and confirm button. */}
          {showConfirmation && (
            <Container className='text-start'>
              <Row>
                <Col xs={4}>
                  <b>Ticker</b>:
                </Col>
                <Col xs={8}>{token.ticker}</Col>
              </Row>

              <Row>
                <Col xs={4}>
                  <b>Name</b>:
                </Col>
                <Col xs={8}>{props.token.tokenData.genesisData.name}</Col>
              </Row>
              <Row style={{ backgroundColor: '#eee' }}>
                <Col xs={4}>
                  <b>Price</b>:
                </Col>
                <Col xs={8}>
                  <strong>{token.usdPrice}</strong>
                </Col>
              </Row>
            </Container>
          )}

          {/** show purchase progress */}
          <Container style={{ wordBreak: 'break-word' }}>
            {onFetch && (
              <>
                <Spinner animation='border' variant='primary' />
                {progressMsg}
              </>
            )}

            {error && (
              <span style={{ color: 'red', fontStyle: 'italic' }}>{error}</span>
            )}

            {success && (
              <>
                <p>
                  Note ID :
                  <a
                    href={`https://astral.psfoundation.info/${noteId}`}
                    target='_blank'
                    rel='noreferrer'
                  >
                    {' '}
                    {noteId}
                  </a>
                </p>
                <p>
                  What happens now:<br />
                  The Seller software must finalize the sale by accepting the Counter Offer transaction you just generated.
                  If their software is online, the token should appear in your wallet within a few minutes.
                  Before it is accepted, you can cancel the purchase by Sweeping your Counter Offer UXTO back to your wallet.
                </p>
              </>
            )}
          </Container>

        </Modal.Body>

        <Modal.Footer className='text-center'>
          {showConfirmation && (
            <Row style={{ width: '100%' }}>
              <Col xs={12} className='text-center'>
                <Button
                  variant='success'
                  style={{ minWidth: '100px' }}
                  onClick={handleBuy}
                >
                  Buy
                </Button>
              </Col>
            </Row>
          )}
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default BuyButton
