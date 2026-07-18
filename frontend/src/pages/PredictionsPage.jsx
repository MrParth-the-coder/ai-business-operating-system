import { useEffect, useState } from 'react'
import { Alert, Box, Card, CardContent, Stack, Typography } from '@mui/material'
import api from '../lib/auth'
import AppLayout from '../components/AppLayout'

export default function PredictionsPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/predictions/')
      .then(({ data }) => setData(data))
      .catch(() => setError('Unable to load predictions.'))
  }, [])

  return (
    <AppLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>ESTIMATES</Typography>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>Predictions</Typography>
          <Typography color="text.secondary">Company-scoped estimates for sales, customer segments, and product demand.</Typography>
        </Stack>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {!data ? (
          <Card><CardContent><Typography color="text.secondary">Loading predictions…</Typography></CardContent></Card>
        ) : (
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Sales forecast</Typography>
                <Typography color="text.secondary">Estimate — not a guarantee.</Typography>
                {data.sales_forecast?.status === 'ready' ? (
                  <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>${Number(data.sales_forecast.forecast || 0).toFixed(2)}</Typography>
                ) : (
                  <Typography color="text.secondary" sx={{ mt: 1 }}>{data.sales_forecast?.message}</Typography>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Customer segmentation</Typography>
                <Typography color="text.secondary">VIP, Regular, and New customer groups.</Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {Object.entries(data.customer_segmentation?.segments || {}).map(([key, value]) => (
                    <Typography key={key}>
                      <strong>{key}</strong>: {Array.isArray(value) && value.length > 0 ? value.join(', ') : 'No customers yet'}
                    </Typography>
                  ))}
                </Stack>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Product demand</Typography>
                <Typography color="text.secondary">Demand tier estimate for each product.</Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {(data.product_demand?.products || []).map((item) => (
                    <Typography key={item.name}>{item.name}: {item.tier}</Typography>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        )}
      </Box>
    </AppLayout>
  )
}
