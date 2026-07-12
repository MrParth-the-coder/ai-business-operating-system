import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, MenuItem, TextField, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import api from '../lib/auth'
import AppLayout from '../components/AppLayout'

export default function CompanySetupPage() {
  const [form, setForm] = useState({ name: '', category: 'retail', currency: 'USD', logo: null })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/companies/me/')
      .then(() => navigate('/dashboard'))
      .catch(() => {})
  }, [navigate])

  const submit = async (e) => {
    e.preventDefault()
    try {
      const data = new FormData()
      data.append('name', form.name)
      data.append('category', form.category)
      data.append('currency', form.currency)
      if (form.logo) data.append('logo', form.logo)
      await api.post('/companies/', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.logo || err.response?.data?.detail || 'Company setup failed.')
    }
  }

  return (
    <AppLayout>
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', p: 3 }}>
        <Card sx={{ width: '100%', maxWidth: 480 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>Company Setup</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2 }}>
            <TextField label="Company Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField select label="Business Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <MenuItem value="retail">Retail</MenuItem>
              <MenuItem value="medical">Medical</MenuItem>
              <MenuItem value="education">Education</MenuItem>
              <MenuItem value="restaurant">Restaurant</MenuItem>
            </TextField>
            <TextField label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            <Button variant="outlined" component="label">
              Upload logo
              <input
                hidden
                accept="image/png,image/jpeg"
                type="file"
                onChange={(e) => setForm({ ...form, logo: e.target.files?.[0] ?? null })}
              />
            </Button>
            {form.logo && <Typography variant="body2">Selected file: {form.logo.name}</Typography>}
            <Button type="submit" variant="contained">Create company</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
    </AppLayout>
  )
}
