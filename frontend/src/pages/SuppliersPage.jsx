import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Checkbox, Chip, FormControlLabel, Grid, Stack, TextField, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import api from '../lib/auth'
import AppLayout from '../components/AppLayout'

const initialSupplierForm = {
  name: '',
  phone: '',
  product_category: '',
  is_active: true,
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([])
  const [form, setForm] = useState(initialSupplierForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadSuppliers = () => {
    setLoading(true)
    api.get('/suppliers/')
      .then(({ data }) => setSuppliers(data))
      .catch(() => setError('Unable to load suppliers.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadSuppliers()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)

    try {
      const { data } = await api.post('/suppliers/', {
        name: form.name,
        phone: form.phone,
        product_category: form.product_category,
        is_active: form.is_active,
      })
      setSuppliers((current) => [data, ...current])
      setForm(initialSupplierForm)
    } catch (err) {
      const responseData = err.response?.data
      const message = responseData?.detail || responseData?.name?.[0] || responseData?.phone?.[0] || (typeof responseData === 'string' ? responseData : 'Unable to save supplier.')
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 3 }}>
          <Box>
            <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>SUPPLY CHAIN</Typography>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>Suppliers</Typography>
            <Typography color="text.secondary">Keep your supply network visible and organized.</Typography>
          </Box>
          <Button component={Link} to="/dashboard" variant="outlined">Back to dashboard</Button>
        </Stack>

        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, rgba(79,70,229,0.06) 0%, rgba(255,255,255,1) 100%)' }}>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
              <Box>
                <Typography variant="h6" gutterBottom>Supply overview</Typography>
                <Typography color="text.secondary">Monitor active suppliers and their product categories in one view.</Typography>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Chip label={`${suppliers.filter((supplier) => supplier.is_active).length} active`} color="primary" />
                <Chip label={`${suppliers.length} total`} variant="outlined" />
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, rgba(79,70,229,0.06) 0%, rgba(255,255,255,1) 100%)' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Add new supplier</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
                <TextField label="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
              </Stack>
              <TextField label="Product category" value={form.product_category} onChange={(e) => setForm({ ...form, product_category: e.target.value })} fullWidth />
              <FormControlLabel control={<Checkbox checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />} label="Active" />
              <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving…' : 'Create supplier'}</Button>
            </Box>
          </CardContent>
        </Card>

        {loading ? (
          <Card><CardContent><Typography color="text.secondary">Loading suppliers…</Typography></CardContent></Card>
        ) : suppliers.length === 0 ? (
          <Card><CardContent><Typography color="text.secondary">No suppliers found yet. Use the form above to add supplier records.</Typography></CardContent></Card>
        ) : (
          <Grid container spacing={2}>
            {suppliers.map((supplier) => (
              <Grid item xs={12} sm={6} md={4} key={supplier.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="h6">{supplier.name}</Typography>
                      <Chip label={supplier.is_active ? 'Active' : 'Inactive'} color={supplier.is_active ? 'success' : 'default'} size="small" />
                    </Stack>
                    <Typography color="text.secondary" sx={{ mb: 1 }}>{supplier.product_category || 'Mixed supplies'}</Typography>
                    <Typography variant="body2">Phone: {supplier.phone || '—'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </AppLayout>
  )
}
