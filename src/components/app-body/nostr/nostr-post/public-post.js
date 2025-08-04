/*
  Component for posting nostr information on kind 1.
*/

// Global npm libraries
import React, { useState } from 'react'
import { Container, Form, Button, Spinner } from 'react-bootstrap'
import Accordion from 'react-bootstrap/Accordion'
import { finalizeEvent } from 'nostr-tools/pure'
import { Relay } from 'nostr-tools/relay'
import { hexToBytes } from '@noble/hashes/utils' // already an installed dependency

// Local libraries
import config from '../../../../config'

function PublicPost (props) {
  const [accordionKey, setAccordionKey] = useState('0')
  const [onFetch, setOnFetch] = useState(false)
  const { bchWalletState } = props.appData
  const [formData, setFormData] = useState({
    content: ''
  })

  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })

    setSuccessMsg('')
    setErrorMsg('')
  }
  // Post on nostr network
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setErrorMsg('')
      setSuccessMsg('')
      setOnFetch(true)

      const { nostrKeyPair } = bchWalletState

      // Convert private key to binary
      const privateKeyBin = hexToBytes(nostrKeyPair.privHex)

      // BCH address of the user.
      const bchAddr = bchWalletState.address

      // Generate a post.
      const eventTemplate = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['t', 'slpdex-socialmedia'], ['u', bchAddr]],
        content: formData.content
      }
      console.log(`eventTemplate: ${JSON.stringify(eventTemplate, null, 2)}`)

      // Sign the post
      const signedEvent = finalizeEvent(eventTemplate, privateKeyBin)
      console.log('signedEvent: ', signedEvent)

      // Publish the post to each relay.
      config.nostrRelays.map(async (relayUrl) => {
        try {
          // Connect to a relay.
          const relay = await Relay.connect(relayUrl)
          console.log(`connected to ${relay.url}`)

          // Publish the message to the relay.
          const result = await relay.publish(signedEvent)
          console.log('result: ', result)

          // Close the connection to the relay.
          relay.close()
        } catch (err) {
          console.warn(`Skipping publishing to ${relayUrl} due to error: ${err}`)
        }
      })

      resetForm()
      setSuccessMsg('Post successfully published!')
      setOnFetch(false)
    } catch (error) {
      console.warn(error)
      setErrorMsg(error.message || 'An error occurred while posting')
      setOnFetch(false)
    }
  }

  const handleAccordionChange = (key) => {
    setAccordionKey(key)
  }

  const resetForm = () => {
    setFormData({
      content: ''
    })
  }

  return (
    <>
      <Container className='mt-4'>
        <Accordion activeKey={accordionKey} onSelect={handleAccordionChange}>
          <Accordion.Item eventKey='0'>
            <Accordion.Header>Public Post</Accordion.Header>
            <Accordion.Body>
              {errorMsg && (
                <div className='alert alert-danger' role='alert'>
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className='alert alert-success' role='alert'>
                  {successMsg}
                </div>
              )}
              <Form onSubmit={handleSubmit}>
                <Form.Group className='mb-3'>
                  <Form.Label>Message</Form.Label>
                  <Form.Control
                    as='textarea'
                    rows={7}
                    placeholder="What's happening?"
                    name='content'
                    value={formData.content}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                <div className='d-flex justify-content-center'>
                  {!onFetch && (
                    <Button variant='primary' type='submit' disabled={onFetch}>
                      Post
                    </Button>
                  )}
                  {onFetch && <Spinner animation='border' variant='primary' />}
                </div>

              </Form>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Container>
    </>
  )
}

export default PublicPost
