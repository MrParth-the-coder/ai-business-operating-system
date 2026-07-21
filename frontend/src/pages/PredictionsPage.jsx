import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Grid, LinearProgress, Stack, Typography, Avatar, Table, TableBody,
  TableCell, TableHead, TableRow, Slider, Divider, Paper
} from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import GroupsIcon from '@mui/icons-material/Groups'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import StarIcon from '@mui/icons-material/Star'
import CalculateIcon from '@mui/icons-material/Calculate'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import api from '../lib/auth'
import AppLayout from '../components/AppLayout'

export default function PredictionsPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // What-If Simulator state
  const [priceChange, setPriceChange] = useState(5)
  const [demandChange, setDemandChange] = useState(10)
  const [costReduction, setCostReduction] = useState(2)
  const [simResult, setSimResult] = useState(null)
  const [simulating, setSimulating] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get('/predictions/')
      .then(({ data }) => setData(data))
      .catch(() => setError('Unable to load predictions.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    runSimulation()
  }, [priceChange, demandChange, costReduction])

  const runSimulation = async () => {
    setSimulating(true)
    try {
      const res = await api.post('/predictions/simulate/', {
        price_change_pct: priceChange,
        demand_change_pct: demandChange,
        cost_reduction_pct: costReduction,
      })
      setSimResult(res.data)
    } catch (err) {
      // ignore simulation error
    } finally {
      setSimulating(false)
    }
  }

  const salesForecast = data?.sales_forecast
  const customerSegs = data?.customer_segmentation?.segments || {}
  const customerDetails = data?.customer_segmentation?.details || {}
  const productDemand = data?.product_demand?.products || []

  return (
    <AppLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>AI PREDICTIVE ANALYTICS</Typography>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>Business Forecasting & Scenarios</Typography>
          <Typography color="text.secondary">Machine learning revenue projections, RFM buyer segmentation, stock velocity, and What-If financial simulations.</Typography>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Sales Forecast Card */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 8px 32px rgba(15,23,42,0.06)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                        <TrendingUpIcon />
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>Revenue Forecast</Typography>
                    </Stack>
                    <Chip
                      label={salesForecast?.growth_trend || '+0%'}
                      color="primary"
                      size="small"
                      icon={<AutoAwesomeIcon sx={{ fontSize: '14px !important' }} />}
                    />
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    Projected Daily Revenue (7-Day ML Seasonal Model)
                  </Typography>

                  <Stack direction="row" spacing={3} alignItems="baseline" sx={{ my: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      ${Number(salesForecast?.forecast || 0).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                      / avg daily
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Chip
                      label={`Peak Day: ${salesForecast?.seasonal_peak_day || 'N/A'}`}
                      color="secondary"
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`7D Moving Avg: $${Number(salesForecast?.moving_average_7d || 0).toFixed(2)}`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>

                  {/* 7-Day Daily Seasonal Forecast Table */}
                  {Array.isArray(salesForecast?.daily_forecast) && salesForecast.daily_forecast.length > 0 && (
                    <Box sx={{ mt: 2, mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        7-Day Out-of-Sample Daily Projections
                      </Typography>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: 'action.hover' }}>
                            <TableCell fontWeight={700}>Date</TableCell>
                            <TableCell fontWeight={700}>Day</TableCell>
                            <TableCell align="right" fontWeight={700}>Projected</TableCell>
                            <TableCell align="right" fontWeight={700}>Range (95%)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {salesForecast.daily_forecast.map((df, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{df.date}</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>{df.day_name}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                ${Number(df.forecast_revenue).toFixed(2)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                ${Number(df.lower_bound).toFixed(0)} - ${Number(df.upper_bound).toFixed(0)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  )}

                  <Box sx={{ mt: 2, mb: 1 }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>MODEL CONFIDENCE</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{salesForecast?.confidence || 75}%</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={salesForecast?.confidence || 75}
                      color="primary"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
                    {salesForecast?.message || 'Statistical estimation computed via seasonal ML regression model.'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Customer Segmentation */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 8px 32px rgba(15,23,42,0.06)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>
                      <GroupsIcon />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>RFM Customer Segmentation</Typography>
                  </Stack>

                  <Stack spacing={2}>
                    <Box sx={{ p: 1.5, bgcolor: 'rgba(236,72,153,0.06)', borderRadius: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                        <StarIcon sx={{ color: 'secondary.main', fontSize: 18 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'secondary.main' }}>VIP Champions (Spent &gt; $500)</Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {(customerSegs.vip || []).length > 0 ? (
                          customerSegs.vip.map((name, idx) => <Chip key={idx} label={name} size="small" color="secondary" />)
                        ) : (
                          <Typography variant="caption" color="text.secondary">No VIP clients identified yet.</Typography>
                        )}
                      </Stack>
                    </Box>

                    {customerSegs.at_risk?.length > 0 && (
                      <Box sx={{ p: 1.5, bgcolor: 'error.lighter', border: '1px dashed', borderColor: 'error.main', borderRadius: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                          <WarningAmberIcon color="error" fontSize="small" />
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'error.main' }}>
                            At-Risk / Slipping Clients ({customerSegs.at_risk.length})
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {customerSegs.at_risk.map((name, idx) => (
                            <Chip key={idx} label={name} size="small" color="error" variant="outlined" />
                          ))}
                        </Stack>
                      </Box>
                    )}

                    <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Loyal Buyers</Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {(customerSegs.loyal || []).length > 0 ? (
                          customerSegs.loyal.map((name, idx) => <Chip key={idx} label={name} size="small" color="primary" variant="outlined" />)
                        ) : (
                          <Typography variant="caption" color="text.secondary">No repeat buyers recorded yet.</Typography>
                        )}
                      </Stack>
                    </Box>

                    <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>New / First-Time Buyers</Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {(customerSegs.new || []).length > 0 ? (
                          customerSegs.new.map((name, idx) => <Chip key={idx} label={name} size="small" />)
                        ) : (
                          <Typography variant="caption" color="text.secondary">No new client records.</Typography>
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Interactive What-If Scenario Simulator Card */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(15,23,42,0.06)', border: '1px solid', borderColor: 'primary.light' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'info.main', width: 36, height: 36 }}>
                      <CalculateIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>Interactive "What-If" Financial Simulator</Typography>
                      <Typography variant="body2" color="text.secondary">Adjust price strategy, market demand surge, and operational efficiency to project 30-day bottom line changes.</Typography>
                    </Box>
                  </Stack>

                  <Grid container spacing={4} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={6}>
                      <Stack spacing={3}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                            Price Adjustment (%): {priceChange > 0 ? `+${priceChange}%` : `${priceChange}%`}
                          </Typography>
                          <Slider
                            value={priceChange}
                            onChange={(e, val) => setPriceChange(val)}
                            min={-20}
                            max={30}
                            valueLabelDisplay="auto"
                          />
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                            Demand Surge (%): {demandChange > 0 ? `+${demandChange}%` : `${demandChange}%`}
                          </Typography>
                          <Slider
                            value={demandChange}
                            onChange={(e, val) => setDemandChange(val)}
                            min={-30}
                            max={50}
                            valueLabelDisplay="auto"
                            color="secondary"
                          />
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                            Cost Reduction (%): +{costReduction}%
                          </Typography>
                          <Slider
                            value={costReduction}
                            onChange={(e, val) => setCostReduction(val)}
                            min={0}
                            max={15}
                            valueLabelDisplay="auto"
                            color="success"
                          />
                        </Box>
                      </Stack>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 3, bgcolor: 'background.default', borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        {simulating ? (
                          <CircularProgress size={24} />
                        ) : simResult ? (
                          <Stack spacing={2}>
                            <Typography variant="overline" color="text.secondary" fontWeight={700}>SIMULATION RESULTS (30-DAY PROJECTION)</Typography>

                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Baseline Revenue</Typography>
                                <Typography variant="h6" fontWeight={700}>${simResult.baseline_revenue_30d?.toLocaleString()}</Typography>
                              </Grid>

                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Projected Revenue</Typography>
                                <Typography variant="h6" fontWeight={800} color={simResult.revenue_delta_30d >= 0 ? 'success.main' : 'error.main'}>
                                  ${simResult.simulated_revenue_30d?.toLocaleString()}
                                </Typography>
                              </Grid>
                            </Grid>

                            <Divider />

                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle2" fontWeight={700}>Projected Net Revenue Gain:</Typography>
                              <Chip
                                label={`${simResult.revenue_delta_30d >= 0 ? '+' : ''}$${simResult.revenue_delta_30d?.toLocaleString()}`}
                                color={simResult.revenue_delta_30d >= 0 ? 'success' : 'error'}
                                sx={{ fontWeight: 800 }}
                              />
                            </Stack>

                            <Alert severity={simResult.revenue_delta_30d >= 0 ? 'success' : 'warning'} sx={{ mt: 1 }}>
                              {simResult.executive_takeaway}
                            </Alert>
                          </Stack>
                        ) : null}
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Product Velocity Recommendations & Days-to-Stockout */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(15,23,42,0.06)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#d97706', width: 36, height: 36 }}>
                      <ShoppingCartIcon />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Stockout Velocity Radar & Recommended Reorders</Typography>
                  </Stack>

                  {productDemand.length === 0 ? (
                    <Typography color="text.secondary">No product demand data available.</Typography>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product Name</TableCell>
                          <TableCell align="center">Current Stock</TableCell>
                          <TableCell align="center">Est. Days to Stockout</TableCell>
                          <TableCell align="center">Rec. Reorder Qty</TableCell>
                          <TableCell>AI Stockout Alert</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {productDemand.map((prod, idx) => {
                          const tierColor = prod.tier === 'high' ? 'error' : prod.tier === 'medium' ? 'warning' : 'success'

                          return (
                            <TableRow key={idx}>
                              <TableCell sx={{ fontWeight: 600 }}>{prod.name}</TableCell>
                              <TableCell align="center">{prod.stock_qty}</TableCell>
                              <TableCell align="center">
                                <Chip label={prod.days_until_stockout ? `${prod.days_until_stockout} days` : '90+ days'} color={tierColor} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700 }}>
                                {prod.recommended_reorder_qty || 0} units
                              </TableCell>
                              <TableCell color="text.secondary">{prod.recommendation}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </AppLayout>
  )
}
