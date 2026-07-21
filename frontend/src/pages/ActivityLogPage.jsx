import { useEffect, useState } from 'react'
import {
  Alert, Avatar, Box, Card, CardContent, Chip, CircularProgress,
  FormControl, InputLabel, MenuItem, Select, Stack, Typography, useTheme
} from '@mui/material'
import HistoryIcon from '@mui/icons-material/History'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import ReceiptIcon from '@mui/icons-material/Receipt'
import GroupIcon from '@mui/icons-material/Group'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import BusinessIcon from '@mui/icons-material/Business'
import EventNoteIcon from '@mui/icons-material/EventNote'
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
  const [actionTypeFilter, setActionTypeFilter] = useState('')

  const fetchLogs = () => {
    setLoading(true)
    const params = {}
    if (actionTypeFilter) params.action_type = actionTypeFilter

    api.get('/audit-logs/', { params })
      .then(({ data }) => setLogs(data.results || data))
      .catch(() => setError('Failed to load activity log history.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchLogs()
  }, [actionTypeFilter])

  return (
    <AppLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>
            <HistoryIcon />
          </Avatar>
          <Box>
            <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>
              AUDIT TRAIL & SYSTEM EVENTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Activity Log History
            </Typography>
            <Typography color="text.secondary">
              Real-time records of business operations, employee edits, and system transactions.
            </Typography>
          </Box>
        </Stack>

        {/* Filter Controls */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 240 }}>
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
            </Stack>
          </CardContent>
        </Card>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : logs.length === 0 ? (
          <Card sx={{ p: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">No activity log entries recorded yet.</Typography>
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
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {log.action}
                        </Typography>
                        {log.description && (
                          <Typography variant="body2" color="text.secondary">
                            {log.description}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          By <b>{log.user_name || log.user_email}</b> • {new Date(log.timestamp).toLocaleString()}
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
