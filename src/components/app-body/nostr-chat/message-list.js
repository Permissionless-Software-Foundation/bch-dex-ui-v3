/*
  Component for displaying the list of chat messages
*/

// Global npm libraries
import React, { useEffect, useState, useCallback } from 'react'

// Local libraries
import MessageItem from './message-item'
import DateSeparator from './date-separator'
import { Spinner } from 'react-bootstrap'

function MessageList (props) {
  const { messages, loadedMessages } = props
  const [groupedMessages, setGroupedMessages] = useState([])

  // Group messages by date
  const groupMessagesByDate = useCallback((messages) => {
    const grouped = {}
    messages.forEach((message, i) => {
      if (i === messages.length - 1) message.latest = true
      const date = new Date(message.created_at * 1000).toDateString()
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(message)
    })

    return grouped
  }, [])

  useEffect(() => {
    const grouped = groupMessagesByDate(messages)

    setGroupedMessages(grouped)
  }, [messages, groupMessagesByDate])

  return (
    <>
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar {
            width: 0 !important;
            display: none !important;
          }
          .hide-scrollbar {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
        `}
      </style>
      <div
        className='h-100 overflow-auto hide-scrollbar'
        style={{
          backgroundColor: '#f8f9fa',
          height: 'calc(100vh - 200px)',
          maxHeight: 'calc(100vh - 200px)'
        }}
      >
        {loadedMessages && (!messages || messages.length === 0) && (
          <div className='h-100 d-flex align-items-center justify-content-center'>
            <div className='text-center text-muted'>
              <p>No messages yet. Start the conversation!</p>
            </div>
          </div>
        )}

        {loadedMessages && messages && messages.length > 0 && (
          <div className='p-3' style={{ overflowY: 'auto', maxHeight: '50vh' }}>
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date}>
                <DateSeparator date={date} />
                {dateMessages.map((message, index) => (
                  <MessageItem
                    key={`${message.id}-${index}`}
                    message={message}
                    totalMessages={messages.length}
                    messageIndex={index}
                    {...props}

                  />
                ))}
              </div>
            ))}
          </div>
        )}
        {!loadedMessages &&
          <div className='p-3' style={{ minHeight: '50vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Spinner animation='border' size='md' />

          </div>}

      </div>
    </>
  )
}

export default MessageList
