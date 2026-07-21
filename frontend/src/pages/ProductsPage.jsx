import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Chip, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, FormControl, FormControlLabel,
  Grid, IconButton, InputAdornment, MenuItem, Select, InputLabel, Stack, TextField,
  Typography, Avatar, CircularProgress, Tooltip
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported'
import { Link } from 'react-router-dom'
import api from '../lib/auth'
import AppLayout from '../components/AppLayout'
import BulkImportModal from '../components/BulkImportModal'

const initialProductForm = {
  name: '',
  category: '',
  price: '',
  stock_qty: '',
  low_stock_threshold: '10',
  supplier: '',
  is_active: true,
  image: null
}

const sampleProductCsv = `name,category,price,stock_qty,low_stock_threshold\nLaptop Pro,Electronics,1200.00,15,3\nWireless Mouse,Accessories,25.50,50,10\nOffice Desk,Furniture,180.00,8,2`

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [form, setForm] = useState(initialProductForm)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [restockingId, setRestockingId] = useState(null)
  
  // Search and Filter states
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Delete dialog state
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadProducts = () => {
    setLoading(true)
    let url = '/products/?'
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (categoryFilter) params.append('category', categoryFilter)
    if (statusFilter) params.append('status', statusFilter)
    
    api.get(`/products/?${params.toString()}`)
      .then(({ data }) => setProducts(data.results || data))
      .catch(() => setError('Unable to load products.'))
      .finally(() => setLoading(false))
  }

  const loadSuppliers = () => {
    api.get('/suppliers/')
      .then(({ data }) => setSuppliers(data.results || data))
      .catch(() => {})
  }

  useEffect(() => {
    loadProducts()
    loadSuppliers()
  }, [search, categoryFilter, statusFilter])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)

    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('category', form.category)
      formData.append('price', form.price !== '' ? parseFloat(form.price) : 0)
      formData.append('stock_qty', form.stock_qty !== '' ? parseInt(form.stock_qty, 10) : 0)
      formData.append('low_stock_threshold', form.low_stock_threshold !== '' ? parseInt(form.low_stock_threshold, 10) : 10)
      formData.append('is_active', form.is_active)
      if (form.supplier) formData.append('supplier', form.supplier)
      if (form.image) formData.append('image', form.image)

      const { data } = await api.post('/products/', formData)
      setProducts((current) => [data, ...current])
      setForm(initialProductForm)
      setMessage('Product created successfully.')
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
      const { data } = await api.patch(`/products/${product.id}/`, { stock_qty: updatedQty })
      setProducts((current) => current.map((item) => item.id === product.id ? data : item))
      setMessage(`${product.name} restocked by 10 units.`)
    } catch {
      setError('Unable to restock product.')
    } finally {
      setRestockingId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    setError('')
    try {
      await api.delete(`/products/${deleteId}/`)
      setProducts((current) => current.filter((p) => p.id !== deleteId))
      setMessage('Product deleted successfully.')
      setDeleteId(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete product.')
    } finally {
      setDeleting(false)
    }
  }

  const lowStockItems = products.filter((p) => p.stock_qty <= p.low_stock_threshold)

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)))

  return (
    <AppLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 3 }}>
          <Box>
            <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>INVENTORY CENTER</Typography>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>Products & Stock</Typography>
            <Typography color="text.secondary">Manage inventory items, upload images, link suppliers, and trigger restocks.</Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button variant="contained" color="secondary" onClick={() => setImportModalOpen(true)}>
              Import CSV
            </Button>
            <Button component={Link} to="/dashboard" variant="outlined">Back to dashboard</Button>
          </Stack>
        </Stack>

        <BulkImportModal
          open={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          entityName="Product"
          endpoint="/products/"
          sampleCsvContent={sampleProductCsv}
          onSuccess={loadProducts}
        />

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

        {/* Add Product Form */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>Add New Product</Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField label="Product Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
                <TextField label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} fullWidth placeholder="e.g. Electronics, Grocery" />
                <FormControl fullWidth>
                  <InputLabel>Supplier</InputLabel>
                  <Select label="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}>
                    <MenuItem value=""><em>None</em></MenuItem>
                    {suppliers.map((s) => (
                      <MenuItem key={s.id} value={s.id}>{s.name} ({s.product_category || 'General'})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField label="Price" type="number" placeholder="0.00" inputProps={{ step: '0.01' }} value={form.price} onFocus={(e) => e.target.select()} onChange={(e) => setForm({ ...form, price: e.target.value })} fullWidth />
                <TextField label="Stock Quantity" type="number" placeholder="0" value={form.stock_qty} onFocus={(e) => e.target.select()} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} fullWidth />
                <TextField label="Low Stock Threshold" type="number" placeholder="10" value={form.low_stock_threshold} onFocus={(e) => e.target.select()} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} fullWidth />
              </Stack>
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <Button variant="outlined" component="label">
                  Upload Product Image
                  <input hidden accept="image/*" type="file" onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })} />
                </Button>
                {form.image && <Typography variant="body2" color="primary">{form.image.name}</Typography>}
                <Box sx={{ flexGrow: 1 }} />
                <FormControlLabel control={<Checkbox checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />} label="Active" />
                <Button type="submit" variant="contained" size="large" disabled={saving}>
                  {saving ? <CircularProgress size={24} color="inherit" /> : 'Create Product'}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {/* Low Stock Suggestions */}
        {lowStockItems.length > 0 && (
          <Card sx={{ mb: 3, borderLeft: '4px solid #f59e0b', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245,158,11,0.12)' : '#fffbe0' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <WarningAmberIcon color="warning" />
                <Typography variant="h6" sx={{ fontWeight: 700, color: (theme) => theme.palette.mode === 'dark' ? '#fde68a' : '#92400e' }}>
                  Reorder Suggestions ({lowStockItems.length} Low Stock)
                </Typography>
              </Stack>
              <Stack spacing={1}>
                {lowStockItems.map((product) => (
                  <Box key={product.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)', p: 1.5, borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {product.name} — Only {product.stock_qty} remaining (Threshold: {product.low_stock_threshold})
                    </Typography>
                    <Button size="small" variant="contained" color="warning" onClick={() => handleRestock(product)} disabled={restockingId === product.id}>
                      {restockingId === product.id ? 'Restocking…' : 'Quick Restock (+10)'}
                    </Button>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Search & Filter Toolbar */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search products by name or category..."
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
              <Grid item xs={6} sm={3} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category Filter</InputLabel>
                  <Select label="Category Filter" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map((c) => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status Filter</InputLabel>
                  <Select label="Status Filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button fullWidth variant="text" onClick={() => { setSearch(''); setCategoryFilter(''); setStatusFilter('') }}>
                  Reset Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : products.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 6 }}>
            <CardContent>
              <ImageNotSupportedIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="h6" color="text.secondary">No products found.</Typography>
              <Typography variant="body2" color="text.secondary">Try clearing your search query or add a new product.</Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2.5}>
            {products.map((product) => {
              const supplierObj = suppliers.find((s) => s.id === product.supplier)
              return (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', borderRadius: 3, '&:hover': { boxShadow: '0 12px 24px rgba(15,23,42,0.1)' } }}>
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Avatar
                          src={product.image || undefined}
                          alt={product.name}
                          variant="rounded"
                          sx={{ width: 56, height: 56, bgcolor: 'primary.light' }}
                        >
                          {product.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>{product.name}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {product.category || 'Uncategorized'}
                          </Typography>
                          {supplierObj && (
                            <Chip label={`Supplier: ${supplierObj.name}`} size="small" variant="outlined" sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }} />
                          )}
                        </Box>
                        <IconButton size="small" color="error" onClick={() => setDeleteId(product.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>

                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2, bgcolor: 'action.hover', p: 1.5, borderRadius: 2 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">PRICE</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>${Number(product.price).toFixed(2)}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">STOCK</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: product.stock_qty <= product.low_stock_threshold ? 'error.main' : 'text.primary' }}>
                            {product.stock_qty} units
                          </Typography>
                        </Box>
                      </Box>

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Chip label={product.is_active ? 'Active' : 'Inactive'} color={product.is_active ? 'success' : 'default'} size="small" />
                        <Button size="small" variant="outlined" onClick={() => handleRestock(product)} disabled={restockingId === product.id}>
                          + Restock 10
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
          <DialogTitle>Confirm Delete Product</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this product? Products referenced in confirmed invoices cannot be deleted.
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
