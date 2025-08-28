/*
  This component is a View that allows the user to manage Nostr relay settings.
*/

// Global npm libraries
import React, { useState } from 'react'
import { Row, Col, Form, Card, Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShareAlt, faTrashAlt } from '@fortawesome/free-solid-svg-icons'
function RelaySelectionView (props) {
  const { appData } = props
  const { relaysData, updateRelaysData, restoreRelaysData } = appData
  console.log('relaysData', relaysData)

  const [newRelayAddress, setNewRelayAddress] = useState('')

  const addRelay = (newRelay) => {
    const exist = relaysData.find(relay => relay.address === newRelay)
    if (!exist) {
      relaysData.push({ address: newRelay, read: true, write: true })
      updateRelaysData(relaysData)
    }
  }
  // Delete relay from relaysData array
  const deleteRelay = (relayToDelete) => {
    const index = relaysData.findIndex(relay => relay.address === relayToDelete.address)
    if (index !== -1) {
      relaysData.splice(index, 1)
      updateRelaysData(relaysData)
    }
  }
  const handleReadToggle = (relayToToggleRead) => {
    const index = relaysData.findIndex(relay => relay.address === relayToToggleRead.address)
    if (index !== -1) {
      relaysData[index].read = !relaysData[index].read
      updateRelaysData(relaysData)
    }
  }
  const handleWriteToggle = (relayToToggleWrite) => {
    const index = relaysData.findIndex(relay => relay.address === relayToToggleWrite.address)
    if (index !== -1) {
      relaysData[index].write = !relaysData[index].write
      updateRelaysData(relaysData)
    }
  }
  return (
    <>
      <Card className='m-3'>
        <Card.Body>
          <Row>
            <Col style={{ textAlign: 'center' }}>
              <h2>Nostr Relay Configuration</h2>
              <p>
                Manage your Nostr relay connections. Configure read and write permissions for each relay.
              </p>
            </Col>
          </Row>
          <hr />

          <Row className='mb-3'>
            <Col className='text-end'>
              <Button
                onClick={() => restoreRelaysData()}
                variant='outline-secondary'
                style={{ minWidth: '120px' }}
              >
                Restore defaults
              </Button>
            </Col>
          </Row>

          <Row>
            <Col>
              <div
                className='relay-table-container' style={{
                  backgroundColor: 'transparent',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <div
                  className='relay-table-header' style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    paddingBottom: '15px',
                    borderBottom: '2px solid #e9ecef'
                  }}
                >
                  <h5 style={{ margin: 0, color: '#495057', fontWeight: '600' }}>Relay Connections</h5>
                  <span style={{
                    fontSize: '0.85em',
                    color: '#6c757d',
                    backgroundColor: '#e9ecef',
                    padding: '4px 12px',
                    borderRadius: '20px'
                  }}
                  >
                    {relaysData.length} relays
                  </span>
                </div>

                <div className='relay-list'>
                  {relaysData.map((relay, index) => (
                    <div
                      key={`relay-${index}`} style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '12px',
                        border: '1px solid #e9ecef',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                      >
                        {/* Relay Address */}
                        <div style={{ flex: '1', minWidth: '200px' }}>
                          <div style={{
                            fontFamily: 'monospace',
                            fontSize: '0.9em',
                            color: '#495057',
                            fontWeight: '500',
                            wordBreak: 'break-all'
                          }}
                          >
                            {relay.address}
                          </div>
                        </div>

                        {/* Controls */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          flexWrap: 'wrap'
                        }}
                        >
                          {/* Read/Write Toggles */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            backgroundColor: '#f8f9fa',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #dee2e6'
                          }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                fontSize: '0.8em',
                                color: '#6c757d',
                                fontWeight: '500',
                                minWidth: '35px'
                              }}
                              >
                                Read
                              </span>
                              <Form.Check
                                type='switch'
                                onClick={() => handleReadToggle(relay)}
                                checked={relay.read}
                                className='mb-0'
                                style={{ margin: 0 }}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                fontSize: '0.8em',
                                color: '#6c757d',
                                fontWeight: '500',
                                minWidth: '35px'
                              }}
                              >
                                Write
                              </span>
                              <Form.Check
                                type='switch'
                                onClick={() => handleWriteToggle(relay)}
                                checked={relay.write}
                                className='mb-0'
                                style={{ margin: 0 }}
                              />
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Button
                              variant='outline-primary'
                              size='sm'
                              className='d-flex align-items-center gap-1'
                              style={{
                                minWidth: '65px',
                                fontSize: '0.8em',
                                padding: '4px 8px',
                                borderWidth: '1px'
                              }}
                            >
                              <FontAwesomeIcon icon={faShareAlt} size='xs' />
                              Share
                            </Button>
                            <Button
                              onClick={() => deleteRelay(relay)}
                              variant='outline-danger'
                              size='sm'
                              className='d-flex align-items-center gap-1'
                              style={{
                                minWidth: '65px',
                                fontSize: '0.8em',
                                padding: '4px 8px',
                                borderWidth: '1px'
                              }}
                            >
                              <FontAwesomeIcon icon={faTrashAlt} size='xs' />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Col>
          </Row>

          <Row className='mt-4'>
            <Col>
              <div
                className='add-relay-container' style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #e9ecef',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <div
                  className='add-relay-header' style={{
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #e9ecef'
                  }}
                >
                  <h6 style={{
                    margin: 0,
                    color: '#495057',
                    fontWeight: '600',
                    fontSize: '1rem'
                  }}
                  >
                    Add New Relay
                  </h6>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '0.85em',
                    color: '#6c757d'
                  }}
                  >
                    Enter the URL of a Nostr relay to add it to your configuration
                  </p>
                </div>

                <div
                  className='add-relay-form' style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'end'
                  }}
                >
                  <div style={{ flex: '1' }}>
                    <Form.Label
                      htmlFor='newRelayAddress'
                      style={{
                        fontSize: '0.9em',
                        fontWeight: '500',
                        color: '#495057',
                        marginBottom: '8px'
                      }}
                    >
                      Relay Address
                    </Form.Label>
                    <Form.Control
                      type='text'
                      id='newRelayAddress'
                      placeholder='wss://your-relay-address.com'
                      value={newRelayAddress}
                      onChange={(e) => setNewRelayAddress(e.target.value)}
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.9em',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        padding: '10px 12px'
                      }}
                    />
                  </div>
                  <Button
                    onClick={() => addRelay(newRelayAddress)}
                    variant='primary'
                    style={{
                      minWidth: '80px',
                      height: '38px',
                      borderRadius: '6px',
                      fontSize: '0.9em',
                      fontWeight: '500',
                      padding: '8px 16px'
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </>
  )
}

export default RelaySelectionView
