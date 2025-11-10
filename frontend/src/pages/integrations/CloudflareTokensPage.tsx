import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
        toast.error(t('integrations.nameAndApiTokenRequired'))
        return
      }

      if (editingToken) {
        await updateToken({ id: editingToken.id, data: formData }).unwrap()
        toast.success(t('integrations.cloudflareTokenUpdated'))
      } else {
        await createToken(formData).unwrap()
        toast.success(t('integrations.cloudflareTokenCreated'))
      }
      handleCloseDialog()
    } catch (error) {
      const apiError = error as { data?: { message?: string } }
      toast.error(apiError.data?.message || t('integrations.cloudflareTokenSaveFailed'))
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm(t('integrations.deleteCloudflareTokenConfirm'))) {
      try {
        await deleteToken(id).unwrap()
        toast.success(t('integrations.cloudflareTokenDeleted'))
      } catch {
        toast.error(t('integrations.cloudflareTokenDeleteFailed'))
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
            {t('integrations.cloudflareTokens')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/integrations/api-tokens')}
          >
            {t('integrations.manageApiTokens')}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            {t('integrations.addCloudflareToken')}
          </Button>
        </Box>
      </Box>

      {cloudflareApiTokens.length === 0 && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'warning.light' }}>
          <Typography variant="body1" sx={{ color: 'warning.dark' }}>
            {t('integrations.noActiveCloudflareTokens')}
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate('/integrations/api-tokens')}
          >
            {t('integrations.goToApiTokens')}
          </Button>
        </Paper>
      )}

      {cloudflareTokens && cloudflareTokens.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="textSecondary" sx={{ mb: 2 }}>
            {t('integrations.noCloudflareTokensConfigured')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={cloudflareApiTokens.length === 0}
          >
            {t('integrations.addFirstCloudflareToken')}
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>{t('settings.name')}</strong></TableCell>
                <TableCell><strong>{t('settings.apiToken')}</strong></TableCell>
                <TableCell><strong>{t('integrations.accountId')}</strong></TableCell>
                <TableCell><strong>{t('integrations.zoneId')}</strong></TableCell>
                <TableCell><strong>{t('integrations.pagesProjectName')}</strong></TableCell>
                <TableCell><strong>{t('pages.created')}</strong></TableCell>
                <TableCell align="right"><strong>{t('settings.actions')}</strong></TableCell>
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
          {editingToken ? t('integrations.editCloudflareToken') : t('integrations.addCloudflareToken')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              label={t('settings.name')}
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              helperText={t('integrations.friendlyNameConfig')}
            />

            <FormControl fullWidth required>
              <InputLabel>{t('settings.apiToken')}</InputLabel>
              <Select
                value={formData.api_token}
                onChange={(e) => setFormData({ ...formData, api_token: e.target.value as number })}
                label={t('settings.apiToken')}
              >
                <MenuItem value={0} disabled>
                  {t('integrations.selectApiToken')}
                </MenuItem>
                {cloudflareApiTokens.map((token) => (
                  <MenuItem key={token.id} value={token.id}>
                    {token.name} ({token.token_masked})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label={t('integrations.accountId')}
              fullWidth
              value={formData.account_id}
              onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
              helperText={t('integrations.accountIdHelper')}
            />

            <TextField
              label={t('integrations.zoneId')}
              fullWidth
              value={formData.zone_id}
              onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })}
              helperText={t('integrations.zoneIdHelper')}
            />

            <TextField
              label={t('integrations.pagesProjectName')}
              fullWidth
              value={formData.pages_project_name}
              onChange={(e) => setFormData({ ...formData, pages_project_name: e.target.value })}
              helperText={t('integrations.pagesProjectNameHelper')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingToken ? t('common.update') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CloudflareTokensPage

