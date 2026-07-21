import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Chip, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, FormControl, FormControlLabel,
  Grid, IconButton, InputAdornment, List, ListItem, ListItemText, MenuItem, Select,
  InputLabel, Stack, TextField, Typography, Avatar, CircularProgress
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import DeleteIcon from '@mui/icons-material/Delete'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import InventoryIcon from '@mui/icons-material/Inventory'
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
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(initialSupplierForm)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Search state
  const [search, setSearch] = useState('')

  // Linked products dialog state
  const [selectedSupplier, setSelectedSupplier] = useState(null)

  // Delete dialog state
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadSuppliers = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.append('search', search)

    api.get(`/suppliers/?${params.toString()}`)
      .then(({ data }) => setSuppliers(data))
      .catch(() => setError('Unable to load suppliers.'))
      .finally(() => setLoading(false))
  }

  const loadProducts = () => {
    api.get('/products/')
      .then(({ data }) => setProducts(data))
      .catch(() => {})
  }

  useEffect(() => {
    loadSuppliers()
    loadProducts()
  }, [search])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
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
      setMessage('Supplier registered successfully.')
    } catch (err) {
      const responseData = err.response?.data
      const message = responseData?.detail || responseData?.name?.[0] || responseData?.phone?.[0] || (typeof responseData === 'string' ? responseData : 'Unable to save supplier.')
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    setError('')
    try {
      await api.delete(`/suppliers/${deleteId}/`)
      setSuppliers((current) => current.filter((s) => s.id !== deleteId))
      setMessage('Supplier deleted successfully.')
      setDeleteId(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete supplier.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 3 }}>
          <Box>
            <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>SUPPLY CHAIN NETWORK</Typography>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>Suppliers & Catalogs</Typography>
            <Typography color="text.secondary">Keep supplier details and linked product inventory synchronized.</Typography>
          </Box>
          <Button component={Link} to="/dashboard" variant="outlined">Back to dashboard</Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

        {/* Add Supplier Form */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>Add New Supplier</Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField label="Supplier / Company Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
                <TextField label="Phone Number" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
                <TextField label="Supply Category" value={form.product_category} onChange={(e) => setForm({ ...form, product_category: e.target.value })} fullWidth placeholder="e.g. Raw Materials, Electronics" />
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <FormControlLabel control={<Checkbox checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />} label="Active Vendor" />
                <Button type="submit" variant="contained" size="large" disabled={saving}>
                  {saving ? <CircularProgress size={24} color="inherit" /> : 'Register Supplier'}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {/* Search Bar */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={9}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search suppliers by name, phone, or category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button fullWidth variant="text" onClick={() => setSearch('')}>
                  Reset Search
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Suppliers Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : suppliers.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 6 }}>
            <CardContent>
              <LocalShippingIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="h6" color="text.secondary">No suppliers found.</Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2.5}>
            {suppliers.map((supplier) => {
              const linkedProducts = products.filter((p) => p.supplier === supplier.id)

              return (
                <Grid item xs={12} sm={6} md={4} key={supplier.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, '&:hover': { boxShadow: '0 12px 24px rgba(15,23,42,0.1)' } }}>
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Avatar sx={{ width: 48, height: 48, bgcolor: 'secondary.light', fontSize: 20 }}>
                          {supplier.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>{supplier.name}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Category: {supplier.product_category || 'General'}
                          </Typography>
                        </Box>
                        <IconButton size="small" color="error" onClick={() => setDeleteId(supplier.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>

                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2, bgcolor: 'action.hover', p: 1.5, borderRadius: 2 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">PHONE</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{supplier.phone}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">LINKED PRODUCTS</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{linkedProducts.length} items</Typography>
                        </Box>
                      </Box>

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Chip label={supplier.is_active ? 'Active' : 'Inactive'} color={supplier.is_active ? 'success' : 'default'} size="small" />
                        <Button startIcon={<InventoryIcon />} size="small" variant="outlined" onClick={() => setSelectedSupplier(supplier)}>
                          Products ({linkedProducts.length})
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        )}

        {/* Linked Products Dialog */}
        <Dialog open={Boolean(selectedSupplier)} onClose={() => setSelectedSupplier(null)} maxWidth="xs" fullWidth>
          <DialogTitle>Supplied Products — {selectedSupplier?.name}</DialogTitle>
          <DialogContent>
            {products.filter((p) => p.supplier === selectedSupplier?.id).length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2 }}>No products currently linked to this supplier.</Typography>
            ) : (
              <List>
                {products.filter((p) => p.supplier === selectedSupplier?.id).map((product) => (
                  <ListItem key={product.id} divider>
                    <ListItemText
                      primary={product.name}
                      secondary={`Category: ${product.category || 'N/A'} | Price: $${Number(product.price).toFixed(2)} | Stock: ${product.stock_qty}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedSupplier(null)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
          <DialogTitle>Confirm Delete Supplier</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this supplier profile?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
            <Button onClick={confirmDelete} color="error" variant="contained" disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  )
}
