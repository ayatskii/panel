import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  CircularProgress,
  TextField,
  InputAdornment,
} from '@mui/material'
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Rocket as DeployIcon,
  Visibility as ViewIcon,
  Speed as SpeedIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material'
import { useGetSitesQuery, useDeleteSiteMutation, useDeploySiteMutation } from '@/store/api/sitesApi'
import SiteCreationWizard from '@/components/sites/SiteCreationWizard'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const SitesListPage = () => {
  const navigate = useNavigate()
  const { data: sites, isLoading } = useGetSitesQuery()
  const [deleteSite] = useDeleteSiteMutation()
  const [deploySite] = useDeploySiteMutation()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [wizardOpen, setWizardOpen] = useState(false)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, siteId: number) => {
    setAnchorEl(event.currentTarget)
    setSelectedSiteId(siteId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedSiteId(null)
  }

  const handleCreateSite = () => {
    setWizardOpen(true)
  }

  const handleSiteCreated = (siteId: number) => {
    toast.success('Site created successfully!')
    setWizardOpen(false)
    navigate(`/sites/${siteId}`)
  }

  const handleDelete = async (siteId: number) => {
    if (window.confirm('Are you sure you want to delete this site? This action cannot be undone.')) {
      try {
        await deleteSite(siteId).unwrap()
        toast.success('Site deleted successfully')
        handleMenuClose()
      } catch {
        toast.error('Failed to delete site');
      }
    }
  }

  const handleDeploy = async (siteId: number) => {
    try {
      const result = await deploySite(siteId).unwrap()
      toast.success(result.message)
      handleMenuClose()
    } catch {
      toast.error('Failed to deploy site');
    }
  }

  const filteredSites = sites?.filter(site =>
    site.brand_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.domain.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

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
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Sites
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateSite}
        >
          Create Site
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          placeholder="Search sites..."
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {filteredSites.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="textSecondary" sx={{ mb: 2 }}>
            No sites found
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/sites/create')}
          >
            Create Your First Site
          </Button>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {filteredSites.map((site) => (
            <Card key={site.id} sx={{ display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {site.brand_name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, site.id)}
                  >
                    <MoreIcon />
                  </IconButton>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {site.domain}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  {/* Template Type */}
                  <Chip 
                    label={site.template_type_display || site.template_type || 'Template'} 
                    size="small" 
                    color="primary"
                    variant="outlined"
                  />
                  
                  {/* Deployment Status */}
                  {site.is_deployed ? (
                    <Chip 
                      label="Deployed" 
                      color="success" 
                      size="small"
                    />
                  ) : (
                    <Chip 
                      label="Not Deployed" 
                      color="default" 
                      size="small"
                    />
                  )}
                  
                  {/* Features */}
                  {site.supports_page_speed && (
                    <Chip 
                      icon={<SpeedIcon />}
                      label="Fast" 
                      size="small" 
                      variant="outlined"
                    />
                  )}
                  {site.supports_color_customization && (
                    <Chip 
                      icon={<PaletteIcon />}
                      label="Customizable" 
                      size="small" 
                      variant="outlined"
                    />
                  )}
                  
                  {/* Page Count */}
                  {site.page_count !== undefined && (
                    <Chip 
                      label={`${site.page_count} pages`} 
                      size="small" 
                      variant="outlined" 
                    />
                  )}
                </Box>

                <Typography variant="caption" color="text.secondary">
                  {site.created_at ? `Created ${format(new Date(site.created_at), 'MMM dd, yyyy')}` : 'Created date unavailable'}
                </Typography>
                
                {site.deployed_at && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Deployed {format(new Date(site.deployed_at), 'MMM dd, yyyy')}
                  </Typography>
                )}
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<ViewIcon />}
                  onClick={() => navigate(`/sites/${site.id}`)}
                >
                  View
                </Button>
                <Button
                  size="small"
                  startIcon={<DeployIcon />}
                  onClick={() => handleDeploy(site.id)}
                  color={site.is_deployed ? 'success' : 'primary'}
                >
                  {site.is_deployed ? 'Redeploy' : 'Deploy'}
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          navigate(`/sites/${selectedSiteId}`)
          handleMenuClose()
        }}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          navigate(`/sites/${selectedSiteId}/edit`)
          handleMenuClose()
        }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => selectedSiteId && handleDeploy(selectedSiteId)}
        >
          <DeployIcon fontSize="small" sx={{ mr: 1 }} />
          Deploy
        </MenuItem>
        <MenuItem
          onClick={() => selectedSiteId && handleDelete(selectedSiteId)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      <SiteCreationWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSiteCreated={handleSiteCreated}
      />
    </Box>
  )
}

export default SitesListPage
