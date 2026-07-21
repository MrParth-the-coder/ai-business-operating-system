import { useContext, useEffect, useState } from 'react'
import { AppBar, Avatar, Box, Button, Divider, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Stack, Toolbar, Typography, useTheme } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import DashboardIcon from '@mui/icons-material/Dashboard'
import BusinessIcon from '@mui/icons-material/Business'
import InventoryIcon from '@mui/icons-material/Inventory'
import PeopleIcon from '@mui/icons-material/People'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import AssessmentIcon from '@mui/icons-material/Assessment'
import NotificationsIcon from '@mui/icons-material/Notifications'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import BadgeIcon from '@mui/icons-material/Badge'
import HistoryIcon from '@mui/icons-material/History'
import SearchIcon from '@mui/icons-material/Search'
import SettingsIcon from '@mui/icons-material/Settings'
import Chip from '@mui/material/Chip'
import api, { logout as apiLogout, clearTokens } from '../lib/auth'
import { ColorModeContext } from '../theme'
import GlobalSearchModal from './GlobalSearchModal'
import SystemSettingsModal from './SystemSettingsModal'

const drawerWidth = 260
const baseNavLinks = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon />, permission: null, ownerOnly: false },
  { path: '/products', label: 'Products', icon: <InventoryIcon />, permission: 'products', ownerOnly: false },
  { path: '/customers', label: 'Customers', icon: <PeopleIcon />, permission: 'customers', ownerOnly: false },
  { path: '/suppliers', label: 'Suppliers', icon: <LocalShippingIcon />, permission: 'suppliers', ownerOnly: false },
  { path: '/invoices', label: 'Invoices', icon: <ReceiptLongIcon />, permission: 'invoices', ownerOnly: false },
  { path: '/reports', label: 'Reports', icon: <AssessmentIcon />, permission: 'reports', ownerOnly: false },
  { path: '/notifications', label: 'Notifications', icon: <NotificationsIcon />, permission: 'notifications', ownerOnly: false },
  { path: '/predictions', label: 'Predictions', icon: <AutoAwesomeIcon />, permission: 'predictions', ownerOnly: false },
  { path: '/employees', label: 'Employees', icon: <BadgeIcon />, permission: 'employees', ownerOnly: false },
  { path: '/activity-log', label: 'Activity Log', icon: <HistoryIcon />, permission: null, ownerOnly: false },
  { path: '/company-setup', label: 'Company Setup', icon: <BusinessIcon />, permission: null, ownerOnly: true },
]

export default function AppLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const colorMode = useContext(ColorModeContext)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [navLinks, setNavLinks] = useState(baseNavLinks)
  const [searchOpen, setSearchOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const { data } = await api.get('/companies/me/')
        const isOwner = data?.is_owner === true
        const permissions = Array.isArray(data?.permissions) ? data.permissions : []

        setNavLinks(baseNavLinks.filter((link) => {
          if (link.ownerOnly && !isOwner) return false
          if (!link.permission) return true
          return isOwner || permissions.includes(link.permission)
        }))
      } catch {
        setNavLinks(baseNavLinks)
      }
    }

    loadPermissions()
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await apiLogout()
    } catch {
      // ignore logout errors; still clear local state
    }
    clearTokens()
    navigate('/login')
  }

  const drawer = (
    <Box sx={{ height: '100%', background: theme.palette.mode === 'dark' ? 'linear-gradient(180deg, rgba(30,41,59,0.2) 0%, rgba(15,23,42,0) 100%)' : 'linear-gradient(180deg, rgba(79,70,229,0.08) 0%, rgba(255,255,255,0) 100%)' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 2, py: 3 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 42, height: 42 }}>A</Avatar>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            AI BOS
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Operations suite
          </Typography>
        </Box>
      </Stack>
      <Divider />
      <List sx={{ px: 1.5, py: 1 }}>
        {navLinks.map((link) => (
          <ListItem key={link.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              to={link.path}
              selected={location.pathname === link.path}
              onClick={() => setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                px: 1.5,
                py: 1,
                '&.Mui-selected': {
                  background: theme.palette.mode === 'dark' ? 'rgba(129, 140, 248, 0.18)' : 'linear-gradient(90deg, rgba(79,70,229,0.14) 0%, rgba(79,70,229,0.05) 100%)',
                  color: 'primary.main',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 42, color: location.pathname === link.path ? 'primary.main' : 'text.secondary' }}>{link.icon}</ListItemIcon>
              <ListItemText primary={link.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography component={Link} to="/dashboard" variant="h6" sx={{ textDecoration: 'none', color: 'inherit', fontWeight: 700 }}>
              AI BOS
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              color="inherit"
              onClick={() => setSearchOpen(true)}
              startIcon={<SearchIcon />}
              sx={{
                bgcolor: 'action.hover',
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                textTransform: 'none',
                border: '1px solid rgba(255,255,255,0.2)',
                display: { xs: 'none', sm: 'inline-flex' }
              }}
            >
              Search...
              <Chip label="Ctrl K" size="small" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
            </Button>
            <IconButton color="inherit" onClick={() => setSearchOpen(true)} sx={{ display: { xs: 'inline-flex', sm: 'none' } }}>
              <SearchIcon />
            </IconButton>
            <IconButton color="inherit" onClick={() => setSettingsOpen(true)} aria-label="system preferences">
              <SettingsIcon />
            </IconButton>
            <IconButton color="inherit" onClick={colorMode.toggleColorMode} aria-label="toggle color mode">
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <Button color="inherit" onClick={handleLogout} disabled={isLoggingOut} sx={{ border: '1px solid rgba(255,255,255,0.25)' }}>
              Logout
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <SystemSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', mt: 8 },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, width: { md: `calc(100% - ${drawerWidth}px)` }, bgcolor: 'background.default' }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  )
}
