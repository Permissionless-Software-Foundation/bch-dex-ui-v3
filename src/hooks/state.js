// Global imports
import { useState, useEffect, useRef } from 'react'
// import { useQueryParam, StringParam } from 'use-query-params'
import useLocalStorageState from 'use-local-storage-state'
import { useNavigate, useLocation } from 'react-router-dom'

// Local imports
import AppUtil from '../util'
import NostrQueries from '../services/nostr-queries'
import config from '../config'

function useAppState () {
  const navigate = useNavigate()
  const location = useLocation()

  // Default local storage object
  const localStorageDefault = {
    serverUrl: 'https://free-bch.fullstack.cash', // Default server
    relays: [
      { address: 'wss://nostr-relay.psfoundation.info', read: true, write: true },
      { address: 'wss://relay.damus.io', read: true, write: true }
    ],
    nftData: {},
    lastFeedTab: 'feed',
    dexServerUrl: config.dexServer
  }
  // Load Local storage Data
  const [lsState, setLSState, { removeItem }] = useLocalStorageState('bchWalletState-template', {
    ssr: true,
    defaultValue: localStorageDefault

  })

  console.log('lsState: ', lsState)
  // Initialize  data states
  const [serverUrl, setServerUrl] = useState(lsState.serverUrl) // Default server url
  const [menuState, setMenuState] = useState(0)
  const [wallet, setWallet] = useState(false)
  const [servers, setServers] = useState([])
  const [defaultDexServerUrl] = useState(config.dexServer) // Default dex server url
  const [dexServerUrl, setDexServerUrl] = useState(lsState.dexServerUrl || config.dexServer) // selected dex server url
  const [dexLib, setDexLib] = useState(false)
  const [nostr, setNostr] = useState(false)
  const [lastFeedTab, setLastFeedTab] = useState(lsState.lastFeedTab || localStorageDefault.lastFeedTab)

  // Startup state management
  const [asyncInitStarted, setAsyncInitStarted] = useState(false)
  const [asyncInitFinished, setAsyncInitFinished] = useState(false)
  const [asyncInitSucceeded, setAsyncInitSucceeded] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(null)
  const [loggedInAlreadyChecked, setLoggedInAlreadyChecked] = useState(false)

  // Modal state management
  const [showStartModal, setShowStartModal] = useState(false)
  const [modalBody, setModalBody] = useState([])
  const [hideSpinner, setHideSpinner] = useState(false)
  const [denyClose, setDenyClose] = useState(false)
  const [userData, setUserData] = useState(lsState.userData)
  const [isSingleView, setIsSingleView] = useState(false)

  // NFTs for sale stored data to improve performance
  const [nftForSaleCacheData, setNftForSaleCacheData] = useState(lsState.nftData || {})

  // Relays
  const [relaysData, setRelaysData] = useState(lsState.relays || localStorageDefault.relays) // All relays data
  const [readRelays, setReadRelays] = useState(relaysData.filter(relay => relay.read).map(relay => relay.address)) // Read relays
  const [writeRelays, setWriteRelays] = useState(relaysData.filter(relay => relay.write).map(relay => relay.address)) // Write relays

  // Nostr queries service
  const nostrQueriesRef = useRef(new NostrQueries({ relays: readRelays }))

  // ProfileDM
  const [startChannelChat, setStartChannelChat] = useState('')

  // The wallet state makes this a true progressive web app (PWA). As
  // balances, UTXOs, and tokens are retrieved, this state is updated.
  // properties are enumerated here for the purpose of documentation.

  // Local storage
  // const [lsState, setLSState, { removeItem }] = useLocalStorageState('bchWalletState', {
  //   ssr: true,
  //   defaultValue: {}
  // })
  // console.log('lsState: ', lsState)
  const removeLocalStorageItem = removeItem

  const updateLocalStorage = (lsObj) => {
    console.log(`updateLocalStorage() input: ${JSON.stringify(lsObj, null, 2)}`)

    // Progressively overwrite the LocalStorage state.
    const newObj = Object.assign({}, lsState, lsObj)
    // console.log(`updateLocalStorage() output: ${JSON.stringify(newObj, null, 2)}`)

    setLSState(newObj)
  }

  // Logout the user
  const logout = () => {
    setUserData(null)
    removeLocalStorageItem('userData')
  }

  /**
   * Check if the user is logged in
   */
  useEffect(() => {
    // verify if the user is logged in
    const isLoggedIn = userData && userData.email
    setIsLoggedIn(isLoggedIn) // update the state

    // if the user is not logged in, navigate to the login page
    if (!isLoggedIn && !loggedInAlreadyChecked) {
      setLoggedInAlreadyChecked(true) // prevent re-navigation
      navigate('/login')
    }
  }, [userData, navigate, loggedInAlreadyChecked])

  const [bchWalletState, setBchWalletState] = useState({
    mnemonic: undefined,
    address: undefined,
    cashAddress: undefined,
    slpAddress: undefined,
    privateKey: undefined,
    publicKey: undefined,
    legacyAddress: undefined,
    hdPath: undefined,
    bchBalance: 0,
    slpTokens: [],
    bchUsdPrice: 150
  })

  // This function is passed to child components in order to update the wallet
  // state. This function is important to make this wallet a PWA.
  function updateBchWalletState (inObj = {}) {
    try {
      const { walletObj, appData } = inObj

      // Debuging
      // console.log('updateBchWalletState() walletObj: ', walletObj)
      // console.log('updateBchWalletState() appData: ', appData)

      appData.setBchWalletState(oldState => {
        const newBchWalletState = Object.assign({}, oldState, walletObj)
        // console.log('newBchWalletState: ', newBchWalletState)

        return newBchWalletState
      })

      // console.log(`New wallet state: ${JSON.stringify(bchWalletState, null, 2)}`)
    } catch (err) {
      console.error('Error in App.js updateBchWalletState()')
      throw err
    }
  }

  // Update NFT for sale tokens data
  function updateNFTCachedData (tokenId, data) {
    const allCacheData = nftForSaleCacheData // Get all cache data
    const cacheData = allCacheData[tokenId] || {} // Get cache data for the tokenId

    const newCacheData = Object.assign({}, cacheData, data) // Merge the new data with the cache data
    allCacheData[tokenId] = newCacheData // Update the cache data
    setNftForSaleCacheData(allCacheData) // Update the state
    updateLocalStorage({ nftData: allCacheData }) // Update the local storage
  }
  // Update relays data
  function updateRelaysData (relaysData) {
    setRelaysData(relaysData)
    updateLocalStorage({ relays: relaysData }) // Update the local storage
    // get the relay addresses with read set to true
    const readRelays = relaysData.filter(relay => relay.read).map(relay => relay.address)
    setReadRelays(readRelays)
    console.log('readRelays: ', readRelays)
    // get the relay addresses with write set to true
    const writeRelays = relaysData.filter(relay => relay.write).map(relay => relay.address)
    setWriteRelays(writeRelays)
    console.log('writeRelays: ', writeRelays)
    nostrQueriesRef.current = new NostrQueries({ relays: readRelays })
  }
  // Restore relays data
  function restoreRelaysData () {
    const relaysData = [...localStorageDefault.relays] // Create a new array  in order to detect changes
    setRelaysData(relaysData)
    updateLocalStorage({ relays: relaysData })
    // get the relay addresses with read set to true
    const readRelays = relaysData.filter(relay => relay.read).map(relay => relay.address)
    setReadRelays(readRelays)
    console.log('readRelays: ', readRelays)
    // get the relay addresses with write set to true
    const writeRelays = relaysData.filter(relay => relay.write).map(relay => relay.address)
    setWriteRelays(writeRelays)
    console.log('writeRelays: ', writeRelays)
    nostrQueriesRef.current = new NostrQueries({ relays: readRelays })
  }

  return {
    serverUrl,
    setServerUrl,
    menuState,
    setMenuState,
    wallet,
    setWallet,
    servers,
    setServers,
    asyncInitStarted,
    setAsyncInitStarted,
    asyncInitFinished,
    setAsyncInitFinished,
    asyncInitSucceeded,
    setAsyncInitSucceeded,
    showStartModal,
    setShowStartModal,
    modalBody,
    setModalBody,
    hideSpinner,
    setHideSpinner,
    denyClose,
    setDenyClose,
    bchWalletState,
    setBchWalletState,
    lsState,
    setLSState,
    removeLocalStorageItem,
    updateLocalStorage,
    updateBchWalletState,
    appUtil: new AppUtil(),
    currentPath: location.pathname,
    dexLib,
    setDexLib,
    nostr,
    setNostr,
    userData,
    setUserData,
    logout,
    dexServerUrl,
    setDexServerUrl,
    defaultDexServerUrl,
    isLoggedIn,
    nftForSaleCacheData,
    setNftForSaleCacheData,
    updateNFTCachedData,
    lastFeedTab,
    setLastFeedTab,
    isSingleView,
    setIsSingleView,
    nostrQueries: nostrQueriesRef.current,
    relaysData,
    updateRelaysData,
    restoreRelaysData,
    readRelays,
    writeRelays,
    startChannelChat,
    setStartChannelChat
  }
}

export default useAppState
