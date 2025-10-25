/*
  This component renders as a button. When clicked, it opens a modal that
  displays information about the token.

  This is a functional component with as little state as possible.
*/

// Global npm libraries
import React, { useEffect, useState } from 'react'
import { Button, Modal, Container, Row, Col, Spinner } from 'react-bootstrap'
import axios from 'axios'

// Local libraries
import config from '../../../config'
// Global variables and constants
const SERVER = config.dexServer

function InfoButton (props) {
  const [show, setShow] = useState(false)
  const [mutableDataCid, setMutableDataCid] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleClose = () => {
    console.log('handleClose()')
    setShow(false)
    // props.instance.setState({ showModal: false })
  }

  const handleOpen = () => {
    console.log('handleOpen()')
    setShow(true)
  }
  // Get Cid from url
  const parseCid = (url) => {
    // get the cid from the url format 'ipfs://bafybeicem27xbzs65uvbcgykcmscsgln3lmhbfrcoec3gdttkdgtxv5acq
    if (url && url.includes('ipfs://')) {
      const cid = url.split('ipfs://')[1]
      return cid
    }
    return url
  }

  // Get token user data if it exists and verify if it contains media or markdown
  useEffect(() => {
    try {
      const userDataStr = props.token.userData
      if (userDataStr) {
        const userData = JSON.parse(userDataStr)

        // If user data contains media or markdown, set the mutable data cid
        if (userData?.media || userData?.markdown) {
          setMutableDataCid(parseCid(props.token.tokenData.mutableData))
        }
      }
    } catch (error) {
      // Do nothing
    }
  }, [props.token, show])

  // Update offer data
  const updateOffer = async () => {
    try {
      setLoading(true)
      const inputObj = { tokenId: props.token.tokenId }
      const result = await axios.post(`${SERVER}/offer/mutable/sync/`, inputObj)
      const offerData = result.data
      console.log('offerData: ', offerData)

      if (props.updateOffer) await props.updateOffer(offerData)
      setLoading(false)
    } catch (error) {
      setLoading(false)
    }
  }

  // Replace with dummy button until token data is loaded.
  if (!props.token.tokenData) {
    return (
      <>
        <Button variant='info'>Info</Button>
      </>
    )
  }

  return (
    <>
      <Button variant='info' disabled={props.disabled} onClick={handleOpen}>Info</Button>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Token Information</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Container>
            <Row>
              <Col xs={4}><b>Ticker</b>:</Col>
              <Col xs={8}>{props.token.ticker}</Col>
            </Row>

            <Row style={{ backgroundColor: '#eee' }}>
              <Col xs={4}><b>Name</b>:</Col>
              <Col xs={8}>{props.token.tokenData.genesisData.name}</Col>
            </Row>

            <Row>
              <Col xs={4}><b>Token ID</b>:</Col>
              <Col xs={8} style={{ wordBreak: 'break-all' }}>
                <a href={`https://explorer.tokentiger.com/?tokenid=${props.token.tokenId}`} target='_blank' rel='noreferrer'>
                  {props.token.tokenId}
                </a>
              </Col>
            </Row>

            <Row style={{ backgroundColor: '#eee' }}>
              <Col xs={4}><b>Decimals</b>:</Col>
              <Col xs={8}>{props.token.tokenData.genesisData.decimals}</Col>
            </Row>

            <Row>
              <Col xs={4}><b>Token Type</b>:</Col>
              <Col xs={8}>{props.token.tokenType}</Col>
            </Row>

            {mutableDataCid && (
              <Row style={{ paddingTop: '10px' }}>
                <Col xs={4}><b>User Data</b>:</Col>
                <Col xs={8}>
                  <Button
                    href={`/user-data/${props.token.tokenId}#single-view`}
                    target='_blank'
                    rel='noopener noreferrer'
                    variant='success'
                  >
                    View User Data
                  </Button>
                </Col>
              </Row>
            )}

          </Container>
        </Modal.Body>
        <Modal.Footer style={{ justifyContent: 'center'}}>
          {!loading && <Button style={{ width: '135px' }} onClick={updateOffer}>Update</Button>}
          {loading && <Spinner />}
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default InfoButton
