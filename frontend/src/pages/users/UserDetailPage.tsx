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

const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
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
      toast.success('User updated successfully')
    } catch {
      toast.error('Failed to update user');
    }
  }

  const handlePasswordSubmit = async () => {
    try {
      await changePassword({
        id: Number(id),
        data: passwordData
      }).unwrap()
      toast.success('Password changed successfully')
      setPasswordDialogOpen(false)
      setPasswordData({ old_password: '', new_password: '', new_password_confirm: '' })
    } catch (error) {
      const apiError = error as { data?: { message?: string } };
      toast.error(apiError.data?.message || 'Failed to change password');
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
        <Typography>User not found</Typography>
        <Button onClick={() => navigate('/users')} sx={{ mt: 2 }}>
          Back to Users
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        User Profile
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
              label="Username"
              name="username"
              fullWidth
              value={formData.username}
              onChange={handleChange}
              required
            />
            
            <TextField
              label="Email"
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
              {isUpdating ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => setPasswordDialogOpen(true)}
            >
              Change Password
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => navigate('/users')}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Old Password"
              name="old_password"
              type="password"
              fullWidth
              value={passwordData.old_password}
              onChange={handlePasswordChange}
              required
            />
            <TextField
              label="New Password"
              name="new_password"
              type="password"
              fullWidth
              value={passwordData.new_password}
              onChange={handlePasswordChange}
              required
            />
            <TextField
              label="Confirm New Password"
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
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
          <Button onClick={handlePasswordSubmit} variant="contained">
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default UserDetailPage
