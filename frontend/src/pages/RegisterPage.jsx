import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
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

    if (!/\d/.test(form.password)) {
      setError('Password must contain at least one number.')
      return
    }

    if (!/[^A-Za-z0-9]/.test(form.password)) {
      setError('Password must contain at least one special character.')
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
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at top left, #c7d2fe 0%, #f8fafc 45%, #eef2ff 100%)', p: 3 }}>
      <Card sx={{ width: '100%', maxWidth: 560, borderRadius: 4, boxShadow: '0 20px 60px rgba(15, 23, 42, 0.12)' }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={1} sx={{ mb: 3 }}>
            <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>CREATE ACCOUNT</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Start managing your business smarter</Typography>
            <Typography color="text.secondary">Set up your company in minutes and bring every department together.</Typography>
          </Stack>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2 }}>
            <TextField label="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <TextField label="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <TextField label="Confirm Password" type="password" required value={form.password_confirm} onChange={(e) => setForm({ ...form, password_confirm: e.target.value })} />
            <Button type="submit" variant="contained" size="large">Create account</Button>
          </Box>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Already have an account? <Link to="/login">Log in</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
