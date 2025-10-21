import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material'
import {
  Edit as EditIcon,
  Rocket as DeployIcon,
  Delete as DeleteIcon,
  Palette as PaletteIcon,
  Speed as SpeedIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { useGetSiteQuery, useDeleteSiteMutation } from '@/store/api/sitesApi'
import { useCreateDeploymentMutation } from '@/store/api/deploymentsApi' // Add this import
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const SiteDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: site, isLoading } = useGetSiteQuery(Number(id))
  const [deleteSite] = useDeleteSiteMutation()
  const [createDeployment, { isLoading: isDeploying }] = useCreateDeploymentMutation() // Add this

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this site? This action cannot be undone.')) {
      try {
        await deleteSite(Number(id)).unwrap()
        toast.success('Site deleted successfully')
        navigate('/sites')
      } catch {
        toast.error('Failed to delete site');
      }
    }
  }

  const handleDeploy = async () => {
    try {
      // Create new deployment for this site
      await createDeployment({ site: Number(id) }).unwrap();
      toast.success('Deployment started! Check deployments page for status.');
      // Optionally navigate to deployments page
      // navigate('/deployments')
    } catch (error) {
      const apiError = error as { data?: { message?: string } };
      toast.error(apiError.data?.message || 'Failed to start deployment');
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!site) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography>Site not found</Typography>
        <Button onClick={() => navigate('/sites')} sx={{ mt: 2 }}>
          Back to Sites
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            {site.brand_name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {site.domain}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/sites/${id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            startIcon={<DeployIcon />}
            onClick={handleDeploy}
            disabled={isDeploying}
            color={site.is_deployed ? 'success' : 'primary'}
          >
            {isDeploying ? <CircularProgress size={20} color="inherit" /> : site.is_deployed ? 'Redeploy' : 'Deploy'}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Box>
      </Box>

      {/* Two Column Layout using CSS Grid */}
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
        {/* Template Information */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Template Configuration
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Template
              </Typography>
              <Typography variant="body1">
                {site.template_name || 'Unknown Template'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Type
              </Typography>
              <Chip 
                label={site.template_type_display || site.template_type} 
                size="small" 
                color="primary"
              />
            </Box>

            {site.footprint_details && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Footprint
                </Typography>
                <Typography variant="body1">
                  {site.footprint_details.name}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              {site.supports_color_customization && (
                <Chip
                  icon={<PaletteIcon />}
                  label="Color Customization"
                  size="small"
                  variant="outlined"
                />
              )}
              {site.supports_page_speed && (
                <Chip
                  icon={<SpeedIcon />}
                  label="Page Speed Optimized"
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        </Paper>

        {/* Site Settings */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Settings
          </Typography>

          <List dense>
            <ListItem>
              <ListItemText 
                primary="Search Engine Indexing" 
                secondary={site.allow_indexing ? 'Allowed' : 'Blocked'}
              />
              {site.allow_indexing ? <CheckIcon color="success" /> : <CloseIcon color="error" />}
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="404 Redirect" 
                secondary={site.redirect_404_to_home ? 'To Homepage' : 'Show 404 Page'}
              />
              {site.redirect_404_to_home ? <CheckIcon color="success" /> : <CloseIcon />}
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="WWW Version" 
                secondary={site.use_www_version ? 'www.domain.com' : 'domain.com'}
              />
              {site.use_www_version ? <CheckIcon color="success" /> : <CloseIcon />}
            </ListItem>
            {site.enable_page_speed && (
              <ListItem>
                <ListItemText 
                  primary="Page Speed Optimization" 
                  secondary="Enabled"
                />
                <SpeedIcon color="success" />
              </ListItem>
            )}
          </List>
        </Paper>
      </Box>

      {/* Custom Colors */}
      {site.custom_colors && Object.keys(site.custom_colors).length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            <PaletteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Custom Colors
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {Object.entries(site.custom_colors).map(([key, value]) => (
              <Box key={key} sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    backgroundColor: value,
                    borderRadius: 1,
                    border: '2px solid',
                    borderColor: 'divider',
                    mb: 1,
                  }}
                />
                <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                  {key}
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Affiliate Link */}
      {site.affiliate_link_name && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Affiliate Link
          </Typography>
          <Typography variant="body1">
            {site.affiliate_link_name}
          </Typography>
        </Paper>
      )}

      {/* Deployment Status */}
      {site.deployed_at && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Deployment Status
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={site.is_deployed ? 'Deployed' : 'Not Deployed'}
                color={site.is_deployed ? 'success' : 'default'}
                size="small"
              />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Last Deployed
              </Typography>
              <Typography variant="body1">
                {format(new Date(site.deployed_at), 'PPpp')}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Metadata */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Information
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              Owner
            </Typography>
            <Typography variant="body1">
              {site.user_username}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              Created
            </Typography>
            <Typography variant="body1">
              {format(new Date(site.created_at), 'PPpp')}
            </Typography>
          </Box>

          {site.deployed_at && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Last Deployed
              </Typography>
              <Typography variant="body1">
                {format(new Date(site.deployed_at), 'PPpp')}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Placeholder Sections in Two Columns */}
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
        {/* Pages */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Pages
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {site.page_count || 0} pages
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate(`/pages?site=${site.id}`)}
          >
            Manage Pages
          </Button>
        </Paper>

        {/* Analytics */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Analytics
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            View site analytics and performance metrics
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate(`/analytics?site=${site.id}`)}
          >
            View Analytics
          </Button>
        </Paper>
      </Box>
    </Box>
  )
}

export default SiteDetailPage
