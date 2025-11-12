import { 
  Paper, 
  Typography, 
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Skeleton,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  CircularProgress,
} from '@mui/material'
import { 
  Language as SitesIcon,
  Article as PagesIcon,
  CloudUpload as DeployIcon,
  TrendingUp as AnalyticsIcon,
  Add as AddIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  Build as BuildingIcon,
  CloudUpload,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  Analytics as AnalyticsIcon2,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useGetSitesQuery, useGetSiteAnalyticsSummaryQuery, useDuplicateSiteMutation } from '@/store/api/sitesApi'
import { useGetPagesQuery } from '@/store/api/pagesApi'
import { useGetDeploymentsQuery } from '@/store/api/deploymentsApi'
import { useGetAnalyticsOverviewQuery, useGetTopPagesQuery } from '@/store/api/analyticsApi'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
)

interface StatCardProps {
  title: string
  value: string | number
  icon:  React.ReactElement
  color: string
  loading?: boolean
}

const StatCard = ({ title, value, icon, color, loading }: StatCardProps) => (
  <Card 
    sx={{ 
      height: '100%',
      background: '#ffffff',
      borderRadius: 3,
      border: '1px solid rgba(0, 0, 0, 0.06)',
      transition: 'all 0.3s ease-in-out',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
      }
    }}
  >
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Typography 
            color="textSecondary" 
            variant="body2"
            sx={{ 
              fontWeight: 500,
              fontSize: '0.875rem',
              mb: 1
            }}
          >
            {title}
          </Typography>
          {loading ? (
            <Skeleton width={80} height={48} />
          ) : (
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                color: '#1a2027',
                fontSize: '2rem'
              }}
            >
              {value}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
            borderRadius: 2.5,
            p: 1.75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 12px ${color}40`,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
)

const DashboardPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  // Fetch data from API
  const { data: sites = [], isLoading: sitesLoading } = useGetSitesQuery()
  const { data: pages = [], isLoading: pagesLoading } = useGetPagesQuery({})
  const { data: deployments = [], isLoading: deploymentsLoading } = useGetDeploymentsQuery({})
  const { data: analyticsSummary, isLoading: analyticsLoading } = useGetSiteAnalyticsSummaryQuery({ 
    id: sites[0]?.id || 0 
  }, { skip: !sites.length })
  
  // Analytics data for first site
  const firstSiteId = sites[0]?.id
  const { data: analyticsOverview, isLoading: analyticsOverviewLoading } = useGetAnalyticsOverviewQuery(
    { site_id: firstSiteId || 0, period_days: 30 },
    { skip: !firstSiteId }
  )
  const { data: topPages, isLoading: topPagesLoading } = useGetTopPagesQuery(
    { site_id: firstSiteId || 0, period_days: 30, limit: 5 },
    { skip: !firstSiteId }
  )
  
  const [duplicateSite] = useDuplicateSiteMutation()
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState('')
  const [languageFilter, setLanguageFilter] = useState<string>('')
  const [templateFilter, setTemplateFilter] = useState<number | ''>('')
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null)

  // Calculate stats
  const totalSites = sites.length
  const totalPages = pages.length
  const totalDeployments = deployments.length
  const totalVisitors = analyticsSummary?.total_visitors || 0
  
  // Get unique languages and templates for filters
  const uniqueLanguages = [...new Set(sites.map(s => s.language_code))].sort()
  const uniqueTemplates = [...new Set(sites.map(s => s.template).filter(Boolean))] as number[]
  
  // Filter sites
  const filteredSites = sites.filter(site => {
    const matchesSearch = 
      site.brand_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.domain.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLanguage = !languageFilter || site.language_code === languageFilter
    const matchesTemplate = !templateFilter || site.template === templateFilter
    return matchesSearch && matchesLanguage && matchesTemplate
  })
  
  // Get recent deployments (last 5)
  const recentDeployments = [...deployments]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, siteId: number) => {
    setAnchorEl(event.currentTarget)
    setSelectedSiteId(siteId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedSiteId(null)
  }
  
  const handleDuplicate = async (siteId: number) => {
    handleMenuClose()
    const site = sites.find(s => s.id === siteId)
    if (!site) return
    
    const newDomain = prompt(t('dashboard.enterNewDomain'))
    if (!newDomain) return
    
    try {
      await duplicateSite({ id: siteId, domain: newDomain }).unwrap()
      toast.success(t('dashboard.siteDuplicated'))
    } catch {
      toast.error(t('dashboard.duplicateFailed'))
    }
  }

  // Get deployment status icon and color
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'deployed':
        return <SuccessIcon sx={{ fontSize: 20, color: '#4CAF50' }} />
      case 'failed':
        return <ErrorIcon sx={{ fontSize: 20, color: '#f44336' }} />
      case 'building':
        return <BuildingIcon sx={{ fontSize: 20, color: '#2196F3' }} />
      case 'pending':
        return <PendingIcon sx={{ fontSize: 20, color: '#FF9800' }} />
      default:
        return <PendingIcon sx={{ fontSize: 20, color: '#9E9E9E' }} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'deployed':
        return 'success'
      case 'failed':
        return 'error'
      case 'building':
        return 'info'
      case 'pending':
        return 'warning'
      default:
        return 'default'
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
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
          {t('dashboard.title')}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#5a6872',
            fontSize: '0.875rem'
          }}
        >
          {t('dashboard.welcomeBack')}
        </Typography>
      </Box>

      {/* Stats Grid - Using CSS Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 3,
          mb: 4,
        }}
      >
        <StatCard
          title={t('dashboard.totalSites')}
          value={totalSites}
          icon={<SitesIcon sx={{ color: '#fff', fontSize: 32 }} />}
          color="#2196F3"
          loading={sitesLoading}
        />
        <StatCard
          title={t('dashboard.totalPages')}
          value={totalPages}
          icon={<PagesIcon sx={{ color: '#fff', fontSize: 32 }} />}
          color="#4CAF50"
          loading={pagesLoading}
        />
        <StatCard
          title={t('dashboard.deployments')}
          value={totalDeployments}
          icon={<DeployIcon sx={{ color: '#fff', fontSize: 32 }} />}
          color="#FF9800"
          loading={deploymentsLoading}
        />
        <StatCard
          title={t('dashboard.totalVisitors')}
          value={formatNumber(totalVisitors)}
          icon={<AnalyticsIcon sx={{ color: '#fff', fontSize: 32 }} />}
          color="#9C27B0"
          loading={analyticsLoading}
        />
      </Box>

      {/* Sites List */}
      <Paper 
        sx={{ 
          p: 3,
          mb: 3,
          borderRadius: 3,
          border: '1px solid rgba(0, 0, 0, 0.06)',
          background: '#ffffff'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('dashboard.sites')} ({filteredSites.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/sites/create')}
          >
            {t('dashboard.createSite')}
          </Button>
        </Box>
        
        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            placeholder={t('dashboard.searchSites')}
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('dashboard.language')}</InputLabel>
            <Select
              value={languageFilter}
              label={t('dashboard.language')}
              onChange={(e) => setLanguageFilter(e.target.value)}
            >
              <MenuItem value="">{t('dashboard.allLanguages')}</MenuItem>
              {uniqueLanguages.map(lang => (
                <MenuItem key={lang} value={lang}>{lang}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('dashboard.template')}</InputLabel>
            <Select
              value={templateFilter}
              label={t('dashboard.template')}
              onChange={(e) => setTemplateFilter(e.target.value as number | '')}
            >
              <MenuItem value="">{t('dashboard.allTemplates')}</MenuItem>
              {uniqueTemplates.map(templateId => {
                const site = sites.find(s => s.template === templateId)
                return site?.template_name ? (
                  <MenuItem key={templateId} value={templateId}>{site.template_name}</MenuItem>
                ) : null
              })}
            </Select>
          </FormControl>
          {(searchQuery || languageFilter || templateFilter) && (
            <Button
              size="small"
              onClick={() => {
                setSearchQuery('')
                setLanguageFilter('')
                setTemplateFilter('')
              }}
            >
              Clear Filters
            </Button>
          )}
        </Box>
        
        {/* Sites Table */}
        {filteredSites.length === 0 ? (
          <Alert severity="info">
            {searchQuery || languageFilter || templateFilter 
              ? t('dashboard.noSitesMatch') 
              : t('dashboard.noSitesYet')}
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Domain</TableCell>
                  <TableCell>Brand</TableCell>
                  <TableCell>Language</TableCell>
                  <TableCell>Template</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSites.map((site) => (
                  <TableRow key={site.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {site.domain}
                      </Typography>
                    </TableCell>
                    <TableCell>{site.brand_name}</TableCell>
                    <TableCell>
                      <Chip label={site.language_code} size="small" />
                    </TableCell>
                    <TableCell>
                      {site.template_name || (
                        <Chip label={t('dashboard.noTemplate')} size="small" color="default" />
                      )}
                    </TableCell>
                    <TableCell>
                      {site.is_deployed ? (
                        <Chip label={t('dashboard.deployed')} size="small" color="success" />
                      ) : (
                        <Chip label={t('dashboard.notDeployed')} size="small" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={t('dashboard.edit')}>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/sites/${site.id}/edit`)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('dashboard.duplicate')}>
                        <IconButton
                          size="small"
                          onClick={() => handleDuplicate(site.id)}
                        >
                          <DuplicateIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('dashboard.analytics')}>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/sites/${site.id}?tab=analytics`)}
                        >
                          <AnalyticsIcon2 fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, site.id)}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedSiteId) {
            navigate(`/sites/${selectedSiteId}/edit`)
            handleMenuClose()
          }
        }}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedSiteId) {
            handleDuplicate(selectedSiteId)
          }
        }}>
          <DuplicateIcon sx={{ mr: 1 }} fontSize="small" />
          Duplicate
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedSiteId) {
            navigate(`/sites/${selectedSiteId}?tab=analytics`)
            handleMenuClose()
          }
        }}>
          <AnalyticsIcon2 sx={{ mr: 1 }} fontSize="small" />
          View Analytics
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedSiteId && window.confirm('Delete this site?')) {
            // TODO: Implement delete
            handleMenuClose()
          }
        }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Analytics Section */}
      {firstSiteId && (
        <Paper 
          sx={{ 
            p: 4,
            mb: 3,
            borderRadius: 3,
            border: '1px solid rgba(0, 0, 0, 0.06)',
            background: '#ffffff'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                color: '#1a2027'
              }}
            >
              Analytics Overview
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate(`/analytics?site=${firstSiteId}`)}
            >
              View Full Analytics
            </Button>
          </Box>

          {analyticsOverviewLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : analyticsOverview ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: '2fr 1fr',
                },
                gap: 3,
              }}
            >
              {/* Traffic Chart */}
              <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  Daily Traffic (Last 30 Days)
                </Typography>
                {analyticsOverview.traffic_analytics?.daily_traffic && (
                  <Line
                    data={{
                      labels: analyticsOverview.traffic_analytics.daily_traffic.map(d => 
                        new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      ),
                      datasets: [
                        {
                          label: t('dashboard.pageViews'),
                          data: analyticsOverview.traffic_analytics.daily_traffic.map(d => d.views),
                          borderColor: '#2196F3',
                          backgroundColor: 'rgba(33, 150, 243, 0.1)',
                          tension: 0.4,
                        },
                        {
                          label: t('dashboard.uniqueVisitors'),
                          data: analyticsOverview.traffic_analytics.daily_traffic.map(d => d.unique_visitors),
                          borderColor: '#4CAF50',
                          backgroundColor: 'rgba(76, 175, 80, 0.1)',
                          tension: 0.4,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                )}
              </Paper>

              {/* Top Pages */}
              <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  Top Pages
                </Typography>
                {topPagesLoading ? (
                  <CircularProgress size={24} />
                ) : topPages?.top_pages && topPages.top_pages.length > 0 ? (
                  <List sx={{ p: 0 }}>
                    {topPages.top_pages.map((page, index) => (
                      <ListItem
                        key={index}
                        sx={{
                          border: '1px solid rgba(0, 0, 0, 0.06)',
                          borderRadius: 1,
                          mb: 1,
                          bgcolor: 'white',
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {page.page__title || page.page__slug || t('pageBuilder.untitled')}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                /{page.page__slug}
                              </Typography>
                              <Chip
                                label={`${page.views} ${t('dashboard.views')}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No page views yet
                  </Typography>
                )}
              </Paper>
            </Box>
          ) : (
            <Alert severity="info">
              No analytics data available. Analytics will appear after your site receives traffic.
            </Alert>
          )}
        </Paper>
      )}

      {/* Content Grid - Using CSS Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: '2fr 1fr',
          },
          gap: 3,
        }}
      >
        {/* Recent Activity */}
        <Paper 
          sx={{ 
            p: 4,
            minHeight: 400,
            borderRadius: 3,
            border: '1px solid rgba(0, 0, 0, 0.06)',
            background: '#ffffff'
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 3,
              fontWeight: 600,
              color: '#1a2027'
            }}
          >
            Recent Deployments
          </Typography>
          
          {deploymentsLoading ? (
            <Box>
              {[1, 2, 3, 4, 5].map((i) => (
                <Box key={i} sx={{ mb: 2 }}>
                  <Skeleton width="100%" height={60} />
                </Box>
              ))}
            </Box>
          ) : recentDeployments.length === 0 ? (
            <Alert severity="info">
              No deployments yet. Create a site and deploy it to see activity here.
            </Alert>
          ) : (
            <List sx={{ p: 0 }}>
              {recentDeployments.map((deployment) => (
                <ListItem
                  key={deployment.id}
                  sx={{
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: 2,
                    mb: 2,
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.02)',
                      cursor: 'pointer',
                    },
                  }}
                  onClick={() => navigate('/deployments')}
                >
                  <ListItemIcon>
                    {getStatusIcon(deployment.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {deployment.site_domain || deployment.site_brand_name}
                        </Typography>
                        <Chip 
                          label={deployment.status} 
                          size="small" 
                          color={getStatusColor(deployment.status) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="textSecondary">
                        {formatDistanceToNow(new Date(deployment.created_at), { addSuffix: true })}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

        {/* Quick Actions */}
        <Paper 
          sx={{ 
            p: 4,
            minHeight: 400,
            borderRadius: 3,
            border: '1px solid rgba(0, 0, 0, 0.06)',
            background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
            color: '#ffffff'
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 3,
              fontWeight: 600,
              color: '#ffffff'
            }}
          >
            {t('dashboard.quickActions')}
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => navigate('/pages/create')}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                },
                fontWeight: 600,
                py: 1.5,
              }}
            >
              {t('dashboard.createNewPage')}
            </Button>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => navigate('/templates/create')}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                },
                fontWeight: 600,
                py: 1.5,
              }}
            >
              {t('dashboard.createTemplate')}
            </Button>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<CloudUpload />}
              onClick={() => navigate('/media')}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                },
                fontWeight: 600,
                py: 1.5,
              }}
            >
              {t('dashboard.uploadMedia')}
            </Button>

          </Box>
        </Paper>
      </Box>
    </Box>
  )
}

export default DashboardPage
