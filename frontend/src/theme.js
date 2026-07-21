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
      primary: { main: isDark ? '#818cf8' : '#4f46e5', light: '#a5b4fc', dark: '#3730a3' },
      secondary: { main: isDark ? '#2dd4bf' : '#0f766e', light: '#5eead4' },
      background: {
        default: isDark ? '#0b0f19' : '#f4f7ff',
        paper: isDark ? '#151e32' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f1f5f9' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#475569',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(148, 163, 184, 0.2)',
    },
    shape: { borderRadius: 16 },
    typography: {
      fontFamily: 'Inter, "Segoe UI", Roboto, sans-serif',
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? '#0b0f19' : '#f4f7ff',
            color: isDark ? '#f1f5f9' : '#0f172a',
          },
        },
      },
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
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#151e32' : '#ffffff',
            backgroundImage: 'none',
            boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.4)' : '0 20px 45px rgba(15, 23, 42, 0.08)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(148, 163, 184, 0.2)',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            backgroundImage: 'none',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(226, 232, 240, 0.8)',
            color: isDark ? '#f1f5f9' : '#0f172a',
          },
          head: {
            backgroundColor: isDark ? '#0f172a' : '#f8fafc',
            color: isDark ? '#94a3b8' : '#475569',
            fontWeight: 700,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: isDark ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : 'linear-gradient(135deg, #312e81 0%, #4f46e5 100%)',
            boxShadow: isDark ? '0 12px 30px rgba(0, 0, 0, 0.5)' : '0 12px 30px rgba(79, 70, 229, 0.2)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(226, 232, 240, 0.8)',
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          shrink: {
            backgroundColor: isDark ? '#151e32' : '#ffffff',
            padding: '0 6px',
            borderRadius: '4px',
            fontWeight: 600,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& label': {
              color: isDark ? '#94a3b8' : undefined,
            },
          },
        },
      },
    },
  })
}
