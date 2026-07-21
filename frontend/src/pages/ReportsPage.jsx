import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Grid, Stack, TextField, Typography, LinearProgress, Paper, useTheme
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import StarIcon from '@mui/icons-material/Star'
import api from '../lib/auth'
import AppLayout from '../components/AppLayout'

export default function ReportsPage() {
  const theme = useTheme()
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [hoveredBar, setHoveredBar] = useState(null)

  const loadReport = (query = {}) => {
    setLoading(true)
    const params = new URLSearchParams(query)
    api.get(`/reports/${params.toString() ? `?${params.toString()}` : ''}`)
      .then(({ data }) => setReport(data))
      .catch(() => setError('Unable to load reports.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadReport()
  }, [])

  const handleApply = (event) => {
    event.preventDefault()
    loadReport({ start_date: startDate, end_date: endDate })
  }

  const handleExportCSV = async () => {
    setExporting(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      params.append('export', 'csv')

      const response = await api.get(`/reports/?${params.toString()}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'analytics_report.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setError('Failed to export CSV report.')
    } finally {
      setExporting(false)
    }
  }

  // Calculate chart max height for SVG trend rendering
  const trendData = report?.sales?.monthly_trend || []
  const maxRevenue = Math.max(...trendData.map((t) => t.revenue), 100)

  return (
    <AppLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 3 }}>
          <Box>
            <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>EXECUTIVE INSIGHTS</Typography>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>Reports & Financial Analytics</Typography>
            <Typography color="text.secondary">Real-time revenue performance, inventory asset valuations, and customer segmentation.</Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            disabled={exporting || loading}
          >
            {exporting ? 'Exporting…' : 'Export Full Report (CSV)'}
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Date Filter Bar */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box component="form" onSubmit={handleApply}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems="center">
                <TextField
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  sx={{
                    '& .MuiInputLabel-root': {
                      transform: 'translate(14px, -9px) scale(0.75) !important',
                      backgroundColor: 'background.paper',
                      px: 0.8,
                      borderRadius: 1,
                      fontWeight: 600,
                    },
                  }}
                />
                <TextField
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  sx={{
                    '& .MuiInputLabel-root': {
                      transform: 'translate(14px, -9px) scale(0.75) !important',
                      backgroundColor: 'background.paper',
                      px: 0.8,
                      borderRadius: 1,
                      fontWeight: 600,
                    },
                  }}
                />
                <Button type="submit" variant="contained" size="large" sx={{ px: 4, whiteSpace: 'nowrap', minWidth: 130 }}>
                  Apply Filter
                </Button>
                <Button variant="outlined" color="inherit" onClick={() => { setStartDate(''); setEndDate(''); loadReport() }} sx={{ whiteSpace: 'nowrap' }}>
                  Reset
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : report ? (
          <Stack spacing={3}>
            {/* Metric Overview Cards */}
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderRadius: 3, bgcolor: theme.palette.mode === 'dark' ? 'rgba(79,70,229,0.15)' : 'rgba(79,70,229,0.06)' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>TOTAL REVENUE</Typography>
                      <TrendingUpIcon color="primary" />
                    </Stack>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      ${Number(report.sales?.revenue || 0).toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {report.sales?.invoice_count || 0} Confirmed Invoices
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderRadius: 3, bgcolor: theme.palette.mode === 'dark' ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.06)' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>PAID REVENUE</Typography>
                      <AccountBalanceWalletIcon color="success" />
                    </Stack>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                      ${Number(report.sales?.paid_revenue || 0).toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Collected Funds
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderRadius: 3, bgcolor: theme.palette.mode === 'dark' ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.06)' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>INVENTORY ASSETS</Typography>
                      <Inventory2Icon color="warning" />
                    </Stack>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? '#fbbf24' : '#d97706' }}>
                      ${Number(report.inventory?.total_valuation || 0).toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {report.inventory?.items || 0} Products ({report.inventory?.low_stock || 0} Low Stock)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderRadius: 3, bgcolor: theme.palette.mode === 'dark' ? 'rgba(236,72,153,0.15)' : 'rgba(236,72,153,0.06)' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>CLIENT BASE</Typography>
                      <PeopleAltIcon color="secondary" />
                    </Stack>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                      {report.customers?.total || 0}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                      <Chip label={`${report.customers?.active || 0} Active`} size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                      <Chip label={`${report.customers?.vip_count || 0} VIP`} size="small" color="secondary" icon={<StarIcon sx={{ fontSize: '10px !important' }} />} sx={{ height: 18, fontSize: '0.65rem' }} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Custom SVG Revenue Trend Chart */}
            <Card sx={{ borderRadius: 3, p: 1 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Revenue Trend Chart</Typography>
                  {hoveredBar && (
                    <Chip
                      label={`${hoveredBar.date}: $${hoveredBar.revenue.toFixed(2)}`}
                      color="primary"
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                  )}
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Hover over any bar to view exact daily metrics.</Typography>

                {trendData.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography color="text.secondary">No confirmed sales recorded in this date range yet.</Typography>
                  </Box>
                ) : (
                  <Box sx={{ width: '100%', overflowX: 'auto' }}>
                    <svg width="100%" height="220" viewBox={`0 0 ${Math.max(600, trendData.length * 70)} 220`} style={{ minWidth: 600 }}>
                      {/* Grid lines */}
                      <line x1="40" y1="20" x2="100%" y2="20" stroke={theme.palette.divider} strokeDasharray="4" />
                      <line x1="40" y1="90" x2="100%" y2="90" stroke={theme.palette.divider} strokeDasharray="4" />
                      <line x1="40" y1="160" x2="100%" y2="160" stroke={theme.palette.divider} strokeDasharray="4" />

                      {/* Bar & line points */}
                      {trendData.map((item, index) => {
                        const x = 70 + index * 65
                        const barHeight = Math.max(8, (item.revenue / maxRevenue) * 140)
                        const y = 170 - barHeight
                        const isHovered = hoveredBar?.date === item.date

                        return (
                          <g key={index}>
                            {/* Full-height hit target area for reliable mouse hover */}
                            <rect
                              x={x - 25}
                              y={10}
                              width="50"
                              height="180"
                              fill="transparent"
                              style={{ cursor: 'pointer', pointerEvents: 'all' }}
                              onMouseEnter={() => setHoveredBar(item)}
                              onMouseLeave={() => setHoveredBar(null)}
                            />
                            <rect
                              x={x - 18}
                              y={y}
                              width="36"
                              height={barHeight}
                              rx="6"
                              fill={isHovered ? '#6366f1' : 'url(#trendGradient)'}
                              stroke={isHovered ? '#312e81' : 'none'}
                              strokeWidth={isHovered ? 2 : 0}
                              style={{ pointerEvents: 'none' }}
                            />
                            <text x={x} y={y - 8} textAnchor="middle" fontSize="11" fontWeight="600" fill={isHovered ? theme.palette.secondary.main : theme.palette.primary.main} style={{ pointerEvents: 'none' }}>
                              ${item.revenue.toFixed(0)}
                            </text>
                            <text x={x} y="195" textAnchor="middle" fontSize="10" fill={theme.palette.text.secondary} fontWeight={isHovered ? '700' : '400'} style={{ pointerEvents: 'none' }}>
                              {item.date.slice(5)}
                            </text>
                          </g>
                        )
                      })}

                      <defs>
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.9" />
                          <stop offset="100%" stopColor="#818cf8" stopOpacity="0.4" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Payment Collections Breakdown */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Payment Collections Breakdown</Typography>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Paid Revenue Collections</Typography>
                      <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }}>
                        ${Number(report.sales?.paid_revenue || 0).toFixed(2)}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={report.sales?.revenue > 0 ? (report.sales.paid_revenue / report.sales.revenue) * 100 : 0}
                      color="success"
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>

                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Outstanding / Overdue Collections</Typography>
                      <Typography variant="body2" color="warning.main" sx={{ fontWeight: 700 }}>
                        ${Number(report.sales?.unpaid_revenue || 0).toFixed(2)}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={report.sales?.revenue > 0 ? (report.sales.unpaid_revenue / report.sales.revenue) * 100 : 0}
                      color="warning"
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        ) : null}
      </Box>
    </AppLayout>
  )
}
