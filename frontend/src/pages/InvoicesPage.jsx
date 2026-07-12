import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Grid, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import api from '../lib/auth'
import AppLayout from '../components/AppLayout'

const initialInvoiceForm = {
  customer: '',
  product: '',
  qty: 1,
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(initialInvoiceForm)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadData = () => {
    setLoading(true)
    Promise.all([api.get('/invoices/'), api.get('/customers/'), api.get('/products/')])
      .then(([invoicesRes, customersRes, productsRes]) => {
        setInvoices(invoicesRes.data)
        setCustomers(customersRes.data)
        setProducts(productsRes.data)
      })
      .catch(() => setError('Unable to load invoice data.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)

    try {
      const payload = {
        customer: Number(form.customer),
        items: [
          {
            product: Number(form.product),
            qty: Number(form.qty),
          },
        ],
      }
      const { data } = await api.post('/invoices/', payload)
      setInvoices((current) => [data, ...current])
      setForm(initialInvoiceForm)
      setMessage('Invoice created successfully.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to create invoice.')
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
              Invoices
            </Typography>
            <Typography color="text.secondary">
              Create and review invoices for your business.
            </Typography>
          </div>
          <Button component={Link} to="/dashboard" variant="outlined">
            Back to dashboard
          </Button>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              New invoice
            </Typography>
            {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Select
                  required
                  value={form.customer}
                  onChange={(e) => setForm({ ...form, customer: e.target.value })}
                  displayEmpty
                  fullWidth
                >
                  <MenuItem value="" disabled>
                    Select customer
                  </MenuItem>
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </MenuItem>
                  ))}
                </Select>
                <Select
                  required
                  value={form.product}
                  onChange={(e) => setForm({ ...form, product: e.target.value })}
                  displayEmpty
                  fullWidth
                >
                  <MenuItem value="" disabled>
                    Select product
                  </MenuItem>
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name}
                    </MenuItem>
                  ))}
                </Select>
                <TextField
                  label="Quantity"
                  type="number"
                  inputProps={{ min: 1 }}
                  value={form.qty}
                  onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })}
                  fullWidth
                />
              </Stack>
              <Button type="submit" variant="contained" disabled={saving || loading}>
                {saving ? 'Saving…' : 'Create invoice'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {loading ? (
          <Typography>Loading invoices…</Typography>
        ) : invoices.length === 0 ? (
          <Typography>No invoices found yet.</Typography>
        ) : (
          <Grid container spacing={2}>
            {invoices.map((invoice) => (
              <Grid item xs={12} sm={6} md={4} key={invoice.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Invoice #{invoice.id}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 1 }}>
                      Customer: {invoice.customer?.name || 'Unknown'}
                    </Typography>
                    <Typography>Status: {invoice.status}</Typography>
                    <Typography>Total: ${Number(invoice.total).toFixed(2)}</Typography>
                    <Typography>Created: {new Date(invoice.created_at).toLocaleDateString()}</Typography>
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
