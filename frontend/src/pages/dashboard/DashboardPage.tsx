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
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography color="textSecondary" variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: color,
            borderRadius: '12px',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Dashboard
      </Typography>

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
          mb: 3,
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
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Recent Activity
          </Typography>
          <Typography color="textSecondary">
            Activity feed will be displayed here
          </Typography>
        </Paper>

        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Quick Actions
          </Typography>
          <Typography color="textSecondary">
            Quick action buttons will be displayed here
          </Typography>
        </Paper>
      </Box>
    </Box>
  )
}

export default DashboardPage
