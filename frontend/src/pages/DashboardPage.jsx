import { useEffect, useState } from 'react'
import { Alert, Box, Card, CardContent, Grid, Typography } from '@mui/material'
import api from '../lib/auth'
import AppLayout from '../components/AppLayout'

export default function DashboardPage() {
  const [summary, setSummary] = useState(null)
  const [company, setCompany] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/companies/me/').then(({ data }) => setCompany(data)).catch(() => {})
    api.get('/dashboard/').then(({ data }) => setSummary(data)).catch(() => setError('Unable to load dashboard.'))
  }, [])

  const widgetsByCategory = {
    retail: [
      ['Products', summary?.products],
      ['Customers', summary?.customers],
      ['Suppliers', summary?.suppliers],
      ['Revenue', summary ? `$${summary.revenue.toFixed(2)}` : '' ],
    ],
    medical: [
      ['Medicines', summary?.products],
      ['Low Stock', summary?.low_stock],
      ['Expiry', summary?.expiry ?? 0],
      ['Suppliers', summary?.suppliers],
    ],
    education: [
      ['Students', summary?.students ?? 0],
      ['Teachers', summary?.teachers ?? 0],
      ['Courses', summary?.courses ?? 0],
      ['Revenue', summary ? `$${summary.revenue.toFixed(2)}` : '' ],
    ],
    restaurant: [
      ['Orders', summary?.orders ?? 0],
      ['Customers', summary?.customers],
      ['Low Stock', summary?.low_stock],
      ['Revenue', summary ? `$${summary.revenue.toFixed(2)}` : '' ],
    ],
  }

  const widgets = widgetsByCategory[summary?.category] || [
    ['Products', summary?.products],
    ['Customers', summary?.customers],
    ['Suppliers', summary?.suppliers],
    ['Revenue', summary ? `$${summary.revenue.toFixed(2)}` : '' ],
  ]

  return (
    <AppLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Dashboard</Typography>
      {company && (
        <Typography variant="h6" sx={{ mb: 1 }}>
          {company.name} • {company.currency}
        </Typography>
      )}
      {summary && (
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          {`Category: ${summary.category?.charAt(0).toUpperCase() + summary.category?.slice(1) || 'Unknown'}`}
        </Typography>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {summary ? (
        <Grid container spacing={2}>
          {widgets.map(([label, value]) => (
            <Grid item xs={12} sm={6} md={4} key={label}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">{label}</Typography>
                  <Typography variant="h5">{value ?? 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography>Loading dashboard…</Typography>
      )}
    </Box>
    </AppLayout>
  )
}
