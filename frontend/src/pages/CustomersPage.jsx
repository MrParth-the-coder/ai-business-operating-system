import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Checkbox, FormControlLabel, Grid, Stack, TextField, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import api from '../lib/auth'
import AppLayout from '../components/AppLayout'

const initialCustomerForm = {
  name: '',
  phone: '',
  email: '',
  is_active: true,
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState(initialCustomerForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadCustomers = () => {
    setLoading(true)
    api.get('/customers/')
      .then(({ data }) => setCustomers(data))
      .catch(() => setError('Unable to load customers.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)

    try {
      const { data } = await api.post('/customers/', {
        name: form.name,
        phone: form.phone,
        email: form.email,
        is_active: form.is_active,
      })
      setCustomers((current) => [data, ...current])
      setForm(initialCustomerForm)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to save customer.')
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
              Customers
            </Typography>
            <Typography color="text.secondary">
              Manage customer records for your business.
            </Typography>
          </div>
          <Button component={Link} to="/dashboard" variant="outlined">
            Back to dashboard
          </Button>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Add new customer
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
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                {saving ? 'Saving…' : 'Create customer'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {loading ? (
          <Typography>Loading customers…</Typography>
        ) : customers.length === 0 ? (
          <Typography>No customers found yet. Use the form above to add customer records.</Typography>
        ) : (
          <Grid container spacing={2}>
            {customers.map((customer) => (
              <Grid item xs={12} sm={6} md={4} key={customer.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {customer.name}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 1 }}>
                      {customer.email || 'No email'}
                    </Typography>
                    <Typography>Phone: {customer.phone || '—'}</Typography>
                    <Typography>Active: {customer.is_active ? 'Yes' : 'No'}</Typography>
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
