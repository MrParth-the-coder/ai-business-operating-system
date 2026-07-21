import { useState } from 'react'
import { Alert, Box, Button, Card, CardContent, CircularProgress, Stack, TextField, Typography } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'
import api from '../lib/auth'

export default function VerifyEmailPage() {
  const location = useLocation()
  const initialEmail = location.state?.email || ''
  const [form, setForm] = useState({ email: initialEmail, token: location.state?.token || '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)
    try {
      await api.post('/auth/verify-email/confirm/', form)
      setMessage('Email verified successfully. You can now log in.')
      setForm({ email: '', token: '' })
    } catch (err) {
      const responseData = err.response?.data
      const errDetail = responseData?.detail || responseData?.token?.[0] || 'Unable to verify email.'
      setError(errDetail)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at top left, #c7d2fe 0%, #f8fafc 45%, #eef2ff 100%)', p: 3 }}>
      <Card sx={{ width: '100%', maxWidth: 520, borderRadius: 4, boxShadow: '0 20px 60px rgba(15, 23, 42, 0.12)' }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={1} sx={{ mb: 3 }}>
            <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>ACCOUNT VERIFICATION</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Verify Your Email</Typography>
            <Typography color="text.secondary">Enter your email and the verification token sent to your address to activate your account.</Typography>
          </Stack>
          {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Email Address"
              required
              disabled={isSubmitting}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <TextField
              label="Verification Token"
              required
              disabled={isSubmitting}
              value={form.token}
              onChange={(e) => setForm({ ...form, token: e.target.value })}
            />
            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Verify Email'}
            </Button>
          </Box>
          <Stack spacing={1.5} sx={{ mt: 3 }}>
            <Typography variant="body2">
              Need a new token? <Link to="/forgot-password">Request verification/reset</Link>
            </Typography>
            <Typography variant="body2">
              Back to <Link to="/login">Login</Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
