import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import api from '../lib/auth'
import AppLayout from '../components/AppLayout'

export default function NotificationsPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')

  const loadNotifications = () => {
    api.get('/notifications/')
      .then(({ data }) => setItems(data))
      .catch(() => setError('Unable to load notifications.'))
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const handleMarkRead = async (item) => {
    try {
      await api.post('/notifications/', { id: item.id })
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, is_read: true } : entry))
    } catch {
      setError('Unable to update notification.')
    }
  }

  return (
    <AppLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>ALERTS</Typography>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>Notifications</Typography>
          <Typography color="text.secondary">Recent alerts for your company.</Typography>
        </Stack>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {items.length === 0 ? (
          <Card><CardContent><Typography color="text.secondary">No notifications yet.</Typography></CardContent></Card>
        ) : (
          items.map((item) => (
            <Card key={item.id} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6">{item.message}</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>{item.type}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>{new Date(item.created_at).toLocaleString()}</Typography>
                {!item.is_read && <Button size="small" sx={{ mt: 1.5 }} onClick={() => handleMarkRead(item)}>Mark read</Button>}
              </CardContent>
            </Card>
          ))
        )}
      </Box>
    </AppLayout>
  )
}
