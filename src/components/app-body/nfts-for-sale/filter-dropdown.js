import React from 'react'
import { Dropdown } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFilter } from '@fortawesome/free-solid-svg-icons'

function FilterDropdown (props) {
  const { selectedFilter, setSelectedFilter } = props

  return (
    <Dropdown>
      <Dropdown.Toggle
        variant='outline-secondary'
        className='d-flex align-items-center justify-content-around gap-2 mt-3'
        style={{ minWidth: '150px' }}
      >
        <FontAwesomeIcon icon={faFilter} />
        <span>{selectedFilter}</span>
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Item onClick={() => setSelectedFilter('Misc')}>
          Misc
        </Dropdown.Item>
        <Dropdown.Item onClick={() => setSelectedFilter('Art')}>
          Art
        </Dropdown.Item>
        <Dropdown.Item onClick={() => setSelectedFilter('Video')}>
          Video
        </Dropdown.Item>
        <Dropdown.Item onClick={() => setSelectedFilter('Writing')}>
          Writing
        </Dropdown.Item>
        <Dropdown.Item onClick={() => setSelectedFilter('Download')}>
          Download
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  )
}

export default FilterDropdown
