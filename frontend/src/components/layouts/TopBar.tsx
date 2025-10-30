import { 
    AppBar, 
    Toolbar, 
    Typography, 
    IconButton, 
    Menu,
    MenuItem,
    Avatar,
    Box
  } from '@mui/material'
  import { Notifications } from '@mui/icons-material'
  import { useState } from 'react'
  import { useSelector, useDispatch } from 'react-redux'
  import { useNavigate } from 'react-router-dom'
  import { useTranslation } from 'react-i18next'
  import type { RootState } from '@/store'
  import { logout } from '@/store/slices/authSlice'
  import toast from 'react-hot-toast'
  import LanguageSwitcher from '../common/LanguageSwitcher'
  
  const TopBar = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const user = useSelector((state: RootState) => state.auth.user)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { t } = useTranslation()
  
    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget)
    }
  
    const handleClose = () => {
      setAnchorEl(null)
    }
  
    const handleLogout = () => {
      dispatch(logout())
      toast.success(t('auth.logoutSuccess'))
      navigate('/login')
    }
  
    return (
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#ffffff',
          color: '#1a2027',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Toolbar sx={{ height: 70, px: 3 }}>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {/* Page title can be dynamic */}
          </Typography>
  
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LanguageSwitcher />
            
            <IconButton 
              sx={{ 
                color: '#5a6872',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  color: '#1976d2'
                }
              }}
            >
              <Notifications />
            </IconButton>
  
            <Box
              onClick={handleMenu}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: 0.75,
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                }
              }}
            >
              <Avatar 
                sx={{ 
                  width: 36,
                  height: 36,
                  background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)'
                }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#1a2027',
                    lineHeight: 1.2
                  }}
                >
                  {user?.username}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#5a6872',
                    fontSize: '0.75rem'
                  }}
                >
                  {user?.role}
                </Typography>
              </Box>
            </Box>
  
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  minWidth: 200,
                  borderRadius: 2,
                  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                }
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a2027' }}>
                  {user?.username}
                </Typography>
                <Typography variant="caption" sx={{ color: '#5a6872' }}>
                  {user?.email}
                </Typography>
              </Box>
              <MenuItem 
                onClick={() => { handleClose(); navigate('/settings'); }}
                sx={{ 
                  py: 1.25,
                  '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' }
                }}
              >
                {t('navigation.settings')}
              </MenuItem>
              <MenuItem 
                onClick={handleLogout}
                sx={{ 
                  py: 1.25,
                  color: '#f44336',
                  '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.04)' }
                }}
              >
                {t('auth.logout')}
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
    )
  }
  
  export default TopBar
  