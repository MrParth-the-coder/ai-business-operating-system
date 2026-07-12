import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, TextField, Typography } from '@mui/material'
import { Link, useNavigate } from 'react-router-dom'
import api, { getAccessToken, setTokens } from '../lib/auth'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (getAccessToken()) {
      navigate('/dashboard')
    }
  }, [navigate])

  const submit = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post('/auth/login/', form)
      setTokens(data)
      try {
        await api.get('/companies/me/')
        navigate('/dashboard')
      } catch {
        navigate('/company-setup')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed.')
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', p: 3 }}>
      <Card sx={{ width: '100%', maxWidth: 480 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>Login</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2 }}>
            <TextField label="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField label="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Button type="submit" variant="contained">Sign in</Button>
          </Box>
          <Typography variant="body2" sx={{ mt: 2 }}>
            No account yet? <Link to="/register">Create one</Link>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <Link to="/forgot-password">Forgot password?</Link>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <Link to="/verify-email">Verify email</Link>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <Link to="/forgot-password">Forgot password?</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
