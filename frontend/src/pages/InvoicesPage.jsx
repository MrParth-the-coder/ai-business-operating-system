import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Chip, Grid, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
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
  const [exporting, setExporting] = useState(false)

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

  const handleExport = async () => {
    setExporting(true)
    setError('')
    setMessage('')
    try {
      const response = await api.get('/invoices/export_csv/', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'invoices.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setMessage('Invoices exported successfully.')
    } catch {
      setError('Unable to export invoices.')
    } finally {
      setExporting(false)
    }
  }

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
      const responseData = err.response?.data
      const message = responseData?.detail || responseData?.non_field_errors?.[0] || (typeof responseData === 'string' ? responseData : 'Unable to create invoice.')
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
            <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>INVOICE WORKFLOW</Typography>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>Invoices</Typography>
            <Typography color="text.secondary">Create and review invoices with a clearer, more focused experience.</Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button variant="outlined" onClick={handleExport} disabled={exporting || loading}>
              {exporting ? 'Exporting…' : 'Export CSV'}
            </Button>
            <Button component={Link} to="/dashboard" variant="outlined">Back to dashboard</Button>
          </Stack>
        </Stack>

        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, rgba(79,70,229,0.06) 0%, rgba(255,255,255,1) 100%)' }}>
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
          <Card>
            <CardContent>
              <Typography color="text.secondary">Loading invoices…</Typography>
            </CardContent>
          </Card>
        ) : invoices.length === 0 ? (
          <Card>
            <CardContent>
              <Typography color="text.secondary">No invoices found yet.</Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {invoices.map((invoice) => (
              <Grid item xs={12} sm={6} md={4} key={invoice.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="h6">Invoice #{invoice.id}</Typography>
                      <Chip label={invoice.status || 'Draft'} color={invoice.status === 'confirmed' ? 'success' : 'default'} size="small" />
                    </Stack>
                    <Typography color="text.secondary" sx={{ mb: 1 }}>
                      Customer: {invoice.customer?.name || 'Unknown'}
                    </Typography>
                    <Typography variant="body2">Total: ${Number(invoice.total).toFixed(2)}</Typography>
                    <Typography variant="body2">Created: {new Date(invoice.created_at).toLocaleDateString()}</Typography>
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
