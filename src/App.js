/*
  This is an SPA that creates a template for future BCH web3 apps.
*/

// Global npm libraries
import React, { useEffect, useCallback } from 'react'

// Local libraries
import './App.css'
import LoadScripts from './components/load-scripts'
import AsyncLoad from './services/async-load'
import Footer from './components/footer'
import NavMenu from './components/nav-menu'
import useAppState from './hooks/state'
import { UninitializedView, InitializedView } from './components/starter-views'

// Paths with custom async loader
// Single Views, load minimal async services in order to prevent the long-time screen loader.
const sigleViewPaths = ['/profile', 'user-data']

function App (props) {
  // Load all the app state into a single object that can be passed to child
  // components.
  const appData = useAppState()

  // Add a new line to the waiting modal.
  const addToModal = useCallback((inStr, appData) => {
    // console.log('addToModal() inStr: ', inStr)

    appData.setModalBody(prevBody => {
      // console.log('prevBody: ', prevBody)
      prevBody.push(inStr)
      return prevBody
    })
  }, [])

  const isSignleView = useCallback(async () => {
    // Get current path
    const currentPath = window.location.pathname
    // Get hash from url
    const hash = window.location.hash
    const allowedPath = sigleViewPaths.find((val) => { return currentPath.match(val) })

    if (hash === '#single-view' && allowedPath) {
      addToModal('Loading minimal-slp-wallet', appData)
      const asyncLoad = new AsyncLoad()
      if (!appData.wallet) {
        await asyncLoad.loadWalletLib()
        const walletTemp = await asyncLoad.initStarterWallet(appData.serverUrl, appData.lsState.mnemonic, appData)
        appData.setWallet(walletTemp)
        // Get the BCH spot price
        addToModal('Getting BCH spot price in USD', appData)
        await asyncLoad.getUSDExchangeRate(walletTemp, appData.updateBchWalletState, appData)
      }

      // Update Modal State
      appData.setIsSingleView(true)
      appData.setHideSpinner(true)
      appData.setShowStartModal(false)
      appData.setDenyClose(false)

      /*       // Update the startup state.
      appData.setAsyncInitFinished(true)
      appData.setAsyncInitSucceeded(false) */
      return true
    }
    return false
  }, [appData, addToModal])

  /** Load all required data before component start. */
  useEffect(() => {
    async function asyncEffect () {
      const singleView = await isSignleView()

      console.log('asyncInitStarted: ', appData.asyncInitStarted)
      console.log('is single view : ', singleView)
      if (!appData.asyncInitStarted && !singleView && appData.isLoggedIn) {
        try {
          appData.setShowStartModal(true)
          // Instantiate the async load object.
          const asyncLoad = new AsyncLoad()
          appData.setAsyncInitStarted(true)

          addToModal('Loading minimal-slp-wallet', appData)
          appData.setDenyClose(true)

          await asyncLoad.loadWalletLib()
          // console.log('Wallet: ', Wallet)

          addToModal('Getting alternative servers', appData)
          const gistServers = await asyncLoad.getServers()
          appData.setServers(gistServers)
          // console.log('servers: ', servers)

          addToModal('Initializing wallet', appData)
          console.log(`Initializing wallet with back end server ${appData.serverUrl}`)

          const walletTemp = await asyncLoad.initWallet(appData.serverUrl, appData.userData.mnemonic, appData)
          appData.setWallet(walletTemp)
          // appData.updateBchWalletState({ walletObj: walletTemp.walletInfo, appData })

          // Get the BCH balance of the wallet.
          addToModal('Getting BCH balance', appData)
          await asyncLoad.getWalletBchBalance(walletTemp, appData.updateBchWalletState, appData)

          // Get the SLP tokens held by the wallet.
          addToModal('Getting SLP tokens', appData)
          await asyncLoad.getSlpTokenBalances(walletTemp, appData.updateBchWalletState, appData)

          // Get the BCH spot price
          addToModal('Getting BCH spot price in USD', appData)
          await asyncLoad.getUSDExchangeRate(walletTemp, appData.updateBchWalletState, appData)

          // Load the P2WDB libraries.
          addToModal('Loading P2WDB Libraries', appData)
          const { p2wdbRead, p2wdbWrite } = asyncLoad.getP2WDBLib({ bchWallet: walletTemp })

          // Load the DEX library.
          addToModal('Loading DEX Library', appData)
          const dexLib = asyncLoad.getDexLib({ bchWallet: walletTemp, p2wdbRead, p2wdbWrite })
          appData.setDexLib(dexLib)

          // Load the Nostr library.
          addToModal('Loading Nostr Library', appData)
          const nostrLib = asyncLoad.getNostrLib({ bchWallet: walletTemp })
          appData.setNostr(nostrLib)

          // Update state
          appData.setShowStartModal(false)
          appData.setDenyClose(false)

          // Update the startup state.
          appData.setAsyncInitFinished(true)
          appData.setAsyncInitSucceeded(true)
          console.log('App.js useEffect() startup finished successfully')
        } catch (err) {
          const errModalBody = [
            `Error: ${err.message}`,
            'Try selecting a different back end server using the drop-down menu at the bottom of the app.'
          ]
          appData.setModalBody(errModalBody)

          // Update Modal State
          appData.setHideSpinner(true)
          appData.setShowStartModal(true)
          appData.setDenyClose(false)

          // Update the startup state.
          appData.setAsyncInitFinished(true)
          appData.setAsyncInitSucceeded(false)
        }
      }
    }
    asyncEffect()
  }, [appData, addToModal, isSignleView])

  return (
    <>
      <LoadScripts />
      <div className='app-container'>
        <NavMenu appData={appData} />
        {/** Define View to show */}
        <div className='main-content'>
          {
            appData.showStartModal
              ? (<UninitializedView appData={appData} />)
              : (<InitializedView menuState={appData.menuState} appData={appData} />)
          }
        </div>
        <Footer appData={appData} />
      </div>
    </>
  )
}

export default App
