import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Chip, Grid, Stack, TextField, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import api from '../lib/auth'
import AppLayout from '../components/AppLayout'

export default function CompanyDashboardPage() {
  const [summary, setSummary] = useState(null)
  const [company, setCompany] = useState(null)
  const [error, setError] = useState('')
  const [question, setQuestion] = useState('')
  const [assistantReply, setAssistantReply] = useState('')
  const [assistantHistory, setAssistantHistory] = useState([])
  const [isAssistantLoading, setIsAssistantLoading] = useState(false)

  useEffect(() => {
    api.get('/companies/me/')
      .then(({ data }) => setCompany(data))
      .catch(() => {})

    api.get('/dashboard/')
      .then(({ data }) => setSummary(data))
      .catch(() => setError('Unable to load dashboard.'))

    api.get('/ai/chat/')
      .then(({ data }) => setAssistantHistory(data))
      .catch(() => {})
  }, [])

  const handleAssistantSubmit = async (event) => {
    event.preventDefault()
    if (!question.trim()) return

    setIsAssistantLoading(true)
    setError('')
    try {
      const { data } = await api.post('/ai/chat/', { question })
      setAssistantReply(data.answer)
      setAssistantHistory((current) => [{ question, answer: data.answer, id: Date.now() }, ...current].slice(0, 6))
      setQuestion('')
    } catch {
      setError('Unable to contact the AI assistant right now.')
    } finally {
      setIsAssistantLoading(false)
    }
  }

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
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 3 }}>
          <Box>
            <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>OPERATIONS HUB</Typography>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>Dashboard</Typography>
            {company && (
              <Typography variant="subtitle1" color="text.secondary">
                {company.name} • {company.currency}
              </Typography>
            )}
            {summary && (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                {`Category: ${summary.category?.charAt(0).toUpperCase() + summary.category?.slice(1) || 'Unknown'}`}
              </Typography>
            )}
          </Box>
          {company && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button component={Link} to="/products" variant="contained">Products</Button>
              <Button component={Link} to="/customers" variant="contained">Customers</Button>
              <Button component={Link} to="/suppliers" variant="contained">Suppliers</Button>
              <Button component={Link} to="/invoices" variant="contained">Invoices</Button>
            </Stack>
          )}
        </Stack>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {summary ? (
          <>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>Business snapshot</Typography>
                    <Typography color="text.secondary">Your company is ready. Focus on day-to-day operations with a reliable view of the essentials.</Typography>
                  </Box>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Chip label={`Revenue ${summary.revenue ? `$${summary.revenue.toFixed(2)}` : '$0.00'}`} color="primary" />
                    <Chip label={`${summary.products || 0} products`} variant="outlined" />
                    <Chip label={`${summary.customers || 0} customers`} variant="outlined" />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
            <Grid container spacing={2}>
              {widgets.map(([label, value]) => (
                <Grid item xs={12} sm={6} md={3} key={label}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography color="text.secondary" variant="body2">{label}</Typography>
                      <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>{value ?? 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Low Stock Warning Banner */}
            {summary.low_stock_items && summary.low_stock_items.length > 0 && (
              <Card sx={{ mt: 3, borderLeft: '6px solid #f59e0b', bgcolor: 'rgba(245, 158, 11, 0.05)' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 1 }}>
                        ⚠️ Low Stock Warning ({summary.low_stock_items.length} items require restock)
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {summary.low_stock_items.map((item) => `${item.name} (${item.stock_qty} left)`).join(', ')}
                      </Typography>
                    </Box>
                    <Button component={Link} to="/products" variant="contained" color="warning" size="small">
                      Manage Stock
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Recent Invoices & Quick Activity */}
            {summary.recent_invoices && summary.recent_invoices.length > 0 && (
              <Card sx={{ mt: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Recent Invoices
                    </Typography>
                    <Button component={Link} to="/invoices" size="small">
                      View All Invoices
                    </Button>
                  </Stack>

                  <Grid container spacing={2}>
                    {summary.recent_invoices.map((inv) => (
                      <Grid item xs={12} sm={6} md={3} key={inv.id}>
                        <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                          <Stack spacing={1}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {inv.customer_name}
                            </Typography>
                            <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                              ${inv.total.toFixed(2)}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                label={inv.payment_status || 'unpaid'}
                                size="small"
                                color={inv.payment_status === 'paid' ? 'success' : inv.payment_status === 'overdue' ? 'error' : 'warning'}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {new Date(inv.created_at).toLocaleDateString()}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            )}

            <Card sx={{ mt: 3, borderRadius: 3, boxShadow: '0 8px 32px rgba(15,23,42,0.06)' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>🤖 AI Business Assistant</Typography>
                    <Typography color="text.secondary">Ask multi-turn questions about revenue, inventory velocity, or customer trends for tailored executive insights.</Typography>
                  </Box>

                  {/* Suggested Question Chips */}
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                    {[
                      '📈 How are my sales doing?',
                      '📦 Check low stock alerts',
                      '💰 What is my unpaid invoice balance?',
                      '👥 Summarize customer activity'
                    ].map((prompt, idx) => (
                      <Chip
                        key={idx}
                        label={prompt}
                        onClick={() => {
                          setQuestion(prompt.replace(/^[^\w]+/, '').trim())
                        }}
                        variant="outlined"
                        color="primary"
                        clickable
                        size="small"
                      />
                    ))}
                  </Stack>

                  <Box component="form" onSubmit={handleAssistantSubmit}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                      <TextField
                        fullWidth
                        value={question}
                        onChange={(event) => setQuestion(event.target.value)}
                        placeholder="Type any question about your business operations..."
                        size="small"
                      />
                      <Button type="submit" variant="contained" disabled={isAssistantLoading} sx={{ minWidth: 100 }}>
                        {isAssistantLoading ? 'Thinking…' : 'Ask AI'}
                      </Button>
                    </Stack>
                  </Box>

                  {assistantReply && (
                    <Alert severity="info" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                      <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                        {assistantReply}
                      </Typography>
                    </Alert>
                  )}

                  {assistantHistory.length > 0 && (
                    <Stack spacing={1.5} sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>RECENT CONVERSATION LOG</Typography>
                      {assistantHistory.map((item) => (
                        <Card key={item.id} variant="outlined" sx={{ borderRadius: 2, bgcolor: 'background.default' }}>
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography variant="subtitle2" color="primary.main" fontWeight={700}>
                              You: {item.question}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                              {item.answer}
                            </Typography>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent>
              <Typography color="text.secondary">Loading dashboard…</Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </AppLayout>
  )
}
