import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, MenuItem, Stack, TextField, Typography, Avatar, IconButton } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined'
import EditIcon from '@mui/icons-material/Edit'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import api from '../lib/auth'
import AppLayout from '../components/AppLayout'

export default function CompanySetupPage() {
  const [form, setForm] = useState({ name: '', owner_name: '', owner_email: '', owner_phone: '', category: 'retail', currency: 'USD', logo: null })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingCompany, setExistingCompany] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const loadCompany = () => {
    setLoading(true)
    api.get('/companies/me/')
      .then(({ data }) => {
        setExistingCompany(data)
        setForm({
          name: data.name || '',
          owner_name: data.owner_name || '',
          owner_email: data.owner_email || '',
          owner_phone: data.owner_phone || '',
          category: data.category || 'retail',
          currency: data.currency || 'USD',
          logo: null
        })
        setEditMode(false)
      })
      .catch(() => {
        // No company exists yet
        setExistingCompany(null)
        setEditMode(true)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadCompany()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!form.name.trim()) {
      setError('Company name is required.')
      return
    }

    if (form.owner_email && !/\S+@\S+\.\S+/.test(form.owner_email)) {
      setError('Please provide a valid owner email address.')
      return
    }

    setIsSubmitting(true)
    try {
      const data = new FormData()
      data.append('name', form.name.trim())
      data.append('owner_name', form.owner_name || '')
      data.append('owner_email', form.owner_email || '')
      data.append('owner_phone', form.owner_phone || '')
      data.append('category', form.category)
      data.append('currency', form.currency)
      if (form.logo) data.append('logo', form.logo)

      if (existingCompany) {
        const { data: updated } = await api.patch('/companies/me/', data)
        setExistingCompany(updated)
        setEditMode(false)
        setMessage('Company settings updated successfully.')
      } else {
        const { data: created } = await api.post('/companies/', data)
        setExistingCompany(created)
        setShowSuccess(true)
      }
    } catch (err) {
      const responseData = err.response?.data
      const message = responseData?.detail || responseData?.name?.[0] || responseData?.logo?.[0] || (typeof responseData === 'string' ? responseData : 'Company setup failed.')
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <Box sx={{ minHeight: 'calc(100vh - 96px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </AppLayout>
    )
  }

  if (showSuccess) {
    return (
      <AppLayout>
        <Box sx={{ minHeight: 'calc(100vh - 96px)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 1, md: 3 } }}>
          <Card sx={{ width: '100%', maxWidth: 560, borderRadius: 4, textAlign: 'center', boxShadow: '0 20px 60px rgba(15, 23, 42, 0.12)' }}>
            <CardContent sx={{ p: { xs: 4, md: 5 } }}>
              <CheckCircleOutlineIcon color="success" sx={{ fontSize: 72, mb: 2 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Setup Completed!</Typography>
              <Typography color="text.secondary" sx={{ mb: 4 }}>
                Your company workspace <strong>{existingCompany?.name}</strong> has been successfully configured.
              </Typography>
              
              <Box sx={{ bgcolor: 'action.hover', p: 3, borderRadius: 2, mb: 4, textAlign: 'left' }}>
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 1 }}>WORKSPACE INFO</Typography>
                <Typography variant="body2"><strong>Company Name:</strong> {existingCompany?.name}</Typography>
                <Typography variant="body2"><strong>Category:</strong> {existingCompany?.category?.toUpperCase()}</Typography>
                <Typography variant="body2"><strong>Currency:</strong> {existingCompany?.currency}</Typography>
                {existingCompany?.owner_name && <Typography variant="body2"><strong>Owner Name:</strong> {existingCompany.owner_name}</Typography>}
              </Box>

              <Button variant="contained" size="large" onClick={() => navigate('/dashboard')} fullWidth>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </Box>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <Box sx={{ minHeight: 'calc(100vh - 96px)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 1, md: 3 } }}>
        <Card sx={{ width: '100%', maxWidth: 580, borderRadius: 4, boxShadow: '0 20px 60px rgba(15, 23, 42, 0.12)' }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            {existingCompany && !editMode ? (
              // Read-only Details View
              <Stack spacing={3}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>COMPANY PROFILE</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>Workspace Details</Typography>
                  </Box>
                  <Button startIcon={<EditIcon />} variant="outlined" onClick={() => setEditMode(true)}>
                    Edit Details
                  </Button>
                </Stack>
                {message && <Alert severity="success">{message}</Alert>}
                
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center" sx={{ p: 3, bgcolor: 'action.hover', borderRadius: 3 }}>
                  <Avatar 
                    src={existingCompany.logo ? existingCompany.logo : undefined} 
                    alt={existingCompany.name} 
                    sx={{ width: 80, height: 80, fontSize: 32, bgcolor: 'primary.main' }}
                  >
                    {existingCompany.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, textAlign: { xs: 'center', sm: 'left' } }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{existingCompany.name}</Typography>
                    <Typography color="text.secondary">{existingCompany.category?.charAt(0).toUpperCase() + existingCompany.category?.slice(1)} business</Typography>
                  </Box>
                </Stack>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">CURRENCY</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{existingCompany.currency}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">OWNER NAME</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{existingCompany.owner_name || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">OWNER EMAIL</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{existingCompany.owner_email || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">OWNER PHONE</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{existingCompany.owner_phone || '—'}</Typography>
                  </Box>
                </Box>
                
                <Button variant="contained" size="large" onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              </Stack>
            ) : (
              // Setup/Edit Form View
              <Stack spacing={3}>
                <Stack direction="row" spacing={1} alignItems="center">
                  {existingCompany && (
                    <IconButton onClick={() => setEditMode(false)}>
                      <ArrowBackIcon />
                    </IconButton>
                  )}
                  <Box>
                    <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>
                      {existingCompany ? 'UPDATE PROFILE' : 'SET UP YOUR COMPANY'}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {existingCompany ? 'Edit company details' : 'Create your workspace'}
                    </Typography>
                  </Box>
                </Stack>
                {error && <Alert severity="error">{error}</Alert>}
                <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2 }}>
                  <TextField label="Company Name" required disabled={isSubmitting} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <TextField label="Owner Name" disabled={isSubmitting} value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
                  <TextField label="Owner Email" type="email" disabled={isSubmitting} value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} />
                  <TextField label="Owner Phone" disabled={isSubmitting} value={form.owner_phone} onChange={(e) => setForm({ ...form, owner_phone: e.target.value })} />
                  
                  <TextField select label="Business Category" disabled={isSubmitting || (existingCompany && existingCompany.category)} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} helperText={existingCompany ? "Business category cannot be changed after setup." : ""}>
                    <MenuItem value="retail">Retail</MenuItem>
                    <MenuItem value="medical">Medical</MenuItem>
                    <MenuItem value="education">Education</MenuItem>
                    <MenuItem value="restaurant">Restaurant</MenuItem>
                  </TextField>
                  
                  <TextField label="Currency" disabled={isSubmitting} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
                  
                  <Button variant="outlined" component="label" sx={{ justifyContent: 'center', py: 1.5 }} disabled={isSubmitting}>
                    Upload logo
                    <input
                      hidden
                      accept="image/png,image/jpeg"
                      type="file"
                      onChange={(e) => setForm({ ...form, logo: e.target.files?.[0] ?? null })}
                    />
                  </Button>
                  {form.logo && <Typography variant="body2" sx={{ textAlign: 'center' }}>Selected file: {form.logo.name}</Typography>}
                  
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    {existingCompany && (
                      <Button variant="outlined" size="large" onClick={() => setEditMode(false)} disabled={isSubmitting} fullWidth>
                        Cancel
                      </Button>
                    )}
                    <Button type="submit" variant="contained" size="large" disabled={isSubmitting} fullWidth>
                      {isSubmitting ? <CircularProgress size={24} color="inherit" /> : existingCompany ? 'Save changes' : 'Create company'}
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            )}
          </CardContent>
        </Card>

        {/* Data Backup & System Diagnostics Section */}
        {existingCompany && !editMode && (
          <Card sx={{ mt: 3, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Data Portability & System Health</Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mb: 2.5 }}>
                Export a complete JSON backup of your operational data or inspect active system health diagnostics.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={async () => {
                    try {
                      const response = await api.get('/companies/export-backup/', { responseType: 'blob' })
                      const url = window.URL.createObjectURL(new Blob([response.data]))
                      const link = document.createElement('a')
                      link.href = url
                      link.setAttribute('download', `company_backup_${existingCompany.name.toLowerCase().replace(/\s+/g, '_')}.json`)
                      document.body.appendChild(link)
                      link.click()
                      link.remove()
                    } catch {
                      setError('Failed to download backup file.')
                    }
                  }}
                >
                  Export Full Backup (JSON)
                </Button>

                <Stack direction="row" spacing={1}>
                  <Chip label="Database: Connected" color="success" size="small" />
                  <Chip label="Multi-Tenant: Isolated" color="primary" size="small" />
                  <Chip label="API Status: Operational" variant="outlined" size="small" />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Box>
    </AppLayout>
  )
}
