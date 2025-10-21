import { 
  Paper, 
  Typography, 
  Box,
  Card,
  CardContent
} from '@mui/material'
import { 
  Language as SitesIcon,
  Article as PagesIcon,
  CloudUpload as DeployIcon,
  TrendingUp as AnalyticsIcon
} from '@mui/icons-material'

interface StatCardProps {
  title: string
  value: string | number
  icon:  React.ReactElement
  color: string
}

const StatCard = ({ title, value, icon, color }: StatCardProps) => (
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
  // TODO: Replace with real data from API
  const stats = {
    totalSites: 12,
    totalPages: 48,
    deployments: 24,
    totalVisitors: '1.2K'
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
          value={stats.totalSites}
          icon={<SitesIcon sx={{ color: '#fff', fontSize: 32 }} />}
          color="#2196F3"
        />
        <StatCard
          title="Total Pages"
          value={stats.totalPages}
          icon={<PagesIcon sx={{ color: '#fff', fontSize: 32 }} />}
          color="#4CAF50"
        />
        <StatCard
          title="Deployments"
          value={stats.deployments}
          icon={<DeployIcon sx={{ color: '#fff', fontSize: 32 }} />}
          color="#FF9800"
        />
        <StatCard
          title="Total Visitors"
          value={stats.totalVisitors}
          icon={<AnalyticsIcon sx={{ color: '#fff', fontSize: 32 }} />}
          color="#9C27B0"
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
        <Paper 
          sx={{ 
            p: 4,
            height: 400,
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
            Recent Activity
          </Typography>
          <Typography 
            color="textSecondary"
            sx={{ fontSize: '0.875rem' }}
          >
            Activity feed will be displayed here
          </Typography>
        </Paper>

        <Paper 
          sx={{ 
            p: 4,
            height: 400,
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
          <Typography 
            sx={{ 
              fontSize: '0.875rem',
              opacity: 0.9
            }}
          >
            Quick action buttons will be displayed here
          </Typography>
        </Paper>
      </Box>
    </Box>
  )
}

export default DashboardPage
