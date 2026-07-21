import { useEffect, useState } from 'react'
import {
  Avatar, Box, Chip, Dialog, DialogContent, InputAdornment,
  List, ListItemButton, ListItemIcon, ListItemText, Stack, TextField,
  Typography, useTheme
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import InventoryIcon from '@mui/icons-material/Inventory'
import PeopleIcon from '@mui/icons-material/People'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import { useNavigate } from 'react-router-dom'
import api from '../lib/auth'

export default function GlobalSearchModal({ open, onClose }) {
  const theme = useTheme()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [invoices, setInvoices] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setProducts([])
      setCustomers([])
      setInvoices([])
      return
    }

    setSearching(true)
    const q = query.trim()

    Promise.all([
      api.get(`/products/?search=${encodeURIComponent(q)}`).catch(() => ({ data: [] })),
      api.get(`/customers/?search=${encodeURIComponent(q)}`).catch(() => ({ data: [] })),
      api.get(`/invoices/`).catch(() => ({ data: [] })),
    ])
      .then(([prodRes, custRes, invRes]) => {
        const pList = prodRes.data.results || prodRes.data || []
        const cList = custRes.data.results || custRes.data || []
        const iList = (invRes.data.results || invRes.data || []).filter(
          (inv) =>
            inv.customer?.name?.toLowerCase().includes(q.toLowerCase()) ||
            String(inv.id).includes(q) ||
            inv.payment_status?.toLowerCase().includes(q.toLowerCase())
        )

        setProducts(pList.slice(0, 4))
        setCustomers(cList.slice(0, 4))
        setInvoices(iList.slice(0, 4))
      })
      .finally(() => setSearching(false))
  }, [query])

  const handleSelect = (path) => {
    onClose()
    navigate(path)
    setQuery('')
  }

  const hasResults = products.length > 0 || customers.length > 0 || invoices.length > 0

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: theme.palette.background.paper,
          backgroundImage: 'none',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }
      }}
    >
      <DialogContent sx={{ p: 2.5 }}>
        <TextField
          autoFocus
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products, customers, invoices... (Esc to close)"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="primary" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Chip label="ESC" size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {!query.trim() ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Type keywords to search across inventory, client records, and sales history.
            </Typography>
          </Box>
        ) : searching ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Searching...</Typography>
          </Box>
        ) : !hasResults ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">No matching records found for "{query}".</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {/* Products Results */}
            {products.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="overline" color="primary" sx={{ px: 1.5, fontWeight: 700, letterSpacing: 1.5 }}>
                  PRODUCTS
                </Typography>
                {products.map((p) => (
                  <ListItemButton key={p.id} onClick={() => handleSelect('/products')} sx={{ borderRadius: 2, mb: 0.5 }}>
                    <ListItemIcon><InventoryIcon color="primary" /></ListItemIcon>
                    <ListItemText
                      primary={p.name}
                      secondary={`${p.category || 'General'} • $${Number(p.price).toFixed(2)} (${p.stock_qty} in stock)`}
                    />
                    <ArrowForwardIosIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                  </ListItemButton>
                ))}
              </Box>
            )}

            {/* Customer Results */}
            {customers.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="overline" color="secondary" sx={{ px: 1.5, fontWeight: 700, letterSpacing: 1.5 }}>
                  CUSTOMERS
                </Typography>
                {customers.map((c) => (
                  <ListItemButton key={c.id} onClick={() => handleSelect('/customers')} sx={{ borderRadius: 2, mb: 0.5 }}>
                    <ListItemIcon><PeopleIcon color="secondary" /></ListItemIcon>
                    <ListItemText
                      primary={c.name}
                      secondary={`${c.email || c.phone || 'No contact details'}`}
                    />
                    <ArrowForwardIosIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                  </ListItemButton>
                ))}
              </Box>
            )}

            {/* Invoices Results */}
            {invoices.length > 0 && (
              <Box>
                <Typography variant="overline" color="success" sx={{ px: 1.5, fontWeight: 700, letterSpacing: 1.5 }}>
                  INVOICES
                </Typography>
                {invoices.map((inv) => (
                  <ListItemButton key={inv.id} onClick={() => handleSelect('/invoices')} sx={{ borderRadius: 2, mb: 0.5 }}>
                    <ListItemIcon><ReceiptLongIcon color="success" /></ListItemIcon>
                    <ListItemText
                      primary={`Invoice #${inv.id} — ${inv.customer?.name || 'Customer'}`}
                      secondary={`$${Number(inv.total).toFixed(2)} • Status: ${inv.payment_status}`}
                    />
                    <ArrowForwardIosIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                  </ListItemButton>
                ))}
              </Box>
            )}
          </List>
        )}
      </DialogContent>
    </Dialog>
  )
}
