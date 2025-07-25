/**
 * Content creators card
 */

import React, { useState, useEffect } from 'react'
import { Card } from 'react-bootstrap'
import Jdenticon from '@chris.troutner/react-jdenticon'
import CopyOnClick from '../../bch-wallet/copy-on-click.js'
import FollowBtn from './follow-btn.js'

function ContentCard (props) {
  const { creator, followList, refreshFollowList } = props
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    setProfile(creator?.profile || {})
  }, [creator.profile])

  const goToProfile = () => {
    const profileUrl = `${window.location.origin}/profile/${creator.npub}`
    window.open(profileUrl, '_blank')
  }

  return (

    <>
      <Card className='mb-4 bg-light rounded-4 shadow-sm border-0'>
        <Card.Body className='p-4'>
          {/* Desktop Layout - Horizontal */}
          <div className='d-flex justify-content-end mb-2' onClick={goToProfile}>
            <small className='text-muted'>
              {new Date(creator.createdAt).toLocaleString()}
            </small>
          </div>
          <div className='d-none d-md-flex align-items-center gap-4 cursor-pointer'>
            {/* Profile Picture */}
            <div className='flex-shrink-0' onClick={goToProfile}>
              <Jdenticon size='140' value={creator.npub} />
            </div>

            {/* Creator Info */}
            <div className='flex-grow-1'>
              <h5 className='mb-2 fw-bold cursor-pointer' onClick={goToProfile}>{profile?.name}</h5>
              <p className='text-muted medium mb-3'>{profile?.about}</p>

              {/* Nostr Public Key */}
              <div className='mb-2'>
                <div className='d-flex align-items-center gap-2 mb-1'>
                  <small className='text-muted fw-semibold'>Nostr Public Key:</small>
                </div>
                <div className='d-flex align-items-center gap-2'>
                  <div className='text-break small text-secondary'>
                    {creator.npub}
                  </div>
                  <CopyOnClick
                    walletProp='npub'
                    appData={props.appData}
                    value={creator.npub}
                  />
                </div>
              </div>

              {/* BCH Address */}
              <div className='mb-3'>
                <div className='d-flex align-items-center gap-2 mb-1'>
                  <small className='text-muted fw-semibold'>BCH Address:</small>
                </div>
                <div className='d-flex align-items-center gap-2'>
                  <div className='text-break small text-secondary'>
                    {creator.bchAddr}
                  </div>
                  <CopyOnClick
                    walletProp='bchAddress'
                    appData={props.appData}
                    value={creator.bchAddr}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex-shrink-0 d-flex flex-column gap-2'>
              <FollowBtn
                creator={creator}
                appData={props.appData}
                creatorProfile={profile}
                followList={followList}
                refreshFollowList={refreshFollowList}

              />

              <button
                className='btn btn-primary btn-sm rounded-pill px-3'
                style={{ fontSize: '0.875rem', minWidth: '100px' }}
              >
                <i className='bi bi-chat-dots me-1' />
                Message
              </button>

              <div className='d-flex align-items-center justify-content-center gap-2 mt-2'>
                <span
                  className='badge rounded-pill bg-white border text-dark px-3 py-2 shadow-sm d-flex align-items-center gap-2'
                  style={{ fontSize: '1rem', fontWeight: 600, cursor: 'auto' }}
                >
                  <i className='bi bi-people-fill text-primary' style={{ fontSize: '1.2rem' }} />
                  <span style={{ fontWeight: 700 }}>{creator.followerCnt}</span>
                  <span className='text-muted' style={{ fontWeight: 400, fontSize: '0.9rem' }}>Followers</span>
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Layout - Vertical */}
          <div className='d-flex d-md-none flex-column align-items-center text-center'>
            {/* Profile Picture */}
            <div className='mb-3'>
              <Jdenticon size='100' value={creator.npub} onClick={goToProfile} />
            </div>

            {/* Creator Info */}
            <div className='w-100 mb-3'>
              <h5 className='mb-2 fw-bold' onClick={goToProfile}>{profile?.name}</h5>
              <p className='text-muted small mb-3'>{profile?.about}</p>

              {/* Nostr Public Key */}
              <div className='mb-3'>
                <div className='mb-1'>
                  <small className='text-muted fw-semibold'>Nostr Public Key:</small>
                </div>
                <div className='d-flex align-items-center justify-content-center gap-2'>
                  <div className='text-break small text-secondary' style={{ maxWidth: '200px' }}>
                    {creator.npub}
                  </div>
                  <CopyOnClick
                    walletProp='npub'
                    appData={props.appData}
                    value={creator.npub}
                  />
                </div>
              </div>

              {/* BCH Address */}
              <div className='mb-3'>
                <div className='mb-1'>
                  <small className='text-muted fw-semibold'>BCH Address:</small>
                </div>
                <div className='d-flex align-items-center justify-content-center gap-2'>
                  <div className='text-break small text-secondary' style={{ maxWidth: '200px' }}>
                    {creator.bchAddr}
                  </div>
                  <CopyOnClick
                    walletProp='bchAddress'
                    appData={props.appData}
                    value={creator.bchAddr}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='d-flex gap-2'>
              <FollowBtn
                creator={creator}
                appData={props.appData}
                creatorProfile={profile}
                followList={followList}
                refreshFollowList={refreshFollowList}
              />
              <button
                className='btn btn-primary btn-sm rounded-pill px-3'
                style={{ fontSize: '0.875rem' }}
              >
                <i className='bi bi-chat-dots me-1' />
                Message
              </button>
            </div>
            <div className='d-flex align-items-center justify-content-center gap-2 mt-2'>
              <span className='badge rounded-pill bg-white border text-dark px-3 py-2 shadow-sm d-flex align-items-center gap-2' style={{ fontSize: '1rem', fontWeight: 600 }}>
                <i className='bi bi-people-fill text-primary' style={{ fontSize: '1.2rem' }} />
                <span style={{ fontWeight: 700 }}>{creator.followerCnt}</span>
                <span className='text-muted' style={{ fontWeight: 400, fontSize: '0.9rem' }}>Followers</span>
              </span>
            </div>
          </div>
        </Card.Body>
      </Card>
    </>
  )
}

export default ContentCard
