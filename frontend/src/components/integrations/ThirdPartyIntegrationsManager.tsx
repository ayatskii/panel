import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material'
import {
  Share as ShareIcon,
  Analytics as AnalyticsIcon,
  Cloud as CloudIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Link as LinkIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Google as GoogleIcon,
  Cloud as CloudflareIcon,
  Mail as MailIcon,
} from '@mui/icons-material'
import {
  useShareToFacebookMutation,
  useShareToTwitterMutation,
  useShareToLinkedInMutation,
  useSendGoogleAnalyticsEventMutation,
  useSendFacebookPixelEventMutation,
  usePurgeCloudflareCacheMutation,
  useSubmitToGoogleSearchConsoleMutation,
  useSendMailchimpCampaignMutation,
  useGetAllIntegrationsStatusQuery,
} from '@/store/api/integrationsApi'
import toast from 'react-hot-toast'

interface ThirdPartyIntegrationsManagerProps {
  pageId?: number
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
      id={`integrations-tabpanel-${index}`}
      aria-labelledby={`integrations-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const ThirdPartyIntegrationsManager = ({ pageId, siteId, siteDomain }: ThirdPartyIntegrationsManagerProps) => {
  const [tabValue, setTabValue] = useState(0)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false)
  const [cdnDialogOpen, setCdnDialogOpen] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [analyticsEvent, setAnalyticsEvent] = useState('')
  const [analyticsCategory, setAnalyticsCategory] = useState('')
  const [analyticsAction, setAnalyticsAction] = useState('')
  const [cdnUrls, setCdnUrls] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailContent, setEmailContent] = useState('')

  const [shareToFacebook, { isLoading: isSharingToFacebook }] = useShareToFacebookMutation()
  const [shareToTwitter, { isLoading: isSharingToTwitter }] = useShareToTwitterMutation()
  const [shareToLinkedIn, { isLoading: isSharingToLinkedIn }] = useShareToLinkedInMutation()
  const [sendGoogleAnalyticsEvent, { isLoading: isSendingGA }] = useSendGoogleAnalyticsEventMutation()
  const [sendFacebookPixelEvent, { isLoading: isSendingFB }] = useSendFacebookPixelEventMutation()
  const [purgeCloudflareCache, { isLoading: isPurgingCache }] = usePurgeCloudflareCacheMutation()
  useSubmitToGoogleSearchConsoleMutation()
  const [sendMailchimpCampaign, { isLoading: isSendingEmail }] = useSendMailchimpCampaignMutation()

  const { data: integrationsStatus, refetch: refetchIntegrationsStatus } = useGetAllIntegrationsStatusQuery(
    { site_id: siteId! },
    { skip: !siteId }
  )

  const handleSocialShare = async (platform: string) => {
    if (!siteId || !pageId || !shareMessage) {
      toast.error('Site ID, Page ID, and message are required')
      return
    }

    try {
      let result
      const shareData = {
        site_id: siteId,
        page_id: pageId,
        message: shareMessage,
        access_token: 'demo_token', // In production, this would come from user's connected accounts
      }

      switch (platform) {
        case 'facebook':
          result = await shareToFacebook(shareData).unwrap()
          break
        case 'twitter':
          result = await shareToTwitter({
            ...shareData,
            access_token_secret: 'demo_secret',
            consumer_key: 'demo_key',
            consumer_secret: 'demo_secret',
          }).unwrap()
          break
        case 'linkedin':
          result = await shareToLinkedIn(shareData).unwrap()
          break
        default:
          throw new Error('Unknown platform')
      }

      if (result.success) {
        toast.success(`Successfully shared to ${platform}!`)
        setShareDialogOpen(false)
        setShareMessage('')
      }
    } catch {
      toast.error(`Failed to share to ${platform}`)
    }
  }

  const handleAnalyticsEvent = async (platform: string) => {
    if (!siteId || !analyticsEvent || !analyticsCategory || !analyticsAction) {
      toast.error('Site ID, event name, category, and action are required')
      return
    }

    try {
      let result
      const eventData = {
        site_id: siteId,
        event_name: analyticsEvent,
        event_category: analyticsCategory,
        event_action: analyticsAction,
        tracking_id: 'demo_tracking_id', // In production, this would come from site settings
      }

      switch (platform) {
        case 'google_analytics':
          result = await sendGoogleAnalyticsEvent(eventData).unwrap()
          break
        case 'facebook_pixel':
          result = await sendFacebookPixelEvent({
            site_id: siteId,
            event_name: analyticsEvent,
            pixel_id: 'demo_pixel_id',
            user_data: {},
          }).unwrap()
          break
        default:
          throw new Error('Unknown platform')
      }

      if (result.success) {
        toast.success(`Successfully sent event to ${platform}!`)
        setAnalyticsDialogOpen(false)
        setAnalyticsEvent('')
        setAnalyticsCategory('')
        setAnalyticsAction('')
      }
    } catch {
      toast.error(`Failed to send event to ${platform}`)
    }
  }

  const handleCdnPurge = async () => {
    if (!siteId) {
      toast.error('Site ID is required')
      return
    }

    try {
      const result = await purgeCloudflareCache({
        site_id: siteId,
        urls: cdnUrls ? cdnUrls.split('\n').filter(url => url.trim()) : undefined,
        zone_id: 'demo_zone_id', // In production, this would come from site settings
        api_token: 'demo_token',
      }).unwrap()

      if (result.success) {
        toast.success('Successfully purged CDN cache!')
        setCdnDialogOpen(false)
        setCdnUrls('')
      }
    } catch {
      toast.error('Failed to purge CDN cache')
    }
  }

  const handleEmailCampaign = async () => {
    if (!siteId || !emailSubject || !emailContent) {
      toast.error('Site ID, subject, and content are required')
      return
    }

    try {
      const result = await sendMailchimpCampaign({
        site_id: siteId,
        campaign_data: {
          list_id: 'demo_list_id',
          subject: emailSubject,
          from_name: siteDomain || 'Demo Site',
          reply_to: `noreply@${siteDomain}`,
        },
        api_key: 'demo_api_key',
      }).unwrap()

      if (result.success) {
        toast.success('Successfully created email campaign!')
        setEmailDialogOpen(false)
        setEmailSubject('')
        setEmailContent('')
      }
    } catch {
      toast.error('Failed to create email campaign')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon color="success" />
      case 'not_connected':
        return <ErrorIcon color="error" />
      case 'unknown':
        return <WarningIcon color="warning" />
      default:
        return <ErrorIcon color="error" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'success'
      case 'not_connected':
        return 'error'
      case 'unknown':
        return 'warning'
      default:
        return 'error'
    }
  }

  const platforms = [
    { id: 'facebook', name: 'Facebook', icon: <FacebookIcon />, color: '#1877F2' },
    { id: 'twitter', name: 'Twitter', icon: <TwitterIcon />, color: '#1DA1F2' },
    { id: 'linkedin', name: 'LinkedIn', icon: <LinkedInIcon />, color: '#0077B5' },
    { id: 'google_analytics', name: 'Google Analytics', icon: <GoogleIcon />, color: '#4285F4' },
    { id: 'facebook_pixel', name: 'Facebook Pixel', icon: <FacebookIcon />, color: '#1877F2' },
    { id: 'cloudflare', name: 'Cloudflare', icon: <CloudflareIcon />, color: '#F38020' },
    { id: 'google_search_console', name: 'Google Search Console', icon: <GoogleIcon />, color: '#4285F4' },
    { id: 'mailchimp', name: 'Mailchimp', icon: <MailIcon />, color: '#FFE01B' },
  ]

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinkIcon color="primary" />
          Third-Party Integrations
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => refetchIntegrationsStatus()}
        >
          Refresh Status
        </Button>
      </Box>

      {/* Integration Status Overview */}
      {integrationsStatus && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {platforms.map((platform) => {
            const status = integrationsStatus.integrations[platform.id]?.status || 'unknown'
            return (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={platform.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Box sx={{ color: platform.color }}>{platform.icon}</Box>
                      <Typography variant="subtitle2">{platform.name}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(status)}
                      <Chip
                        label={status.replace('_', ' ')}
                        color={getStatusColor(status)}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Social Media" />
          <Tab label="Analytics" />
          <Tab label="CDN" />
          <Tab label="Email Marketing" />
        </Tabs>
      </Box>

      {/* Social Media Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Social Media Sharing
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Share your content to social media platforms to increase reach and engagement.
          </Alert>

          <Grid container spacing={2}>
            {['facebook', 'twitter', 'linkedin'].map((platform) => (
              <Box key={platform} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      {platforms.find(p => p.id === platform)?.icon}
                      <Typography variant="h6">
                        {platforms.find(p => p.id === platform)?.name}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<ShareIcon />}
                      onClick={() => {
                        setSelectedPlatform(platform)
                        setShareDialogOpen(true)
                      }}
                    >
                      Share Content
                    </Button>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Grid>
        </Box>
      </TabPanel>

      {/* Analytics Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Analytics Integration
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Send custom events to analytics platforms to track user behavior and conversions.
          </Alert>

          <Grid container spacing={2}>
            {['google_analytics', 'facebook_pixel'].map((platform) => (
              <Box key={platform} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      {platforms.find(p => p.id === platform)?.icon}
                      <Typography variant="h6">
                        {platforms.find(p => p.id === platform)?.name}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<AnalyticsIcon />}
                      onClick={() => {
                        setSelectedPlatform(platform)
                        setAnalyticsDialogOpen(true)
                      }}
                    >
                      Send Event
                    </Button>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Grid>
        </Box>
      </TabPanel>

      {/* CDN Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            CDN Management
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Purge CDN cache to ensure users see the latest version of your content.
          </Alert>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CloudflareIcon sx={{ color: '#F38020' }} />
                <Typography variant="h6">Cloudflare</Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<CloudIcon />}
                onClick={() => setCdnDialogOpen(true)}
              >
                Purge Cache
              </Button>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      {/* Email Marketing Tab */}
      <TabPanel value={tabValue} index={3}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Email Marketing
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Create and send email campaigns to your subscribers.
          </Alert>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <MailIcon sx={{ color: '#FFE01B' }} />
                <Typography variant="h6">Mailchimp</Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<EmailIcon />}
                onClick={() => setEmailDialogOpen(true)}
              >
                Create Campaign
              </Button>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      {/* Social Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share to {platforms.find(p => p.id === selectedPlatform)?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Share Message"
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Write your message here..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => handleSocialShare(selectedPlatform)}
            variant="contained"
            disabled={!shareMessage || (selectedPlatform === 'facebook' ? isSharingToFacebook : selectedPlatform === 'twitter' ? isSharingToTwitter : isSharingToLinkedIn)}
            startIcon={(selectedPlatform === 'facebook' ? isSharingToFacebook : selectedPlatform === 'twitter' ? isSharingToTwitter : isSharingToLinkedIn) ? <CircularProgress size={20} /> : <ShareIcon />}
          >
            {(selectedPlatform === 'facebook' ? isSharingToFacebook : selectedPlatform === 'twitter' ? isSharingToTwitter : isSharingToLinkedIn) ? 'Sharing...' : 'Share'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Analytics Event Dialog */}
      <Dialog open={analyticsDialogOpen} onClose={() => setAnalyticsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Event to {platforms.find(p => p.id === selectedPlatform)?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Event Name"
              value={analyticsEvent}
              onChange={(e) => setAnalyticsEvent(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Event Category"
              value={analyticsCategory}
              onChange={(e) => setAnalyticsCategory(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Event Action"
              value={analyticsAction}
              onChange={(e) => setAnalyticsAction(e.target.value)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalyticsDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => handleAnalyticsEvent(selectedPlatform)}
            variant="contained"
            disabled={!analyticsEvent || !analyticsCategory || !analyticsAction || (selectedPlatform === 'google_analytics' ? isSendingGA : isSendingFB)}
            startIcon={(selectedPlatform === 'google_analytics' ? isSendingGA : isSendingFB) ? <CircularProgress size={20} /> : <AnalyticsIcon />}
          >
            {(selectedPlatform === 'google_analytics' ? isSendingGA : isSendingFB) ? 'Sending...' : 'Send Event'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CDN Purge Dialog */}
      <Dialog open={cdnDialogOpen} onClose={() => setCdnDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Purge Cloudflare Cache</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="URLs to Purge (one per line)"
              value={cdnUrls}
              onChange={(e) => setCdnUrls(e.target.value)}
              fullWidth
              multiline
              rows={4}
              placeholder="Leave empty to purge entire zone"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCdnDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCdnPurge}
            variant="contained"
            disabled={isPurgingCache}
            startIcon={isPurgingCache ? <CircularProgress size={20} /> : <CloudIcon />}
          >
            {isPurgingCache ? 'Purging...' : 'Purge Cache'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Campaign Dialog */}
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Email Campaign</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Content"
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              fullWidth
              multiline
              rows={4}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEmailCampaign}
            variant="contained"
            disabled={!emailSubject || !emailContent || isSendingEmail}
            startIcon={isSendingEmail ? <CircularProgress size={20} /> : <EmailIcon />}
          >
            {isSendingEmail ? 'Creating...' : 'Create Campaign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}

export default ThirdPartyIntegrationsManager
