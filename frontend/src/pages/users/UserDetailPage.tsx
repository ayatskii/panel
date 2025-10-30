import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import { useGetUserQuery, useUpdateUserMutation, useChangePasswordMutation } from '@/store/api/usersApi'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: user, isLoading } = useGetUserQuery(Number(id))
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()
  const [changePassword] = useChangePasswordMutation()
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  })
  
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: ''
  })
  
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await updateUser({
        id: Number(id),
        data: formData
      }).unwrap()
      toast.success(t('users.userUpdated'))
    } catch {
      toast.error(t('users.updateFailed'));
    }
  }

  const handlePasswordSubmit = async () => {
    try {
      await changePassword({
        id: Number(id),
        data: passwordData
      }).unwrap()
      toast.success(t('users.passwordChanged'))
      setPasswordDialogOpen(false)
      setPasswordData({ old_password: '', new_password: '', new_password_confirm: '' })
    } catch (error) {
      const apiError = error as { data?: { message?: string } };
      toast.error(apiError.data?.message || t('users.passwordChangeFailed'));
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography>{t('users.userNotFound')}</Typography>
        <Button onClick={() => navigate('/users')} sx={{ mt: 2 }}>
          {t('users.backToUsers')}
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        {t('users.userProfile')}
      </Typography>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          {/* Form Fields using CSS Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, 1fr)',
              },
              gap: 3,
              mb: 3,
            }}
          >
            <TextField
              label={t('users.username')}
              name="username"
              fullWidth
              value={formData.username}
              onChange={handleChange}
              required
            />
            
            <TextField
              label={t('users.email')}
              name="email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          {/* Action Buttons using Flexbox */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isUpdating}
            >
              {isUpdating ? <CircularProgress size={24} /> : t('users.saveChanges')}
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => setPasswordDialogOpen(true)}
            >
              {t('users.changePassword')}
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => navigate('/users')}
            >
              {t('common.cancel')}
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('users.changePassword')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label={t('users.oldPassword')}
              name="old_password"
              type="password"
              fullWidth
              value={passwordData.old_password}
              onChange={handlePasswordChange}
              required
            />
            <TextField
              label={t('users.newPassword')}
              name="new_password"
              type="password"
              fullWidth
              value={passwordData.new_password}
              onChange={handlePasswordChange}
              required
            />
            <TextField
              label={t('users.confirmNewPassword')}
              name="new_password_confirm"
              type="password"
              fullWidth
              value={passwordData.new_password_confirm}
              onChange={handlePasswordChange}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handlePasswordSubmit} variant="contained">
            {t('users.changePassword')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default UserDetailPage
