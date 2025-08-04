/*
Component for posting nostr information on kind 0.
*/

// Global npm libraries
import React, { useState, useEffect } from 'react'
import { Container, Form, Button, Spinner } from 'react-bootstrap'
import Accordion from 'react-bootstrap/Accordion'
import { finalizeEvent } from 'nostr-tools/pure'
import { Relay } from 'nostr-tools/relay'
import { hexToBytes } from '@noble/hashes/utils' // already an installed dependency
import { RelayPool } from 'nostr'

// Local libraries
import config from '../../../../config'

function ProfilePost (props) {
  const { bchWalletState } = props.appData
  const [accordionKey, setAccordionKey] = useState(null)
  const [onFetch, setOnFetch] = useState(false)
  const [formLoaded, setFormLoaded] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    about: '',
    picture: '',
    display_name: '',
    website: '',
    banner: '',
    bot: false
  })

  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    // Get Last post from
    const getLastPost = () => {
      const { nostrKeyPair } = bchWalletState

      const psf = 'wss://nostr-relay.psfoundation.info'

      const pool = RelayPool([psf])
      pool.on('open', relay => {
        relay.subscribe('subid', { limit: 1, kinds: [0], authors: [nostrKeyPair.pubHex] })
        setFormLoaded(true)
      })

      pool.on('eose', relay => {
        console.log('Closing Relay')
        setFormLoaded(true)
        relay.close()
      })

      pool.on('event', (relay, subId, ev) => {
        console.log('Received event:', ev)
        // setPosts(currentPosts => [...currentPosts, ev])
        try {
          const data = JSON.parse(ev.content)
          console.log('data', data)
          setFormData(data)
        } catch (error) {

        }
      })
    }

    if (!formLoaded) {
      getLastPost()
    }
  }, [bchWalletState, formLoaded])

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

      // Relay list
      // const psf = 'wss://nostr-relay.psfoundation.info'

      const formDataString = JSON.stringify(formData)

      // Generate a post.
      const eventTemplate = {
        kind: 0,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: formDataString
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

  return (
    <>
      <Container className='mt-4'>
        <Accordion activeKey={accordionKey} onSelect={handleAccordionChange}>
          <Accordion.Item eventKey='0'>
            <Accordion.Header>Profile Post</Accordion.Header>
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
              {formLoaded && (
                <Form onSubmit={handleSubmit}>
                  <Form.Group className='mb-3'>
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type='text'
                      placeholder='Enter your name'
                      name='name'
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className='mb-3'>
                    <Form.Label>About</Form.Label>
                    <Form.Control
                      as='textarea'
                      rows={3}
                      placeholder='Tell us about yourself'
                      name='about'
                      value={formData.about}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className='mb-3'>
                    <Form.Label>Profile Picture URL</Form.Label>
                    <Form.Control
                      type='url'
                      placeholder='Enter URL to your profile picture'
                      name='picture'
                      value={formData.picture}
                      onChange={handleInputChange}
                    />
                  </Form.Group>

                  <Form.Group className='mb-3'>
                    <Form.Label>Display Name</Form.Label>
                    <Form.Control
                      type='text'
                      placeholder='Enter your display name'
                      name='display_name'
                      value={formData.display_name}
                      onChange={handleInputChange}
                    />
                  </Form.Group>

                  <Form.Group className='mb-3'>
                    <Form.Label>Website</Form.Label>
                    <Form.Control
                      type='url'
                      placeholder='Enter your website URL'
                      name='website'
                      value={formData.website}
                      onChange={handleInputChange}
                    />
                  </Form.Group>

                  <Form.Group className='mb-3'>
                    <Form.Label>Banner URL</Form.Label>
                    <Form.Control
                      type='url'
                      placeholder='Enter URL to your banner picture (1024x768 pixels)'
                      name='banner'
                      value={formData.banner}
                      onChange={handleInputChange}
                    />
                  </Form.Group>

                  <Form.Group className='mb-3'>
                    <Form.Check
                      type='checkbox'
                      label='This account is for a bot'
                      name='bot'
                      checked={formData.bot}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          bot: e.target.checked
                        })
                        setSuccessMsg('')
                        setErrorMsg('')
                      }}
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
              )}
              {!formLoaded && (
                <div className='text-center'>
                  <Spinner animation='border' variant='primary' />
                </div>
              )}

            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Container>
    </>
  )
}

export default ProfilePost
