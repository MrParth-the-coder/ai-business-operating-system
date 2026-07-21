import { useEffect, useState } from 'react'
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent,
  Divider, Stack, Table, TableBody, TableCell, TableHead,
  TableRow, Typography, useTheme
} from '@mui/material'
import PrintIcon from '@mui/icons-material/Print'
import CloseIcon from '@mui/icons-material/Close'
import api from '../lib/auth'

export default function InvoicePrintModal({ invoice, open, onClose }) {
  const theme = useTheme()
  const [company, setCompany] = useState(null)

  useEffect(() => {
    if (open) {
      api.get('/companies/me/')
        .then(({ data }) => setCompany(data))
        .catch(() => {})
    }
  }, [open])

  if (!invoice) return null

  const companyData = invoice.company || company
  const companyName = companyData?.name || 'AI-BOS OPERATIONS'
  const companyAddress = companyData?.address || ''
  const companyTaxRate = companyData?.tax_rate !== undefined ? parseFloat(companyData.tax_rate) : 10.0
  const companyTerms = companyData?.billing_terms || 'Thank you for your business! Payment due within 15 days.'
  const logoUrl = companyData?.logo || null

  const items = invoice.items || []
  const subtotal = Number(invoice.subtotal || items.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.qty || 1)), 0))
  const tax = Number(invoice.tax || (subtotal * companyTaxRate) / 100)
  const grandTotal = Number(invoice.total || (subtotal + tax))

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
          p: 1
        }
      }}
    >
      <DialogContent id="printable-invoice-content">
        <Box sx={{ p: 3, bgcolor: '#ffffff', color: '#0f172a', borderRadius: 2 }}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 4 }}>
            <Box>
              {logoUrl ? (
                <Box component="img" src={logoUrl} alt={companyName} sx={{ maxHeight: 48, mb: 1, objectFit: 'contain' }} />
              ) : null}
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b' }}>
                {companyName.toUpperCase()}
              </Typography>
              {companyAddress && (
                <Typography variant="body2" sx={{ color: '#64748b', whiteSpace: 'pre-line' }}>
                  {companyAddress}
                </Typography>
              )}
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#4f46e5' }}>
                INVOICE #{invoice.id}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Date: {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : 'N/A'}
              </Typography>
              <Chip
                label={invoice.payment_status?.toUpperCase() || 'DRAFT'}
                size="small"
                sx={{
                  mt: 1,
                  fontWeight: 700,
                  bgcolor: invoice.payment_status === 'paid' ? '#dcfce7' : '#fef3c7',
                  color: invoice.payment_status === 'paid' ? '#15803d' : '#b45309'
                }}
              />
            </Box>
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* Customer & Billed To */}
          <GridContainer>
            <Box sx={{ flex: 1 }}>
              <Typography variant="overline" sx={{ fontWeight: 700, color: '#64748b', letterSpacing: 1 }}>
                BILLED TO
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                {invoice.customer?.name || 'Walk-in Customer'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                {invoice.customer?.email || 'No email provided'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                {invoice.customer?.phone || 'No phone provided'}
              </Typography>
            </Box>
          </GridContainer>

          {/* Items Table */}
          <Table sx={{ my: 4 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>ITEM DESCRIPTION</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>QTY</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>UNIT PRICE</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>AMOUNT</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => {
                const lineTotal = Number(item.price || item.unit_price || 0) * Number(item.qty || 1)
                return (
                  <TableRow key={index}>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>
                      {item.product_name || item.name || `Product #${item.product}`}
                    </TableCell>
                    <TableCell align="center" sx={{ color: '#475569' }}>{item.qty}</TableCell>
                    <TableCell align="right" sx={{ color: '#475569' }}>${Number(item.price || item.unit_price || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#0f172a' }}>${lineTotal.toFixed(2)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* Totals Summary */}
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 4 }}>
            <Box sx={{ width: 280 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>Subtotal:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>${subtotal.toFixed(2)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>Tax ({companyTaxRate.toFixed(1)}%):</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>${tax.toFixed(2)}</Typography>
              </Stack>
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>Total Amount:</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#4f46e5' }}>${grandTotal.toFixed(2)}</Typography>
              </Stack>
            </Box>
          </Stack>

          {/* Footer Signature Block & Terms */}
          <Divider sx={{ my: 4 }} />
          <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
            <Box sx={{ maxWidth: '60%' }}>
              <Typography variant="overline" sx={{ fontWeight: 700, color: '#64748b' }}>TERMS & NOTES</Typography>
              <Typography variant="body2" sx={{ color: '#475569', whiteSpace: 'pre-line' }}>
                {companyTerms}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', width: 180 }}>
              <Box sx={{ borderBottom: '1px dashed #cbd5e1', mb: 1, pb: 3 }} />
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Authorized Signature
              </Typography>
            </Box>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose} startIcon={<CloseIcon />} variant="outlined">
          Close
        </Button>
        <Button onClick={handlePrint} startIcon={<PrintIcon />} variant="contained">
          Print Invoice
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function GridContainer({ children }) {
  return <Box sx={{ display: 'flex', gap: 2 }}>{children}</Box>
}
