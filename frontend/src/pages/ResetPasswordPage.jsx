import { useState } from 'react'
import { Alert, Box, Button, Card, CardContent, CircularProgress, Stack, TextField, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import api from '../lib/auth'

export default function ResetPasswordPage() {
  const [form, setForm] = useState({ email: '', token: '', password: '', password_confirm: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (form.password !== form.password_confirm) {
      setError('Passwords do not match.')
      return
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setIsSubmitting(true)
    try {
      await api.post('/auth/password-reset/confirm/', form)
      setMessage('Password has been reset successfully. You may now log in.')
      setForm({ email: '', token: '', password: '', password_confirm: '' })
    } catch (err) {
      const responseData = err.response?.data
      const errDetail = responseData?.detail || responseData?.token?.[0] || responseData?.password?.[0] || responseData?.password_confirm?.[0] || 'Unable to reset password.'
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
            <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>UPDATE SECURITY</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Reset Password</Typography>
            <Typography color="text.secondary">Provide your email, the token you received, and your new password details.</Typography>
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
              label="Reset Token"
              required
              disabled={isSubmitting}
              value={form.token}
              onChange={(e) => setForm({ ...form, token: e.target.value })}
            />
            <TextField
              label="New Password"
              type="password"
              required
              disabled={isSubmitting}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <TextField
              label="Confirm Password"
              type="password"
              required
              disabled={isSubmitting}
              value={form.password_confirm}
              onChange={(e) => setForm({ ...form, password_confirm: e.target.value })}
            />
            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Confirm New Password'}
            </Button>
          </Box>
          <Typography variant="body2" sx={{ mt: 3 }}>
            Back to <Link to="/login">Login</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
