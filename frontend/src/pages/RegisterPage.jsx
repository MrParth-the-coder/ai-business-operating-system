import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, TextField, Typography } from '@mui/material'
import { Link, useNavigate } from 'react-router-dom'
import api, { getAccessToken, setTokens } from '../lib/auth'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', name: '', phone: '', password: '', password_confirm: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (getAccessToken()) {
      navigate('/dashboard')
    }
  }, [navigate])

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.password_confirm) {
      setError('Passwords must match.')
      return
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    try {
      await api.post('/auth/register/', form)
      const { data } = await api.post('/auth/login/', { email: form.email, password: form.password })
      setTokens(data)
      navigate('/company-setup')
    } catch (err) {
      const responseData = err.response?.data
      if (responseData) {
        const errorMessage = responseData.detail
          || responseData.non_field_errors?.[0]
          || responseData.password?.[0]
          || responseData.password_confirm?.[0]
          || responseData.email?.[0]
          || responseData.name?.[0]
          || responseData.phone?.[0]
        setError(errorMessage || 'Registration failed.')
      } else {
        setError('Registration failed.')
      }
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', p: 3 }}>
      <Card sx={{ width: '100%', maxWidth: 480 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>Register</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2 }}>
            <TextField label="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <TextField label="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <TextField label="Confirm Password" type="password" required value={form.password_confirm} onChange={(e) => setForm({ ...form, password_confirm: e.target.value })} />
            <Button type="submit" variant="contained">Create account</Button>
          </Box>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Already have an account? <Link to="/login">Log in</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
