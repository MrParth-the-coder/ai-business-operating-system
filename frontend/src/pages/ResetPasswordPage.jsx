import { useState } from 'react'
import { Alert, Box, Button, Card, CardContent, TextField, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import api from '../lib/auth'

export default function ResetPasswordPage() {
  const [form, setForm] = useState({ email: '', token: '', password: '', password_confirm: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await api.post('/auth/password-reset/confirm/', form)
      setMessage('Password has been reset. You may now log in.')
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.token || err.response?.data?.password_confirm || 'Unable to reset password.')
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', p: 3 }}>
      <Card sx={{ width: '100%', maxWidth: 480 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>Reset Password</Typography>
          {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2 }}>
            <TextField label="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField label="Reset Token" required value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} />
            <TextField label="New Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <TextField label="Confirm Password" type="password" required value={form.password_confirm} onChange={(e) => setForm({ ...form, password_confirm: e.target.value })} />
            <Button type="submit" variant="contained">Reset password</Button>
          </Box>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Back to <Link to="/login">Login</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
