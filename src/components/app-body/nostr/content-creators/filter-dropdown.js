import React from 'react'
import { Dropdown } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFilter } from '@fortawesome/free-solid-svg-icons'

function FilterDropdown (props) {
  const { selectedFilter, setSelectedFilter } = props

  return (
    <Dropdown>
      <Dropdown.Toggle variant='outline-secondary' className='d-flex align-items-center gap-2'>
        <FontAwesomeIcon icon={faFilter} />
        <span>{selectedFilter}</span>
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Item onClick={() => setSelectedFilter('Most Followers')}>
          Most Followers
        </Dropdown.Item>
        <Dropdown.Item onClick={() => setSelectedFilter('Most Tokens')}>
          Most Tokens
        </Dropdown.Item>
        <Dropdown.Item onClick={() => setSelectedFilter('Most Likes')}>
          Most Likes
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  )
}

export default FilterDropdown
