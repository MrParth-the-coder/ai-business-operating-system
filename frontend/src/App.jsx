import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { Box, Button, CircularProgress, CssBaseline, Stack, ThemeProvider, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import CompanySetupPage from './pages/CompanySetupPage'
import CompanyDashboardPage from './pages/CompanyDashboardPage'
import ProductsPage from './pages/ProductsPage'
import CustomersPage from './pages/CustomersPage'
import SuppliersPage from './pages/SuppliersPage'
import InvoicesPage from './pages/InvoicesPage'
import ReportsPage from './pages/ReportsPage'
import NotificationsPage from './pages/NotificationsPage'
import PredictionsPage from './pages/PredictionsPage'
import api, { getAccessToken } from './lib/auth'
import { ColorModeContext, buildTheme, getInitialThemeMode } from './theme'

function ProtectedRoute({ children, requiredPermission = null, ownerOnly = false }) {
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!getAccessToken()) {
      setStatus('unauthenticated')
      return
    }

    let cancelled = false
    api.get('/companies/me/')
      .then(({ data }) => {
        if (cancelled) return
        const isOwner = data?.is_owner === true
        const permissions = Array.isArray(data?.permissions) ? data.permissions : []
        if (ownerOnly && !isOwner) {
          setStatus('forbidden')
          setMessage('This module is reserved for company owners.')
          return
        }
        if (requiredPermission && !isOwner && !permissions.includes(requiredPermission)) {
          setStatus('forbidden')
          setMessage('You do not have permission to access this module.')
          return
        }
        setStatus('allowed')
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('allowed')
        }
      })

    return () => {
      cancelled = true
    }
  }, [ownerOnly, requiredPermission])

  if (!getAccessToken()) {
    return <Navigate to="/login" replace />
  }

  if (status === 'loading') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">Checking access…</Typography>
        </Stack>
      </Box>
    )
  }

  if (status === 'forbidden') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3 }}>
        <Stack spacing={2} alignItems="center" sx={{ maxWidth: 420, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={700}>Access denied</Typography>
          <Typography color="text.secondary">{message}</Typography>
          <Button component={Link} to="/dashboard" variant="contained">Back to dashboard</Button>
        </Stack>
      </Box>
    )
  }

  return children
}

export default function App() {
  const [mode, setMode] = useState(getInitialThemeMode)

  const colorMode = useMemo(() => ({
    toggleColorMode: () => {
      setMode((current) => {
        const next = current === 'light' ? 'dark' : 'light'
        window.localStorage.setItem('ai-bos-theme', next)
        return next
      })
    },
  }), [])

  const theme = useMemo(() => buildTheme(mode), [mode])

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Routes>
          <Route path="/" element={<Navigate to={getAccessToken() ? '/dashboard' : '/login'} replace />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/company-setup" element={<ProtectedRoute ownerOnly><CompanySetupPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><CompanyDashboardPage /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute requiredPermission="products"><ProductsPage /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute requiredPermission="customers"><CustomersPage /></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute requiredPermission="suppliers"><SuppliersPage /></ProtectedRoute>} />
          <Route path="/invoices" element={<ProtectedRoute requiredPermission="invoices"><InvoicesPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute requiredPermission="reports"><ReportsPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute requiredPermission="notifications"><NotificationsPage /></ProtectedRoute>} />
          <Route path="/predictions" element={<ProtectedRoute requiredPermission="predictions"><PredictionsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}
