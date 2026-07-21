import { useEffect, useState } from 'react'
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress,
  FormControl, InputAdornment, InputLabel, MenuItem, Select, Stack, TextField,
  Tooltip, Typography, useTheme
} from '@mui/material'
import HistoryIcon from '@mui/icons-material/History'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import ReceiptIcon from '@mui/icons-material/Receipt'
import GroupIcon from '@mui/icons-material/Group'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import BusinessIcon from '@mui/icons-material/Business'
import EventNoteIcon from '@mui/icons-material/EventNote'
import SearchIcon from '@mui/icons-material/Search'
import DownloadIcon from '@mui/icons-material/Download'
import ComputerIcon from '@mui/icons-material/Computer'
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone'
import SecurityIcon from '@mui/icons-material/Security'
import api from '../lib/auth'
import AppLayout from '../components/AppLayout'

const getActionIcon = (actionType) => {
  switch (actionType) {
    case 'PRODUCT_CREATED':
    case 'PRODUCT_RESTOCKED':
      return <ShoppingCartIcon fontSize="small" />
    case 'CUSTOMER_CREATED':
      return <PersonAddIcon fontSize="small" />
    case 'INVOICE_CREATED':
    case 'INVOICE_STATUS':
      return <ReceiptIcon fontSize="small" />
    case 'EMPLOYEE_ADDED':
      return <GroupIcon fontSize="small" />
    case 'BULK_IMPORT':
      return <CloudUploadIcon fontSize="small" />
    case 'COMPANY_UPDATED':
      return <BusinessIcon fontSize="small" />
    default:
      return <EventNoteIcon fontSize="small" />
  }
}

const getActionColor = (actionType) => {
  switch (actionType) {
    case 'PRODUCT_CREATED':
    case 'PRODUCT_RESTOCKED':
      return 'primary'
    case 'CUSTOMER_CREATED':
    case 'EMPLOYEE_ADDED':
      return 'info'
    case 'INVOICE_CREATED':
    case 'INVOICE_STATUS':
      return 'success'
    case 'BULK_IMPORT':
      return 'secondary'
    default:
      return 'default'
  }
}

export default function ActivityLogPage() {
  const theme = useTheme()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [actionTypeFilter, setActionTypeFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [exporting, setExporting] = useState(false)

  const fetchLogs = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (actionTypeFilter) params.append('action_type', actionTypeFilter)
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)

    api.get(`/audit-logs/?${params.toString()}`)
      .then(({ data }) => setLogs(data.results || data))
      .catch(() => setError('Failed to load activity log history.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchLogs()
  }, [search, actionTypeFilter, startDate, endDate])

  const handleExportCSV = () => {
    setExporting(true)
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (actionTypeFilter) params.append('action_type', actionTypeFilter)
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)

    api.get(`/audit-logs/export_csv/?${params.toString()}`, { responseType: 'blob' })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'security_audit_log.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
      .catch(() => setError('Failed to export security audit log.'))
      .finally(() => setExporting(false))
  }

  return (
    <AppLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>
              <HistoryIcon />
            </Avatar>
            <Box>
              <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>
                ENTERPRISE SECURITY & AUDIT
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Activity Log History
              </Typography>
              <Typography color="text.secondary">
                Real-time IP tracking, device user-agents, and transaction compliance logs.
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            disabled={exporting || logs.length === 0}
          >
            {exporting ? 'Exporting…' : 'Export Security Audit (CSV)'}
          </Button>
        </Stack>

        {/* Filter Toolbar */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by IP, user, action, or description..."
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

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filter by Action Type</InputLabel>
                  <Select
                    value={actionTypeFilter}
                    label="Filter by Action Type"
                    onChange={(e) => setActionTypeFilter(e.target.value)}
                  >
                    <MenuItem value=""><em>All Actions</em></MenuItem>
                    <MenuItem value="PRODUCT_CREATED">Product Created</MenuItem>
                    <MenuItem value="PRODUCT_RESTOCKED">Product Restocked</MenuItem>
                    <MenuItem value="CUSTOMER_CREATED">Customer Created</MenuItem>
                    <MenuItem value="INVOICE_CREATED">Invoice Created</MenuItem>
                    <MenuItem value="INVOICE_STATUS">Invoice Status Updated</MenuItem>
                    <MenuItem value="EMPLOYEE_ADDED">Employee Added</MenuItem>
                    <MenuItem value="BULK_IMPORT">Bulk Import Executed</MenuItem>
                    <MenuItem value="COMPANY_UPDATED">Company Updated</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} sm={3} md={2.5}>
                <TextField
                  fullWidth
                  size="small"
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={6} sm={3} md={2.5}>
                <TextField
                  fullWidth
                  size="small"
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : logs.length === 0 ? (
          <Card sx={{ p: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">No security audit entries match your filters.</Typography>
          </Card>
        ) : (
          <Stack spacing={2}>
            {logs.map((log) => (
              <Card key={log.id} sx={{ borderRadius: 2.5, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(79, 70, 229, 0.1)', color: 'primary.main' }}>
                        {getActionIcon(log.action_type)}
                      </Avatar>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {log.action}
                          </Typography>
                          {log.ip_address && (
                            <Tooltip title={`Recorded Client IP: ${log.ip_address}`}>
                              <Chip
                                icon={<SecurityIcon sx={{ fontSize: '13px !important' }} />}
                                label={log.ip_address}
                                size="small"
                                variant="outlined"
                                color="default"
                                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                              />
                            </Tooltip>
                          )}
                          {log.user_agent && (
                            <Tooltip title={`Device User Agent: ${log.user_agent}`}>
                              <Chip
                                icon={log.user_agent.toLowerCase().includes('mobile') ? <PhoneIphoneIcon sx={{ fontSize: '13px !important' }} /> : <ComputerIcon sx={{ fontSize: '13px !important' }} />}
                                label={log.user_agent.toLowerCase().includes('mobile') ? 'Mobile' : 'Desktop'}
                                size="small"
                                variant="outlined"
                                color="info"
                                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                              />
                            </Tooltip>
                          )}
                        </Stack>

                        {log.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.2 }}>
                            {log.description}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          By <b>{log.user_name || log.user_email}</b> ({log.user_email}) • {new Date(log.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                    </Stack>

                    <Chip
                      label={log.action_type.replace('_', ' ')}
                      color={getActionColor(log.action_type)}
                      size="small"
                      sx={{ fontWeight: 600, px: 1 }}
                    />
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Box>
    </AppLayout>
  )
}
