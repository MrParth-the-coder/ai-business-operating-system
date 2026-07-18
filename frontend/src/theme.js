import { createContext } from 'react'
import { createTheme } from '@mui/material'

export const ColorModeContext = createContext({ toggleColorMode: () => {} })

export function getInitialThemeMode() {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem('ai-bos-theme')
  return stored === 'dark' ? 'dark' : 'light'
}

export function buildTheme(mode) {
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      primary: { main: '#4f46e5', light: '#818cf8', dark: '#312e81' },
      secondary: { main: '#0f766e', light: '#2dd4bf' },
      background: {
        default: isDark ? '#020617' : '#f4f7ff',
        paper: isDark ? '#111827' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f8fafc' : '#0f172a',
        secondary: isDark ? '#cbd5e1' : '#475569',
      },
      divider: isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(148, 163, 184, 0.2)',
    },
    shape: { borderRadius: 16 },
    typography: {
      fontFamily: 'Inter, "Segoe UI", Roboto, sans-serif',
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 999,
            boxShadow: 'none',
            px: 2,
            py: 1,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: isDark ? '0 20px 45px rgba(2, 6, 23, 0.35)' : '0 20px 45px rgba(15, 23, 42, 0.08)',
            border: isDark ? '1px solid rgba(148, 163, 184, 0.16)' : '1px solid rgba(148, 163, 184, 0.2)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: isDark ? 'linear-gradient(135deg, #0f172a 0%, #111827 100%)' : 'linear-gradient(135deg, #312e81 0%, #4f46e5 100%)',
            boxShadow: isDark ? '0 12px 30px rgba(2, 6, 23, 0.35)' : '0 12px 30px rgba(79, 70, 229, 0.2)',
          },
        },
      },
    },
  })
}
