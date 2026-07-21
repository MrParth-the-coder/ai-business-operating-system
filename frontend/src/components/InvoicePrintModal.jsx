import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent,
  Divider, Stack, Table, TableBody, TableCell, TableHead,
  TableRow, Typography, useTheme
} from '@mui/material'
import PrintIcon from '@mui/icons-material/Print'
import CloseIcon from '@mui/icons-material/Close'

export default function InvoicePrintModal({ invoice, open, onClose }) {
  const theme = useTheme()

  if (!invoice) return null

  const items = invoice.items || []
  const subtotal = items.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.qty || 1)), 0)
  const tax = subtotal * 0.1
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
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b' }}>
                AI-BOS INVOICE
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Enterprise Operations Suite
              </Typography>
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
                const lineTotal = Number(item.price || 0) * Number(item.qty || 1)
                return (
                  <TableRow key={index}>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>
                      {item.product_name || `Product #${item.product}`}
                    </TableCell>
                    <TableCell align="center" sx={{ color: '#475569' }}>{item.qty}</TableCell>
                    <TableCell align="right" sx={{ color: '#475569' }}>${Number(item.price || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#0f172a' }}>${lineTotal.toFixed(2)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* Totals Summary */}
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 4 }}>
            <Box sx={{ width: 260 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>Subtotal:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>${subtotal.toFixed(2)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>Estimated Tax (10%):</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>${tax.toFixed(2)}</Typography>
              </Stack>
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>Total Amount:</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#4f46e5' }}>${grandTotal.toFixed(2)}</Typography>
              </Stack>
            </Box>
          </Stack>

          {/* Footer Signature Block */}
          <Divider sx={{ my: 4 }} />
          <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
            <Box>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Thank you for your business! Terms: Net 30 days.
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', width: 200 }}>
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
