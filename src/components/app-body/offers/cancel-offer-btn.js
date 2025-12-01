/*
  This component renders as a button. When clicked, it opens a modal that
  cancels the offer.

  This is a functional component with as little state as possible.
*/

// Global npm libraries
import React, { useState } from 'react'
import { Button, Modal, Container, Row, Col, Spinner } from 'react-bootstrap'
import Sweeper from 'bch-token-sweep'

function CancelOfferBtn (props) {
  const [show, setShow] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [hideSpinner, setHideSpinner] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(true) // show the confirmation view

  // Update wallet state function
  const updateWalletState = async () => {
    const wallet = props.appData.wallet
    const bchBalance = await wallet.getBalance({ bchAddress: wallet.walletInfo.cashAddress })
    await wallet.initialize()
    const slpTokens = await wallet.listTokens(wallet.walletInfo.cashAddress)
    props.appData.updateBchWalletState({ walletObj: { bchBalance, slpTokens }, appData: props.appData })
  }

  // Handle cancel/sweep function
  const handleCancel = async () => {
    try {
      console.log('Canceling Offer')

      // Hide confirmation and show processing
      setShowConfirmation(false)
      setHideSpinner(false)
      setStatusMsg('')
      setIsProcessing(true)

      // Get the keypair that holds Offer UTXOs.
      // This uses HD index 2 (for offers, as opposed to index 1 for counter offers)
      const wallet = props.appData.wallet
      const keyPair = await wallet.getKeyPair(2)
      const wif = keyPair.wif
      console.log(`WIF: ${wif}`)

      // Get wallet info for sweeping
      const walletWif = props.appData.wallet.walletInfo.privateKey
      const toAddr = props.appData.wallet.slpAddress

      // Instance the Sweep library and populate UTXOs from network
      const sweep = new Sweeper(wif, walletWif, props.appData.wallet)
      await sweep.populateObjectFromNetwork()

      // Constructing the sweep transaction
      const hex = await sweep.sweepTo(toAddr)
      const txid = await props.appData.wallet.ar.sendTx(hex)

      // Generate success status message
      const newStatusMsg = (
        <>
          <p>Sweep succeeded!</p>
          <p>Offer has been canceled.</p>
          <p>Transaction ID: {txid}</p>
          <p>
            <a href={`https://blockchair.com/bitcoin-cash/transaction/${txid}`} target='_blank' rel='noreferrer'>
              TX on Blockchair BCH Block Explorer
            </a>
          </p>
          <p>
            <a href={`https://token.fullstack.cash/transactions/?txid=${txid}`} target='_blank' rel='noreferrer'>
              TX on token explorer
            </a>
          </p>
        </>
      )

      setHideSpinner(true)
      setStatusMsg(newStatusMsg)
      setIsProcessing(false)

      // Update wallet state to reflect the changes
      await updateWalletState()

      // Refresh the offers list if refreshTokens function is provided
      if (props.refreshTokens) {
        // Small delay to ensure blockchain state is updated
        setTimeout(() => {
          props.refreshTokens()
        }, 2000)
      }
    } catch (err) {
      console.error('Error in handleCancel(): ', err)
      setHideSpinner(true)
      setIsProcessing(false)
      setStatusMsg(<b style={{ color: 'red' }}>{`Error: ${err.message}`}</b>)
    }
  }

  const handleClose = () => {
    // Deny close if the cancel is in progress.
    if (isProcessing) {
      return
    }

    setShow(false)
    setStatusMsg('')
    setHideSpinner(false)
    setIsProcessing(false)
    setShowConfirmation(true) // Reset confirmation state for next time
  }

  const handleOpen = () => {
    setShow(true)
    // Don't start the cancel process immediately - wait for user confirmation
  }

  return (
    <>
      <Button variant='danger' onClick={handleOpen} disabled={isProcessing}>Cancel</Button>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Cancel Offer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {showConfirmation
            ? (
              <Container>
                <Row>
                  <Col style={{ textAlign: 'center' }}>
                    <p>Are you sure you want to cancel this Offer?</p>
                    <p style={{ color: '#666', fontSize: '0.9em' }}>
                      This action will sweep the Offer UTXOs back to your wallet.
                    </p>
                  </Col>
                </Row>
              </Container>
              )
            : (
              <Container>
                <Row>
                  {!hideSpinner && (
                    <Col style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <span style={{ marginRight: '10px' }}>Canceling Offer...</span>
                      <Spinner animation='border' />
                    </Col>
                  )}
                </Row>
                <br />
                {statusMsg && (
                  <Row>
                    <Col style={{ textAlign: 'center' }}>{statusMsg}</Col>
                  </Row>
                )}
              </Container>
              )}
        </Modal.Body>
        <Modal.Footer>
          {showConfirmation && (
            <Row style={{ width: '100%' }}>
              <Col xs={12} className='text-center'>
                <Button
                  variant='secondary'
                  style={{ minWidth: '100px', marginRight: '10px' }}
                  onClick={handleClose}
                >
                  No, Keep Open
                </Button>
                <Button
                  variant='danger'
                  style={{ minWidth: '100px' }}
                  onClick={handleCancel}
                >
                  Yes, Cancel It
                </Button>
              </Col>
            </Row>
          )}
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default CancelOfferBtn
