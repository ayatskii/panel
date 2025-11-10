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
  Chip,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  VpnKey as KeyIcon,
} from '@mui/icons-material'
import {
  useGetApiTokensQuery,
  useCreateApiTokenMutation,
  useUpdateApiTokenMutation,
  useDeleteApiTokenMutation,
} from '@/store/api/integrationsApi'
import toast from 'react-hot-toast'
import { formatDate } from '@/utils/formatDate'
import type { ApiToken } from '@/types'

const ApiTokensPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: apiTokens, isLoading } = useGetApiTokensQuery()
  const [createToken] = useCreateApiTokenMutation()
  const [updateToken] = useUpdateApiTokenMutation()
  const [deleteToken] = useDeleteApiTokenMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingToken, setEditingToken] = useState<ApiToken | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    service: 'cloudflare' as ApiToken['service'],
    token_value: '',
    is_active: true,
  })

  const handleOpenDialog = (token?: ApiToken) => {
    if (token) {
      setEditingToken(token)
      setFormData({
        name: token.name,
        service: token.service,
        token_value: '', // Never pre-fill for security
        is_active: token.is_active,
      })
    } else {
      setEditingToken(null)
      setFormData({
        name: '',
        service: 'cloudflare',
        token_value: '',
        is_active: true,
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
      if (!formData.name || !formData.service) {
        toast.error(t('integrations.nameAndServiceRequired'))
        return
      }

      if (!editingToken && !formData.token_value) {
        toast.error(t('integrations.tokenValueRequired'))
        return
      }

      const dataToSend: Partial<ApiToken> = {
        name: formData.name,
        service: formData.service,
        is_active: formData.is_active,
      }

      // Only include token_value if it's provided (for updates, it's optional)
      if (formData.token_value) {
        dataToSend.token_value = formData.token_value
      }

      if (editingToken) {
        await updateToken({ id: editingToken.id, data: dataToSend }).unwrap()
        toast.success(t('integrations.apiTokenUpdated'))
      } else {
        await createToken(dataToSend).unwrap()
        toast.success(t('integrations.apiTokenCreated'))
      }
      handleCloseDialog()
    } catch (error) {
      const apiError = error as { data?: { message?: string } }
      toast.error(apiError.data?.message || t('integrations.apiTokenSaveFailed'))
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm(t('integrations.deleteApiTokenConfirm'))) {
      try {
        await deleteToken(id).unwrap()
        toast.success(t('integrations.apiTokenDeleted'))
      } catch {
        toast.error(t('integrations.apiTokenDeleteFailed'))
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
          <KeyIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {t('integrations.apiTokens')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/integrations/cloudflare-tokens')}
          >
            {t('integrations.cloudflareTokens')}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            {t('integrations.addApiToken')}
          </Button>
        </Box>
      </Box>

      {apiTokens && apiTokens.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="textSecondary" sx={{ mb: 2 }}>
            {t('integrations.noApiTokensConfigured')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            {t('integrations.addFirstApiToken')}
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>{t('settings.name')}</strong></TableCell>
                <TableCell><strong>{t('settings.service')}</strong></TableCell>
                <TableCell><strong>{t('settings.token')}</strong></TableCell>
                <TableCell><strong>{t('settings.status')}</strong></TableCell>
                <TableCell><strong>{t('settings.usage')}</strong></TableCell>
                <TableCell><strong>{t('settings.lastUsed')}</strong></TableCell>
                <TableCell align="right"><strong>{t('settings.actions')}</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {apiTokens?.map((token) => (
                <TableRow key={token.id}>
                  <TableCell>{token.name}</TableCell>
                  <TableCell>{token.service_display}</TableCell>
                  <TableCell>
                    <code style={{ fontSize: '0.875rem' }}>{token.token_masked}</code>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={token.is_active ? t('settings.active') : t('settings.inactive')}
                      color={token.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{token.usage_count} {t('integrations.times')}</TableCell>
                  <TableCell>
                    {token.last_used ? formatDate(token.last_used, 'PPP') : t('integrations.never')}
                  </TableCell>
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
          {editingToken ? t('integrations.editApiToken') : t('integrations.addApiToken')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              label={t('settings.name')}
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              helperText={t('integrations.friendlyName')}
            />

            <FormControl fullWidth required>
              <InputLabel>{t('settings.service')}</InputLabel>
              <Select
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value as ApiToken['service'] })}
                label={t('settings.service')}
              >
                <MenuItem value="cloudflare">Cloudflare</MenuItem>
                <MenuItem value="chatgpt">ChatGPT</MenuItem>
                <MenuItem value="grok">Grok</MenuItem>
                <MenuItem value="claude">Claude</MenuItem>
                <MenuItem value="elevenlabs">ElevenLabs</MenuItem>
                <MenuItem value="dalle">DALL-E</MenuItem>
                <MenuItem value="midjourney">Midjourney</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label={t('integrations.tokenValue')}
              fullWidth
              required={!editingToken}
              type="password"
              value={formData.token_value}
              onChange={(e) => setFormData({ ...formData, token_value: e.target.value })}
              helperText={editingToken ? t('integrations.tokenValueHelperEdit') : t('integrations.tokenValueHelper')}
            />

            <FormControl fullWidth>
              <InputLabel>{t('settings.status')}</InputLabel>
              <Select
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                label={t('settings.status')}
              >
                <MenuItem value="active">{t('settings.active')}</MenuItem>
                <MenuItem value="inactive">{t('settings.inactive')}</MenuItem>
              </Select>
            </FormControl>
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

export default ApiTokensPage

