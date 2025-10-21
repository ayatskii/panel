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
  import type { RootState } from '@/store'
  import { logout } from '@/store/slices/authSlice'
  import toast from 'react-hot-toast'
  
  const TopBar = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const user = useSelector((state: RootState) => state.auth.user)
    const dispatch = useDispatch()
    const navigate = useNavigate()
  
    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget)
    }
  
    const handleClose = () => {
      setAnchorEl(null)
    }
  
    const handleLogout = () => {
      dispatch(logout())
      toast.success('Logged out successfully')
      navigate('/login')
    }
  
    return (
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#fff',
          color: '#000',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {/* Page title can be dynamic */}
          </Typography>
  
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton color="inherit">
              <Notifications />
            </IconButton>
  
            <IconButton onClick={handleMenu} sx={{ p: 0 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
  
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem disabled>
                <Typography variant="body2">
                  {user?.username}
                </Typography>
              </MenuItem>
              <MenuItem onClick={() => { handleClose(); navigate('/settings'); }}>
                Settings
              </MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
    )
  }
  
  export default TopBar
  