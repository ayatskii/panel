import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudQueue as CloudIcon,
} from '@mui/icons-material'
import {
  useGetCloudflareTokensQuery,
  useGetApiTokensQuery,
  useCreateCloudflareTokenMutation,
  useUpdateCloudflareTokenMutation,
  useDeleteCloudflareTokenMutation,
} from '@/store/api/integrationsApi'
import toast from 'react-hot-toast'
import { formatDate } from '@/utils/formatDate'
import type { CloudflareToken } from '@/types'

const CloudflareTokensPage = () => {
  const navigate = useNavigate()
  const { data: cloudflareTokens, isLoading } = useGetCloudflareTokensQuery()
  const { data: apiTokens } = useGetApiTokensQuery()
  const [createToken] = useCreateCloudflareTokenMutation()
  const [updateToken] = useUpdateCloudflareTokenMutation()
  const [deleteToken] = useDeleteCloudflareTokenMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingToken, setEditingToken] = useState<CloudflareToken | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    api_token: 0,
    account_id: '',
    zone_id: '',
    pages_project_name: '',
  })

  // Filter API tokens to only show Cloudflare tokens
  const cloudflareApiTokens = apiTokens?.filter(token => token.service === 'cloudflare' && token.is_active) || []

  const handleOpenDialog = (token?: CloudflareToken) => {
    if (token) {
      setEditingToken(token)
      setFormData({
        name: token.name,
        api_token: token.api_token,
        account_id: token.account_id,
        zone_id: token.zone_id,
        pages_project_name: token.pages_project_name,
      })
    } else {
      setEditingToken(null)
      setFormData({
        name: '',
        api_token: 0,
        account_id: '',
        zone_id: '',
        pages_project_name: '',
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingToken(null)
  }

  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.api_token) {
        toast.error('Name and API Token are required')
        return
      }

      if (editingToken) {
        await updateToken({ id: editingToken.id, data: formData }).unwrap()
        toast.success('Cloudflare token updated successfully')
      } else {
        await createToken(formData).unwrap()
        toast.success('Cloudflare token created successfully')
      }
      handleCloseDialog()
    } catch (error) {
      const apiError = error as { data?: { message?: string } }
      toast.error(apiError.data?.message || 'Failed to save Cloudflare token')
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this Cloudflare token?')) {
      try {
        await deleteToken(id).unwrap()
        toast.success('Cloudflare token deleted successfully')
      } catch {
        toast.error('Failed to delete Cloudflare token')
      }
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CloudIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Cloudflare Tokens
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/integrations/api-tokens')}
          >
            Manage API Tokens
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Cloudflare Token
          </Button>
        </Box>
      </Box>

      {cloudflareApiTokens.length === 0 && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'warning.light' }}>
          <Typography variant="body1" sx={{ color: 'warning.dark' }}>
            No active Cloudflare API tokens found. Please create an API token first.
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate('/integrations/api-tokens')}
          >
            Go to API Tokens
          </Button>
        </Paper>
      )}

      {cloudflareTokens && cloudflareTokens.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="textSecondary" sx={{ mb: 2 }}>
            No Cloudflare tokens configured yet
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={cloudflareApiTokens.length === 0}
          >
            Add Your First Cloudflare Token
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>API Token</strong></TableCell>
                <TableCell><strong>Account ID</strong></TableCell>
                <TableCell><strong>Zone ID</strong></TableCell>
                <TableCell><strong>Project Name</strong></TableCell>
                <TableCell><strong>Created</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cloudflareTokens?.map((token) => (
                <TableRow key={token.id}>
                  <TableCell>{token.name}</TableCell>
                  <TableCell>{token.api_token_name || `Token #${token.api_token}`}</TableCell>
                  <TableCell>{token.account_id || '-'}</TableCell>
                  <TableCell>{token.zone_id || '-'}</TableCell>
                  <TableCell>{token.pages_project_name || '-'}</TableCell>
                  <TableCell>{formatDate(token.created_at, 'PPP')}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(token)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(token.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingToken ? 'Edit Cloudflare Token' : 'Add Cloudflare Token'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              label="Name"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              helperText="Friendly name for this configuration"
            />

            <FormControl fullWidth required>
              <InputLabel>API Token</InputLabel>
              <Select
                value={formData.api_token}
                onChange={(e) => setFormData({ ...formData, api_token: e.target.value as number })}
                label="API Token"
              >
                <MenuItem value={0} disabled>
                  Select an API token
                </MenuItem>
                {cloudflareApiTokens.map((token) => (
                  <MenuItem key={token.id} value={token.id}>
                    {token.name} ({token.token_masked})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Account ID"
              fullWidth
              value={formData.account_id}
              onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
              helperText="Your Cloudflare account ID"
            />

            <TextField
              label="Zone ID"
              fullWidth
              value={formData.zone_id}
              onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })}
              helperText="Cloudflare zone ID for DNS operations"
            />

            <TextField
              label="Pages Project Name"
              fullWidth
              value={formData.pages_project_name}
              onChange={(e) => setFormData({ ...formData, pages_project_name: e.target.value })}
              helperText="Default Cloudflare Pages project name"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingToken ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CloudflareTokensPage

