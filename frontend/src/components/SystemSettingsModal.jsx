import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControlLabel, MenuItem, Stack, Switch, TextField,
  Typography, useTheme
} from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import { CURRENCIES, getActiveCurrency, updateCompanyCurrency } from '../lib/currency'

const DEFAULT_PREFS = {
  dateFormat: 'YYYY-MM-DD',
  currency: getActiveCurrency(),
  enableAlerts: true,
  autoRefreshDashboard: false,
}

export function getSystemPreferences() {
  try {
    const saved = localStorage.getItem('aibos_preferences')
    return saved ? { ...DEFAULT_PREFS, ...JSON.parse(saved), currency: getActiveCurrency() } : { ...DEFAULT_PREFS, currency: getActiveCurrency() }
  } catch {
    return { ...DEFAULT_PREFS, currency: getActiveCurrency() }
  }
}

export default function SystemSettingsModal({ open, onClose }) {
  const theme = useTheme()
  const [prefs, setPrefs] = useState(getSystemPreferences())
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setPrefs({ ...getSystemPreferences(), currency: getActiveCurrency() })
      setMessage('')
    }
  }, [open])

  const handleSave = async () => {
    setSaving(true)
    try {
      localStorage.setItem('aibos_preferences', JSON.stringify(prefs))
      await updateCompanyCurrency(prefs.currency)
      setMessage('Settings & Currency preferences updated successfully!')
      setTimeout(() => {
        onClose()
      }, 800)
    } catch {
      setMessage('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: theme.palette.background.paper,
          backgroundImage: 'none',
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon color="primary" /> System Preferences
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            select
            fullWidth
            label="Default Operating Currency"
            value={prefs.currency}
            onChange={(e) => setPrefs({ ...prefs, currency: e.target.value })}
            helperText="Updates UI display formatting & backend company currency"
          >
            {Object.values(CURRENCIES).map((c) => (
              <MenuItem key={c.code} value={c.code}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Date Display Format"
            value={prefs.dateFormat}
            onChange={(e) => setPrefs({ ...prefs, dateFormat: e.target.value })}
          >
            <MenuItem value="YYYY-MM-DD">YYYY-MM-DD (2026-07-18)</MenuItem>
            <MenuItem value="DD/MM/YYYY">DD/MM/YYYY (18/07/2026)</MenuItem>
            <MenuItem value="MM/DD/YYYY">MM/DD/YYYY (07/18/2026)</MenuItem>
          </TextField>

          <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={prefs.enableAlerts}
                  onChange={(e) => setPrefs({ ...prefs, enableAlerts: e.target.checked })}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>System Notifications</Typography>
                  <Typography variant="caption" color="text.secondary">Show low-stock & payment alert banners</Typography>
                </Box>
              }
            />
          </Box>

          <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={prefs.autoRefreshDashboard}
                  onChange={(e) => setPrefs({ ...prefs, autoRefreshDashboard: e.target.checked })}
                  color="secondary"
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Auto-Refresh Metrics</Typography>
                  <Typography variant="caption" color="text.secondary">Periodically refresh dashboard totals</Typography>
                </Box>
              }
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
