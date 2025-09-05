/*
  Component for the message input area
*/

// Global npm libraries
import React, { useState, useEffect } from 'react'
import { Form, Button, InputGroup } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import { finalizeEvent } from 'nostr-tools/pure'
import { hexToBytes } from '@noble/hashes/utils' // already an installed dependency
import { Relay } from 'nostr-tools/relay'

function MessageInput (props) {
  const { appData, selectedChannel, profiles } = props
  const { bchWalletState, writeRelays, nostrQueries } = appData
  const [isDm, setIsDm] = useState(false)
  const [dmProfile, setDmProfile] = useState(false)
  const [message, setMessage] = useState('')
  const [onFetch, setOnFetch] = useState(false)

  // Define input type between private or public
  useEffect(() => {
    const dmTo = profiles[selectedChannel]
    setIsDm(!!dmTo)
    setDmProfile(dmTo)
  }, [selectedChannel, profiles])

  const handleSubmitPrivate = async (e) => {
    e.preventDefault()

    try {
      setOnFetch(true)
      console.log('dm To : ', dmProfile)

      const { nostrKeyPair } = bchWalletState
      // Convert private key to binary
      const privateKeyBin = hexToBytes(nostrKeyPair.privHex)

      const encryptedMsg = await nostrQueries.encryptMsg({
        senderPrivKey: nostrKeyPair.privHex,
        receiverPubKey: dmProfile?.pubKey,
        message
      })

      console.log('encryptedMsg', encryptedMsg)
      // Generate a post.
      const eventTemplate = {
        kind: 4,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['p', dmProfile.pubKey]],
        content: encryptedMsg
      }
      console.log(`eventTemplate: ${JSON.stringify(eventTemplate, null, 2)}`)

      // Sign the post
      const signedEvent = finalizeEvent(eventTemplate, privateKeyBin)
      console.log('signedEvent: ', signedEvent)

      // Publish the post to each relay.
      for (let i = 0; i < writeRelays.length; i++) {
        const relayUrl = writeRelays[i]

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
      }
      setMessage('')
      setOnFetch(false)
    } catch (error) {
      console.warn(error)
      setOnFetch(false)
    }
  }

  // Post on nostr network
  const handleSubmitPublic = async (e) => {
    e.preventDefault()
    try {
      setOnFetch(true)

      const { nostrKeyPair } = bchWalletState

      // Convert private key to binary
      const privateKeyBin = hexToBytes(nostrKeyPair.privHex)

      // Relay list
      // const psf = 'wss://nostr-relay.psfoundation.info'

      // Generate a post.
      const eventTemplate = {
        kind: 42,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['e', selectedChannel, 'root']],
        content: message
      }
      console.log(`eventTemplate: ${JSON.stringify(eventTemplate, null, 2)}`)

      // Sign the post
      const signedEvent = finalizeEvent(eventTemplate, privateKeyBin)
      console.log('signedEvent: ', signedEvent)

      // Publish the post to each relay.
      for (let i = 0; i < writeRelays.length; i++) {
        const relayUrl = writeRelays[i]

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
      }
      setMessage('')
      setOnFetch(false)
    } catch (error) {
      console.warn(error)
      setOnFetch(false)
    }
  }

  const onChange = (e) => {
    setMessage(e.target.value)
  }
  return (
    <div className='p-3' style={{ backgroundColor: '#ffffff' }}>
      <Form onSubmit={isDm ? handleSubmitPrivate : handleSubmitPublic}>
        <InputGroup>
          <Form.Control
            as='textarea'
            rows={3}
            placeholder='Type a message...'
            className='border-1 bg-transparent text-dark'
            style={{
              backgroundColor: '#f8f9fa',
              border: '4px solid rgb(235, 232, 232)',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              resize: 'none',
              minHeight: '60px',
              maxHeight: '120px'
            }}
            value={message}
            onChange={onChange}
            disabled={onFetch}
          />

          <Button
            type='submit'
            variant='link'
            className='text-dark border-0 bg-transparent ms-2'
            style={{
              color: '#6c757d',
              transition: 'color 0.2s ease',
              alignSelf: 'flex-end',
              marginBottom: '8px'
            }}
            title='Send message'
            disabled={onFetch}

          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </Button>
        </InputGroup>
      </Form>
    </div>
  )
}

export default MessageInput
