import { useState } from 'react'
import { Alert, Box, Button, Card, CardContent, TextField, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import api from '../lib/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      const { data } = await api.post('/auth/password-reset/', { email })
      setMessage(`Password reset token generated. Token: ${data.token}`)
    } catch (err) {
      setError(err.response?.data?.email || err.response?.data?.detail || 'Unable to request password reset.')
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', p: 3 }}>
      <Card sx={{ width: '100%', maxWidth: 480 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>Forgot Password</Typography>
          {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2 }}>
            <TextField label="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button type="submit" variant="contained">Request reset</Button>
          </Box>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Remembered your password? <Link to="/login">Log in</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
