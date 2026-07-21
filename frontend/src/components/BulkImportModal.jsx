import { useState } from 'react'
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Stack, Typography
} from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import DownloadIcon from '@mui/icons-material/Download'
import api from '../lib/auth'

export default function BulkImportModal({ open, onClose, entityName, endpoint, sampleCsvContent, onSuccess }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `${entityName.toLowerCase()}_import_template.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleUpload = () => {
    if (!file) {
      setError('Please select a CSV file to upload.')
      return
    }

    setUploading(true)
    setError('')
    setSuccessMsg('')

    const formData = new FormData()
    formData.append('file', file)

    api.post(`${endpoint}bulk_import/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then(({ data }) => {
        setSuccessMsg(data.detail || `Successfully imported ${data.imported_count || 0} ${entityName.toLowerCase()}s.`)
        setFile(null)
        if (onSuccess) onSuccess()
        setTimeout(() => {
          onClose()
          setSuccessMsg('')
        }, 1800)
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Failed to upload CSV file.')
      })
      .finally(() => setUploading(false))
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Bulk Import {entityName}s via CSV
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Typography variant="body2" color="text.secondary">
            Quickly add multiple {entityName.toLowerCase()}s by uploading a CSV file. Make sure your columns match the required field headers.
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}
          {successMsg && <Alert severity="success">{successMsg}</Alert>}

          <Box sx={{ border: '2px dashed rgba(148, 163, 184, 0.4)', borderRadius: 3, p: 3, textAlign: 'center', bgcolor: 'action.hover' }}>
            <UploadFileIcon sx={{ fontSize: 44, color: 'primary.main', mb: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {file ? file.name : 'Select or Drag CSV File'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Supports .csv format up to 5MB
            </Typography>

            <Button variant="outlined" component="label">
              Choose File
              <input type="file" accept=".csv" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </Button>
          </Box>

          <Button
            variant="text"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadTemplate}
            sx={{ alignSelf: 'flex-start' }}
          >
            Download Sample CSV Template
          </Button>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={uploading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!file || uploading}
          startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {uploading ? 'Importing…' : 'Start Bulk Import'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
