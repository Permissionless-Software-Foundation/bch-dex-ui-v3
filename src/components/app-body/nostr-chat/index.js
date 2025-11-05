/*
  Component for Nostr Chat functionality
*/

// Global npm libraries
import React, { useCallback, useEffect, useState, useRef } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import NostrRestClient, { generateSubId } from '../../../services/nostr-rest-client.js'
import axios from 'axios'

// Local libraries
import ChatSidebar from './chat-sidebar'
import ChatMain from './chat-main'
import config from '../../../config'

// Global variables and constants
const SERVER = `${config.dexServer}/`

function NostrChat (props) {
  const { appData } = props
  const { nostrQueries, bchWalletState, startChannelChat } = appData
  // Initialize REST client for SSE subscriptions
  const restClient = useRef(new NostrRestClient())
  // Track active subscriptions for cleanup
  const subscriptionsRef = useRef({})

  const [messages, setMessages] = useState([])
  const [loadedMessages, setLoadedMessages] = useState(false)
  const [profiles, setProfiles] = useState({})
  const [channelsData, setChannelsData] = useState({})
  const [channelsLoaded, setChannelsLoaded] = useState(false)
  const [groupChannels] = useState(config.chatsId)
  const [dmChannels, setDmChannels] = useState([])
  const [dmListLoaded, setDmListLoaded] = useState(false)

  const [selectedChannel, setSelectedChannel] = useState(null)
  const [selectedChannelIsDm, setSelectedChannelIsDm] = useState(false)

  const [deletedChats, setDeletedChats] = useState(appData.nostrQueries.deletedChats || [])

  const profilesRef = useRef({})
  const dmChannelsRef = useRef([])

  // Reset states on change channel
  const onChangeChannel = useCallback((ch) => {
    if (selectedChannel === ch) return
    const profiles = profilesRef.current
    setSelectedChannelIsDm(!!profiles[ch])
    setMessages([])
    setLoadedMessages(false)
    setSelectedChannel(ch)
  }, [selectedChannel])

  // Add a new DM to the list
  const addPrivateMessage = useCallback(async (profile) => {
    try {
      const exist = dmChannelsRef.current.find(val => val === profile.pubKey)
      setMessages([])
      setLoadedMessages(false)
      onChangeChannel(profile.pubKey)
      if (exist) return
      setDmChannels(currentChs => {
        let newChs = [...currentChs]
        newChs.push(profile.pubKey)
        newChs = newChs.filter((val, i, list) => {
          const existingIndex = list.findIndex(value => value === val)
          return existingIndex === i
        })
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
  }, [onChangeChannel])

  // Define starter chat
  useEffect(() => {
    // Start dm if a initial chat is provided from props
    const startDM = async (pubKey) => {
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
      await addPrivateMessage(profile)
    }

    if (selectedChannel) return
    if (!startChannelChat) {
      // Set group chat as initial chat
      setSelectedChannel(config.chatsId[0])
      setSelectedChannelIsDm(false)
    } else if (dmListLoaded) {
      // Set provided profile as initial chat
      startDM(startChannelChat)
    }
  }, [appData, startChannelChat, dmListLoaded, addPrivateMessage, selectedChannel])

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

  // Handle SSE subscription for group channels
  useEffect(() => {
    // fetch messages when channel selected and channel metadata are loaded
    if (!selectedChannel || !channelsLoaded || selectedChannelIsDm) return

    // wait for deleted chats
    if (!deletedChats || !Array.isArray(deletedChats)) return

    // Create subscription for group channel messages
    const subId = generateSubId(`group-${selectedChannel}`)
    const filter = { limit: 10, kinds: [42], '#e': [selectedChannel] }

    // Track if EOSE has been called
    let eoseCalled = false
    let eoseTimeoutId = null

    const subscription = restClient.current.createSubscription(subId, filter, {
      onEvent: (ev) => {
        console.log('Group post retrieved from REST API', ev.content)
        const onBlackList = nostrQueries.blackList.find((val) => { return val === ev.pubkey })
        const isDeleted = deletedChats.find((val) => { return val.eventId === ev.id })
        if (!onBlackList && !isDeleted) {
          onMsgRead(ev)
        }
      },
      onEose: () => {
        eoseCalled = true
        if (eoseTimeoutId) {
          clearTimeout(eoseTimeoutId)
          eoseTimeoutId = null
        }
        if (!selectedChannelIsDm) {
          // Use setTimeout to ensure state updates from onEvent callbacks are processed
          // before setting loadedMessages to true
          setTimeout(() => {
            setLoadedMessages(true)
          }, 100)
        }
      },
      onClosed: (message) => {
        console.log('Group channel subscription closed:', message)
      },
      onError: (error) => {
        console.warn('Group channel subscription error:', error)
      }
    })

    subscriptionsRef.current[subId] = subscription

    // Set up EOSE timeout fallback - if EOSE doesn't arrive within 10 seconds, set loadedMessages anyway
    const EOSE_TIMEOUT_MS = 10000 // 10 seconds
    eoseTimeoutId = setTimeout(() => {
      if (!eoseCalled && !selectedChannelIsDm) {
        console.warn(`EOSE timeout reached for subscription ${subId} - setting loadedMessages to true`)
        setLoadedMessages(true)
      }
    }, EOSE_TIMEOUT_MS)

    // Capture values for cleanup
    const subscriptionsRefValue = subscriptionsRef.current
    const restClientValue = restClient.current

    return () => {
      // Clear EOSE timeout if it exists
      if (eoseTimeoutId) {
        clearTimeout(eoseTimeoutId)
      }
      // Close subscription on component unmount or selected channel changes
      console.log('Close existing subscription for group channel')
      if (subscriptionsRefValue[subId]) {
        subscriptionsRefValue[subId].close()
        delete subscriptionsRefValue[subId]
      }
      restClientValue.closeSubscription(subId).catch(err => {
        // Subscription already closed is not an error - this is expected behavior
        const errorMessage = err?.message || err?.toString() || ''
        if (!errorMessage.includes('not found') && !errorMessage.includes('already closed')) {
          console.warn('Error closing subscription:', err)
        }
      })
    }
  }, [onMsgRead, selectedChannel, selectedChannelIsDm, nostrQueries, channelsLoaded, deletedChats])

  // Handle SSE subscription for dm channels
  useEffect(() => {
    // fetch messages when channel selected and channel metadata are loaded

    if (!selectedChannel || !selectedChannelIsDm) return

    const { nostrKeyPair } = bchWalletState
    const dmPubKey = selectedChannel

    // Create subscription for DM channel messages
    const subId = generateSubId(`dm-${dmPubKey}`)
    // Use array of filters for multiple conditions
    const filters = [
      { limit: 10, kinds: [4], '#p': [nostrKeyPair.pubHex], authors: [dmPubKey] }, // received messages
      { limit: 10, kinds: [4], '#p': [dmPubKey], authors: [nostrKeyPair.pubHex] } // sent messages
    ]

    // Track if EOSE has been called
    let eoseCalled = false
    let eoseTimeoutId = null

    const subscription = restClient.current.createSubscription(subId, filters, {
      onEvent: (ev) => {
        console.log('DM post retrieved from REST API', ev.content)
        // decrypt message
        if (ev.pubkey === nostrKeyPair.pubHex) {
          // Sent messages
          decryptMsg({ ev, pubKey: dmPubKey })
        } else {
          // Received messages
          decryptMsg({ ev, pubKey: ev.pubkey })
        }
      },
      onEose: () => {
        eoseCalled = true
        if (eoseTimeoutId) {
          clearTimeout(eoseTimeoutId)
          eoseTimeoutId = null
        }
        if (selectedChannelIsDm) {
          // Use setTimeout to ensure state updates from onEvent callbacks are processed
          // before setting loadedMessages to true
          setTimeout(() => {
            setLoadedMessages(true)
          }, 100)
        }
      },
      onClosed: (message) => {
        console.log('DM channel subscription closed:', message)
      },
      onError: (error) => {
        console.warn('DM channel subscription error:', error)
      }
    })

    subscriptionsRef.current[subId] = subscription

    // Set up EOSE timeout fallback - if EOSE doesn't arrive within 10 seconds, set loadedMessages anyway
    const EOSE_TIMEOUT_MS = 10000 // 10 seconds
    eoseTimeoutId = setTimeout(() => {
      if (!eoseCalled && selectedChannelIsDm) {
        console.warn(`EOSE timeout reached for subscription ${subId} - setting loadedMessages to true`)
        setLoadedMessages(true)
      }
    }, EOSE_TIMEOUT_MS)

    // Capture values for cleanup
    const subscriptionsRefValue = subscriptionsRef.current
    const restClientValue = restClient.current

    return () => {
      // Clear EOSE timeout if it exists
      if (eoseTimeoutId) {
        clearTimeout(eoseTimeoutId)
      }
      // Close subscription on component unmount or selected channel changes
      console.log('Close existing subscription for private channel')
      if (subscriptionsRefValue[subId]) {
        subscriptionsRefValue[subId].close()
        delete subscriptionsRefValue[subId]
      }
      restClientValue.closeSubscription(subId).catch(err => {
        // Subscription already closed is not an error - this is expected behavior
        const errorMessage = err?.message || err?.toString() || ''
        if (!errorMessage.includes('not found') && !errorMessage.includes('already closed')) {
          console.warn('Error closing subscription:', err)
        }
      })
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

  // Keep live subscription for new DMs
  useEffect(() => {
    if (!dmListLoaded || !channelsLoaded) return
    const { bchWalletState } = appData
    const { nostrKeyPair } = bchWalletState

    // Create subscription for new incoming DM notifications
    const subId = generateSubId('dm-notify')
    const filter = { limit: 0, kinds: [4], '#p': [nostrKeyPair.pubHex] } // received messages

    const subscription = restClient.current.createSubscription(subId, filter, {
      onEvent: (ev) => {
        console.log('New message received from REST API', ev)
        handleIncomingDms(ev.pubkey)
      },
      onEose: () => {
        // EOSE received, subscription is active
      },
      onClosed: (message) => {
        console.log('DM notification subscription closed:', message)
      },
      onError: (error) => {
        console.warn('DM notification subscription error:', error)
      }
    })

    subscriptionsRef.current[subId] = subscription

    // Capture values for cleanup
    const subscriptionsRefValue = subscriptionsRef.current
    const restClientValue = restClient.current

    return () => {
      // Close subscription on component unmount
      console.log('Close existing subscription for DM notifications')
      if (subscriptionsRefValue[subId]) {
        subscriptionsRefValue[subId].close()
        delete subscriptionsRefValue[subId]
      }
      restClientValue.closeSubscription(subId).catch(err => {
        // Subscription already closed is not an error - this is expected behavior
        const errorMessage = err?.message || err?.toString() || ''
        if (!errorMessage.includes('not found') && !errorMessage.includes('already closed')) {
          console.warn('Error closing subscription:', err)
        }
      })
    }
  }, [handleIncomingDms, appData, nostrQueries, dmListLoaded, channelsLoaded])

  // Load Dm channels
  useEffect(() => {
    const loadCurrentDms = async () => {
      const { nostrQueries, bchWalletState } = appData
      const { nostrKeyPair } = bchWalletState
      if (!nostrKeyPair?.pubHex) return
      const dms = await appData.nostrQueries.getDms(nostrKeyPair.pubHex)
      setDmChannels(currentChs => {
        let newChs = [...currentChs, ...dms]
        newChs = newChs.filter((val, i, list) => {
          const existingIndex = list.findIndex(value => value === val)
          return existingIndex === i
        })
        dmChannelsRef.current = newChs
        return newChs
      })
      setDmListLoaded(true)

      console.log('dm list', dms)

      for (let i = 0; i < dms.length; i++) {
        const pubKey = dms[i]
        const npub = await nostrQueries.hexToNpub(pubKey)

        const defaultProfile = { name: npub } // default profile
        profilesRef.current[pubKey] = defaultProfile // update ref , to prevent fetch this profile again.
        // Fetch profile
        const nostrProfile = await nostrQueries.getProfile(pubKey)

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
    }

    if (!dmListLoaded) loadCurrentDms()
  }, [appData, dmListLoaded])

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

    loadChData()
  }, [selectedChannel, appData, groupChannels])

  // Get all deleted chats
  const fetchDeletedChats = useCallback(async () => {
    try {
      const options = {
        method: 'GET',
        url: `${SERVER}nostr/deletedChat`
      }
      const result = await axios.request(options)
      const { deletedChats } = result.data
      console.log('deletedChats', deletedChats)
      setDeletedChats(deletedChats)
    } catch (error) {
      console.error(error)
    }
  }, [])

  // Get deleted chats when the component was mounted.
  useEffect(() => {
    fetchDeletedChats()
  }, [fetchDeletedChats])

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
              deletedChats={deletedChats}
              refreshDeletedChats={fetchDeletedChats}
              {...props}
            />
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default NostrChat
