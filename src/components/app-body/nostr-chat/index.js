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
  const { nostrQueries, bchWalletState } = appData
  const [messages, setMessages] = useState([])
  const [loadedMessages, setLoadedMessages] = useState(false)
  const [profiles, setProfiles] = useState({})
  const [channelsData, setChannelsData] = useState({})
  const [channelsLoaded, setChannelsLoaded] = useState(false)
  const [groupChannels] = useState(config.chatsId)
  const [dmChannels, setDmChannels] = useState([])
  const [dmListLoaded, setDmListLoaded] = useState(false)

  const [selectedChannel, setSelectedChannel] = useState(config.chatsId[0])
  const [selectedChannelIsDm, setSelectedChannelIsDm] = useState(false)

  const profilesRef = useRef({})
  const dmChannelsRef = useRef([])

  // Handle read messages
  const onMsgRead = useCallback(async (ev) => {
    try {
      // console.log('onMsgRead() msg: ', msg)

      // Update messages list
      setMessages(current => {
        // ignore existing messages
        const exist = current.find(val => val.id === ev.id)
        if (exist) return current

        const newMsgs = [...current]
        newMsgs.push(ev)

        // Sort messages by timestamp
        newMsgs.sort((a, b) => b.created_at - a.created_at)
        return newMsgs.reverse()
      })

      // Fetch message owner profile
      const pubKey = ev.pubkey
      const existProfile = profilesRef.current[ev.pubkey]
      if (existProfile) {
        return
      }
      const npub = await appData.nostrQueries.hexToNpub(pubKey)

      console.log(`Trying to get ${pubKey} profile.`)

      const defaultProfile = { name: npub } // default profile
      profilesRef.current[pubKey] = defaultProfile // update ref , to prevent fetch this profile again.
      // Fetch profile
      const nostrProfile = await appData.nostrQueries.getProfile(pubKey)

      const profile = nostrProfile || defaultProfile
      // add public key formats to profile object
      profile.pubKey = pubKey
      profile.npub = npub
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

  const decryptMsg = useCallback(async ({ ev, pubKey }) => {
    try {
      const encryptedMsg = ev.content
      const senderPubKey = pubKey

      const { nostrKeyPair } = appData.bchWalletState
      const { nostrQueries } = appData
      const decryptData = {
        receiverPrivKey: nostrKeyPair.privHex,
        senderPubKey,
        encryptedMsg
      }

      const decrptedMsg = await nostrQueries.decryptMsg(decryptData)

      ev.content = decrptedMsg
      onMsgRead(ev)
    } catch (error) {
      console.warn(error)
    }
  }, [appData, onMsgRead])

  // Handle nostr pool for group channels
  useEffect(() => {
    // fetch messages when channel selected and channel metadata are loaded
    if (!selectedChannel || !channelsLoaded || selectedChannelIsDm) return

    // Load messages for group channel
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
      if (!selectedChannelIsDm) {
        setLoadedMessages(true)
      }
    })

    pool.on('event', (relay, subId, ev) => {
      console.log('post retrieved from ', relay.url, ev.content)
      onMsgRead(ev)
    })

    return () => {
      // Close pool on component unmount or selected channel changes
      console.log('Close existing pool for group channel')
      pool.close()
    }
  }, [onMsgRead, selectedChannel, selectedChannelIsDm, nostrQueries, channelsLoaded])

  // Handle nostr pool for dm channels
  useEffect(() => {
    // fetch messages when channel selected and channel metadata are loaded
    console.log('selectedChannel', selectedChannel)
    console.log('selectedChannelIsDm', selectedChannelIsDm)

    if (!selectedChannel || !selectedChannelIsDm) return
    const { nostrKeyPair } = bchWalletState
    const dmPubKey = selectedChannel
    console.log('dmPubKey', selectedChannel)

    // Load messages for group channel
    const relays = nostrQueries.relays
    if (relays.length === 0) {
      return
    }

    const pool = RelayPool(relays)

    // const pool = RelayPool([config.nostrRelay])
    pool.on('open', relay => {
      relay.subscribe('REQ', [
        { limit: 10, kinds: [4], '#p': [nostrKeyPair.pubHex], authors: [dmPubKey] }, // received messages
        { limit: 10, kinds: [4], '#p': [dmPubKey], authors: [nostrKeyPair.pubHex] } // sent messages
      ])
    })

    pool.on('eose', relay => {
      if (selectedChannelIsDm) {
        setLoadedMessages(true)
      }
    })

    pool.on('event', (relay, subId, ev) => {
      console.log('post retrieved from ', relay.url, ev.content)
      // decrpt message
      if (ev.pubkey === nostrKeyPair.pubHex) {
        // Sent messages
        decryptMsg({ ev, pubKey: dmPubKey })
      } else {
        // Received messages
        decryptMsg({ ev, pubKey: ev.pubkey })
      }
    })

    return () => {
      // Close pool on component unmount or selected channel changes
      console.log('Close existing pool for private channel')
      pool.close()
    }
  }, [onMsgRead, selectedChannel, selectedChannelIsDm, nostrQueries, bchWalletState, decryptMsg])

  const handleIncomingDms = useCallback(async (pubKey) => {
    try {
      if (!dmListLoaded) return
      const exist = dmChannelsRef.current.find(val => val === pubKey)
      if (exist) return

      let profile = await nostrQueries.getProfile(pubKey)
      const npub = nostrQueries.hexToNpub(pubKey)
      if (!profile) profile = { name: npub }
      // add public key formats to profile object
      profile.pubKey = pubKey
      profile.npub = npub
      setProfiles(currentProfiles => {
        const newProfiles = { ...currentProfiles }
        newProfiles[pubKey] = profile
        profilesRef.current = newProfiles
        return newProfiles
      })
      setDmChannels(currentChs => {
        const newChs = [...currentChs]
        newChs.push(profile.pubKey)
        dmChannelsRef.current = newChs
        return newChs
      })
      setChannelsData(currentChs => {
        const newChs = { ...currentChs }
        newChs[profile.pubKey] = profile
        return newChs
      })
    } catch (error) {
      console.warn(error)
    }
  }, [nostrQueries, dmListLoaded])

  // Keep live NPI04  for new dms
  useEffect(() => {
    if (!dmListLoaded || !channelsLoaded) return
    const { bchWalletState } = appData
    const { nostrKeyPair } = bchWalletState
    const relays = nostrQueries.relays

    const pool = RelayPool(relays)
    // const pool = RelayPool([config.nostrRelay])
    pool.on('open', relay => {
      relay.subscribe('REQ', [
        { limit: 0, kinds: [4], '#p': [nostrKeyPair.pubHex] } // received messages
      ])
    })

    pool.on('event', (relay, subId, ev) => {
      console.log('New message received', ev)
      handleIncomingDms(ev.pubkey)
    })

    return () => {
      // Close pool on component unmount or selected channel changes
      console.log('Close existing pool for private channel')
      pool.close()
    }
  }, [handleIncomingDms, appData, nostrQueries, dmListLoaded, channelsLoaded])

  // Load Dm channels
  useEffect(() => {
    const loadCurrentDms = async () => {
      const { nostrKeyPair } = bchWalletState
      const dms = await appData.nostrQueries.getDms(nostrKeyPair.pubHex)
      console.log('dm list', dms)

      for (let i = 0; i < dms.length; i++) {
        const pubKey = dms[i]
        const npub = await appData.nostrQueries.hexToNpub(pubKey)

        const defaultProfile = { name: npub } // default profile
        profilesRef.current[pubKey] = defaultProfile // update ref , to prevent fetch this profile again.
        // Fetch profile
        const nostrProfile = await appData.nostrQueries.getProfile(pubKey)

        const profile = nostrProfile || defaultProfile
        // add public key formats to profile object
        profile.pubKey = pubKey
        profile.npub = npub
        // Update profiles state
        setProfiles(currentProfiles => {
          const newProfiles = { ...currentProfiles }
          newProfiles[pubKey] = profile
          profilesRef.current = newProfiles
          return newProfiles
        })
      }
      setDmChannels(dms)
      setDmListLoaded(true)
      dmChannelsRef.current = dms
    }

    loadCurrentDms()
  }, [bchWalletState, appData.nostrQueries])

  // Load public channels data
  useEffect(() => {
    const loadChData = async () => {
      const loadedChannels = []
      for (let i = 0; i < groupChannels.length; i++) {
        const ch = groupChannels[i]

        const exist = loadedChannels.find((val) => { return val === ch })
        if (exist) { continue }
        // Fech profile.
        let channelData = await appData.nostrQueries.getChannelInfo(ch)
        console.log('channelData', channelData)
        // Set short id as name
        if (!channelData) channelData = { name: ch.slice(0, 8) + '...' + ch.slice(-5) }
        loadedChannels.push(channelData)

        // Update channels data state
        setChannelsData(currentChs => {
          const newChs = { ...currentChs }
          newChs[ch] = channelData
          return newChs
        })
        setChannelsLoaded(true)
      }
    }

    // loadMessages()
    loadChData()
  }, [selectedChannel, appData, groupChannels])

  const addPrivateMessage = async (profile) => {
    try {
      const exist = dmChannels.find(val => val === profile.pubKey)
      setMessages([])
      setLoadedMessages(false)
      onChangeChannel(profile.pubKey)
      if (exist) return
      setDmChannels(currentChs => {
        const newChs = [...currentChs]
        newChs.push(profile.pubKey)
        dmChannelsRef.current = newChs
        return newChs
      })
      setChannelsData(currentChs => {
        const newChs = { ...currentChs }
        newChs[profile.pubKey] = profile
        return newChs
      })
    } catch (error) {
      console.warn(error)
    }
  }

  // Reset states on change channel
  const onChangeChannel = useCallback((ch) => {
    if (selectedChannel === ch) return
    setSelectedChannelIsDm(!!profiles[ch])
    setMessages([])
    setLoadedMessages(false)
    setSelectedChannel(ch)
  }, [selectedChannel, profiles])

  return (
    <>
      <Container fluid className='h-100 p-0 mb-5 '>
        <Row className='h-100 g-0'>
          <Col xs={12} md={4} lg={3} className='h-100'>
            <ChatSidebar
              groupChannels={groupChannels}
              dmChannels={dmChannels}
              selectedChannel={selectedChannel}
              selectedChannelIsDm={selectedChannelIsDm}
              profiles={profiles}
              channelsData={channelsData}
              onChangeChannel={onChangeChannel}
              dmListLoaded={dmListLoaded && channelsLoaded}
              {...props}
            />
          </Col>
          <Col xs={12} md={8} lg={9} className='h-100 pe-2'>
            <ChatMain
              loadedMessages={loadedMessages}
              selectedChannel={selectedChannel}
              selectedChannelIsDm={selectedChannelIsDm}
              messages={messages}
              profiles={profiles}
              channelsData={channelsData}
              dmListLoaded={dmListLoaded && channelsLoaded}
              onChangeChannel={onChangeChannel}
              addPrivateMessage={addPrivateMessage}
              {...props}
            />
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default NostrChat
