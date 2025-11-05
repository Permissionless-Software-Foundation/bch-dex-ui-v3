/*
  Implementing nostr natively in the browser, rather than using a library
  intended for node.js
*/

// Global npm libraries
// import { finalizeEvent } from '@chris.troutner/nostr-tools/pure'
// import { Relay } from '@chris.troutner/nostr-tools/relay'
// import BchNostr from 'bch-nostr'
// import * as nip19 from '@chris.troutner/nostr-tools/nip19'

import { finalizeEvent } from 'nostr-tools/pure'
import BchNostr from 'bch-nostr'
import * as nip19 from 'nostr-tools/nip19'
import config from '../config/index.js'
import NostrRestClient from './nostr-rest-client.js'

class NostrBrowser {
  constructor (localConfig = {}) {
    if (!localConfig.bchWallet) {
      throw new Error('Instance of minimal-slp-wallet must be passed as wallet property when instantiating the bch-dex-lib library.')
    }

    this.bchWallet = localConfig.bchWallet

    this.bchNostr = new BchNostr({
      relayWs: config.nostrRelay,
      topic: config.nostrTopic
    })

    // Initialize REST client for publishing events
    this.restClient = new NostrRestClient()
  }

  async testNostrUpload (inObj = {}) {
    try {
      console.log('testNostrUpload() executing.')
      // console.log('this.bchWallet: ', this.bchWallet)

      const { offerData, partialHex } = inObj
      console.log('offerData: ', offerData)

      const wif = this.bchWallet.walletInfo.privateKey
      // const { privKeyBuf, nostrPubKey } =
      //   this.bchNostr.keys.createNostrPubKeyFromWif({ wif })
      const { privKeyBuf } =
        this.bchNostr.keys.createNostrPubKeyFromWif({ wif })

      // Scaffold the Counter Offer from the Offer
      const counterOfferData = Object.assign({}, offerData)
      counterOfferData.partialTxHex = partialHex
      delete counterOfferData.nostrEventId
      delete counterOfferData._id
      counterOfferData.offerHash = offerData.nostrEventId

      // Add P2WDB specific flag for signaling that this is a new Counter Offer.
      counterOfferData.dataType = 'counter-offer'
      console.log(`counterOfferData: ${JSON.stringify(counterOfferData, null, 2)}`)

      const nostrData = {
        data: counterOfferData
      }

      const msg = JSON.stringify(nostrData, null, 2)

      // const inObj = {
      //   kind: 867,
      //   privKeyBuf: privKeyBuf,
      //   nostrPubKey: nostrPubKey,
      //   relayWs: 'wss://nostr-relay.psfoundation.info',
      //   msg,
      //   tags: [['t', 'bch-dex-test-topic-01']]
      // }

      const eventTemplate = {
        kind: 867,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['t', config.nostrTopic]],
        content: msg
      }

      // Sign the post
      const signedEvent = finalizeEvent(eventTemplate, privKeyBuf)
      // console.log('signedEvent: ', signedEvent)
      const eventId = signedEvent.id

      // Publish the message via REST API
      const result = await this.restClient.publishEvent(signedEvent)

      if (!result.accepted) {
        throw new Error(`Failed to publish event: ${result.message || 'Unknown error'}`)
      }

      // const eventId = await this.bchNostr.post.uploadToNostr(inObj)

      const noteId = this.eventId2note(eventId)

      // const eventId = 'test1'
      // const noteId = 'test2'

      return { eventId, noteId }
    } catch (err) {
      console.log('Error in nostr.js/testNostrUpload()')
      throw err
    }
  }

  // Convert an Event ID into a `noteabc..` syntax that Astral expects.
  // This can be used to generate a link to Astral to display the post.
  eventId2note (eventId) {
    return nip19.noteEncode(eventId)
  }
}

export default NostrBrowser
