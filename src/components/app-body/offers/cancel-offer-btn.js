/*
  This component renders as a button. When clicked, it opens a modal that
  cancels the offer.

  This is a functional component with as little state as possible.
*/

// Global npm libraries
import React, { useState } from 'react'
import { Button, Modal, Container } from 'react-bootstrap'

function CancelOfferBtn (props) {
  const [show, setShow] = useState(false)

  const handleClose = () => {
    setShow(false)
    // props.instance.setState({ showModal: false })
  }

  const handleOpen = () => {
    setShow(true)
  }

  return (
    <>
      <Button variant='danger' onClick={handleOpen} disabled>Cancel</Button>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Cancel </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Container>
            {/** ... */}
          </Container>
        </Modal.Body>
        <Modal.Footer />
      </Modal>
    </>
  )
}

export default CancelOfferBtn
