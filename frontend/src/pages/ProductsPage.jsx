import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Checkbox, FormControlLabel, Grid, Stack, TextField, Typography } from '@mui/material'
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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

  return (
    <AppLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <div>
            <Typography variant="h4" gutterBottom>
              Products
            </Typography>
            <Typography color="text.secondary">
              Inventory items for your business.
            </Typography>
          </div>
          <Button component={Link} to="/dashboard" variant="outlined">
            Back to dashboard
          </Button>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Add new product
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
                  label="Category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="Price"
                  type="number"
                  inputProps={{ step: '0.01' }}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Stock quantity"
                  type="number"
                  value={form.stock_qty}
                  onChange={(e) => setForm({ ...form, stock_qty: Number(e.target.value) })}
                  fullWidth
                />
                <TextField
                  label="Low stock threshold"
                  type="number"
                  value={form.low_stock_threshold}
                  onChange={(e) => setForm({ ...form, low_stock_threshold: Number(e.target.value) })}
                  fullWidth
                />
              </Stack>
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
                {saving ? 'Saving…' : 'Create product'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {loading ? (
          <Typography>Loading products…</Typography>
        ) : products.length === 0 ? (
          <Typography>No products found yet. Use the form above to add inventory.</Typography>
        ) : (
          <Grid container spacing={2}>
            {products.map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {product.name}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 1 }}>
                      {product.category || 'Uncategorized'}
                    </Typography>
                    <Typography>Price: ${Number(product.price).toFixed(2)}</Typography>
                    <Typography>Stock: {product.stock_qty}</Typography>
                    <Typography>Low stock threshold: {product.low_stock_threshold}</Typography>
                    <Typography>Active: {product.is_active ? 'Yes' : 'No'}</Typography>
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
