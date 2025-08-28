/*
 This component is a View that allows the user to handle configuration
 settings for the app.
*/

// Global npm libraries
import React from 'react'
import ServerSelectView from './select-server-view'
import SelectDexServerView from './select-dex-server-view'
import ChangePasswordView from './change-password-view'
import RelaySelectionView from './relay-selection-view'

function ConfigurationView (props) {
  const { appData } = props

  return (
    <div className='mb-4'>
      <ServerSelectView appData={appData} />
      <SelectDexServerView appData={appData} />
      <ChangePasswordView appData={appData} />
      <RelaySelectionView appData={appData} />
    </div>
  )
}

export default ConfigurationView
