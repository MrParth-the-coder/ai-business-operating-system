import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Grid, Stack, TextField, Typography, LinearProgress, Paper, useTheme,
  Table, TableBody, TableCell, TableHead, TableRow
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import StarIcon from '@mui/icons-material/Star'
import CategoryIcon from '@mui/icons-material/Category'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import CodeIcon from '@mui/icons-material/Code'
import api from '../lib/auth'
import AppLayout from '../components/AppLayout'
import { formatCurrency, getActiveCurrency } from '../lib/currency'

export default function ReportsPage() {
  const theme = useTheme()
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [activePreset, setActivePreset] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [hoveredBar, setHoveredBar] = useState(null)
  const [displayCurrency, setDisplayCurrency] = useState(getActiveCurrency())

  useEffect(() => {
    const handleCurrencyChange = () => setDisplayCurrency(getActiveCurrency())
    window.addEventListener('currency-changed', handleCurrencyChange)
    return () => window.removeEventListener('currency-changed', handleCurrencyChange)
  }, [])

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
    setActivePreset('')
    loadReport({ start_date: startDate, end_date: endDate })
  }

  const handlePresetSelect = (presetKey) => {
    setActivePreset(presetKey)
    setStartDate('')
    setEndDate('')
    loadReport({ preset: presetKey })
  }

  const handleExport = async (format) => {
    setExporting(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (activePreset) {
        params.append('preset', activePreset)
      } else {
        if (startDate) params.append('start_date', startDate)
        if (endDate) params.append('end_date', endDate)
      }
      params.append('export', format)

      const response = await api.get(`/reports/?${params.toString()}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `analytics_report.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setError(`Failed to export ${format.toUpperCase()} report.`)
    } finally {
      setExporting(false)
    }
  }

  // Calculate chart max height for SVG trend rendering
  const trendData = report?.sales?.monthly_trend || []
  const maxRevenue = Math.max(...trendData.map((t) => t.revenue), 100)
  const categoryBreakdown = report?.sales?.category_breakdown || []
  const topCustomers = report?.sales?.top_customers || []

  return (
    <AppLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 3 }}>
          <Box>
            <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>EXECUTIVE INSIGHTS</Typography>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>Reports & Financial Analytics</Typography>
            <Typography color="text.secondary">Real-time revenue performance, inventory asset valuations, category share, and customer leaderboards.</Typography>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('csv')}
              disabled={exporting || loading}
            >
              {exporting ? 'Exporting…' : 'Export CSV'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<CodeIcon />}
              onClick={() => handleExport('json')}
              disabled={exporting || loading}
            >
              Export JSON
            </Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Date Filter Bar & Presets */}
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 8px 32px rgba(15,23,42,0.06)' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              {/* Presets Row */}
              <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" useFlexGap sx={{ gap: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mr: 1 }}>QUICK PRESETS:</Typography>
                {[
                  { key: 'today', label: 'Today' },
                  { key: '7d', label: 'Last 7 Days' },
                  { key: '30d', label: 'Last 30 Days' },
                  { key: 'this_month', label: 'This Month' },
                  { key: 'ytd', label: 'Year to Date' }
                ].map((p) => (
                  <Chip
                    key={p.key}
                    label={p.label}
                    onClick={() => handlePresetSelect(p.key)}
                    color={activePreset === p.key ? 'primary' : 'default'}
                    variant={activePreset === p.key ? 'filled' : 'outlined'}
                    clickable
                    size="small"
                  />
                ))}
              </Stack>

              <Box component="form" onSubmit={handleApply}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems="center">
                  <TextField
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
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
                    size="small"
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
                  <Button type="submit" variant="contained" size="medium" sx={{ px: 4, whiteSpace: 'nowrap', minWidth: 130 }}>
                    Apply Filter
                  </Button>
                  <Button variant="outlined" color="inherit" onClick={() => { setActivePreset(''); setStartDate(''); setEndDate(''); loadReport() }} sx={{ whiteSpace: 'nowrap' }}>
                    Reset
                  </Button>
                </Stack>
              </Box>
            </Stack>
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
                      {formatCurrency(report.sales?.revenue || 0, displayCurrency, true)}
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
                      {formatCurrency(report.sales?.paid_revenue || 0, displayCurrency, true)}
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
                      {formatCurrency(report.inventory?.total_valuation || 0, displayCurrency, true)}
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
                      <line x1="40" y1="20" x2="100%" y2="20" stroke={theme.palette.divider} strokeDasharray="4" />
                      <line x1="40" y1="90" x2="100%" y2="90" stroke={theme.palette.divider} strokeDasharray="4" />
                      <line x1="40" y1="160" x2="100%" y2="160" stroke={theme.palette.divider} strokeDasharray="4" />

                      {trendData.map((item, index) => {
                        const x = 70 + index * 65
                        const barHeight = Math.max(8, (item.revenue / maxRevenue) * 140)
                        const y = 170 - barHeight
                        const isHovered = hoveredBar?.date === item.date

                        return (
                          <g key={index}>
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

            {/* Product Category Share & Top Buyers Grid */}
            <Grid container spacing={3}>
              {/* Category Breakdown Card */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 8px 32px rgba(15,23,42,0.06)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <CategoryIcon color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>Category Revenue Distribution</Typography>
                    </Stack>

                    {categoryBreakdown.length === 0 ? (
                      <Typography color="text.secondary">No category distribution data recorded.</Typography>
                    ) : (
                      <Stack spacing={2.5}>
                        {categoryBreakdown.map((cat, idx) => (
                          <Box key={idx}>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                              <Typography variant="subtitle2" fontWeight={700}>{cat.category}</Typography>
                              <Typography variant="subtitle2" color="primary.main" fontWeight={700}>
                                {formatCurrency(cat.revenue, displayCurrency, true)} ({cat.share_pct}%)
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={cat.share_pct}
                              color={idx % 2 === 0 ? 'primary' : 'secondary'}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Top Buyers Leaderboard Card */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 8px 32px rgba(15,23,42,0.06)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <EmojiEventsIcon sx={{ color: '#f59e0b' }} />
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>Top Buyers Leaderboard</Typography>
                    </Stack>

                    {topCustomers.length === 0 ? (
                      <Typography color="text.secondary">No customer sales recorded in this period.</Typography>
                    ) : (
                      <Stack spacing={1.5}>
                        {topCustomers.map((cust, idx) => (
                          <Paper key={idx} variant="outlined" sx={{ p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Chip
                                label={`#${idx + 1}`}
                                size="small"
                                color={idx === 0 ? 'warning' : 'default'}
                                sx={{ fontWeight: 800, minWidth: 32 }}
                              />
                              <Box>
                                <Typography variant="subtitle2" fontWeight={700}>{cust.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{cust.invoice_count} confirmed orders</Typography>
                              </Box>
                            </Stack>
                            <Chip
                              label={formatCurrency(cust.total_spent, displayCurrency, true)}
                              color="success"
                              variant="outlined"
                              sx={{ fontWeight: 800 }}
                            />
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Payment Collections Breakdown */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Payment Collections Breakdown</Typography>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Paid Revenue Collections</Typography>
                      <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }}>
                        {formatCurrency(report.sales?.paid_revenue || 0, displayCurrency, true)}
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
                        {formatCurrency(report.sales?.unpaid_revenue || 0, displayCurrency, true)}
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
