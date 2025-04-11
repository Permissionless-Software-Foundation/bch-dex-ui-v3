/*
  This Card component summarizes an SLP token.
*/

// Global npm libraries
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card } from 'react-bootstrap'
import Jdenticon from '@chris.troutner/react-jdenticon'

// Local libraries
import InfoButton from './info-button'
import BuyButton from './buy-button'

function TokenCard (props) {
  const { token, appData, handleRefresh } = props
  const [icon, setIcon] = useState(token.icon)
  const [tokenData, setTokenData] = useState(token.tokenData)

  console.log('TokenCard() appData: ', appData)

  // Update icon state every token.icon and token.tokenData changes
  useEffect(() => {
    setIcon(token.icon)
    setTokenData(token.tokenData)
  }, [token.icon, token.tokenData])

  return (
    <>
      <Col xs={12} sm={6} lg={4} style={{ padding: '25px' }}>
        <Card>
          <Card.Body style={{ textAlign: 'center' }}>
            {/** If the icon is loaded, display it */
              icon && (
                <Card.Img
                  src={icon}
                  style={{ height: '100px', width: 'auto' }}
                  onError={(e) => {
                    setIcon(null) // Set the icon to null if it fails to load the image url.
                  }}
                />
              )
            }

            {/** If the icon is not loaded, display the Jdenticon   */
              !icon && (
                <Jdenticon size='100' value={token.tokenId} />
              )
            }
            <Card.Title style={{ textAlign: 'center', marginTop: '10px' }}>
              <h4>{token.ticker}</h4>
            </Card.Title>

            <Container>
              <Row>
                <Col>
                  {tokenData && tokenData.genesisData ? tokenData.genesisData.name : null}
                </Col>
              </Row>
              <br />

              <Row>
                <Col>Price:</Col>
                <Col>{token.usdPrice}</Col>
              </Row>
              <br />

              <Row>
                <Col>
                  <InfoButton token={token} disabled={!token.tokenData} />
                </Col>

                <Col />

                <Col>
                  <BuyButton token={token} disabled={!token.tokenData} appData={appData} onSuccess={handleRefresh} />
                </Col>
              </Row>

            </Container>
          </Card.Body>
        </Card>
      </Col>
    </>
  )
}
// eslint-disable-next-line
{/* <Col>
                  <InfoButton token={props.token} />
                </Col>

                <Col>
                  <FlagButton appData={props.appData} offer={props.token} />
                </Col>

                <Col>
                  <BuyNftButton appData={props.appData} offer={props.token} />
                </Col> */ }

export default TokenCard
