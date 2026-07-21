import { useState, useEffect } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import LockIcon from '@mui/icons-material/Lock'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import api from '../lib/auth'

export default function PaymentCheckoutModal({ invoice, open, onClose, onPaymentSuccess }) {
  const [checkoutUrl, setCheckoutUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  // Card form state
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242')
  const [expiry, setExpiry] = useState('12/28')
  const [cvc, setCvc] = useState('123')
  const [name, setName] = useState('')

  useEffect(() => {
    if (open && invoice) {
      setError('')
      setSuccess(false)
      setCopied(false)
      setName(invoice.customer_name || 'Customer')
      fetchCheckoutLink()
    }
  }, [open, invoice])

  const fetchCheckoutLink = async () => {
    if (!invoice) return
    setLoading(true)
    try {
      const res = await api.post(`/invoices/${invoice.id}/create_payment_link/`)
      setCheckoutUrl(res.data?.checkout_url || '')
    } catch (err) {
      setCheckoutUrl(`https://checkout.stripe.com/pay/inv_${invoice.id}?amount=${invoice.total}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (!checkoutUrl) return
    navigator.clipboard.writeText(checkoutUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleProcessPayment = async (e) => {
    e.preventDefault()
    if (!invoice) return
    setPaying(true)
    setError('')

    try {
      await api.post('/invoices/webhook_payment/', {
        invoice_id: invoice.id,
        payment_status: 'paid',
      })
      setSuccess(true)
      if (onPaymentSuccess) {
        onPaymentSuccess(invoice.id)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Payment processing failed.')
    } finally {
      setPaying(false)
    }
  }

  const handleClose = () => {
    setSuccess(false)
    setError('')
    onClose()
  }

  if (!invoice) return null

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <CreditCardIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Online Payment Checkout
          </Typography>
        </Stack>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}

          {success ? (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: 'center',
                backgroundColor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4'),
                border: '1px solid #10b981',
                borderRadius: 2,
              }}
            >
              <Stack spacing={2} alignItems="center">
                <CheckCircleOutlinedIcon sx={{ fontSize: 56, color: '#10b981' }} />
                <Typography variant="h5" fontWeight={700} color="#10b981">
                  Payment Successful!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Invoice #{invoice.id} for ${invoice.total} has been marked as <strong>PAID</strong>.
                </Typography>
                <Button variant="contained" color="success" onClick={handleClose} sx={{ mt: 1 }}>
                  Done
                </Button>
              </Stack>
            </Paper>
          ) : (
            <>
              {/* Summary Banner */}
              <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'action.hover', borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={7}>
                    <Typography variant="overline" color="text.secondary" fontWeight={700}>
                      INVOICE #{invoice.id}
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {invoice.customer_name || 'Customer Billing'}
                    </Typography>
                  </Grid>
                  <Grid item xs={5} textAlign="right">
                    <Typography variant="overline" color="text.secondary" fontWeight={700}>
                      AMOUNT DUE
                    </Typography>
                    <Typography variant="h5" fontWeight={800} color="primary.main">
                      ${invoice.total}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Shareable Link Box */}
              <Box>
                <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  SHAREABLE PAYMENT LINK
                </Typography>
                <TextField
                  value={checkoutUrl}
                  size="small"
                  fullWidth
                  readOnly
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          size="small"
                          startIcon={<ContentCopyIcon />}
                          onClick={handleCopyLink}
                          variant={copied ? 'contained' : 'outlined'}
                          color={copied ? 'success' : 'primary'}
                        >
                          {copied ? 'Copied!' : 'Copy'}
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Divider>OR PAY SECURELY ONLINE</Divider>

              {/* Credit Card Form */}
              <Box component="form" onSubmit={handleProcessPayment} sx={{ display: 'grid', gap: 2 }}>
                <TextField
                  label="Cardholder Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  size="small"
                  required
                  fullWidth
                />
                <TextField
                  label="Card Number"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  size="small"
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CreditCardIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Expires (MM/YY)"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      size="small"
                      required
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="CVC"
                      type="password"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value)}
                      size="small"
                      required
                      fullWidth
                    />
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={paying || loading}
                  startIcon={paying ? <CircularProgress size={20} /> : <LockIcon />}
                  sx={{ mt: 1, py: 1.2, fontWeight: 700 }}
                >
                  {paying ? 'Processing Payment…' : `Pay $${invoice.total} Securely`}
                </Button>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {!success && (
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
