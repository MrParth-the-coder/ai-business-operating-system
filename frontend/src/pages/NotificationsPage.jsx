import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Grid, Stack, Tabs, Tab, Typography, Avatar, Tooltip
} from '@mui/material'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import WarningIcon from '@mui/icons-material/Warning'
import ReceiptIcon from '@mui/icons-material/Receipt'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import PriorityHighIcon from '@mui/icons-material/PriorityHigh'
import api from '../lib/auth'
import AppLayout from '../components/AppLayout'

export default function NotificationsPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [categoryTab, setCategoryTab] = useState('all')

  const loadNotifications = () => {
    setLoading(true)
    api.get('/notifications/')
      .then(({ data }) => setItems(data))
      .catch(() => setError('Unable to load notifications.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const handleMarkRead = async (item) => {
    try {
      await api.post('/notifications/', { id: item.id })
      setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, is_read: true } : entry)))
    } catch {
      setError('Unable to update notification.')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/', { action: 'mark_all_read' })
      setItems((current) => current.map((entry) => ({ ...entry, is_read: true })))
    } catch {
      setError('Failed to mark all notifications as read.')
    }
  }

  const filteredItems = items.filter((item) => {
    if (categoryTab === 'unread') return !item.is_read
    if (categoryTab === 'low_stock') return item.type === 'low_stock'
    if (categoryTab === 'invoices') return item.type === 'invoice_created' || item.type === 'invoice_overdue'
    return true
  })

  const unreadCount = items.filter((i) => !i.is_read).length

  return (
    <AppLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 3 }}>
          <Box>
            <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>AUTOMATION & ALERTS</Typography>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>Notifications Hub</Typography>
            <Typography color="text.secondary">Stay informed with system alerts, low-stock warnings, and billing events.</Typography>
          </Box>
          {unreadCount > 0 && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAllRead}
            >
              Mark All as Read ({unreadCount})
            </Button>
          )}
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Category Tabs */}
        <Card sx={{ mb: 3 }}>
          <Tabs
            value={categoryTab}
            onChange={(_, val) => setCategoryTab(val)}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2 }}
          >
            <Tab label={`All Notifications (${items.length})`} value="all" />
            <Tab label={`Unread (${unreadCount})`} value="unread" />
            <Tab label="Low Stock Alerts" value="low_stock" />
            <Tab label="Invoices & Billing" value="invoices" />
          </Tabs>
        </Card>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : filteredItems.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 6 }}>
            <CardContent>
              <CheckCircleOutlineIcon sx={{ fontSize: 54, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" color="text.secondary">All caught up!</Typography>
              <Typography variant="body2" color="text.secondary">No notifications match your current filter.</Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {filteredItems.map((item) => {
              const isStock = item.type === 'low_stock'
              const isOverdue = item.type === 'invoice_overdue'

              const avatarBg = isOverdue ? '#ef4444' : isStock ? '#f59e0b' : '#4f46e5'
              const icon = isOverdue ? <PriorityHighIcon /> : isStock ? <WarningIcon /> : <ReceiptIcon />

              return (
                <Grid item xs={12} key={item.id}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      borderLeft: item.is_read ? '4px solid transparent' : `4px solid ${avatarBg}`,
                      bgcolor: item.is_read ? 'background.paper' : 'rgba(79, 70, 229, 0.02)',
                      boxShadow: item.is_read ? '0 2px 8px rgba(0,0,0,0.04)' : '0 6px 20px rgba(15,23,42,0.08)'
                    }}
                  >
                    <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: avatarBg, width: 44, height: 44 }}>
                          {icon}
                        </Avatar>
                        <Box>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="subtitle1" sx={{ fontWeight: item.is_read ? 500 : 700 }}>
                              {item.message}
                            </Typography>
                            {!item.is_read && <Chip label="NEW" color="error" size="small" sx={{ height: 18, fontSize: '0.65rem' }} />}
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            Type: {item.type.replace('_', ' ').toUpperCase()} • {new Date(item.created_at).toLocaleString()}
                          </Typography>
                        </Box>
                      </Stack>

                      {!item.is_read && (
                        <Button size="small" variant="text" onClick={() => handleMarkRead(item)}>
                          Mark as Read
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        )}
      </Box>
    </AppLayout>
  )
}
