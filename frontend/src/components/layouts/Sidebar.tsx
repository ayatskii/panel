import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Box
} from '@mui/material'
import { 
  Dashboard as DashboardIcon,
  Language as SitesIcon,
  Article as PagesIcon,
  ViewModule as TemplatesIcon,
  Image as MediaIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  CloudUpload as DeployIcon,
  Code as CodeIcon,
  Layers as LayersIcon,
  VpnKey as IntegrationsIcon,
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'

const drawerWidth = 260

interface MenuItem {
  text: string
  icon: React.ReactElement
  path: string
}

const menuItems: MenuItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Sites', icon: <SitesIcon />, path: '/sites' },
  { text: 'Pages', icon: <PagesIcon />, path: '/pages' },
  { text: 'Templates', icon: <TemplatesIcon />, path: '/templates' },
  { text: 'Media', icon: <MediaIcon />, path: '/media' },
  { text: 'Integrations', icon: <IntegrationsIcon />, path: '/integrations/cloudflare-tokens' },
  { text: 'Deployments', icon: <DeployIcon />, path: '/deployments' },
  { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  { text: 'Prompts', icon: <CodeIcon />, path: '/prompts' }
]

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
        },
      }}
    >
      <Toolbar sx={{ 
        height: 70,
        display: 'flex',
        alignItems: 'center',
        px: 2.5,
        gap: 1.5
      }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
          }}
        >
          <LayersIcon sx={{ color: '#fff', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              fontWeight: 700,
              fontSize: '1.125rem',
              color: '#1a2027',
              lineHeight: 1.2
            }}
          >
            Panel
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#5a6872',
              fontSize: '0.75rem',
              fontWeight: 500
            }}
          >
            Management
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.08)', mx: 2 }} />
      <List sx={{ px: 1.5, py: 2 }}>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path || 
                             (item.path.startsWith('/integrations') && location.pathname.startsWith('/integrations'))
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isSelected}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  py: 1.25,
                  px: 2,
                  transition: 'all 0.2s ease-in-out',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    background: 'linear-gradient(90deg, rgba(25, 118, 210, 0.12) 0%, rgba(25, 118, 210, 0.04) 100%)',
                    borderLeft: '3px solid #1976d2',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.12)',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    transform: 'translateX(2px)',
                  },
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    minWidth: 40,
                    color: isSelected ? '#1976d2' : '#5a6872',
                    transition: 'color 0.2s ease-in-out'
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? '#1976d2' : '#1a2027',
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
    </Drawer>
  )
}

export default Sidebar
