import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Checkbox, Chip, FormControlLabel, Grid, Stack, TextField, Typography } from '@mui/material'
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
        purchase_history: [],
        is_active: form.is_active,
      })
      setCustomers((current) => [data, ...current])
      setForm(initialCustomerForm)
    } catch (err) {
      const responseData = err.response?.data
      const message = responseData?.detail || responseData?.phone?.[0] || responseData?.name?.[0] || (typeof responseData === 'string' ? responseData : 'Unable to save customer.')
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
            <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>CUSTOMER RELATIONSHIP</Typography>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>Customers</Typography>
            <Typography color="text.secondary">Keep every customer profile organized and easy to find.</Typography>
          </Box>
          <Button component={Link} to="/dashboard" variant="outlined">Back to dashboard</Button>
        </Stack>

        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, rgba(79,70,229,0.06) 0%, rgba(255,255,255,1) 100%)' }}>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
              <Box>
                <Typography variant="h6" gutterBottom>Relationship overview</Typography>
                <Typography color="text.secondary">Track active clients and keep records ready for follow-up.</Typography>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Chip label={`${customers.filter((customer) => customer.is_active).length} active`} color="primary" />
                <Chip label={`${customers.length} total`} variant="outlined" />
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, rgba(79,70,229,0.06) 0%, rgba(255,255,255,1) 100%)' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Add new customer</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
                <TextField label="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
              </Stack>
              <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth />
              <FormControlLabel control={<Checkbox checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />} label="Active" />
              <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving…' : 'Create customer'}</Button>
            </Box>
          </CardContent>
        </Card>

        {loading ? (
          <Card><CardContent><Typography color="text.secondary">Loading customers…</Typography></CardContent></Card>
        ) : customers.length === 0 ? (
          <Card><CardContent><Typography color="text.secondary">No customers found yet. Use the form above to add customer records.</Typography></CardContent></Card>
        ) : (
          <Grid container spacing={2}>
            {customers.map((customer) => (
              <Grid item xs={12} sm={6} md={4} key={customer.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="h6">{customer.name}</Typography>
                      <Chip label={customer.is_active ? 'Active' : 'Inactive'} color={customer.is_active ? 'success' : 'default'} size="small" />
                    </Stack>
                    <Typography color="text.secondary" sx={{ mb: 1 }}>{customer.email || 'No email'}</Typography>
                    <Typography variant="body2">Phone: {customer.phone || '—'}</Typography>
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
