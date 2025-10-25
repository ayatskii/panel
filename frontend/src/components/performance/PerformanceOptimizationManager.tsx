import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Divider,
  LinearProgress,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Slider,
} from '@mui/material'
import { Grid } from '@mui/material'
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Cloud as CloudIcon,
  Image as ImageIcon,
  Storage as DatabaseIcon,
  Assessment as AssessmentIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Cached as CachedIcon,
  Compress as CompressIcon,
  NetworkCheck as NetworkCheckIcon,
  Computer as ComputerIcon,
} from '@mui/icons-material'
import {
  useGetCacheStatsQuery,
  useInvalidateCacheMutation,
  useOptimizeDatabaseMutation,
  useOptimizeImagesMutation,
  useCompressImageMutation,
  useGetCdnPerformanceQuery,
  useOptimizeCdnMutation,
  useGetSystemPerformanceQuery,
  useGetRecommendationsQuery,
  useRunPerformanceTestMutation,
} from '@/store/api/performanceApi'
import toast from 'react-hot-toast'

interface PerformanceOptimizationManagerProps {
  siteId?: number
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
      id={`performance-tabpanel-${index}`}
      aria-labelledby={`performance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const PerformanceOptimizationManager = ({ siteId, siteDomain }: PerformanceOptimizationManagerProps) => {
  const [tabValue, setTabValue] = useState(0)
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [cdnDialogOpen, setCdnDialogOpen] = useState(false)
  const [selectedTestType, setSelectedTestType] = useState('full')
  const [compressionQuality, setCompressionQuality] = useState(85)
  const [cdnSettings, setCdnSettings] = useState({
    compression: true,
    minification: true,
    browser_caching: true,
    gzip: true,
  })

  const [invalidateCache, { isLoading: isInvalidatingCache }] = useInvalidateCacheMutation()
  const [optimizeDatabase, { isLoading: isOptimizingDB }] = useOptimizeDatabaseMutation()
  const [optimizeImages, { isLoading: isOptimizingImages }] = useOptimizeImagesMutation()
  const [compressImage, { isLoading: isCompressingImage }] = useCompressImageMutation()
  const [optimizeCdn, { isLoading: isOptimizingCdn }] = useOptimizeCdnMutation()
  const [runPerformanceTest, { isLoading: isRunningTest }] = useRunPerformanceTestMutation()

  const { data: cacheStats, refetch: refetchCacheStats } = useGetCacheStatsQuery()
  const { data: cdnPerformance, refetch: refetchCdnPerformance } = useGetCdnPerformanceQuery(
    { site_id: siteId! },
    { skip: !siteId }
  )
  const { data: systemPerformance, refetch: refetchSystemPerformance } = useGetSystemPerformanceQuery()
  const { data: recommendations, refetch: refetchRecommendations } = useGetRecommendationsQuery(
    { site_id: siteId! },
    { skip: !siteId }
  )

  const handleInvalidateCache = async (pattern: string) => {
    try {
      const result = await invalidateCache({ pattern }).unwrap()

      if (result.success) {
        toast.success(`Invalidated ${result.invalidated_count} cache entries!`)
        refetchCacheStats()
      }
    } catch (error) {
      toast.error('Failed to invalidate cache')
    }
  }

  const handleOptimizeDatabase = async () => {
    if (!siteId) {
      toast.error('Site ID is required')
      return
    }

    try {
      const result = await optimizeDatabase({ site_id: siteId }).unwrap()

      if (result.success) {
        toast.success('Database optimization completed!')
        refetchRecommendations()
      }
    } catch (error) {
      toast.error('Failed to optimize database')
    }
  }

  const handleOptimizeImages = async () => {
    if (!siteId) {
      toast.error('Site ID is required')
      return
    }

    try {
      const result = await optimizeImages({ site_id: siteId }).unwrap()

      if (result.success) {
        toast.success(`Optimized ${result.image_stats.total_images} images!`)
        refetchRecommendations()
      }
    } catch (error) {
      toast.error('Failed to optimize images')
    }
  }

  const handleCompressImage = async (mediaId: number) => {
    try {
      const result = await compressImage({
        media_id: mediaId,
        quality: compressionQuality,
      }).unwrap()

      if (result.success) {
        toast.success(`Compressed image by ${result.compression_ratio}%!`)
      }
    } catch (error) {
      toast.error('Failed to compress image')
    }
  }

  const handleOptimizeCdn = async () => {
    if (!siteId) {
      toast.error('Site ID is required')
      return
    }

    try {
      const result = await optimizeCdn({
        site_id: siteId,
        settings: cdnSettings,
      }).unwrap()

      if (result.success) {
        toast.success('CDN optimization completed!')
        setCdnDialogOpen(false)
        refetchCdnPerformance()
      }
    } catch (error) {
      toast.error('Failed to optimize CDN')
    }
  }

  const handleRunPerformanceTest = async () => {
    if (!siteId) {
      toast.error('Site ID is required')
      return
    }

    try {
      const result = await runPerformanceTest({
        site_id: siteId,
        test_type: selectedTestType,
      }).unwrap()

      if (result.success) {
        toast.success(`Performance test completed! Score: ${result.overall_score}/100`)
        setTestDialogOpen(false)
      }
    } catch (error) {
      toast.error('Failed to run performance test')
    }
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'success'
    if (score >= 70) return 'warning'
    return 'error'
  }

  const getPerformanceIcon = (score: number) => {
    if (score >= 90) return <CheckCircleIcon color="success" />
    if (score >= 70) return <WarningIcon color="warning" />
    return <ErrorIcon color="error" />
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SpeedIcon color="primary" />
          Performance Optimization
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              refetchCacheStats()
              refetchCdnPerformance()
              refetchSystemPerformance()
              refetchRecommendations()
            }}
          >
            Refresh All
          </Button>
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={() => setTestDialogOpen(true)}
          >
            Run Test
          </Button>
        </Box>
      </Box>

      {/* Performance Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CachedIcon color="primary" />
                <Typography variant="subtitle2">Cache Hit Rate</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {cacheStats?.cache_hit_rate?.toFixed(1) || 0}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={cacheStats?.cache_hit_rate || 0}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CloudIcon color="primary" />
                <Typography variant="subtitle2">CDN Performance</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {cdnPerformance?.performance_score || 0}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={cdnPerformance?.performance_score || 0}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ComputerIcon color="primary" />
                <Typography variant="subtitle2">System Health</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {systemPerformance?.system_metrics ? 
                  Math.round(100 - (systemPerformance.system_metrics.cpu_usage_percent + systemPerformance.system_metrics.memory_usage_percent) / 2) : 0}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={systemPerformance?.system_metrics ? 
                  100 - (systemPerformance.system_metrics.cpu_usage_percent + systemPerformance.system_metrics.memory_usage_percent) / 2 : 0}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AssessmentIcon color="primary" />
                <Typography variant="subtitle2">Recommendations</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {recommendations?.high_priority || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                High Priority
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Cache" />
          <Tab label="Database" />
          <Tab label="Images" />
          <Tab label="CDN" />
          <Tab label="System" />
          <Tab label="Recommendations" />
        </Tabs>
      </Box>

      {/* Cache Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Cache Management
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Cache management helps improve performance by storing frequently accessed data in memory.
          </Alert>

          {cacheStats && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Cache Statistics</Typography>
                    <List>
                      <ListItem>
                        <ListItemText
                          primary="Cache Hits"
                          secondary={cacheStats.cache_hits.toLocaleString()}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Cache Misses"
                          secondary={cacheStats.cache_misses.toLocaleString()}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Total Keys"
                          secondary={cacheStats.total_keys.toLocaleString()}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Memory Usage"
                          secondary={`${cacheStats.memory_usage} MB`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Cache Actions</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<CachedIcon />}
                        onClick={() => handleInvalidateCache('*')}
                        disabled={isInvalidatingCache}
                      >
                        {isInvalidatingCache ? 'Invalidating...' : 'Clear All Cache'}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<CachedIcon />}
                        onClick={() => handleInvalidateCache('pages:*')}
                        disabled={isInvalidatingCache}
                      >
                        Clear Pages Cache
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<CachedIcon />}
                        onClick={() => handleInvalidateCache('media:*')}
                        disabled={isInvalidatingCache}
                      >
                        Clear Media Cache
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          )}
        </Box>
      </TabPanel>

      {/* Database Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Database Optimization
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Database optimization improves query performance and reduces server load.
          </Alert>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Database Performance</Typography>
                <Button
                  variant="contained"
                  startIcon={<DatabaseIcon />}
                  onClick={handleOptimizeDatabase}
                  disabled={isOptimizingDB}
                >
                  {isOptimizingDB ? 'Optimizing...' : 'Optimize Database'}
                </Button>
              </Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Database is performing well. Consider adding indexes for frequently queried fields.
              </Alert>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      {/* Images Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Image Optimization
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Image optimization reduces file sizes and improves page load times.
          </Alert>

          <Grid container spacing={2}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Bulk Optimization</Typography>
                  <Button
                    variant="contained"
                    startIcon={<ImageIcon />}
                    onClick={handleOptimizeImages}
                    disabled={isOptimizingImages}
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    {isOptimizingImages ? 'Optimizing...' : 'Optimize All Images'}
                  </Button>
                  <Alert severity="info">
                    This will optimize all images for the site to reduce file sizes.
                  </Alert>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Individual Compression</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography gutterBottom>Compression Quality: {compressionQuality}%</Typography>
                    <Slider
                      value={compressionQuality}
                      onChange={(_, value) => setCompressionQuality(value as number)}
                      min={10}
                      max={100}
                      step={5}
                      marks={[
                        { value: 10, label: '10%' },
                        { value: 50, label: '50%' },
                        { value: 85, label: '85%' },
                        { value: 100, label: '100%' },
                      ]}
                    />
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<CompressIcon />}
                    onClick={() => setImageDialogOpen(true)}
                    fullWidth
                  >
                    Compress Specific Image
                  </Button>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
      </TabPanel>

      {/* CDN Tab */}
      <TabPanel value={tabValue} index={3}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            CDN Management
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            CDN optimization improves content delivery speed and reduces server load.
          </Alert>

          {cdnPerformance && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>CDN Statistics</Typography>
                    <List>
                      <ListItem>
                        <ListItemText
                          primary="Cache Hit Ratio"
                          secondary={`${cdnPerformance.cdn_stats.cache_hit_ratio}%`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Bandwidth Saved"
                          secondary={`${cdnPerformance.cdn_stats.bandwidth_saved_mb} MB`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Requests Served"
                          secondary={cdnPerformance.cdn_stats.requests_served.toLocaleString()}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Average Response Time"
                          secondary={`${cdnPerformance.cdn_stats.average_response_time} ms`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>CDN Settings</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={cdnSettings.compression}
                            onChange={(e) => setCdnSettings({...cdnSettings, compression: e.target.checked})}
                          />
                        }
                        label="Enable Compression"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={cdnSettings.minification}
                            onChange={(e) => setCdnSettings({...cdnSettings, minification: e.target.checked})}
                          />
                        }
                        label="Enable Minification"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={cdnSettings.browser_caching}
                            onChange={(e) => setCdnSettings({...cdnSettings, browser_caching: e.target.checked})}
                          />
                        }
                        label="Enable Browser Caching"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={cdnSettings.gzip}
                            onChange={(e) => setCdnSettings({...cdnSettings, gzip: e.target.checked})}
                          />
                        }
                        label="Enable Gzip"
                      />
                      <Button
                        variant="contained"
                        startIcon={<CloudIcon />}
                        onClick={handleOptimizeCdn}
                        disabled={isOptimizingCdn}
                        fullWidth
                      >
                        {isOptimizingCdn ? 'Optimizing...' : 'Apply CDN Settings'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          )}
        </Box>
      </TabPanel>

      {/* System Tab */}
      <TabPanel value={tabValue} index={4}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            System Performance
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Monitor system resources and performance metrics.
          </Alert>

          {systemPerformance && (
            <Grid container spacing={2}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>CPU & Memory</Typography>
                    <List>
                      <ListItem>
                        <ListItemText
                          primary="CPU Usage"
                          secondary={`${systemPerformance.system_metrics.cpu_usage_percent}%`}
                        />
                        <LinearProgress
                          variant="determinate"
                          value={systemPerformance.system_metrics.cpu_usage_percent}
                          sx={{ width: 100 }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Memory Usage"
                          secondary={`${systemPerformance.system_metrics.memory_usage_percent}%`}
                        />
                        <LinearProgress
                          variant="determinate"
                          value={systemPerformance.system_metrics.memory_usage_percent}
                          sx={{ width: 100 }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Available Memory"
                          secondary={`${systemPerformance.system_metrics.memory_available_gb} GB`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Storage & Network</Typography>
                    <List>
                      <ListItem>
                        <ListItemText
                          primary="Disk Usage"
                          secondary={`${systemPerformance.system_metrics.disk_usage_percent}%`}
                        />
                        <LinearProgress
                          variant="determinate"
                          value={systemPerformance.system_metrics.disk_usage_percent}
                          sx={{ width: 100 }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Free Disk Space"
                          secondary={`${systemPerformance.system_metrics.disk_free_gb} GB`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Network Sent"
                          secondary={`${(systemPerformance.system_metrics.network_bytes_sent / 1024 / 1024).toFixed(2)} MB`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Network Received"
                          secondary={`${(systemPerformance.system_metrics.network_bytes_recv / 1024 / 1024).toFixed(2)} MB`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          )}

          {systemPerformance?.performance_alerts && systemPerformance.performance_alerts.length > 0 && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="error">
                  Performance Alerts
                </Typography>
                {systemPerformance.performance_alerts.map((alert, index) => (
                  <Alert key={index} severity={alert.severity as 'error' | 'warning' | 'info' | 'success'} sx={{ mb: 1 }}>
                    {alert.message}
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}
        </Box>
      </TabPanel>

      {/* Recommendations Tab */}
      <TabPanel value={tabValue} index={5}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Performance Recommendations
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Get personalized recommendations to improve your site's performance.
          </Alert>

          {recommendations && (
            <Box>
              {recommendations.recommendations.map((rec, index) => (
                <Accordion key={index}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      {getPerformanceIcon(rec.priority === 'high' ? 60 : 80)}
                      <Typography variant="h6">{rec.title}</Typography>
                      <Chip
                        label={rec.priority}
                        color={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'success'}
                        size="small"
                        sx={{ ml: 'auto' }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {rec.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Chip
                        icon={<TrendingUpIcon />}
                        label={`Impact: ${rec.impact}`}
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        icon={<SettingsIcon />}
                        label={`Effort: ${rec.effort}`}
                        color="secondary"
                        variant="outlined"
                      />
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </Box>
      </TabPanel>

      {/* Performance Test Dialog */}
      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Run Performance Test</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Test Type</InputLabel>
              <Select
                value={selectedTestType}
                onChange={(e) => setSelectedTestType(e.target.value)}
                label="Test Type"
              >
                <MenuItem value="full">Full Test</MenuItem>
                <MenuItem value="database">Database Only</MenuItem>
                <MenuItem value="cache">Cache Only</MenuItem>
                <MenuItem value="media">Media Only</MenuItem>
              </Select>
            </FormControl>
            <Alert severity="info">
              This will run comprehensive performance tests to identify optimization opportunities.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRunPerformanceTest}
            variant="contained"
            disabled={isRunningTest}
            startIcon={isRunningTest ? <CircularProgress size={20} /> : <PlayIcon />}
          >
            {isRunningTest ? 'Running Test...' : 'Run Test'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Compression Dialog */}
      <Dialog open={imageDialogOpen} onClose={() => setImageDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Compress Image</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Media ID"
              type="number"
              fullWidth
              placeholder="Enter media ID to compress"
              sx={{ mb: 2 }}
            />
            <Typography gutterBottom>Compression Quality: {compressionQuality}%</Typography>
            <Slider
              value={compressionQuality}
              onChange={(_, value) => setCompressionQuality(value as number)}
              min={10}
              max={100}
              step={5}
              marks={[
                { value: 10, label: '10%' },
                { value: 50, label: '50%' },
                { value: 85, label: '85%' },
                { value: 100, label: '100%' },
              ]}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              // In a real implementation, you'd get the media ID from the form
              handleCompressImage(1)
              setImageDialogOpen(false)
            }}
            variant="contained"
            disabled={isCompressingImage}
            startIcon={isCompressingImage ? <CircularProgress size={20} /> : <CompressIcon />}
          >
            {isCompressingImage ? 'Compressing...' : 'Compress Image'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}

export default PerformanceOptimizationManager
