import React from 'react'
import { Container } from 'react-bootstrap'
import ContentCreatorsList from './content-creators-list.js'

function ContentCreators (props) {
  return (
    <>
      <Container>
        <ContentCreatorsList {...props} />
      </Container>
    </>
  )
}

export default ContentCreators
