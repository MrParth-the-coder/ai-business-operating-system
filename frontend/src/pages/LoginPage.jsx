import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
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
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at top left, #c7d2fe 0%, #f8fafc 45%, #eef2ff 100%)', p: 3 }}>
      <Card sx={{ width: '100%', maxWidth: 520, borderRadius: 4, boxShadow: '0 20px 60px rgba(15, 23, 42, 0.12)' }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={1} sx={{ mb: 3 }}>
            <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>WELCOME BACK</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Sign in to AI BOS</Typography>
            <Typography color="text.secondary">Run your business from one calm, connected workspace.</Typography>
          </Stack>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2 }}>
            <TextField label="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField label="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Button type="submit" variant="contained" size="large">Sign in</Button>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
            <Typography variant="body2">
              No account yet? <Link to="/register">Create one</Link>
            </Typography>
            <Typography variant="body2">
              <Link to="/forgot-password">Forgot password?</Link>
            </Typography>
            <Typography variant="body2">
              <Link to="/verify-email">Verify email</Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
