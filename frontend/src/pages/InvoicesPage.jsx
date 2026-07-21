import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, FormControl, Grid,
  IconButton, InputAdornment, MenuItem, Select, InputLabel, Stack, Table,
  TableBody, TableCell, TableHead, TableRow, TextField, Typography, Avatar,
  CircularProgress, Tooltip
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import DeleteIcon from '@mui/icons-material/Delete'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import VisibilityIcon from '@mui/icons-material/Visibility'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PaidIcon from '@mui/icons-material/Paid'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import AddIcon from '@mui/icons-material/Add'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutlined'
import ReceiptIcon from '@mui/icons-material/Receipt'
import PrintIcon from '@mui/icons-material/Print'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { Link } from 'react-router-dom'
import api from '../lib/auth'
import AppLayout from '../components/AppLayout'
import InvoicePrintModal from '../components/InvoicePrintModal'
import OCRScanModal from '../components/OCRScanModal'
import PaymentCheckoutModal from '../components/PaymentCheckoutModal'
import { formatCurrency, getActiveCurrency } from '../lib/currency'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])

  // Form states
  const [customer, setCustomer] = useState('')
  const [items, setItems] = useState([{ product: '', qty: 1 }])

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Search & Filter states
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')

  // Preview & Dialog states
  const [previewInvoice, setPreviewInvoice] = useState(null)
  const [printInvoice, setPrintInvoice] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [ocrOpen, setOcrOpen] = useState(false)
  const [payInvoice, setPayInvoice] = useState(null)

  const handleApplyOCR = (extractedData) => {
    if (!extractedData || !Array.isArray(extractedData.items)) return
    if (!customer && customers.length > 0) {
      setCustomer(customers[0].id)
    }

    const mappedItems = extractedData.items.map((ext) => {
      const match = products.find(
        (p) => p.name.toLowerCase().includes(ext.name.toLowerCase()) || ext.name.toLowerCase().includes(p.name.toLowerCase())
      )
      return {
        product: match ? match.id : (products[0]?.id || ''),
        qty: ext.qty || 1,
      }
    })

    if (mappedItems.length > 0) {
      setItems(mappedItems)
    }
    setMessage(`Successfully extracted ${extractedData.items.length} item(s) from ${extractedData.vendor_name || 'receipt'} via AI OCR!`)
  }

  const loadData = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (statusFilter) params.append('status', statusFilter)
    if (paymentFilter) params.append('payment_status', paymentFilter)

    Promise.all([
      api.get(`/invoices/?${params.toString()}`),
      api.get('/customers/'),
      api.get('/products/')
    ])
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
  }, [search, statusFilter, paymentFilter])

  const handleAddItemRow = () => {
    setItems((current) => [...current, { product: '', qty: 1 }])
  }

  const handleRemoveItemRow = (index) => {
    setItems((current) => current.filter((_, idx) => idx !== index))
  }

  const handleItemChange = (index, field, value) => {
    setItems((current) =>
      current.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    )
  }

  const handleExportCSV = async () => {
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
      setMessage('Invoices exported as CSV successfully.')
    } catch {
      setError('Unable to export invoices.')
    } finally {
      setExporting(false)
    }
  }

  const handleDownloadPDF = async (invoiceId) => {
    setError('')
    try {
      const response = await api.get(`/invoices/${invoiceId}/export_pdf/`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `invoice_${invoiceId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setError('Unable to generate PDF.')
    }
  }

  const handleMarkPaid = async (invoiceId) => {
    setError('')
    try {
      const { data } = await api.post(`/invoices/${invoiceId}/mark_paid/`)
      setInvoices((current) => current.map((inv) => (inv.id === invoiceId ? data : inv)))
      if (previewInvoice?.id === invoiceId) setPreviewInvoice(data)
      setMessage(`Invoice #${invoiceId} marked as Paid.`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to mark invoice as paid.')
    }
  }

  const handleConfirmInvoice = async (invoiceId) => {
    setError('')
    try {
      const { data } = await api.post(`/invoices/${invoiceId}/confirm/`)
      setInvoices((current) => current.map((inv) => (inv.id === invoiceId ? data : inv)))
      if (previewInvoice?.id === invoiceId) setPreviewInvoice(data)
      setMessage(`Invoice #${invoiceId} confirmed and stock updated.`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to confirm invoice.')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)

    try {
      const validItems = items.filter((item) => item.product && Number(item.qty) > 0)
      if (validItems.length === 0) {
        setError('Please add at least one product with valid quantity.')
        setSaving(false)
        return
      }

      const payload = {
        customer: Number(customer),
        items: validItems.map((item) => ({
          product: Number(item.product),
          qty: Number(item.qty),
        })),
      }

      const { data } = await api.post('/invoices/', payload)
      setInvoices((current) => [data, ...current])
      setCustomer('')
      setItems([{ product: '', qty: 1 }])
      setMessage(`Invoice #${data.id} created successfully!`)
    } catch (err) {
      const responseData = err.response?.data
      const message = responseData?.detail || responseData?.non_field_errors?.[0] || (typeof responseData === 'string' ? responseData : 'Unable to create invoice.')
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
      await api.delete(`/invoices/${deleteId}/`)
      setInvoices((current) => current.filter((inv) => inv.id !== deleteId))
      setMessage('Invoice deleted successfully.')
      setDeleteId(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete invoice.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 3 }}>
          <Box>
            <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>INVOICE WORKFLOW</Typography>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>Invoices & Billing</Typography>
            <Typography color="text.secondary">Create multi-item invoices, preview drafts, export PDFs, and track payment status.</Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AutoAwesomeIcon />}
              onClick={() => setOcrOpen(true)}
            >
              Scan Invoice (AI)
            </Button>
            <Button variant="outlined" onClick={handleExportCSV} disabled={exporting || loading}>
              {exporting ? 'Exporting…' : 'Export CSV'}
            </Button>
            <Button component={Link} to="/dashboard" variant="outlined">Back to dashboard</Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

        {/* Create Invoice Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>Create New Invoice</Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2.5 }}>
              <FormControl required fullWidth>
                <InputLabel>Select Customer</InputLabel>
                <Select value={customer} label="Select Customer" onChange={(e) => setCustomer(e.target.value)}>
                  {customers.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name} ({c.phone})</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>Line Items</Typography>

              {items.map((row, idx) => {
                const selectedProd = products.find((p) => p.id === Number(row.product))
                const linePrice = selectedProd ? (Number(selectedProd.price) * Number(row.qty)).toFixed(2) : '0.00'

                return (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} key={idx} alignItems="center">
                    <FormControl required fullWidth size="small">
                      <InputLabel>Product</InputLabel>
                      <Select
                        label="Product"
                        value={row.product}
                        onChange={(e) => handleItemChange(idx, 'product', e.target.value)}
                      >
                        {products.map((p) => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.name} (${Number(p.price).toFixed(2)} | Stock: {p.stock_qty})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      label="Qty"
                      type="number"
                      size="small"
                      inputProps={{ min: 1 }}
                      value={row.qty}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                      sx={{ width: { xs: '100%', sm: 120 } }}
                    />

                    <Typography variant="subtitle2" sx={{ minWidth: 90, textAlign: 'right', fontWeight: 600 }}>
                      ${linePrice}
                    </Typography>

                    {items.length > 1 && (
                      <IconButton color="error" size="small" onClick={() => handleRemoveItemRow(idx)}>
                        <RemoveCircleOutlineIcon />
                      </IconButton>
                    )}
                  </Stack>
                )
              })}

              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 1 }}>
                <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={handleAddItemRow}>
                  Add Line Item
                </Button>
                <Button type="submit" variant="contained" size="large" disabled={saving}>
                  {saving ? <CircularProgress size={24} color="inherit" /> : 'Generate Invoice Draft'}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {/* Search & Filter Controls */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by Invoice ID or Customer Name..."
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
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Draft / Status</InputLabel>
                  <Select label="Draft / Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="confirmed">Confirmed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Payment Status</InputLabel>
                  <Select label="Payment Status" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                    <MenuItem value="">All Payments</MenuItem>
                    <MenuItem value="unpaid">Unpaid</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                    <MenuItem value="overdue">Overdue</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={1}>
                <Button fullWidth variant="text" onClick={() => { setSearch(''); setStatusFilter(''); setPaymentFilter('') }}>
                  Reset
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Invoices List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : invoices.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 6 }}>
            <CardContent>
              <ReceiptIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="h6" color="text.secondary">No invoices found.</Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2.5}>
            {invoices.map((invoice) => {
              const customerObj = invoice.customer || customers.find((c) => c.id === invoice.customer_id)
              const paymentColor = invoice.payment_status === 'paid' ? 'success' : invoice.payment_status === 'overdue' ? 'error' : 'warning'

              return (
                <Grid item xs={12} sm={6} md={4} key={invoice.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, '&:hover': { boxShadow: '0 12px 24px rgba(15,23,42,0.1)' } }}>
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Invoice #{invoice.id}</Typography>
                        <Stack direction="row" spacing={0.5}>
                          <Chip label={invoice.status?.toUpperCase()} color={invoice.status === 'confirmed' ? 'primary' : 'default'} size="small" />
                          <Chip label={invoice.payment_status?.toUpperCase()} color={paymentColor} size="small" />
                        </Stack>
                      </Stack>

                      <Typography color="text.secondary" variant="body2" sx={{ mb: 1.5 }}>
                        Customer: <strong>{customerObj?.name || 'Customer'}</strong>
                      </Typography>

                      <Box sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 2, mb: 2 }}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">SUBTOTAL</Typography>
                          <Typography variant="caption">{formatCurrency(invoice.subtotal || 0, displayCurrency, true)}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">TAX (10%)</Typography>
                          <Typography variant="caption">{formatCurrency(invoice.tax || 0, displayCurrency, true)}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5, pt: 0.5, borderTop: '1px dashed #ccc' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>TOTAL</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            {formatCurrency(invoice.total || 0, displayCurrency, true)}
                          </Typography>
                        </Stack>
                      </Box>

                      <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Live Preview">
                            <IconButton size="small" onClick={() => setPreviewInvoice(invoice)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Export PDF">
                            <IconButton size="small" color="primary" onClick={() => handleDownloadPDF(invoice.id)}>
                              <PictureAsPdfIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Print View">
                            <IconButton size="small" color="secondary" onClick={() => setPrintInvoice(invoice)}>
                              <PrintIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {invoice.payment_status !== 'paid' && (
                            <>
                              <Tooltip title="Pay Online (Gateway)">
                                <IconButton size="small" color="primary" onClick={() => setPayInvoice({ ...invoice, customer_name: invoice.customer?.name })}>
                                  <CreditCardIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Mark as Paid">
                                <IconButton size="small" color="success" onClick={() => handleMarkPaid(invoice.id)}>
                                  <PaidIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Stack>

                        {invoice.status === 'draft' ? (
                          <Button size="small" variant="contained" color="secondary" onClick={() => handleConfirmInvoice(invoice.id)}>
                            Confirm
                          </Button>
                        ) : (
                          <IconButton size="small" color="error" onClick={() => setDeleteId(invoice.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        )}

        {/* Live Invoice Preview Modal */}
        <Dialog open={Boolean(previewInvoice)} onClose={() => setPreviewInvoice(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Invoice #{previewInvoice?.id} Preview</Typography>
            <Chip label={previewInvoice?.payment_status?.toUpperCase()} color={previewInvoice?.payment_status === 'paid' ? 'success' : 'warning'} />
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Customer: {previewInvoice?.customer?.name}</Typography>
              <Typography variant="caption" color="text.secondary">Phone: {previewInvoice?.customer?.phone}</Typography>
              <Typography variant="caption" display="block" color="text.secondary">Date: {new Date(previewInvoice?.created_at).toLocaleString()}</Typography>
            </Box>

            <Table size="small" sx={{ mb: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Line Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewInvoice?.items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product?.name || `Product #${item.product_id}`}</TableCell>
                    <TableCell align="right">{item.qty}</TableCell>
                    <TableCell align="right">${Number(item.unit_price).toFixed(2)}</TableCell>
                    <TableCell align="right">${Number(item.line_total).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Box sx={{ ml: 'auto', width: '50%' }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Subtotal:</Typography>
                <Typography variant="body2">${Number(previewInvoice?.subtotal).toFixed(2)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Tax (10%):</Typography>
                <Typography variant="body2">${Number(previewInvoice?.tax).toFixed(2)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ fontWeight: 700, mt: 1, pt: 1, borderTop: '1px solid #ddd' }}>
                <Typography variant="subtitle1">Total:</Typography>
                <Typography variant="subtitle1">${Number(previewInvoice?.total).toFixed(2)}</Typography>
              </Stack>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button startIcon={<PictureAsPdfIcon />} onClick={() => handleDownloadPDF(previewInvoice.id)}>
              Download PDF
            </Button>
            {previewInvoice?.payment_status !== 'paid' && (
              <Button startIcon={<PaidIcon />} color="success" variant="contained" onClick={() => handleMarkPaid(previewInvoice.id)}>
                Mark Paid
              </Button>
            )}
            <Button onClick={() => setPreviewInvoice(null)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
          <DialogTitle>Confirm Delete Invoice</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this invoice record?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
            <Button onClick={confirmDelete} color="error" variant="contained" disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
        {/* Printable Invoice Modal */}
        <InvoicePrintModal
          invoice={printInvoice}
          open={Boolean(printInvoice)}
          onClose={() => setPrintInvoice(null)}
        />
        {/* AI OCR Receipt Scanner Modal */}
        <OCRScanModal
          open={ocrOpen}
          onClose={() => setOcrOpen(false)}
          onApplyExtraction={handleApplyOCR}
        />
        {/* Payment Checkout Modal */}
        <PaymentCheckoutModal
          invoice={payInvoice}
          open={Boolean(payInvoice)}
          onClose={() => setPayInvoice(null)}
          onPaymentSuccess={() => loadData()}
        />
      </Box>
    </AppLayout>
  )
}
