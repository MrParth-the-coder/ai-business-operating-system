import { useState } from 'react'
import { Alert, Box, Button, Card, CardContent, CircularProgress, Stack, TextField, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import api from '../lib/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)
    try {
      const { data } = await api.post('/auth/password-reset/', { email })
      setMessage(`Password reset token generated. Use the token to reset your password. Token: ${data.token}`)
    } catch (err) {
      setError(err.response?.data?.email?.[0] || err.response?.data?.detail || 'Unable to request password reset.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at top left, #c7d2fe 0%, #f8fafc 45%, #eef2ff 100%)', p: 3 }}>
      <Card sx={{ width: '100%', maxWidth: 520, borderRadius: 4, boxShadow: '0 20px 60px rgba(15, 23, 42, 0.12)' }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={1} sx={{ mb: 3 }}>
            <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>RECOVERY</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Reset your password</Typography>
            <Typography color="text.secondary">Enter your email and we will generate a temporary reset token.</Typography>
          </Stack>
          {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Email Address"
              type="email"
              required
              disabled={isSubmitting}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Request reset token'}
            </Button>
          </Box>
          <Stack spacing={1.5} sx={{ mt: 3 }}>
            <Typography variant="body2">
              Remembered your password? <Link to="/login">Log in</Link>
            </Typography>
            <Typography variant="body2">
              Have a token? <Link to="/reset-password">Reset Password</Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
