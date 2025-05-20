import React, { useState, useEffect } from 'react'
import { Form, Button, Row, Col, Alert, Collapse, Card, Spinner } from 'react-bootstrap'
import axios from 'axios'
import config from '../../../config'

const ChangePasswordView = ({ appData }) => {
  // Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [error, setError] = useState('') // Error
  const [success, setSuccess] = useState('') // Success
  const [onFetch, setOnFetch] = useState(false) // Loading
  const [open, setOpen] = useState(false) // Collapse

  // Form Handlers
  const handleChange = (e) => {
    const { name, value } = e.target
    const values = { ...passwordData }
    values[name] = value
    setPasswordData(values)
    setError('')
  }

  // Reset Form  after collapse
  useEffect(() => {
    if (open) {
      setSuccess('')
      resetForm()
    }
  }, [open])

  const validatePassword = () => {
    // Basic validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      throw new Error('All fields are required')
    }

    // Check if new password and confirm password match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      throw new Error('New passwords do not match')
    }
  }

  // Call auth endpoint
  const auth = async (e) => {
    const userData = appData.userData
    console.log(userData)

    const password = passwordData.currentPassword
    const options = {
      url: `${config.dexServer}/auth`,
      method: 'POST',
      data: {
        email: userData.email,
        password
      }
    }

    const response = await axios(options)
    return response.data
  }
  // Call update user endpoint
  const updatePassword = async (e) => {
    const { _id, token } = appData.userData
    console.log(token)
    const options = {
      url: `${config.dexServer}/users/${_id}`,
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {
        user: {
          password: passwordData.newPassword
        }
      }
    }
    const response = await axios(options)
    return response.data
  }

  const handleSubmit = async (e) => {
    try {
      e.preventDefault()
      // Validate Form values
      validatePassword()

      // Set Loading
      setOnFetch(true)

      // Auth before update
      await auth()
      // Call update user endpoint
      await updatePassword()
      // Set Success
      setSuccess('Success')
      // Reset Form
      resetForm()
    } catch (error) {
      setSuccess('')
      setOnFetch('')
      // Set Error
      setError(error.message)
    }
  }

  // Reset Form
  const resetForm = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setError('')
    setOnFetch(false)
  }

  return (
    <Card className='m-3 mb-4 pt-4 pb-4'>

      <Row className='justify-content-center'>
        <Col md={6}>
          <h2 className='mb-4 text-center'>Change Password</h2>

          <div className='d-grid gap-2 mb-3'>
            <Button
              onClick={() => setOpen(!open)}
              aria-controls='change-password-form'
              aria-expanded={open}
              variant='outline-primary'
            >
              {open ? 'Hide' : 'Update Password'}
            </Button>
          </div>

          <Collapse in={open}>
            <div id='change-password-form'>

              <Form onSubmit={handleSubmit}>
                <Form.Group className='mb-3'>
                  <Form.Label>Current Password</Form.Label>
                  <Form.Control
                    type='password'
                    id='currentPassword'
                    name='currentPassword'
                    value={passwordData.currentPassword}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className='mb-3'>
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type='password'
                    id='newPassword'
                    name='newPassword'
                    value={passwordData.newPassword}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className='mb-3'>
                  <Form.Label>Confirm New Password</Form.Label>
                  <Form.Control
                    type='password'
                    id='confirmPassword'
                    name='confirmPassword'
                    value={passwordData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                {error && <Alert variant='danger'>{error}</Alert>}
                {success && <Alert variant='success'>{success}</Alert>}

                {!onFetch && (
                  <div className='d-grid gap-2'>
                    <Button variant='primary' type='submit'>
                      Change Password
                    </Button>
                  </div>
                )}
                {onFetch && (
                  <div className='d-flex justify-content-center align-items-center'>
                    <Spinner animation='border' variant='primary' />
                  </div>
                )}
              </Form>
            </div>
          </Collapse>
        </Col>
      </Row>
    </Card>
  )
}

export default ChangePasswordView
