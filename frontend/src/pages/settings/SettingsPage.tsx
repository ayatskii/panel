import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Alert,
  Card,
  CardContent,
  Chip
} from '@mui/material'
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  Info as InfoIcon
} from '@mui/icons-material'
import { useGetCurrentUserQuery } from '@/store/api/authApi'
import { useUpdateUserMutation, useChangePasswordMutation } from '@/store/api/usersApi'
import toast from 'react-hot-toast'
import { formatDate } from '@/utils/formatDate'
import { useTranslation } from 'react-i18next'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel = ({ children, value, index }: TabPanelProps) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState(0)
  const { t } = useTranslation()
  const { data: currentUser, isLoading } = useGetCurrentUserQuery()
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation()
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
  })
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: ''
  })
  
  const [passwordError, setPasswordError] = useState('')

  // Update form when user data loads
  useEffect(() => {
    if (currentUser) {
      setProfileData({
        username: currentUser.username,
        email: currentUser.email,
      })
    }
  }, [currentUser])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    })
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    })
    setPasswordError('')
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser) return
    
    try {
      await updateUser({
        id: currentUser.id,
        data: profileData
      }).unwrap()
      toast.success(t('settings.profileUpdated'))
    } catch (error) {
      const apiError = error as { data?: { username?: string[]; email?: string[]; detail?: string } };
      
      if (apiError.data?.username) {
        toast.error(apiError.data.username[0])
      } else if (apiError.data?.email) {
        toast.error(apiError.data.email[0])
      } else if (apiError.data?.detail) {
        toast.error(apiError.data.detail)
      } else {
        toast.error(t('settings.profileUpdateFailed'))
      }
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser) return
    
    // Client-side validation
    if (passwordData.new_password !== passwordData.new_password_confirm) {
      setPasswordError(t('settings.passwordsDoNotMatch'))
      return
    }
    
    if (passwordData.new_password.length < 8) {
      setPasswordError(t('settings.passwordTooShort'))
      return
    }
    
    try {
      await changePassword({
        id: currentUser.id,
        data: passwordData
      }).unwrap()
      toast.success(t('settings.passwordChanged'))
      setPasswordData({ old_password: '', new_password: '', new_password_confirm: '' })
      setPasswordError('')
    } catch (error) {
      const apiError = error as { 
        data?: { 
          old_password?: string[];
          new_password?: string[];
          new_password_confirm?: string[];
          detail?: string 
        } 
      };
      
      if (apiError.data?.old_password) {
        setPasswordError(apiError.data.old_password[0])
      } else if (apiError.data?.new_password) {
        setPasswordError(apiError.data.new_password[0])
      } else if (apiError.data?.new_password_confirm) {
        setPasswordError(apiError.data.new_password_confirm[0])
      } else if (apiError.data?.detail) {
        setPasswordError(apiError.data.detail)
      } else {
        setPasswordError(t('settings.passwordChangeFailed'))
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

  if (!currentUser) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography>{t('settings.unableToLoadUserData')}</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700,
            color: '#1a2027',
            mb: 0.5
          }}
        >
          {t('settings.title')}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#5a6872',
            fontSize: '0.875rem'
          }}
        >
          {t('settings.description')}
        </Typography>
      </Box>

      <Paper 
        sx={{ 
          mb: 3,
          borderRadius: 3,
          border: '1px solid rgba(0, 0, 0, 0.06)',
          overflow: 'hidden'
        }}
      >
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            px: 2,
            '& .MuiTab-root': {
              minHeight: 64,
              fontWeight: 500
            }
          }}
        >
          <Tab 
            icon={<PersonIcon />} 
            iconPosition="start" 
            label={t('settings.tabs.profile')} 
          />
          <Tab 
            icon={<SecurityIcon />} 
            iconPosition="start" 
            label={t('settings.tabs.security')} 
          />
          <Tab 
            icon={<InfoIcon />} 
            iconPosition="start" 
            label={t('settings.tabs.accountInfo')} 
          />
        </Tabs>

        {/* Profile Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ px: 3 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 1,
                fontWeight: 600,
                color: '#1a2027'
              }}
            >
              {t('settings.profileInformation')}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 4,
                fontSize: '0.875rem'
              }}
            >
              {t('settings.profileInformationDescription')}
            </Typography>

            <form onSubmit={handleProfileSubmit}>
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
                  label={t('settings.username')}
                  name="username"
                  fullWidth
                  value={profileData.username}
                  onChange={handleProfileChange}
                  required
                  helperText={t('settings.usernameHelper')}
                />
                
                <TextField
                  label={t('settings.email')}
                  name="email"
                  type="email"
                  fullWidth
                  value={profileData.email}
                  onChange={handleProfileChange}
                  required
                  helperText={t('settings.emailHelper')}
                />
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isUpdating}
                >
                  {isUpdating ? <CircularProgress size={24} /> : t('settings.saveChanges')}
                </Button>
              </Box>
            </form>
          </Box>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ px: 3 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 1,
                fontWeight: 600,
                color: '#1a2027'
              }}
            >
              {t('settings.changePassword')}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 4,
                fontSize: '0.875rem'
              }}
            >
              {t('settings.passwordSecurityDescription')}
            </Typography>

            {passwordError && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setPasswordError('')}>
                {passwordError}
              </Alert>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 500 }}>
                <TextField
                  label={t('settings.currentPassword')}
                  name="old_password"
                  type="password"
                  fullWidth
                  value={passwordData.old_password}
                  onChange={handlePasswordChange}
                  required
                />
                
                <TextField
                  label={t('settings.newPassword')}
                  name="new_password"
                  type="password"
                  fullWidth
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  required
                  helperText={t('settings.passwordHelper')}
                />
                
                <TextField
                  label={t('settings.confirmNewPassword')}
                  name="new_password_confirm"
                  type="password"
                  fullWidth
                  value={passwordData.new_password_confirm}
                  onChange={handlePasswordChange}
                  required
                />
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? <CircularProgress size={24} /> : t('settings.updatePassword')}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setPasswordData({ old_password: '', new_password: '', new_password_confirm: '' })
                    setPasswordError('')
                  }}
                  disabled={isChangingPassword}
                >
                  {t('common.cancel')}
                </Button>
              </Box>
            </form>
          </Box>
        </TabPanel>

        {/* Account Info Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ px: 3 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 1,
                fontWeight: 600,
                color: '#1a2027'
              }}
            >
              {t('settings.accountInformation')}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 4,
                fontSize: '0.875rem'
              }}
            >
              {t('settings.accountInformationDescription')}
            </Typography>

            <Card 
              variant="outlined"
              sx={{
                borderRadius: 2,
                border: '1px solid rgba(0, 0, 0, 0.08)'
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: 'repeat(2, 1fr)',
                    },
                    gap: 3,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t('settings.userId')}
                    </Typography>
                    <Typography variant="body1">
                      #{currentUser.id}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t('settings.username')}
                    </Typography>
                    <Typography variant="body1">
                      {currentUser.username}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t('settings.email')}
                    </Typography>
                    <Typography variant="body1">
                      {currentUser.email}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t('settings.role')}
                    </Typography>
                    <Chip 
                      label={currentUser.role.toUpperCase()} 
                      color={currentUser.is_admin ? 'primary' : 'default'}
                      size="small"
                    />
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t('settings.accountCreated')}
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(currentUser.created_at, 'PPP')}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t('settings.accountStatus')}
                    </Typography>
                    <Chip 
                      label={t('settings.active')} 
                      color="success"
                      size="small"
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  )
}

export default SettingsPage

