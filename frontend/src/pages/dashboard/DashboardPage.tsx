import { 
  Paper, 
  Typography, 
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Skeleton,
  Alert
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
  CloudUpload
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useGetSitesQuery } from '@/store/api/sitesApi'
import { useGetPagesQuery } from '@/store/api/pagesApi'
import { useGetDeploymentsQuery } from '@/store/api/deploymentsApi'
import { useGetAnalyticsSummaryQuery } from '@/store/api/analyticsApi'
import { formatDistanceToNow } from 'date-fns'

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
  const navigate = useNavigate()
  
  // Fetch data from API
  const { data: sites = [], isLoading: sitesLoading } = useGetSitesQuery()
  const { data: pages = [], isLoading: pagesLoading } = useGetPagesQuery({})
  const { data: deployments = [], isLoading: deploymentsLoading } = useGetDeploymentsQuery({})
  const { data: analyticsSummary, isLoading: analyticsLoading } = useGetAnalyticsSummaryQuery({})

  // Calculate stats
  const totalSites = sites.length
  const totalPages = pages.length
  const totalDeployments = deployments.length
  const totalVisitors = analyticsSummary?.total_visitors || 0
  
  // Get recent deployments (last 5)
  const recentDeployments = [...deployments]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

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
          Dashboard
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#5a6872',
            fontSize: '0.875rem'
          }}
        >
          Welcome back! Here's what's happening with your sites.
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
          title="Total Sites"
          value={totalSites}
          icon={<SitesIcon sx={{ color: '#fff', fontSize: 32 }} />}
          color="#2196F3"
          loading={sitesLoading}
        />
        <StatCard
          title="Total Pages"
          value={totalPages}
          icon={<PagesIcon sx={{ color: '#fff', fontSize: 32 }} />}
          color="#4CAF50"
          loading={pagesLoading}
        />
        <StatCard
          title="Deployments"
          value={totalDeployments}
          icon={<DeployIcon sx={{ color: '#fff', fontSize: 32 }} />}
          color="#FF9800"
          loading={deploymentsLoading}
        />
        <StatCard
          title="Total Visitors"
          value={formatNumber(totalVisitors)}
          icon={<AnalyticsIcon sx={{ color: '#fff', fontSize: 32 }} />}
          color="#9C27B0"
          loading={analyticsLoading}
        />
      </Box>

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
                          color={getStatusColor(deployment.status) as any}
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
            Quick Actions
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => navigate('/sites/create')}
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
              Create New Site
            </Button>
            
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
              Create New Page
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
              Create Template
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
              Upload Media
            </Button>

            <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                Need help getting started?
              </Typography>
              <Button
                size="small"
                variant="text"
                sx={{ 
                  color: '#ffffff', 
                  textDecoration: 'underline',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                View Documentation
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}

export default DashboardPage
