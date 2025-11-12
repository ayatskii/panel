import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import { formatDate } from '@/utils/formatDate'

const SitesListPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
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
    toast.success(t('sites.siteCreated'))
    setWizardOpen(false)
    navigate(`/sites/${siteId}`)
  }

  const handleDelete = async (siteId: number) => {
    if (window.confirm(t('sites.deleteConfirm'))) {
      try {
        await deleteSite(siteId).unwrap()
        toast.success(t('sites.siteDeleted'))
        handleMenuClose()
      } catch {
        toast.error(t('sites.siteDeleteFailed'));
      }
    }
  }

  const handleDeploy = async (siteId: number) => {
    try {
      const result = await deploySite(siteId).unwrap()
      toast.success(result.message)
      handleMenuClose()
    } catch {
      toast.error(t('sites.siteDeployFailed'));
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
          {t('sites.title')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateSite}
        >
          {t('sites.createSite')}
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          placeholder={t('sites.title') + '...'}
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
          <Typography color="textSecondary">
            {t('sites.noSitesFound')}
          </Typography>
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
                      label={t('sites.deployed')} 
                      color="success" 
                      size="small"
                    />
                  ) : (
                    <Chip 
                      label={t('sites.notDeployed')} 
                      color="default" 
                      size="small"
                    />
                  )}
                  
                  {/* Features */}
                  {site.supports_page_speed && (
                    <Chip 
                      icon={<SpeedIcon />}
                      label={t('sites.fast')} 
                      size="small" 
                      variant="outlined"
                    />
                  )}
                  {site.supports_color_customization && (
                    <Chip 
                      icon={<PaletteIcon />}
                      label={t('sites.customizable')} 
                      size="small" 
                      variant="outlined"
                    />
                  )}
                  
                  {/* Page Count */}
                  {site.page_count !== undefined && (
                    <Chip 
                      label={t('sites.pageCount', { count: site.page_count })} 
                      size="small" 
                      variant="outlined" 
                    />
                  )}
                </Box>

                <Typography variant="caption" color="text.secondary">
                  {site.created_at ? t('sites.createdOn', { date: formatDate(site.created_at, 'PPP') }) : t('sites.createdDateUnavailable')}
                </Typography>
                
                {site.deployed_at && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {t('sites.deployedOn', { date: formatDate(site.deployed_at, 'PPP') })}
                  </Typography>
                )}
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<ViewIcon />}
                  onClick={() => navigate(`/sites/${site.id}`)}
                >
                  {t('common.view')}
                </Button>
                <Button
                  size="small"
                  startIcon={<DeployIcon />}
                  onClick={() => handleDeploy(site.id)}
                  color={site.is_deployed ? 'success' : 'primary'}
                >
                  {site.is_deployed ? t('common.redeploy') : t('common.deploy')}
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
          {t('common.view')} {t('sites.details')}
        </MenuItem>
        <MenuItem onClick={() => {
          navigate(`/sites/${selectedSiteId}/edit`)
          handleMenuClose()
        }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          {t('common.edit')}
        </MenuItem>
        <MenuItem
          onClick={() => selectedSiteId && handleDeploy(selectedSiteId)}
        >
          <DeployIcon fontSize="small" sx={{ mr: 1 }} />
          {t('common.deploy')}
        </MenuItem>
        <MenuItem
          onClick={() => selectedSiteId && handleDelete(selectedSiteId)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          {t('common.delete')}
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
