import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Checkbox, Chip, FormControlLabel, Grid, Stack, TextField, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import api from '../lib/auth'
import AppLayout from '../components/AppLayout'

const initialProductForm = {
  name: '',
  category: '',
  price: '0.00',
  stock_qty: 0,
  low_stock_threshold: 10,
  is_active: true,
}

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(initialProductForm)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [restockingId, setRestockingId] = useState(null)

  const loadProducts = () => {
    setLoading(true)
    api.get('/products/')
      .then(({ data }) => setProducts(data))
      .catch(() => setError('Unable to load products.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)

    try {
      const payload = {
        name: form.name,
        category: form.category,
        price: parseFloat(form.price) || 0,
        stock_qty: Number(form.stock_qty),
        low_stock_threshold: Number(form.low_stock_threshold),
        is_active: form.is_active,
      }
      const { data } = await api.post('/products/', payload)
      setProducts((current) => [data, ...current])
      setForm(initialProductForm)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to save product.')
    } finally {
      setSaving(false)
    }
  }

  const handleRestock = async (product) => {
    setRestockingId(product.id)
    setError('')
    setMessage('')
    try {
      const updatedQty = Number(product.stock_qty || 0) + 10
      const { data } = await api.patch(`/products/${product.id}/`, { stock_qty: updatedQty, low_stock_threshold: product.low_stock_threshold, name: product.name, category: product.category, price: product.price, is_active: product.is_active })
      setProducts((current) => current.map((item) => item.id === product.id ? data : item))
      setMessage(`${product.name} restocked by 10 units.`)
    } catch {
      setError('Unable to restock product.')
    } finally {
      setRestockingId(null)
    }
  }

  return (
    <AppLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 3 }}>
          <Box>
            <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>INVENTORY CENTER</Typography>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>Products</Typography>
            <Typography color="text.secondary">Manage inventory items with a clearer, more actionable view.</Typography>
          </Box>
          <Button component={Link} to="/dashboard" variant="outlined">Back to dashboard</Button>
        </Stack>

        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, rgba(79,70,229,0.06) 0%, rgba(255,255,255,1) 100%)' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Add new product</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
                <TextField label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} fullWidth />
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField label="Price" type="number" inputProps={{ step: '0.01' }} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} fullWidth />
                <TextField label="Stock quantity" type="number" value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: Number(e.target.value) })} fullWidth />
                <TextField label="Low stock threshold" type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: Number(e.target.value) })} fullWidth />
              </Stack>
              <FormControlLabel control={<Checkbox checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />} label="Active" />
              <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving…' : 'Create product'}</Button>
            </Box>
          </CardContent>
        </Card>

        {loading ? (
          <Card><CardContent><Typography color="text.secondary">Loading products…</Typography></CardContent></Card>
        ) : (
          <>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Low stock alerts</Typography>
                {products.filter((product) => product.stock_qty <= product.low_stock_threshold).length === 0 ? (
                  <Typography color="text.secondary">No products are currently below their threshold.</Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {products.filter((product) => product.stock_qty <= product.low_stock_threshold).map((product) => (
                      <Box key={product.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Typography>{product.name} — {product.stock_qty} in stock</Typography>
                        <Button size="small" variant="contained" onClick={() => handleRestock(product)} disabled={restockingId === product.id}>
                          {restockingId === product.id ? 'Restocking…' : 'Restock +10'}
                        </Button>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>

            {products.length === 0 ? (
              <Card><CardContent><Typography color="text.secondary">No products found yet. Use the form above to add inventory.</Typography></CardContent></Card>
            ) : (
              <Grid container spacing={2}>
                {products.map((product) => (
                  <Grid item xs={12} sm={6} md={4} key={product.id}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="h6">{product.name}</Typography>
                          <Chip label={product.is_active ? 'Active' : 'Inactive'} color={product.is_active ? 'success' : 'default'} size="small" />
                        </Stack>
                        <Typography color="text.secondary" sx={{ mb: 1 }}>{product.category || 'Uncategorized'}</Typography>
                        <Typography variant="body2">Price: ${Number(product.price).toFixed(2)}</Typography>
                        <Typography variant="body2">Stock: {product.stock_qty}</Typography>
                        <Typography variant="body2">Low stock threshold: {product.low_stock_threshold}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}
      </Box>
    </AppLayout>
  )
}
