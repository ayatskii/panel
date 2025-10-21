import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Toolbar,
  Typography,
  Divider
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
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'

const drawerWidth = 240

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
          backgroundColor: '#1e1e2e',
          color: '#fff',
        },
      }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          Website Panel
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(33, 150, 243, 0.16)',
                  '&:hover': {
                    backgroundColor: 'rgba(33, 150, 243, 0.24)',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  )
}

export default Sidebar
