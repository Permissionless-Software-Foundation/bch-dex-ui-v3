import { useState, useEffect } from 'react'
// import { useQueryParam, StringParam } from 'use-query-params'
import useLocalStorageState from 'use-local-storage-state'
import AppUtil from '../util'
import { useNavigate, useLocation } from 'react-router-dom'

import config from '../config'

function useAppState () {
  const location = useLocation()
  const navigate = useNavigate()
  // Load Local storage Data
  const [lsState, setLSState, { removeItem }] = useLocalStorageState('bchWalletState-template', {
    ssr: true,
    defaultValue: {
      serverUrl: 'https://free-bch.fullstack.cash', // Default server
      dexServerUrl: config.dexServer // Default dex server url
    },
    nftData: {},
    lastFeedTab: 'feed'
  })

  console.log('lsState: ', lsState)

  // Initialize  data states
  const [serverUrl, setServerUrl] = useState(lsState.serverUrl) // Default server url
  const [menuState, setMenuState] = useState(0)
  const [wallet, setWallet] = useState(false)
  const [servers, setServers] = useState([])
  const [defaultDexServerUrl] = useState(config.dexServer) // Default dex server url
  const [dexServerUrl, setDexServerUrl] = useState(lsState.dexServerUrl) // selected dex server url
  const [dexLib, setDexLib] = useState(false)
  const [nostr, setNostr] = useState(false)
  const [lastFeedTab, setLastFeedTab] = useState(lsState.lastFeedTab || 'feed')

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
    setIsSingleView
  }
}

export default useAppState
