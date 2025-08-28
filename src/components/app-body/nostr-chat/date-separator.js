/*
  Component for displaying date separators between message groups.
*/

// Global npm libraries
import React from 'react'

function DateSeparator (props) {
  const { date } = props

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }

  return (
    <div className='text-center my-4'>
      <div
        className='d-inline-block px-3 py-1 rounded-pill'
        style={{
          backgroundColor: '#e9ecef',
          color: '#6c757d',
          fontSize: '12px',
          fontWeight: '500'
        }}
      >
        {formatDate(date)}
      </div>
    </div>
  )
}

export default DateSeparator
