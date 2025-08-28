/*
  Component for Nostr Chat functionality
*/

// Global npm libraries
import React, { useCallback, useEffect, useState, useRef } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { RelayPool } from 'nostr'

// Local libraries
import ChatSidebar from './chat-sidebar'
import ChatMain from './chat-main'
import config from '../../../config'

function NostrChat (props) {
  const { appData } = props
  const { nostrQueries } = appData
  const [messages, setMessages] = useState([])
  const [loadedMessages, setLoadedMessages] = useState(false)
  const [profiles, setProfiles] = useState({})
  const [channelsData, setChannelsData] = useState({})
  const [channels] = useState(config.chatsId)

  const [selectedChannel, setSelectedChannel] = useState(config.chatsId[0])
  const profilesRef = useRef({})

  // Handle read messages
  const onMsgRead = useCallback(async (msg) => {
    try {
      // console.log('onMsgRead() msg: ', msg)

      // Update messages list
      setMessages(current => {
        // ignore existing messages
        const exist = current.find(val => val.id === msg.id)
        if (exist) return current

        const newMsgs = [...current]
        newMsgs.push(msg)

        // Sort messages by timestamp
        newMsgs.sort((a, b) => b.created_at - a.created_at)
        return newMsgs.reverse()
      })

      // Fetch message owner profile
      const pubKey = msg.pubkey
      const existProfile = profilesRef.current[msg.pubkey]
      if (existProfile) {
        return
      }

      // Fetch profile.
      let profile = await appData.nostrQueries.getProfile(pubKey)
      if (!profile) profile = { name: pubKey }

      // Update profiles state
      setProfiles(currentProfiles => {
        const newProfiles = { ...currentProfiles }
        newProfiles[pubKey] = profile
        profilesRef.current = newProfiles
        return newProfiles
      })
    } catch (error) {
      console.warn(error)
    }
  }, [appData, profilesRef])

  // Handle nostr pool
  useEffect(() => {
    if (!selectedChannel) return

    const relays = nostrQueries.relays
    if (relays.length === 0) {
      return
    }

    const pool = RelayPool(relays)

    // const pool = RelayPool([config.nostrRelay])
    pool.on('open', relay => {
      relay.subscribe('REQ', { limit: 10, kinds: [42], '#e': [selectedChannel] })
    })

    pool.on('eose', relay => {
      setLoadedMessages(true)
    })

    pool.on('event', (relay, subId, ev) => {
      console.log('post retrieved from ', relay.url, ev.content)
      onMsgRead(ev)
    })

    return () => {
      // Close pool on component unmount or selected channel changes
      console.log('Close existing pool')
      pool.close()
    }
  }, [onMsgRead, selectedChannel, nostrQueries])

  // Load channels data
  useEffect(() => {
    const loadChData = async () => {
      const loadedChannels = []
      for (let i = 0; i < channels.length; i++) {
        const ch = channels[i]

        const exist = loadedChannels.find((val) => { return val === ch })
        if (exist) { continue }
        // Fech profile.
        let channelData = await appData.nostrQueries.getChannelInfo(ch)
        console.log('channelData', channelData)
        // Set short id as name
        if (!channelData) channelData = { name: ch.slice(0, 8) + '...' + ch.slice(-5) }
        loadedChannels.push(channelData)

        // Update profile state
        setChannelsData(currentChs => {
          const newChs = { ...currentChs }
          newChs[ch] = channelData
          return newChs
        })
      }
    }

    // loadMessages()
    loadChData()
  }, [selectedChannel, appData, channels])

  // Reset states on change channel
  const onChangeChannel = useCallback((ch) => {
    setSelectedChannel(ch)
    setMessages([])
    setLoadedMessages(false)
  }, [])

  return (
    <>
      <Container fluid className='h-100 p-0 mb-5 '>
        <Row className='h-100 g-0'>
          <Col xs={12} md={4} lg={3} className='h-100'>
            <ChatSidebar
              channels={channels}
              selectedChannel={selectedChannel}
              profiles={profiles}
              channelsData={channelsData}
              onChangeChannel={onChangeChannel}
              {...props}
            />
          </Col>
          <Col xs={12} md={8} lg={9} className='h-100 pe-2'>
            <ChatMain
              loadedMessages={loadedMessages}
              selectedChannel={selectedChannel}
              messages={messages}
              profiles={profiles}
              channelsData={channelsData}
              onChangeChannel={onChangeChannel}
              {...props}
            />
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default NostrChat
