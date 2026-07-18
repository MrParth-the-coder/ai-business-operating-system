import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Grid, Stack, TextField, Typography } from '@mui/material'
import api from '../lib/auth'
import AppLayout from '../components/AppLayout'

export default function ReportsPage() {
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const loadReport = (query = {}) => {
    const params = new URLSearchParams(query)
    api.get(`/reports/${params.toString() ? `?${params.toString()}` : ''}`)
      .then(({ data }) => setReport(data))
      .catch(() => setError('Unable to load reports.'))
  }

  useEffect(() => {
    loadReport()
  }, [])

  const handleApply = (event) => {
    event.preventDefault()
    loadReport({ start_date: startDate, end_date: endDate })
  }

  return (
    <AppLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>INSIGHTS</Typography>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>Reports</Typography>
          <Typography color="text.secondary">Company-scoped summaries for sales, inventory, and customers.</Typography>
        </Stack>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box component="form" onSubmit={handleApply}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                <TextField label="Start date" type="date" InputLabelProps={{ shrink: true }} value={startDate} onChange={(event) => setStartDate(event.target.value)} fullWidth />
                <TextField label="End date" type="date" InputLabelProps={{ shrink: true }} value={endDate} onChange={(event) => setEndDate(event.target.value)} fullWidth />
                <Button type="submit" variant="contained">Apply</Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
        {report ? (
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(79,70,229,0.08) 0%, rgba(255,255,255,1) 100%)' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Sales</Typography>
                  {report.date_range?.start_date && <Typography variant="body2" color="text.secondary">{report.date_range.start_date} → {report.date_range.end_date || 'today'}</Typography>}
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>${Number(report.sales?.revenue || 0).toFixed(2)}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>Invoices: {report.sales?.invoice_count || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Inventory</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>{report.inventory?.items || 0}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>Low stock: {report.inventory?.low_stock || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Customers</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>{report.customers?.total || 0}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>Active: {report.customers?.active || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Card><CardContent><Typography color="text.secondary">Loading reports…</Typography></CardContent></Card>
        )}
      </Box>
    </AppLayout>
  )
}
