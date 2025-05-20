/*
 This component is a View that allows the user to handle configuration
 settings for the app.
*/

// Global npm libraries
import React, { useRef } from 'react'
import ServerSelectView from './select-server-view'
import SelectDexServerView from './select-dex-server-view'
import ChangePasswordView from './change-password-view'

function ConfigurationView (props) {
  const { appData } = props

  // Refs for the onSubmit functions from the child components
  const onSubmitServerRef = useRef(null)
  const onSubmitDexServerRef = useRef(null)
  const onSubmitPasswordRef = useRef(null)
  // Function to submit all the forms
  const onSubmitAll = async () => {
    await onSubmitDexServerRef.current?.()
    await onSubmitServerRef.current?.()
    await onSubmitPasswordRef.current?.()
  }

  return (
    <div className='mb-4'>
      <ServerSelectView appData={appData} onSubmitRef={onSubmitServerRef} onSubmitAll={onSubmitAll} />
      <SelectDexServerView appData={appData} onSubmitRef={onSubmitDexServerRef} />
      <ChangePasswordView appData={appData} onSubmitRef={onSubmitPasswordRef} />
    </div>
  )
}

export default ConfigurationView
