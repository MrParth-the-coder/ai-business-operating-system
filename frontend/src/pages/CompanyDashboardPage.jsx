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
            <Card sx={{ mb: 3, background: 'linear-gradient(135deg, rgba(79,70,229,0.12) 0%, rgba(255,255,255,0.01) 100%)' }}>
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
                  <Card sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(79,70,229,0.08) 0%, rgba(255,255,255,0.01) 100%)' }}>
                    <CardContent>
                      <Typography color="text.secondary" variant="body2">{label}</Typography>
                      <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>{value ?? 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="h6" gutterBottom>AI assistant</Typography>
                    <Typography color="text.secondary">Ask about sales, inventory, or customer activity and get a company-specific summary.</Typography>
                  </Box>
                  <Box component="form" onSubmit={handleAssistantSubmit}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                      <TextField
                        fullWidth
                        value={question}
                        onChange={(event) => setQuestion(event.target.value)}
                        placeholder="Example: How are my sales doing?"
                        size="small"
                      />
                      <Button type="submit" variant="contained" disabled={isAssistantLoading}>
                        {isAssistantLoading ? 'Thinking…' : 'Ask'}
                      </Button>
                    </Stack>
                  </Box>
                  {assistantReply && (
                    <Alert severity="info">{assistantReply}</Alert>
                  )}
                  {assistantHistory.length > 0 && (
                    <Stack spacing={1}>
                      {assistantHistory.map((item) => (
                        <Card key={item.id} variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle2">You: {item.question}</Typography>
                            <Typography color="text.secondary" sx={{ mt: 0.5 }}>Assistant: {item.answer}</Typography>
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
