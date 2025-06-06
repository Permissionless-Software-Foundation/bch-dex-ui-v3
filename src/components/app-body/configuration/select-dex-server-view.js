/*
  This component is a View that allows the user to select a back end server
  for dex server.
*/

// Global npm libraries
import React, { useState, useEffect, useCallback } from 'react'
import { Row, Col, Form, Card } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRotateLeft } from '@fortawesome/free-solid-svg-icons'

function SelectDexServerView (props) {
  const { appData, onSubmitRef } = props
  const [selectedServer, setSelectedServer] = useState(appData.dexServerUrl)

  // Update server when input value changes
  const handleServerChange = (event) => {
    setSelectedServer(event.target.value)
  }

  const onSaveServer = useCallback(async (serverUrl) => {
    if (!serverUrl) { return }
    appData.setDexServerUrl(serverUrl)
    await appData.updateLocalStorage({ dexServerUrl: serverUrl })
  }, [appData])

  const handleReset = () => {
    setSelectedServer(appData.defaultDexServerUrl)
  }

  // Add onSaveServer to onSubmitRef
  // This is used to submit the form when the user clicks the  global save button
  useEffect(() => {
    if (onSubmitRef) {
      onSubmitRef.current = () => onSaveServer(selectedServer)
    }
  }, [selectedServer, onSubmitRef, onSaveServer])

  return (
    <>
      <Card className='m-3'>
        <Card.Body>

          <Row className='justify-content-center'>
            <Col xs={12} md={6}>
              <p>
                Enter the DEX server URL below.
              </p>
              <div className='d-flex'>
                <Form.Control
                  type='text'
                  value={selectedServer}
                  onChange={handleServerChange}
                  className='mb-3'
                  defaultValue={appData.defaultDexServerUrl}
                  placeholder='Enter server URL'
                />
                <button
                  className='btn btn-outline-secondary mb-3 ms-2'
                  onClick={handleReset}
                  title='Reset to default'
                >
                  <FontAwesomeIcon icon={faArrowRotateLeft} />
                </button>
              </div>
            </Col>
          </Row>

          <Row className='justify-content-center mt-3'>
            <Col xs={12} md={6} className='text-center'>
              <button
                className='btn btn-primary'
                style={{ minWidth: '100px' }}
                onClick={() => { onSaveServer(selectedServer) }}
                disabled={!selectedServer}
              >
                Save
              </button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </>
  )
}

export default SelectDexServerView
