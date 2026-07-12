import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Grid, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import api from '../lib/auth'
import AppLayout from '../components/AppLayout'

export default function CompanyDashboardPage() {
  const [summary, setSummary] = useState(null)
  const [company, setCompany] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/companies/me/')
      .then(({ data }) => setCompany(data))
      .catch(() => {})

    api.get('/dashboard/')
      .then(({ data }) => setSummary(data))
      .catch(() => setError('Unable to load dashboard.'))
  }, [])

  const widgetsByCategory = {
    retail: [
      ['Products', summary?.products],
      ['Customers', summary?.customers],
      ['Suppliers', summary?.suppliers],
      ['Revenue', summary ? `$${summary.revenue.toFixed(2)}` : ''],
    ],
    medical: [
      ['Medicines', summary?.products],
      ['Low Stock', summary?.low_stock],
      ['Suppliers', summary?.suppliers],
      ['Revenue', summary ? `$${summary.revenue.toFixed(2)}` : ''],
    ],
    education: [
      ['Students', summary?.customers],
      ['Teachers', summary?.employees],
      ['Courses', summary?.products],
      ['Revenue', summary ? `$${summary.revenue.toFixed(2)}` : ''],
    ],
    restaurant: [
      ['Items', summary?.products],
      ['Customers', summary?.customers],
      ['Low Stock', summary?.low_stock],
      ['Revenue', summary ? `$${summary.revenue.toFixed(2)}` : ''],
    ],
  }

  const widgets = widgetsByCategory[summary?.category] || [
    ['Products', summary?.products],
    ['Customers', summary?.customers],
    ['Suppliers', summary?.suppliers],
    ['Revenue', summary ? `$${summary.revenue.toFixed(2)}` : ''],
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
        {company && (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', mb: 3 }}>
            <Button component={Link} to="/products" variant="contained">
              View products
            </Button>
            <Button component={Link} to="/customers" variant="contained">
              View customers
            </Button>
            <Button component={Link} to="/suppliers" variant="contained">
              View suppliers
            </Button>
            <Button component={Link} to="/invoices" variant="contained">
              View invoices
            </Button>
          </Box>
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
