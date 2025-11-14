/*
  Component for displaying a list of direct messages
*/

// Global npm libraries
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Spinner, Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrashAlt, faCheck } from '@fortawesome/free-solid-svg-icons'

// Local libraries
import config from '../../../config'

// Global variables and constants
const SERVER = `${config.dexServer}/`

function AdminDeleteBtn (props) {
  const { appData, pubkey, npub, eventId, deleteType, deletedData, refreshDeletedData } = props
  const { userData } = appData

  const [onFetch, setOnFetch] = useState(false)
  const [deleted, setDeleted] = useState(false)

  // Check if the message was already deleted
  useEffect(() => {
    if (!deletedData || !Array.isArray(deletedData)) {
      return
    }
    const exist = deletedData.find(val => val.eventId === eventId)
    if (exist) {
      setDeleted(true)
    }
  }, [deletedData, eventId])

  // REST request to handle delete
  const deleteChat = async () => {
    try {
      setOnFetch(true)
      let bchAddr = ''
      try {
        const npubToBchUrl = `${SERVER}sm/npub/${npub}`
        const response = await axios.get(npubToBchUrl)
        bchAddr = response.data?.bchAddr
      } catch (error) { }

      const options = {
        method: 'POST',
        url: `${SERVER}nostr/deletedChat`,
        headers: {
          Authorization: `Bearer ${userData.token}`
        },
        data: {
          npub,
          pubkey,
          bchAddr,
          eventId
        }
      }
      const result = await axios.request(options)
      if (refreshDeletedData) await refreshDeletedData()
      setOnFetch(false)
      return result.data
    } catch (err) {
      console.warn('Error in delete() ', err)
      setOnFetch(false)
    }
  }

  // REST request to handle delete
  const deletePost = async () => {
    try {
      setOnFetch(true)
      let bchAddr = ''
      try {
        const npubToBchUrl = `${SERVER}sm/npub/${npub}`
        const response = await axios.get(npubToBchUrl)
        bchAddr = response.data?.bchAddr
      } catch (error) { }

      const options = {
        method: 'POST',
        url: `${SERVER}nostr/deletedPost`,
        headers: {
          Authorization: `Bearer ${userData.token}`
        },
        data: {
          npub,
          pubkey,
          bchAddr,
          eventId
        }
      }
      const result = await axios.request(options)
      if (refreshDeletedData) await refreshDeletedData()
      setOnFetch(false)
      return result.data
    } catch (err) {
      console.warn('Error in delete() ', err)
      setOnFetch(false)
    }
  }

  const submitDelete = () => {
    if (deleteType === 'chat') {
      deleteChat()
    }
    if (deleteType === 'post') {
      deletePost()
    }
  }

  if (userData?.type !== 'admin') return null
  return (
    <Button
      variant='outline-danger'
      size='sm'
      onClick={submitDelete}
      disabled={deleted || onFetch}
      style={{
        minWidth: '32px',
        height: '28px',
        padding: '4px 8px',
        borderRadius: '6px',
        border: deleted ? '1px solid #6c757d' : '1px solid #dc3545',
        backgroundColor: deleted ? '#f8f9fa' : 'transparent',
        color: deleted ? '#6c757d' : '#dc3545',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        fontSize: '12px',
        fontWeight: 500,
        transition: 'all 0.2s ease-in-out',
        cursor: deleted || onFetch ? 'not-allowed' : 'pointer',
        opacity: deleted ? 0.6 : 1
      }}
      onMouseEnter={(e) => {
        if (!deleted && !onFetch) {
          e.currentTarget.style.color = '#dc3545'
        }
      }}
      onMouseLeave={(e) => {
        if (!deleted && !onFetch) {
          e.currentTarget.style.color = '#a8271e'
        }
      }}
    >
      {onFetch && <Spinner animation='border' size='sm' style={{ width: '12px', height: '12px' }} />}
      {!onFetch && !deleted && (
        <>
          <FontAwesomeIcon icon={faTrashAlt} style={{ fontSize: '11px' }} />
          <span>Delete</span>
        </>
      )}
      {!onFetch && deleted && (
        <>
          <FontAwesomeIcon icon={faCheck} style={{ fontSize: '11px' }} />
          <span>Deleted</span>
        </>
      )}
    </Button>
  )
}

export default AdminDeleteBtn
