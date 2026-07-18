import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import api from '../lib/auth'
import AppLayout from '../components/AppLayout'

export default function CompanySetupPage() {
  const [form, setForm] = useState({ name: '', owner_name: '', owner_email: '', owner_phone: '', category: 'retail', currency: 'USD', logo: null })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/companies/me/')
      .then(() => navigate('/dashboard'))
      .catch(() => {})
  }, [navigate])

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Company name is required.')
      return
    }

    setIsSubmitting(true)
    try {
      const data = new FormData()
      data.append('name', form.name.trim())
      data.append('owner_name', form.owner_name || '')
      data.append('owner_email', form.owner_email || '')
      data.append('owner_phone', form.owner_phone || '')
      data.append('category', form.category)
      data.append('currency', form.currency)
      if (form.logo) data.append('logo', form.logo)
      await api.post('/companies/', data)
      navigate('/dashboard')
    } catch (err) {
      const responseData = err.response?.data
      const message = responseData?.detail || responseData?.name?.[0] || responseData?.logo?.[0] || (typeof responseData === 'string' ? responseData : 'Company setup failed.')
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout>
      <Box sx={{ minHeight: 'calc(100vh - 96px)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 1, md: 3 } }}>
        <Card sx={{ width: '100%', maxWidth: 560, borderRadius: 4, boxShadow: '0 20px 60px rgba(15, 23, 42, 0.12)' }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={1} sx={{ mb: 3 }}>
              <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>SET UP YOUR COMPANY</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>Create your workspace</Typography>
              <Typography color="text.secondary">Add the essentials so your team can start working faster.</Typography>
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2 }}>
              <TextField label="Company Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <TextField label="Owner Name" value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
              <TextField label="Owner Email" type="email" value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} />
              <TextField label="Owner Phone" value={form.owner_phone} onChange={(e) => setForm({ ...form, owner_phone: e.target.value })} />
              <TextField select label="Business Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <MenuItem value="retail">Retail</MenuItem>
                <MenuItem value="medical">Medical</MenuItem>
                <MenuItem value="education">Education</MenuItem>
                <MenuItem value="restaurant">Restaurant</MenuItem>
              </TextField>
              <TextField label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
              <Button variant="outlined" component="label" sx={{ justifyContent: 'center' }}>
                Upload logo
                <input
                  hidden
                  accept="image/png,image/jpeg"
                  type="file"
                  onChange={(e) => setForm({ ...form, logo: e.target.files?.[0] ?? null })}
                />
              </Button>
              {form.logo && <Typography variant="body2">Selected file: {form.logo.name}</Typography>}
              <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                {isSubmitting ? 'Creating…' : 'Create company'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </AppLayout>
  )
}
