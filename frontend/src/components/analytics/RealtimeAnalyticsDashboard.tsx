import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Alert,
  AlertTitle,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material'
import {
  People as PeopleIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Computer as ComputerIcon,
  PhoneAndroid as MobileIcon,
  Tablet as TabletIcon,
} from '@mui/icons-material'
import { useGetRealtimeMetricsQuery, useGetLiveVisitorsQuery, useGetRealtimeAlertsQuery } from '@/store/api/analyticsApi'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

interface RealtimeAnalyticsDashboardProps {
  siteId: number
  refreshInterval?: number
}

interface LiveVisitor {
  ip_address: string
  country: string
  city: string
  device_type: string
  browser: string
  os: string
  last_activity: string
  page_count: number
  current_page?: {
    title: string
    url: string
  }
}

interface Alert {
  type: string
  severity: 'low' | 'medium' | 'high'
  message: string
  timestamp: string
}

const RealtimeAnalyticsDashboard: React.FC<RealtimeAnalyticsDashboardProps> = ({
  siteId,
  refreshInterval = 5000
}) => {
  const { t } = useTranslation()
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { data: metrics, refetch: refetchMetrics, isLoading: metricsLoading } = useGetRealtimeMetricsQuery(siteId, {
    pollingInterval: refreshInterval,
    skip: !siteId
  })

  const { data: visitorsData, refetch: refetchVisitors, isLoading: visitorsLoading } = useGetLiveVisitorsQuery(siteId, {
    pollingInterval: refreshInterval,
    skip: !siteId
  })

  const { data: alertsData, refetch: refetchAlerts, isLoading: alertsLoading } = useGetRealtimeAlertsQuery(siteId, {
    pollingInterval: refreshInterval,
    skip: !siteId
  })

  const visitors: LiveVisitor[] = visitorsData?.visitors || []
  const alerts: Alert[] = alertsData?.alerts || []

  useEffect(() => {
    // Initialize WebSocket connection
    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [siteId, connectWebSocket])

  const connectWebSocket = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/ws/analytics/${siteId}/`
      
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        setIsConnected(true)
        toast.success(t('analytics.realtimeConnected'))
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleWebSocketMessage(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      wsRef.current.onclose = () => {
        setIsConnected(false)
        toast.error(t('analytics.realtimeDisconnected'))
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket()
        }, 5000)
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setIsConnected(false)
      }

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error)
      setIsConnected(false)
    }
  }, [siteId, handleWebSocketMessage, t])

  const handleWebSocketMessage = useCallback((data: { type: string; payload?: unknown }) => {
    switch (data.type) {
      case 'realtime_update':
        setLastUpdate(new Date())
        // Refresh data when real-time update is received
        refetchMetrics()
        refetchVisitors()
        refetchAlerts()
        break
      case 'alert':
        // @ts-expect-error dynamic payload shape from server
        toast.error(t('analytics.analyticsAlert', { message: data.data.message }))
        break
      case 'initial_data':
        setLastUpdate(new Date())
        break
      default:
        console.log('Unknown WebSocket message type:', data.type)
    }
  }, [refetchMetrics, refetchVisitors, refetchAlerts, t])

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return <MobileIcon />
      case 'tablet':
        return <TabletIcon />
      case 'desktop':
      default:
        return <ComputerIcon />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'error'
      case 'medium':
        return 'warning'
      case 'low':
        return 'info'
      default:
        return 'default'
    }
  }

  const handleRefresh = () => {
    refetchMetrics()
    refetchVisitors()
    refetchAlerts()
    setLastUpdate(new Date())
    toast.success(t('analytics.dataRefreshed'))
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          {t('analytics.title')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={isConnected ? <WifiIcon /> : <WifiOffIcon />}
            label={isConnected ? t('common.connected') : t('common.disconnected')}
            color={isConnected ? 'success' : 'error'}
            variant="outlined"
          />
          <Tooltip title={t('common.refreshData') as string}>
            <IconButton onClick={handleRefresh} disabled={metricsLoading || visitorsLoading || alertsLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Real-time Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">{t('analytics.onlineUsers')}</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {metrics?.online_users || 0}
              </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('analytics.last5minutes')}
                </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <VisibilityIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">{t('analytics.hourlyViews')}</Typography>
              </Box>
              <Typography variant="h4" color="secondary">
                {metrics?.hourly_views || 0}
              </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('analytics.lastHour')}
                </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">{t('analytics.liveVisitors')}</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {visitors.length}
              </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('analytics.currentlyActive')}
                </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WarningIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">{t('analytics.activeAlerts')}</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {alerts.length}
              </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('analytics.realtimeAlerts')}
                </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Live Visitors */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('analytics.liveVisitors')}
              </Typography>
              {visitorsLoading ? (
                <LinearProgress />
              ) : visitors.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  {t('analytics.noActiveVisitors')}
                </Typography>
              ) : (
                <List dense>
                  {visitors.slice(0, 10).map((visitor, index) => (
                    <ListItem key={`${visitor.ip_address}-${index}`} divider>
                      <ListItemIcon>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {getDeviceIcon(visitor.device_type)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {visitor.ip_address}
                            </Typography>
                            <Chip label={visitor.device_type} size="small" variant="outlined" />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {visitor.country && visitor.city 
                                ? `${visitor.city}, ${visitor.country}` 
                                : visitor.country || t('analytics.unknownLocation')
                              }
                            </Typography>
                            <Typography variant="caption" display="block">
                              {visitor.browser} {t('analytics.onOs', { os: visitor.os })} • {visitor.page_count} {t('analytics.pages')}
                            </Typography>
                            {visitor.current_page && (
                              <Typography variant="caption" display="block" color="primary">
                                {t('analytics.currentlyViewing')}: {visitor.current_page.title}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Real-time Alerts */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('analytics.realtimeAlerts')}
              </Typography>
              {alertsLoading ? (
                <LinearProgress />
              ) : alerts.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  {t('analytics.noActiveAlerts')}
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                  {alerts.map((alert, index) => (
                    <Alert
                      key={index}
                      severity={getSeverityColor(alert.severity) as 'error' | 'warning' | 'info' | 'success'}
                      sx={{ mb: 1 }}
                    >
                      <AlertTitle>{alert.type.replace('_', ' ').toUpperCase()}</AlertTitle>
                      {alert.message}
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Alert>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Pages (Real-time) */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('analytics.topPagesLastHour')}
              </Typography>
              {metricsLoading ? (
                <LinearProgress />
              ) : metrics?.top_pages?.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  {t('analytics.noPageViewsLastHour')}
                </Typography>
              ) : (
                <List dense>
                  {metrics?.top_pages?.map((page: { title: string; views: number }, index: number) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={page.page__title || t('analytics.unknownPage')}
                        secondary={`${page.views} ${t('analytics.views')}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Last Update Info */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {t('analytics.lastUpdated')}: {lastUpdate.toLocaleTimeString()}
        </Typography>
      </Box>
    </Box>
  )
}

export default RealtimeAnalyticsDashboard
