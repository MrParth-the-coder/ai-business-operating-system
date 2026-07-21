import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import api from '../lib/auth'

export default function OCRScanModal({ open, onClose, onApplyExtraction }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [extractedData, setExtractedData] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setError('')
    setExtractedData(null)

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => setPreviewUrl(reader.result)
      reader.readAsDataURL(file)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleScan = async () => {
    if (!selectedFile) return
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      const res = await api.post('/invoices/scan_ocr/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setExtractedData(res.data?.extracted_data || null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to scan receipt via AI OCR.')
    } finally {
      setLoading(false)
    }
  }

  const handleItemChange = (index, field, value) => {
    if (!extractedData) return
    const updatedItems = [...extractedData.items]
    const updatedItem = { ...updatedItems[index], [field]: value }
    if (field === 'qty' || field === 'unit_price') {
      const qty = parseFloat(field === 'qty' ? value : updatedItem.qty) || 0
      const price = parseFloat(field === 'unit_price' ? value : updatedItem.unit_price) || 0
      updatedItem.line_total = (qty * price).toFixed(2)
    }
    updatedItems[index] = updatedItem

    const newSubtotal = updatedItems.reduce((acc, item) => acc + (parseFloat(item.line_total) || 0), 0)
    const newTax = newSubtotal * 0.1
    const newTotal = newSubtotal + newTax

    setExtractedData({
      ...extractedData,
      items: updatedItems,
      subtotal: newSubtotal.toFixed(2),
      tax: newTax.toFixed(2),
      total: newTotal.toFixed(2),
    })
  }

  const handleApply = () => {
    if (extractedData && onApplyExtraction) {
      onApplyExtraction(extractedData)
    }
    handleClose()
  }

  const handleClose = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setLoading(false)
    setError('')
    setExtractedData(null)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <AutoAwesomeIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            AI Invoice & Receipt OCR Scanner
          </Typography>
        </Stack>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}

          {!extractedData ? (
            <Paper
              variant="outlined"
              sx={{
                p: 4,
                textAlign: 'center',
                borderStyle: 'dashed',
                borderWidth: 2,
                borderColor: 'primary.main',
                backgroundColor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.05)' : '#f8fafc'),
                borderRadius: 2,
              }}
            >
              <Stack spacing={2} alignItems="center">
                <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  Upload receipt or paper invoice image (JPEG, PNG, PDF)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Google Gemini 2.0 Flash Vision AI will automatically parse vendor details and line items.
                </Typography>
                <Button variant="contained" component="label" disabled={loading}>
                  Choose File
                  <input type="file" hidden accept="image/*,application/pdf" onChange={handleFileChange} />
                </Button>

                {selectedFile && (
                  <Chip
                    label={`${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`}
                    onDelete={() => {
                      setSelectedFile(null)
                      setPreviewUrl(null)
                    }}
                    color="primary"
                    variant="outlined"
                  />
                )}

                {previewUrl && (
                  <Box
                    component="img"
                    src={previewUrl}
                    alt="Receipt preview"
                    sx={{ maxHeight: 220, borderRadius: 1, boxShadow: 1, mt: 1, objectFit: 'contain' }}
                  />
                )}

                {selectedFile && !loading && (
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    startIcon={<AutoAwesomeIcon />}
                    onClick={handleScan}
                    sx={{ mt: 2 }}
                  >
                    Scan Receipt with AI
                  </Button>
                )}

                {loading && (
                  <Stack spacing={1} alignItems="center" sx={{ py: 2 }}>
                    <CircularProgress size={36} />
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Analyzing receipt layout and extracting items...
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Paper>
          ) : (
            <Stack spacing={2}>
              <Alert severity="success" icon={<CheckCircleOutlinedIcon />}>
                Receipt parsed successfully! Review and edit extracted details below before auto-filling.
              </Alert>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
                <TextField
                  label="Vendor Name"
                  value={extractedData.vendor_name || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, vendor_name: e.target.value })}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Invoice Date"
                  type="date"
                  value={extractedData.invoice_date || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, invoice_date: e.target.value })}
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>

              <Typography variant="subtitle2" fontWeight={700}>
                Extracted Line Items ({extractedData.items?.length || 0})
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: (theme) => (theme.palette.mode === 'dark' ? '#1e293b' : '#f1f5f9') }}>
                      <TableCell fontWeight={700}>Product Description</TableCell>
                      <TableCell width={90} fontWeight={700}>Qty</TableCell>
                      <TableCell width={130} fontWeight={700}>Unit Price ($)</TableCell>
                      <TableCell width={130} fontWeight={700}>Total ($)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {extractedData.items?.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <TextField
                            value={item.name}
                            onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                            size="small"
                            fullWidth
                            variant="standard"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.qty}
                            onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                            size="small"
                            variant="standard"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                            size="small"
                            variant="standard"
                          />
                        </TableCell>
                        <TableCell fontWeight={600}>${parseFloat(item.line_total).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ alignSelf: 'flex-end', width: { xs: '100%', sm: 300 }, pt: 1 }}>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Subtotal:</Typography>
                    <Typography fontWeight={600}>${parseFloat(extractedData.subtotal).toFixed(2)}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Tax (10%):</Typography>
                    <Typography fontWeight={600}>${parseFloat(extractedData.tax).toFixed(2)}</Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="subtitle1" fontWeight={700}>Total:</Typography>
                    <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                      ${parseFloat(extractedData.total).toFixed(2)}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        {extractedData && (
          <Button variant="contained" startIcon={<AutoAwesomeIcon />} onClick={handleApply}>
            Auto-Fill Invoice Draft
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
