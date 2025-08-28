/**
 *  Nostr class for query into relay pools
 *
 */
import { RelayPool } from 'nostr'
import * as nip19 from 'nostr-tools/nip19'

export default class NostrQueries {
  constructor ({ relays }) {
    this.relays = relays || []
  }

  setRelays (relays) {
    this.relays = relays
  }

  npubToHex (npub) {
    const pubHexData = nip19.decode(npub)
    const pubHex = pubHexData.data
    return pubHex
  }

  // Load profile from nostr relays
  // It uses multiple relays. It will exit after the first successful retrieval
  // from any relay. If one relay fails, it will move on to the next one.
  async getProfile (pubHex) {
    try {
      if (this.relays.length === 0) {
        return false
      }
      for (let i = 0; i < this.relays.length; i++) {
        const profile = await new Promise((resolve) => {
          const relay = this.relays[i]
          // const pool = RelayPool(config.nostrRelays)
          const pool = RelayPool([relay])
          pool.on('open', relay => {
            relay.subscribe('subid', { limit: 5, kinds: [0], authors: [pubHex] })
          })

          pool.on('eose', relay => {
            relay.close()
            resolve(false)
          })

          pool.on('event', (relay, subId, ev) => {
            try {
              const profile = JSON.parse(ev.content)
              // console.log('profile', profile)
              console.log(`Profile found  for ${pubHex} at ${relay.url}`)
              resolve(profile)
            } catch (error) {
              resolve(false)
            }
            relay.close()
          })
          pool.on('error', (relay) => {
            relay.close()
            resolve(false)
          })
        })
        // Stop looking for profile if found
        if (profile) {
          return profile
        }
      }
    } catch (error) {
      console.warn(error)
    }
  }

  // Get Feeds by user pubkey
  async getUserFeeds (pubHex) {
    try {
      if (this.relays.length === 0) {
        return []
      }
      let feeds = await new Promise((resolve) => {
        let list = []
        const closedRelays = []

        const pool = RelayPool(this.relays)

        pool.on('open', relay => {
          relay.subscribe('subid', { limit: 5, kinds: [1], authors: [pubHex] })
        })

        pool.on('eose', relay => {
          relay.close()
          if (!closedRelays.includes(relay)) {
            closedRelays.push(relay)
          }
          // Resolve list if all relays are closed
          if (closedRelays.length === this.relays.length) {
            resolve(list)
          }
        })

        pool.on('event', (relay, subId, ev) => {
          list = [...list, ev]
        })
        pool.on('error', (relay) => {
          relay.close()
          if (!closedRelays.includes(relay)) {
            closedRelays.push(relay)
          } // Resolve list if all relays are closed
          if (closedRelays.length === this.relays.length) {
            resolve(list)
          }
        })
      })
      // Remove duplicated feeds
      feeds = feeds.filter((val, i, list) => {
        const existingIndex = list.findIndex(value => value.id === val.id)
        return existingIndex === i
      })

      // Sort from newest to oldest
      feeds.sort((a, b) => b.created_at - a.created_at)

      return feeds
    } catch (error) {
      console.warn(error)
    }
  }

  // Get global feeds
  async getGlobalFeeds () {
    try {
      if (this.relays.length === 0) {
        return []
      }

      let feeds = await new Promise((resolve, reject) => {
        let list = []
        const closedRelays = []

        const pool = RelayPool(this.relays)
        // const pool = RelayPool([config.nostrRelay])
        pool.on('open', relay => {
          relay.subscribe('REQ', { limit: 10, kinds: [1], '#t': ['slpdex-socialmedia'] })
        })

        pool.on('eose', relay => {
          relay.close()
          if (!closedRelays.includes(relay)) {
            closedRelays.push(relay)
          }
          // Resolve list if all relays are closed
          if (closedRelays.length === this.relays.length) {
            resolve(list)
          }
        })

        pool.on('event', (relay, subId, ev) => {
          console.log('post retrieved from ', relay.url, ev.sig)
          list = [...list, ev]
        })
        pool.on('error', (relay) => {
          relay.close()
          if (!closedRelays.includes(relay)) {
            closedRelays.push(relay)
          }
          // Resolve list if all relays are closed
          if (closedRelays.length === this.relays.length) {
            resolve(list)
          }
        })
      })

      // Remove duplicated feeds
      feeds = feeds.filter((val, i, list) => {
        const existingIndex = list.findIndex(value => value.id === val.id)
        return existingIndex === i
      })

      // Sort from newest to oldest
      feeds.sort((a, b) => b.created_at - a.created_at)

      // console.log('feeds', feeds)

      return feeds
    } catch (error) {
      console.warn(error)
    }
  }

  // Get follow list by pubkey
  async getFollowList (pubHex) {
    if (this.relays.length === 0) {
      return []
    }
    return new Promise((resolve, reject) => {
      let list = []
      const closedRelays = []

      const pool = RelayPool(this.relays)
      // const pool = RelayPool([config.nostrRelay])
      pool.on('open', relay => {
        relay.subscribe('subid', { limit: 1, kinds: [3], authors: [pubHex] })
      })

      pool.on('eose', relay => {
        relay.close()
        if (!closedRelays.includes(relay)) {
          closedRelays.push(relay)
        }
        // Resolve list if all relays are closed
        if (closedRelays.length === this.relays.length) {
          resolve(list)
        }
      })

      pool.on('event', (relay, subId, ev) => {
        // console.log('Received event:', ev)
        // Merge list received from all relays
        list = [...list, ...ev.tags]
      })
      pool.on('error', (relay) => {
        relay.close()
        if (!closedRelays.includes(relay)) {
          closedRelays.push(relay)
        }
        // Resolve list if all relays are closed
        if (closedRelays.length === this.relays.length) {
          resolve(list)
        }
      })
    })
  }

  // Get event likes
  async getPostLikes (postId) {
    try {
      if (this.relays.length === 0) {
        return []
      }
      let likesRes = await new Promise((resolve) => {
        const likes = []
        const closedRelays = []

        const pool = RelayPool(this.relays)
        pool.on('open', relay => {
          relay.subscribe('subid', { kinds: [7], '#e': [postId] })
        })

        pool.on('eose', relay => {
          relay.close()
          if (!closedRelays.includes(relay)) {
            closedRelays.push(relay)
          }
          // Resolve list if all relays are closed
          if (closedRelays.length === this.relays.length) {
            resolve(likes)
          }
        })

        pool.on('event', (relay, subId, ev) => {
          try {
            // Count likes
            if (ev.content === '+' || ev.content === '-') {
              likes.push(ev)
            }
          } catch (error) {
            // skip error
          }
        })
        pool.on('error', (relay) => {
          relay.close()
          if (!closedRelays.includes(relay)) {
            closedRelays.push(relay)
          }
          // Resolve list if all relays are closed
          if (closedRelays.length === this.relays.length) {
            resolve(likes)
          }
        })
      })

      // Remove duplicated events
      likesRes = likesRes.filter((val, i, list) => {
        const existingIndex = list.findIndex(value => value.id === val.id)
        return existingIndex === i
      })
      // Get likes
      const likesArr = likesRes.filter((val, i, list) => {
        return val.content === '+'
      })

      // Get dislikes
      const dislikesArr = likesRes.filter((val, i, list) => {
        return val.content === '-'
      })
      // For every user dislike remove a user like from the array
      for (let i = 0; i < dislikesArr.length; i++) {
        const disLike = dislikesArr[i]
        const likeExist = likesArr.findIndex(val => val.pubkey === disLike.pubkey)
        if (likeExist >= 0) likesArr.splice(likeExist, 1)
      }
      // Return array of likes.
      return likesArr
    } catch (error) {
      console.warn(error)
    }
  }

  async getChannelInfo (channelId) {
    try {
      if (this.relays.length === 0) {
        return false
      }
      for (let i = 0; i < this.relays.length; i++) {
        const info = await new Promise((resolve) => {
          const relay = this.relays[i]
          // const pool = RelayPool(config.nostrRelays)
          const pool = RelayPool([relay])
          pool.on('open', relay => {
            relay.subscribe('REQ', { limit: 1, kinds: [41], '#e': [channelId] })
          })

          pool.on('eose', relay => {
            relay.close()
            resolve(false)
          })

          pool.on('event', (relay, subId, ev) => {
            try {
              const chInfo = JSON.parse(ev.content)
              resolve(chInfo)
            } catch (error) {
              resolve(false)
            }
            relay.close()
          })
          pool.on('error', (relay) => {
            relay.close()
            resolve(false)
          })
        })
        // Stop looking for profile if found
        if (info) {
          return info
        }
      }
    } catch (error) {
      console.warn(error)
    }
  }

  catch (error) {
    console.warn(error)
  }
}
