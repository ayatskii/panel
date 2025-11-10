import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  Alert,
  Tabs,
  Tab,
} from '@mui/material'
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
  Tooltip,
  Legend,
} from 'chart.js'
import { formatDate } from '@/utils/formatDate'
import {
  useGetSiteAnalyticsQuery,
  useGetAnalyticsOverviewQuery,
  useGetTopPagesQuery,
  useGetTrafficSummaryQuery,
} from '@/store/api/analyticsApi'
import { useGetSitesQuery } from '@/store/api/sitesApi'
import RealtimeAnalyticsDashboard from '@/components/analytics/RealtimeAnalyticsDashboard'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel = ({ children, value, index }: TabPanelProps) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

const AnalyticsDashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedSiteId = searchParams.get('site')
  const [tabValue, setTabValue] = useState(0)
  const [periodDays, setPeriodDays] = useState(30)

  const { data: sites } = useGetSitesQuery()
  const selectedSite = sites?.find(s => s.id === Number(selectedSiteId)) || sites?.[0]
  const siteId = selectedSite?.id || 0

  const { data: analyticsOverview, isLoading: overviewLoading } = useGetAnalyticsOverviewQuery(
    { site_id: siteId, period_days: periodDays },
    { skip: !siteId }
  )
  const { data: topPages, isLoading: topPagesLoading } = useGetTopPagesQuery(
    { site_id: siteId, period_days: periodDays, limit: 10 },
    { skip: !siteId }
  )
  const { data: trafficSummary, isLoading: trafficLoading } = useGetTrafficSummaryQuery(
    { site_id: siteId, period_days: periodDays },
    { skip: !siteId }
  )

  const handleSiteChange = (siteId: number) => {
    setSearchParams({ site: siteId.toString() })
  }

  const handlePeriodChange = (days: number) => {
    setPeriodDays(days)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Analytics Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Site</InputLabel>
            <Select
              value={siteId}
              label="Site"
              onChange={(e) => handleSiteChange(Number(e.target.value))}
            >
              {sites?.map((site) => (
                <MenuItem key={site.id} value={site.id}>
                  {site.brand_name} ({site.domain})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={periodDays}
              label="Period"
              onChange={(e) => handlePeriodChange(Number(e.target.value))}
            >
              <MenuItem value={7}>Last 7 days</MenuItem>
              <MenuItem value={30}>Last 30 days</MenuItem>
              <MenuItem value={90}>Last 90 days</MenuItem>
              <MenuItem value={365}>Last year</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {!siteId ? (
        <Alert severity="info">Please select a site to view analytics</Alert>
      ) : (
        <>
          {/* Metrics Cards */}
          {overviewLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : analyticsOverview ? (
            <>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" variant="body2" gutterBottom>
                        Total Views
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {analyticsOverview.basic_metrics?.total_views?.toLocaleString() || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" variant="body2" gutterBottom>
                        Unique Visitors
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {analyticsOverview.basic_metrics?.unique_visitors?.toLocaleString() || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" variant="body2" gutterBottom>
                        Total Pages
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {analyticsOverview.basic_metrics?.total_pages || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" variant="body2" gutterBottom>
                        Avg Session Duration
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {analyticsOverview.basic_metrics?.avg_session_duration
                          ? `${Math.round(analyticsOverview.basic_metrics.avg_session_duration)}s`
                          : '0s'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Tabs */}
              <Paper sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                  <Tab label="Traffic" />
                  <Tab label="Top Pages" />
                  <Tab label="Sources" />
                  <Tab label="Devices" />
                  <Tab label="Real-time" />
                </Tabs>
              </Paper>

              {/* Traffic Tab */}
              <TabPanel value={tabValue} index={0}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Daily Traffic
                  </Typography>
                  {analyticsOverview.traffic_analytics?.daily_traffic && (
                    <Line
                      data={{
                        labels: analyticsOverview.traffic_analytics.daily_traffic.map((d) =>
                          new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        ),
                        datasets: [
                          {
                            label: 'Page Views',
                            data: analyticsOverview.traffic_analytics.daily_traffic.map((d) => d.views),
                            borderColor: '#2196F3',
                            backgroundColor: 'rgba(33, 150, 243, 0.1)',
                            tension: 0.4,
                          },
                          {
                            label: 'Unique Visitors',
                            data: analyticsOverview.traffic_analytics.daily_traffic.map((d) => d.unique_visitors),
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

                {/* Hourly Traffic */}
                {analyticsOverview.traffic_analytics?.hourly_traffic && (
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Hourly Traffic Distribution
                    </Typography>
                    <Bar
                      data={{
                        labels: analyticsOverview.traffic_analytics.hourly_traffic.map((h) => `${h.hour}:00`),
                        datasets: [
                          {
                            label: 'Views',
                            data: analyticsOverview.traffic_analytics.hourly_traffic.map((h) => h.views),
                            backgroundColor: '#9C27B0',
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </Paper>
                )}
              </TabPanel>

              {/* Top Pages Tab */}
              <TabPanel value={tabValue} index={1}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Top Pages
                  </Typography>
                  {topPagesLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : topPages?.top_pages && topPages.top_pages.length > 0 ? (
                    <List>
                      {topPages.top_pages.map((page, index) => (
                        <ListItem
                          key={index}
                          sx={{
                            border: '1px solid rgba(0, 0, 0, 0.06)',
                            borderRadius: 1,
                            mb: 1,
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {page.page__title || page.page__slug || 'Untitled'}
                                </Typography>
                                <Chip label={`${page.views} views`} color="primary" variant="outlined" />
                              </Box>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary">
                                /{page.page__slug}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Alert severity="info">No page views yet</Alert>
                  )}
                </Paper>
              </TabPanel>

              {/* Sources Tab */}
              <TabPanel value={tabValue} index={2}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Traffic Sources
                  </Typography>
                  {analyticsOverview.traffic_analytics?.traffic_sources &&
                  analyticsOverview.traffic_analytics.traffic_sources.length > 0 ? (
                    <List>
                      {analyticsOverview.traffic_analytics.traffic_sources.map((source, index) => (
                        <ListItem
                          key={index}
                          sx={{
                            border: '1px solid rgba(0, 0, 0, 0.06)',
                            borderRadius: 1,
                            mb: 1,
                          }}
                        >
                          <ListItemText
                            primary={source.referrer || 'Direct'}
                            secondary={
                              <Chip label={`${source.visits} visits`} size="small" color="secondary" />
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Alert severity="info">No traffic source data available</Alert>
                  )}
                </Paper>
              </TabPanel>

              {/* Devices Tab */}
              <TabPanel value={tabValue} index={3}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Device Types
                  </Typography>
                  {analyticsOverview.user_analytics?.device_types ? (
                    <Box sx={{ maxWidth: 400, mx: 'auto' }}>
                      <Doughnut
                        data={{
                          labels: ['Mobile', 'Desktop', 'Tablet'],
                          datasets: [
                            {
                              data: [
                                analyticsOverview.user_analytics.device_types.mobile || 0,
                                analyticsOverview.user_analytics.device_types.desktop || 0,
                                analyticsOverview.user_analytics.device_types.tablet || 0,
                              ],
                              backgroundColor: ['#2196F3', '#4CAF50', '#FF9800'],
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: true,
                          plugins: {
                            legend: {
                              position: 'bottom' as const,
                            },
                          },
                        }}
                      />
                    </Box>
                  ) : (
                    <Alert severity="info">No device data available</Alert>
                  )}
                </Paper>
              </TabPanel>

              {/* Real-time Tab */}
              <TabPanel value={tabValue} index={4}>
                <RealtimeAnalyticsDashboard siteId={siteId} refreshInterval={5000} />
              </TabPanel>
            </>
          ) : (
            <Alert severity="info">
              No analytics data available. Analytics will appear after your site receives traffic.
            </Alert>
          )}
        </>
      )}
    </Box>
  )
}

export default AnalyticsDashboardPage
