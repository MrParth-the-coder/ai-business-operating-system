import { useEffect, useState } from 'react'
import {
  Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow,
  Typography, useTheme
} from '@mui/material'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import PrintIcon from '@mui/icons-material/Print'
import api from '../lib/auth'

export default function CustomerStatementModal({ customer, open, onClose }) {
  const theme = useTheme()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && customer) {
      setLoading(true)
      api.get('/invoices/')
        .then(({ data }) => {
          const allInvoices = data.results || data || []
          const filtered = allInvoices.filter(
            (inv) => inv.customer?.id === customer.id || inv.customer_id === customer.id
          )
          setInvoices(filtered)
        })
        .catch(() => setInvoices([]))
        .finally(() => setLoading(false))
    }
  }, [open, customer])

  if (!customer) return null

  const totalBilled = invoices.reduce((acc, inv) => acc + Number(inv.total || 0), 0)
  const totalPaid = invoices
    .filter((inv) => inv.payment_status === 'paid')
    .reduce((acc, inv) => acc + Number(inv.total || 0), 0)
  const balanceDue = totalBilled - totalPaid

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: theme.palette.background.paper,
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ReceiptLongIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Account Statement — {customer.name}</Typography>
        </Stack>
        <Chip label={customer.segment ? customer.segment.toUpperCase() : 'CLIENT'} color="secondary" size="small" />
      </DialogTitle>

      <DialogContent dividers>
        {/* Contact Info Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">Email: {customer.email || '—'}</Typography>
          <Typography variant="body2" color="text.secondary">Phone: {customer.phone || '—'}</Typography>
        </Box>

        {/* Financial Overview Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">TOTAL BILLED</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>${totalBilled.toFixed(2)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="success.main">TOTAL PAID</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main', mt: 0.5 }}>${totalPaid.toFixed(2)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="error.main">OUTSTANDING BALANCE</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main', mt: 0.5 }}>${balanceDue.toFixed(2)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Transaction History Ledger */}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          Billing Ledger ({invoices.length} transactions)
        </Typography>

        {loading ? (
          <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress size={28} /></Box>
        ) : invoices.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
            No invoice records found for this customer.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>INVOICE ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>DATE</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>AMOUNT</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>PAYMENT STATUS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell sx={{ fontWeight: 600 }}>Invoice #{inv.id}</TableCell>
                  <TableCell>{inv.created_at ? new Date(inv.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>${Number(inv.total).toFixed(2)}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={inv.payment_status?.toUpperCase() || 'DRAFT'}
                      size="small"
                      color={inv.payment_status === 'paid' ? 'success' : 'warning'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose} variant="outlined">Close</Button>
        <Button onClick={handlePrint} startIcon={<PrintIcon />} variant="contained">Print Statement</Button>
      </DialogActions>
    </Dialog>
  )
}
