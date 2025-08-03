/*
  This library gets data that requires an async wait.
*/

// Global npm libraries
import axios from 'axios'
import BchDexLib from 'bch-dex-lib'

// Local libraries
import GistServers from './gist-servers'
import Nostr from './nostr'
import P2WDB from 'p2wdb'
import { base58_to_binary as base58ToBinary } from 'base58-js'
import { bytesToHex } from '@noble/hashes/utils' // already an installed dependency
import { getPublicKey } from 'nostr-tools/pure'
import * as nip19 from 'nostr-tools/nip19'

class AsyncLoad {
  constructor () {
    this.BchWallet = false
  }

  // Load the minimal-slp-wallet which comes in as a <script> file and is
  // attached to the global 'window' object.
  async loadWalletLib () {
    try {
      do {
        if (typeof window !== 'undefined' && window.SlpWallet) {
          this.BchWallet = window.SlpWallet

          return this.BchWallet
        } else {
          console.log('Waiting for wallet library to load...')
        }

        await sleep(1000)
      } while (!this.BchWallet)
    } catch (error) {
      console.error('Error loading wallet library: ', error)
      throw error
    }
  }

  // Initialize the BCH wallet
  async initWallet (restURL, mnemonic, appData) {
    try {
      const options = {
        interface: 'consumer-api',
        restURL,
        noUpdate: true
      }

      let wallet
      if (mnemonic) {
        // Load the wallet from the mnemonic, if it's available from local storage.
        wallet = new this.BchWallet(mnemonic, options)
      } else {
        // Generate a new mnemonic and wallet.
        wallet = new this.BchWallet(null, options)
      }

      // Wait for wallet to initialize.
      await wallet.walletInfoPromise
      await wallet.initialize()
      console.log('starting to update wallet state.')

      // Get Nostr key pair from WIF
      const nostrKeyPair = this.nostrKeyPairFromWIF(wallet.walletInfo.privateKey)
      console.log('nostrKeyPair: ', nostrKeyPair)
      const walletInfo = wallet.walletInfo
      walletInfo.nostrKeyPair = nostrKeyPair
      // Update the state of the wallet.
      appData.updateBchWalletState({ walletObj: walletInfo, appData })
      console.log('finished updating wallet state.')
      // Save the mnemonic to local storage.
      if (!mnemonic) {
        const newMnemonic = wallet.walletInfo.mnemonic
        appData.updateLocalStorage({ mnemonic: newMnemonic })
      }

      this.wallet = wallet

      return wallet
    } catch (error) {
      console.error('Error initializing wallet: ', error)
      throw error
    }
  }

  // Get the BCH balance of the wallet.
  async getWalletBchBalance (wallet, updateBchWalletState, appData) {
    try {
      // Get the BCH balance of the wallet.
      const bchBalance = await wallet.getBalance({ bchAddress: wallet.walletInfo.cashAddress })

      await wallet.walletInfoPromise
      await wallet.initialize()
      // console.log(`mnemonic: ${wallet.walletInfo.mnemonic}`)

      // Update the state of the wallet with the balances
      updateBchWalletState({ walletObj: { bchBalance }, appData })

      return true
    } catch (error) {
      console.error('Error getting wallet BCH balance: ', error)
      throw error
    }
  }

  // Get the spot exchange rate for BCH in USD.
  async getUSDExchangeRate (wallet, updateBchWalletState, appData) {
    try {
      const bchUsdPrice = await wallet.getUsd()

      // Update the state of the wallet
      updateBchWalletState({ walletObj: { bchUsdPrice }, appData })

      return true
    } catch (error) {
      console.error('Error getting USD exchange rate: ', error)
      throw error
    }
  }

  // Get a list of SLP tokens held by the wallet.
  async getSlpTokenBalances (wallet, updateBchWalletState, appData) {
    try {
      // Get token information from the wallet. This will also initialize the UTXO store.
      const slpTokens = await wallet.listTokens(wallet.walletInfo.cashAddress)
      // console.log('slpTokens: ', slpTokens)

      console.log('slpTokens: ', slpTokens)

      // Update the state of the wallet with the balances
      updateBchWalletState({ walletObj: { slpTokens }, appData })

      return true
    } catch (error) {
      console.error('Error getting SLP tokens', error)
      throw error
    }
  }

  // Get token data for a given Token ID
  async getTokenData (tokenId) {
    try {
      const tokenData = await this.wallet.getTokenData(tokenId)

      // Convert the IPFS CIDs into actual data.
      tokenData.immutableData = await this.getIpfsData(tokenData.immutableData)
      tokenData.mutableData = await this.getIpfsData(tokenData.mutableData)

      return tokenData
    } catch (error) {
      console.error('Error getting Token data', error)
      throw error
    }
  }

  // Get data about a Group token
  async getGroupData (tokenId) {
    try {
      const tokenData = await this.getTokenData(tokenId)

      const groupData = {
        immutableData: tokenData.immutableData,
        mutableData: tokenData.mutableData,
        nfts: tokenData.genesisData.nfts,
        tokenId: tokenData.genesisData.tokenId
      }

      return groupData
    } catch (error) {
      console.error('Error getting Token group data', error)
      throw error
    }
  }

  // Given an IPFS URI, this will download and parse the JSON data.
  async getIpfsData (ipfsUri) {
    try {
      const cid = ipfsUri.slice(7)

      const downloadUrl = `https://${cid}.ipfs.dweb.link/data.json`

      const response = await axios.get(downloadUrl)
      const data = response.data

      return data
    } catch (error) {
      console.error('Error getting IPFS data', error)
      throw error
    }
  }

  // Get a list of alternative back end servers.
  async getServers () {
    // Try to get the list from GitHub
    try {
      const gistLib = new GistServers()
      const gistServers = await gistLib.getServerList()

      return gistServers
    } catch (err) {
      console.error('Error trying to retrieve list of servers from GitHub: ', err)
      console.log('Returning hard-coded list of servers.')

      const defaultOptions = [
        { value: 'https://free-bch.fullstack.cash', label: 'https://free-bch.fullstack.cash' },
        { value: 'https://dev-consumer.psfoundation.info', label: 'https://dev-consumer.psfoundation.info' }
      ]

      return defaultOptions
    }
  }

  // Load the BchDexLib library.
  getDexLib (inObj = {}) {
    try {
      const { bchWallet, p2wdbRead, p2wdbWrite } = inObj

      const dexLib = new BchDexLib({ bchWallet, p2wdbRead, p2wdbWrite })

      return dexLib
    } catch (error) {
      console.error('Error getting DexLib', error)
      throw error
    }
  }

  // Load the Nostr library.
  getNostrLib (inObj = {}) {
    try {
      const { bchWallet } = inObj

      const nostrLib = new Nostr({ bchWallet })

      return nostrLib
    } catch (error) {
      console.error('Error in getNostrLib', error)
      throw error
    }
  }

  // Load the P2WDB library.
  getP2WDBLib (inObj = {}) {
    try {
      const { bchWallet } = inObj

      const p2wdbRead = new P2WDB.Read()
      const p2wdbWrite = new P2WDB.Write({ bchWallet })

      return { p2wdbRead, p2wdbWrite }
    } catch (error) {
      console.error('Error in getP2WDBLib', error)
      throw error
    }
  }

  // Get Nostr key pair from WIF
  nostrKeyPairFromWIF (WIF) {
    if (!WIF) return

    // Extract the privaty key from the WIF, using this guide:
    // https://learnmeabitcoin.com/technical/keys/private-key/wif/
    const wifBuf = base58ToBinary(WIF)
    const privBuf = wifBuf.slice(1, 33)
    // console.log('privBuf: ', privBuf)
    // Convert the private key to a hex string
    const privHex = bytesToHex(privBuf)
    // Convert the private key to a Nostr NSEC key
    const nsec = nip19.nsecEncode(privBuf)

    // Get the public key hex string from the private key
    const pubHex = getPublicKey(privBuf)
    // Convert the public key to a Nostr NPUB key
    const npub = nip19.npubEncode(pubHex)

    return {
      privHex,
      pubHex,
      nsec,
      npub
    }
  }

  // Initialize the BCH wallet without initialize() promise
  async initStarterWallet (restURL, mnemonic, appData) {
    try {
      const options = {
        interface: 'consumer-api',
        restURL,
        noUpdate: true
      }

      let wallet
      if (mnemonic) {
        // Load the wallet from the mnemonic, if it's available from local storage.
        wallet = new this.BchWallet(mnemonic, options)
      } else {
        // Generate a new mnemonic and wallet.
        wallet = new this.BchWallet(null, options)
      }

      await wallet.walletInfoPromise

      // Get Nostr key pair from WIF
      const nostrKeyPair = this.nostrKeyPairFromWIF(wallet.walletInfo.privateKey)
      const walletInfo = wallet.walletInfo
      walletInfo.nostrKeyPair = nostrKeyPair
      // Update the state of the wallet.
      appData.updateBchWalletState({ walletObj: walletInfo, appData })
      // Save the mnemonic to local storage.
      if (!mnemonic) {
        const newMnemonic = wallet.walletInfo.mnemonic
        appData.updateLocalStorage({ mnemonic: newMnemonic })
      }

      this.wallet = wallet

      return wallet
    } catch (error) {
      console.error('Error initStarterWallet: ', error)
      throw error
    }
  }
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default AsyncLoad
