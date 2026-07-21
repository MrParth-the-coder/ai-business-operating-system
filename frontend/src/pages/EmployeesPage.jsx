import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel,
  FormGroup, Grid, IconButton, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Typography, Avatar, Tooltip
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import BadgeIcon from '@mui/icons-material/Badge'
import SecurityIcon from '@mui/icons-material/Security'
import api from '../lib/auth'
import AppLayout from '../components/AppLayout'

const AVAILABLE_PERMISSIONS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'products', label: 'Products & Inventory' },
  { id: 'customers', label: 'Customers' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'invoices', label: 'Invoices & Billing' },
  { id: 'reports', label: 'Reports & Analytics' },
  { id: 'predictions', label: 'AI & Predictions' },
  { id: 'ai', label: 'AI Assistant Chat' },
  { id: 'employees', label: 'Employee Management' },
]

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Dialog state
  const [openModal, setOpenModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    assigned_permissions: ['dashboard', 'products', 'customers', 'invoices'],
  })

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState(null)

  const loadEmployees = () => {
    setLoading(true)
    api.get('/employees/')
      .then(({ data }) => setEmployees(data))
      .catch(() => setError('Unable to load employee profiles.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadEmployees()
  }, [])

  const handleOpenAdd = () => {
    setEditItem(null)
    setFormData({
      email: '',
      password: '',
      assigned_permissions: ['dashboard', 'products', 'customers', 'invoices'],
    })
    setOpenModal(true)
  }

  const handleOpenEdit = (emp) => {
    setEditItem(emp)
    setFormData({
      email: emp.email || '',
      password: '',
      assigned_permissions: emp.assigned_permissions || [],
    })
    setOpenModal(true)
  }

  const handleTogglePermission = (permId) => {
    setFormData((prev) => {
      const current = prev.assigned_permissions || []
      if (current.includes(permId)) {
        return { ...prev, assigned_permissions: current.filter((p) => p !== permId) }
      } else {
        return { ...prev, assigned_permissions: [...current, permId] }
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      if (editItem) {
        await api.patch(`/employees/${editItem.id}/`, {
          assigned_permissions: formData.assigned_permissions,
          ...(formData.password ? { password: formData.password } : {}),
        })
        setSuccess('Employee permissions updated successfully!')
      } else {
        await api.post('/employees/', formData)
        setSuccess('New employee account provisioned!')
      }
      setOpenModal(false)
      loadEmployees()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save employee profile.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/employees/${deleteTarget.id}/`)
      setSuccess('Employee account removed.')
      setDeleteTarget(null)
      loadEmployees()
    } catch {
      setError('Unable to delete employee.')
    }
  }

  return (
    <AppLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>ACCESS CONTROL</Typography>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>Employee & Role Management</Typography>
            <Typography color="text.secondary">Provision team member accounts and assign module-level RBAC permissions.</Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            sx={{ px: 3, py: 1, borderRadius: 2 }}
          >
            Add Employee
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(15,23,42,0.06)' }}>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : employees.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <BadgeIcon sx={{ fontSize: 54, color: 'text.secondary', mb: 1 }} />
                <Typography variant="h6" color="text.secondary">No team members provisioned yet.</Typography>
                <Typography variant="body2" color="text.secondary">Add employees to grant them access to specific business modules.</Typography>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee Member</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Assigned Permissions</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 700 }}>
                            {(emp.name || emp.email || 'E')[0].toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{emp.name || emp.email.split('@')[0]}</Typography>
                            <Typography variant="caption" color="text.secondary">{emp.email}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip label={(emp.role || 'employee').toUpperCase()} color="primary" variant="outlined" size="small" />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          {(emp.assigned_permissions || []).map((perm) => (
                            <Chip key={perm} label={perm} size="small" sx={{ fontSize: '0.7rem' }} />
                          ))}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit Permissions">
                          <IconButton size="small" color="primary" onClick={() => handleOpenEdit(emp)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove Account">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(emp)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Employee Dialog */}
        <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleSubmit}>
            <DialogTitle sx={{ fontWeight: 700 }}>
              {editItem ? 'Edit Employee Permissions' : 'Provision New Employee Account'}
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2.5}>
                <TextField
                  label="Work Email Address"
                  type="email"
                  fullWidth
                  required
                  disabled={Boolean(editItem)}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <TextField
                  label={editItem ? 'New Password (leave blank to keep current)' : 'Account Password'}
                  type="password"
                  fullWidth
                  required={!editItem}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon color="primary" fontSize="small" /> Module Permissions
                  </Typography>
                  <FormGroup>
                    <Grid container spacing={1}>
                      {AVAILABLE_PERMISSIONS.map((perm) => (
                        <Grid item xs={12} sm={6} key={perm.id}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={(formData.assigned_permissions || []).includes(perm.id)}
                                onChange={() => handleTogglePermission(perm.id)}
                              />
                            }
                            label={perm.label}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </FormGroup>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenModal(false)}>Cancel</Button>
              <Button type="submit" variant="contained">
                {editItem ? 'Save Changes' : 'Create Account'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
          <DialogTitle sx={{ fontWeight: 700 }}>Revoke Employee Access?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to remove account access for <strong>{deleteTarget?.email}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Confirm Revoke
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  )
}
