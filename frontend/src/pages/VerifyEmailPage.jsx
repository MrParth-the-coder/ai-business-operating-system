import { useState } from 'react'
import { Alert, Box, Button, Card, CardContent, TextField, Typography } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'
import api from '../lib/auth'

export default function VerifyEmailPage() {
  const location = useLocation()
  const initialEmail = location.state?.email || ''
  const [form, setForm] = useState({ email: initialEmail, token: location.state?.token || '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await api.post('/auth/verify-email/confirm/', form)
      setMessage('Email verified successfully. You can now log in.')
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.token || 'Unable to verify email.')
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', p: 3 }}>
      <Card sx={{ width: '100%', maxWidth: 480 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>Verify Email</Typography>
          {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <TextField
              label="Verification Token"
              required
              value={form.token}
              onChange={(e) => setForm({ ...form, token: e.target.value })}
            />
            <Button type="submit" variant="contained">Verify Email</Button>
          </Box>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Need a new token? <Link to="/forgot-password">Request verification/reset</Link>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Back to <Link to="/login">Login</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
