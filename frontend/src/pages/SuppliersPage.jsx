import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Checkbox, FormControlLabel, Grid, Stack, TextField, Typography } from '@mui/material'
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
      setError(err.response?.data?.detail || 'Unable to save supplier.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <div>
            <Typography variant="h4" gutterBottom>
              Suppliers
            </Typography>
            <Typography color="text.secondary">
              Track suppliers for your business operations.
            </Typography>
          </div>
          <Button component={Link} to="/dashboard" variant="outlined">
            Back to dashboard
          </Button>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Add new supplier
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="Name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Phone"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  fullWidth
                />
              </Stack>
              <TextField
                label="Product category"
                value={form.product_category}
                onChange={(e) => setForm({ ...form, product_category: e.target.value })}
                fullWidth
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  />
                }
                label="Active"
              />
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Saving…' : 'Create supplier'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {loading ? (
          <Typography>Loading suppliers…</Typography>
        ) : suppliers.length === 0 ? (
          <Typography>No suppliers found yet. Use the form above to add supplier records.</Typography>
        ) : (
          <Grid container spacing={2}>
            {suppliers.map((supplier) => (
              <Grid item xs={12} sm={6} md={4} key={supplier.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {supplier.name}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 1 }}>
                      {supplier.product_category || 'Mixed supplies'}
                    </Typography>
                    <Typography>Phone: {supplier.phone || '—'}</Typography>
                    <Typography>Active: {supplier.is_active ? 'Yes' : 'No'}</Typography>
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
