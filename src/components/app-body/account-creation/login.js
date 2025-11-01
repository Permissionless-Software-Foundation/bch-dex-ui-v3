/*
  This component is used to login or sign up to the app.
*/

// Global npm libraries
import React, { useState } from 'react'
import { Form, Button, Container, Row, Col, Card, Alert, Tabs, Tab, Spinner } from 'react-bootstrap'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

// Local libraries
import config from '../../../config'

const Login = ({ appData }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [onFetch, setOnFetch] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('login')
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setError('')
    setFormData({
      email: '',
      password: ''
    })
  }

  const validateForm = ({ email }) => {
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address')
    }
  }
  // get user name from the email
  const getNameFromEmail = (email) => {
    return email.split('@')[0]
  }

  // Call auth endpoint
  const auth = async (e) => {
    const options = {
      url: `${config.dexServer}/auth`,
      method: 'POST',
      data: formData
    }

    const response = await axios(options)
    return response.data
  }
  // call create user endpoint
  const createUser = async (e) => {
    const options = {
      url: `${config.dexServer}/users`,
      method: 'POST',
      data: {
        user: {
          email: formData.email,
          password: formData.password,
          name: getNameFromEmail(formData.email)
        }
      }
    }
    const response = await axios(options)
    return response.data
  }

  const handleSubmit = async (e) => {
    try {
      console.log('Account creation submit')
      e.preventDefault()
      setOnFetch(true)
      setError('')
      validateForm(formData)

      let user
      if (activeTab === 'login') {
        user = await auth()
      } else {
        user = await createUser()
      }
      setOnFetch(false)
      // console.log('User ', user)

      // update local storage and user data state
      if (user) {
        const userData = {
          token: user.token,
          email: user.user.email,
          _id: user.user._id,
          mnemonic: user.user.mnemonic,
          type: user.user.type
        }
        appData.updateLocalStorage({
          userData
        })
        appData.setUserData(userData)
      }
      navigate('/')
      window.location.reload()
    } catch (err) {
      setOnFetch(false)
      let errMsg = err.message
      if (err.response && err.response.data) errMsg = err.response.data
      setError(errMsg)
    }
  }

  const renderForm = () => (
    <>
      {error && <Alert variant='danger'>{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className='mb-3'>
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type='email'
            name='email'
            placeholder='Enter email'
            value={formData.email}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className='mb-3'>
          <Form.Label>Password</Form.Label>
          <Form.Control
            type='password'
            name='password'
            placeholder='Password'
            value={formData.password}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Button variant='primary' type='submit' className='w-100'>
          {activeTab === 'login' ? 'Login' : 'Sign Up'}
        </Button>
      </Form>
    </>
  )

  return (
    <Container className='mt-5'>
      <Row className='justify-content-center'>
        <Col md={6}>
          <Card>
            <Card.Body style={{ minHeight: '300px' }}>
              {!onFetch && (
                <Tabs
                  activeKey={activeTab}
                  onSelect={handleTabChange}
                  className='mb-3'
                >
                  <Tab eventKey='login' title='Login'>
                    {renderForm()}
                  </Tab>
                  <Tab eventKey='signup' title='Sign Up'>
                    {renderForm()}
                  </Tab>
                </Tabs>
              )}
              {onFetch && (
                <div className='d-flex justify-content-center align-items-center' style={{ height: '100%', position: 'absolute', width: '100%', top: 0, left: 0 }}>
                  <Spinner animation='border' variant='primary' />
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

    </Container>
  )
}

export default Login
