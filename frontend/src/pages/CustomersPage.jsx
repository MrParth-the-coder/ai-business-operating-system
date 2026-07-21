import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Chip, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, FormControl, FormControlLabel,
  Grid, IconButton, InputAdornment, MenuItem, Select, InputLabel, Stack, Table,
  TableBody, TableCell, TableHead, TableRow, TextField, Typography, Avatar,
  CircularProgress
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import DeleteIcon from '@mui/icons-material/Delete'
import HistoryIcon from '@mui/icons-material/History'
import StarIcon from '@mui/icons-material/Star'
import PersonIcon from '@mui/icons-material/Person'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import { Link } from 'react-router-dom'
import api from '../lib/auth'
import AppLayout from '../components/AppLayout'
import BulkImportModal from '../components/BulkImportModal'
import CustomerStatementModal from '../components/CustomerStatementModal'

const initialCustomerForm = {
  name: '',
  phone: '',
  email: '',
  is_active: true,
}

const sampleCustomerCsv = `name,email,phone,segment\nAcme Corporation,billing@acme.com,+1234567890,vip\nLogistics Express,contact@logistics.com,+9876543210,regular\nRetail Depot,info@retaildepot.com,+1122334455,new`

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState(initialCustomerForm)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)

  // Search and Filter states
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Selected customer for history view
  const [historyCustomer, setHistoryCustomer] = useState(null)
  const [statementCustomer, setStatementCustomer] = useState(null)

  // Delete dialog state
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadCustomers = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (statusFilter) params.append('status', statusFilter)

    api.get(`/customers/?${params.toString()}`)
      .then(({ data }) => setCustomers(data))
      .catch(() => setError('Unable to load customers.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCustomers()
  }, [search, statusFilter])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
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
      setMessage('Customer created successfully.')
    } catch (err) {
      const responseData = err.response?.data
      const message = responseData?.detail || responseData?.phone?.[0] || responseData?.name?.[0] || (typeof responseData === 'string' ? responseData : 'Unable to save customer.')
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
      await api.delete(`/customers/${deleteId}/`)
      setCustomers((current) => current.filter((c) => c.id !== deleteId))
      setMessage('Customer deleted successfully.')
      setDeleteId(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete customer.')
    } finally {
      setDeleting(false)
    }
  }

  const getCustomerBadge = (customer) => {
    const history = customer.purchase_history || []
    const totalSpent = history.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0)
    if (totalSpent >= 500 || history.length >= 5) {
      return { label: 'VIP', color: 'secondary', icon: <StarIcon fontSize="small" /> }
    }
    if (history.length > 0) {
      return { label: 'Regular', color: 'primary', icon: null }
    }
    return { label: 'New', color: 'info', icon: null }
  }

  return (
    <AppLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 3 }}>
          <Box>
            <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>CUSTOMER RELATIONSHIP</Typography>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>Customers & Segmentation</Typography>
            <Typography color="text.secondary">Keep every client record organized with transaction histories and auto-segmentation.</Typography>
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
          entityName="Customer"
          endpoint="/customers/"
          sampleCsvContent={sampleCustomerCsv}
          onSuccess={loadCustomers}
        />

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

        {/* Add Customer Form */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>Add New Customer</Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField label="Customer Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
                <TextField label="Phone Number" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
                <TextField label="Email Address" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth />
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <FormControlLabel control={<Checkbox checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />} label="Active Status" />
                <Button type="submit" variant="contained" size="large" disabled={saving}>
                  {saving ? <CircularProgress size={24} color="inherit" /> : 'Create Customer'}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {/* Search & Filter Bar */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search customers by name, email, or phone..."
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
              <Grid item xs={6} sm={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={2}>
                <Button fullWidth variant="text" onClick={() => { setSearch(''); setStatusFilter('') }}>
                  Reset
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Customers Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : customers.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 6 }}>
            <CardContent>
              <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="h6" color="text.secondary">No customers found.</Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2.5}>
            {customers.map((customer) => {
              const badge = getCustomerBadge(customer)
              const history = customer.purchase_history || []
              const totalSpent = history.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0)

              return (
                <Grid item xs={12} sm={6} md={4} key={customer.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, '&:hover': { boxShadow: '0 12px 24px rgba(15,23,42,0.1)' } }}>
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.light', fontSize: 20 }}>
                          {customer.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>{customer.name}</Typography>
                            <Chip label={badge.label} color={badge.color} size="small" icon={badge.icon} sx={{ height: 20, fontSize: '0.7rem' }} />
                          </Stack>
                          <Typography variant="caption" color="text.secondary" display="block" noWrap>
                            {customer.email || 'No email registered'}
                          </Typography>
                        </Box>
                        <IconButton size="small" color="error" onClick={() => setDeleteId(customer.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>

                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2, bgcolor: 'action.hover', p: 1.5, borderRadius: 2 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">TOTAL SPENT</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>${totalSpent.toFixed(2)}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">INVOICES</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{history.length} orders</Typography>
                        </Box>
                      </Box>

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">Phone: <strong>{customer.phone}</strong></Typography>
                        <Stack direction="row" spacing={1}>
                          <Button startIcon={<ReceiptLongIcon />} size="small" variant="contained" color="secondary" onClick={() => setStatementCustomer(customer)}>
                            Statement
                          </Button>
                          <Button startIcon={<HistoryIcon />} size="small" variant="outlined" onClick={() => setHistoryCustomer(customer)}>
                            History
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        )}

        {/* Purchase History Dialog */}
        <Dialog open={Boolean(historyCustomer)} onClose={() => setHistoryCustomer(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Purchase History — {historyCustomer?.name}</DialogTitle>
          <DialogContent>
            {historyCustomer?.purchase_history?.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2 }}>No recorded purchases for this customer yet.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice ID</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Items Qty</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyCustomer?.purchase_history?.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>#{item.invoice_id}</TableCell>
                      <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                      <TableCell align="right">{item.qty}</TableCell>
                      <TableCell align="right">${Number(item.total).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setHistoryCustomer(null)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Customer Statement Modal */}
        <CustomerStatementModal
          customer={statementCustomer}
          open={Boolean(statementCustomer)}
          onClose={() => setStatementCustomer(null)}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
          <DialogTitle>Confirm Delete Customer</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this customer? This action cannot be undone.
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
