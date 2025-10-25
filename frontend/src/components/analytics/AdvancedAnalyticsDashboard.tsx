import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Visibility as VisibilityIcon,
  People as PeopleIcon,
  Article as ArticleIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Public as PublicIcon,
} from '@mui/icons-material'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  useGetAnalyticsOverviewQuery,
  useGetRealTimeAnalyticsQuery,
  useGetTrafficSummaryQuery,
  useGetPerformanceMetricsQuery,
  useExportAnalyticsMutation,
} from '@/store/api/analyticsApi'
import toast from 'react-hot-toast'

interface AdvancedAnalyticsDashboardProps {
  siteId: number
  siteDomain?: string
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const AdvancedAnalyticsDashboard = ({ siteId, siteDomain }: AdvancedAnalyticsDashboardProps) => {
  const [tabValue, setTabValue] = useState(0)
  const [periodDays, setPeriodDays] = useState(30)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState('json')

  const { data: overviewData, refetch: refetchOverview, isLoading: isLoadingOverview } = useGetAnalyticsOverviewQuery({
    site_id: siteId,
    period_days: periodDays,
  })

  const { data: realTimeData, refetch: refetchRealTime } = useGetRealTimeAnalyticsQuery({
    site_id: siteId,
  })

  const { data: trafficSummary } = useGetTrafficSummaryQuery({
    site_id: siteId,
    period_days: periodDays,
  })

  // const { data: topPages } = useGetTopPagesQuery({
  //   site_id: siteId,
  //   period_days: periodDays,
  //   limit: 10,
  // })

  const { data: performanceMetrics } = useGetPerformanceMetricsQuery({
    site_id: siteId,
    period_days: periodDays,
  })

  const [exportAnalytics, { isLoading: isExporting }] = useExportAnalyticsMutation()

  // Auto-refresh real-time data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchRealTime()
    }, 30000)

    return () => clearInterval(interval)
  }, [refetchRealTime])

  const handleExport = async () => {
    try {
      const result = await exportAnalytics({
        site_id: siteId,
        format: exportFormat,
      }).unwrap()

      if (result.success) {
        // Download the file
        const blob = new Blob([result.data], { 
          type: exportFormat === 'json' ? 'application/json' : 'text/csv' 
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-${siteDomain || siteId}-${new Date().toISOString().split('T')[0]}.${exportFormat}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        toast.success('Analytics data exported successfully!')
        setExportDialogOpen(false)
      }
    } catch {
      toast.error('Failed to export analytics data')
    }
  }

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? <TrendingUpIcon color="success" /> : <TrendingDownIcon color="error" />
  }

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'success' : 'error'
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  if (isLoadingOverview) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!overviewData) {
    return (
      <Alert severity="error">
        Failed to load analytics data. Please try again.
      </Alert>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon color="primary" />
          Advanced Analytics Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={periodDays}
              onChange={(e) => setPeriodDays(Number(e.target.value))}
              label="Period"
            >
              <MenuItem value={7}>Last 7 days</MenuItem>
              <MenuItem value={30}>Last 30 days</MenuItem>
              <MenuItem value={90}>Last 90 days</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetchOverview()}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => setExportDialogOpen(true)}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Real-time Stats */}
      {realTimeData && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PeopleIcon color="primary" />
                  <Typography variant="subtitle2">Active Users</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {realTimeData.active_users}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Last hour
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <VisibilityIcon color="primary" />
                  <Typography variant="subtitle2">Hourly Views</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {realTimeData.hourly_views}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Last hour
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TimelineIcon color="primary" />
                  <Typography variant="subtitle2">Total Views</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {overviewData.basic_metrics.total_views.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {periodDays} days
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PeopleIcon color="primary" />
                  <Typography variant="subtitle2">Unique Visitors</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {overviewData.basic_metrics.unique_visitors.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {periodDays} days
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Growth Indicators */}
      {trafficSummary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2">Views Growth</Typography>
                  {getGrowthIcon(trafficSummary.growth.views_growth)}
                </Box>
                <Typography variant="h6" color={getGrowthColor(trafficSummary.growth.views_growth)}>
                  {trafficSummary.growth.views_growth > 0 ? '+' : ''}{trafficSummary.growth.views_growth.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  vs previous {periodDays} days
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2">Visitors Growth</Typography>
                  {getGrowthIcon(trafficSummary.growth.visitors_growth)}
                </Box>
                <Typography variant="h6" color={getGrowthColor(trafficSummary.growth.visitors_growth)}>
                  {trafficSummary.growth.visitors_growth > 0 ? '+' : ''}{trafficSummary.growth.visitors_growth.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  vs previous {periodDays} days
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Traffic" />
          <Tab label="Content" />
          <Tab label="Performance" />
          <Tab label="SEO" />
        </Tabs>
      </Box>

      {/* Traffic Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Daily Traffic Chart */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Daily Traffic
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={overviewData.traffic_analytics.daily_traffic}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="views" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="unique_visitors" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Pages */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Pages
                </Typography>
                <List dense>
                  {overviewData.traffic_analytics.top_pages.slice(0, 5).map((page, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <ArticleIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={page.page__title || 'Untitled'}
                        secondary={`${page.views} views`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Device Types */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Device Types
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Desktop', value: overviewData.user_analytics.device_types.desktop },
                        { name: 'Mobile', value: overviewData.user_analytics.device_types.mobile },
                        { name: 'Tablet', value: overviewData.user_analytics.device_types.tablet },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1, 2].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Geographic Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Geographic Distribution
                </Typography>
                <List dense>
                  {overviewData.user_analytics.geographic_distribution.slice(0, 5).map((geo, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <PublicIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={geo.country}
                        secondary={`${geo.visits} visits (${geo.percentage.toFixed(1)}%)`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Content Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {/* Most Viewed Content */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Most Viewed Content
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={overviewData.content_analytics.most_viewed.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="page__title" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="views" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Content Metrics */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Content Metrics
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Pages
                  </Typography>
                  <Typography variant="h6">
                    {overviewData.basic_metrics.total_pages}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Published Pages
                  </Typography>
                  <Typography variant="h6">
                    {overviewData.basic_metrics.published_pages}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={overviewData.basic_metrics.publish_percentage}
                    sx={{ mt: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {overviewData.basic_metrics.publish_percentage.toFixed(1)}% published
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Media Files
                  </Typography>
                  <Typography variant="h6">
                    {overviewData.basic_metrics.total_media}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Engagement Score
                  </Typography>
                  <Typography variant="h6">
                    {overviewData.content_analytics.engagement_metrics.engagement_score.toFixed(1)}/100
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Performance Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          {/* Performance Metrics */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Metrics
                </Typography>
                {performanceMetrics && (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Average Load Time
                      </Typography>
                      <Typography variant="h6">
                        {performanceMetrics.performance_metrics.load_times.avg_load_time?.toFixed(2) || 'N/A'}s
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Bounce Rate
                      </Typography>
                      <Typography variant="h6">
                        {performanceMetrics.performance_metrics.bounce_rate.toFixed(1)}%
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Sessions
                      </Typography>
                      <Typography variant="h6">
                        {performanceMetrics.performance_metrics.total_sessions.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* SEO Metrics */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  SEO Completeness
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Pages with Titles
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={overviewData.seo_metrics.seo_completeness.title_percentage}
                    sx={{ mt: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {overviewData.seo_metrics.seo_completeness.title_percentage.toFixed(1)}%
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Pages with Meta Descriptions
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={overviewData.seo_metrics.seo_completeness.meta_percentage}
                    sx={{ mt: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {overviewData.seo_metrics.seo_completeness.meta_percentage.toFixed(1)}%
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Pages with H1 Tags
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={overviewData.seo_metrics.seo_completeness.h1_percentage}
                    sx={{ mt: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {overviewData.seo_metrics.seo_completeness.h1_percentage.toFixed(1)}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* SEO Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          {/* SEO Overview */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  SEO Overview
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {overviewData.seo_metrics.seo_completeness.pages_with_title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pages with Titles
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {overviewData.seo_metrics.seo_completeness.pages_with_meta_description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pages with Meta Descriptions
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {overviewData.seo_metrics.seo_completeness.pages_with_h1}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pages with H1 Tags
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {overviewData.seo_metrics.seo_completeness.pages_with_keywords}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pages with Keywords
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Content Analysis */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Content Analysis
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Average Word Count
                  </Typography>
                  <Typography variant="h6">
                    {overviewData.seo_metrics.content_analysis.avg_word_count.toFixed(0)}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Pages with Images
                  </Typography>
                  <Typography variant="h6">
                    {overviewData.seo_metrics.content_analysis.pages_with_images}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Pages with FAQ
                  </Typography>
                  <Typography variant="h6">
                    {overviewData.seo_metrics.content_analysis.pages_with_faq}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>Export Analytics Data</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Format</InputLabel>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              label="Format"
            >
              <MenuItem value="json">JSON</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={isExporting}
            startIcon={isExporting ? <CircularProgress size={20} /> : <DownloadIcon />}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AdvancedAnalyticsDashboard
