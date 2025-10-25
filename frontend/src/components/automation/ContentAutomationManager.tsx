import { useState, useEffect } from 'react'
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Divider,
  LinearProgress,
} from '@mui/material'
import {
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  PlayArrow as PlayIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  AutoAwesome as AutoAwesomeIcon,
  Template as TemplateIcon,
  Workflow as WorkflowIcon,
} from '@mui/icons-material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import {
  useSchedulePagePublicationMutation,
  useCancelScheduledPublicationMutation,
  useGetScheduledPagesQuery,
  useProcessScheduledPublicationsMutation,
  useCreateContentTemplateMutation,
  useApplyContentTemplateMutation,
  useBulkUpdatePagesMutation,
  useCreateAutomatedWorkflowMutation,
  useGetAutomationAnalyticsQuery,
} from '@/store/api/pagesApi'
import toast from 'react-hot-toast'

interface ContentAutomationManagerProps {
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
      id={`automation-tabpanel-${index}`}
      aria-labelledby={`automation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const ContentAutomationManager = ({ pageId, siteId, siteDomain }: ContentAutomationManagerProps) => {
  const [tabValue, setTabValue] = useState(0)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false)
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false)
  const [selectedPages, setSelectedPages] = useState<number[]>([])
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [workflowName, setWorkflowName] = useState('')
  const [workflowDescription, setWorkflowDescription] = useState('')

  const [schedulePagePublication, { isLoading: isScheduling }] = useSchedulePagePublicationMutation()
  const [cancelScheduledPublication, { isLoading: isCancelling }] = useCancelScheduledPublicationMutation()
  const [processScheduledPublications, { isLoading: isProcessing }] = useProcessScheduledPublicationsMutation()
  const [createContentTemplate, { isLoading: isCreatingTemplate }] = useCreateContentTemplateMutation()
  const [applyContentTemplate, { isLoading: isApplyingTemplate }] = useApplyContentTemplateMutation()
  const [bulkUpdatePages, { isLoading: isBulkUpdating }] = useBulkUpdatePagesMutation()
  const [createAutomatedWorkflow, { isLoading: isCreatingWorkflow }] = useCreateAutomatedWorkflowMutation()

  const { data: scheduledPagesData, refetch: refetchScheduledPages } = useGetScheduledPagesQuery({
    site_id: siteId,
    status: 'scheduled',
  })

  const { data: automationAnalytics } = useGetAutomationAnalyticsQuery({
    site_id: siteId,
    period_days: 30,
  })

  const handleSchedulePublication = async () => {
    if (!pageId || !scheduledDate) {
      toast.error('Page ID and scheduled date are required')
      return
    }

    try {
      const result = await schedulePagePublication({
        pageId,
        scheduled_date: scheduledDate.toISOString(),
      }).unwrap()

      if (result.success) {
        toast.success('Page scheduled for publication!')
        setScheduleDialogOpen(false)
        setScheduledDate(null)
        refetchScheduledPages()
      }
    } catch (error) {
      toast.error('Failed to schedule page publication')
    }
  }

  const handleCancelScheduledPublication = async (pageId: number) => {
    try {
      const result = await cancelScheduledPublication({ pageId }).unwrap()

      if (result.success) {
        toast.success('Scheduled publication cancelled!')
        refetchScheduledPages()
      }
    } catch (error) {
      toast.error('Failed to cancel scheduled publication')
    }
  }

  const handleProcessScheduledPublications = async () => {
    try {
      const result = await processScheduledPublications().unwrap()

      if (result.success) {
        toast.success(`Processed ${result.processed_count} scheduled publications!`)
        refetchScheduledPages()
      }
    } catch (error) {
      toast.error('Failed to process scheduled publications')
    }
  }

  const handleCreateTemplate = async () => {
    if (!templateName) {
      toast.error('Template name is required')
      return
    }

    try {
      const result = await createContentTemplate({
        name: templateName,
        description: templateDescription,
        blocks: [], // In a real implementation, this would come from the current page blocks
        site_id: siteId,
      }).unwrap()

      if (result.success) {
        toast.success('Content template created!')
        setTemplateDialogOpen(false)
        setTemplateName('')
        setTemplateDescription('')
      }
    } catch (error) {
      toast.error('Failed to create content template')
    }
  }

  const handleApplyTemplate = async (templateId: string) => {
    if (!pageId) {
      toast.error('Page ID is required')
      return
    }

    try {
      const result = await applyContentTemplate({
        pageId,
        template_id: templateId,
      }).unwrap()

      if (result.success) {
        toast.success(`Applied template with ${result.blocks_count} blocks!`)
      }
    } catch (error) {
      toast.error('Failed to apply content template')
    }
  }

  const handleBulkUpdate = async (updates: any) => {
    if (selectedPages.length === 0) {
      toast.error('Please select pages to update')
      return
    }

    try {
      const result = await bulkUpdatePages({
        page_ids: selectedPages,
        updates,
      }).unwrap()

      if (result.success) {
        toast.success(`Updated ${result.updated_count} pages!`)
        setBulkUpdateDialogOpen(false)
        setSelectedPages([])
      }
    } catch (error) {
      toast.error('Failed to bulk update pages')
    }
  }

  const handleCreateWorkflow = async () => {
    if (!workflowName) {
      toast.error('Workflow name is required')
      return
    }

    try {
      const result = await createAutomatedWorkflow({
        name: workflowName,
        description: workflowDescription,
        triggers: [], // In a real implementation, this would come from the UI
        actions: [], // In a real implementation, this would come from the UI
        site_id: siteId,
      }).unwrap()

      if (result.success) {
        toast.success('Automated workflow created!')
        setWorkflowDialogOpen(false)
        setWorkflowName('')
        setWorkflowDescription('')
      }
    } catch (error) {
      toast.error('Failed to create automated workflow')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'primary'
      case 'published':
        return 'success'
      case 'cancelled':
        return 'error'
      default:
        return 'default'
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon color="primary" />
            Content Automation & Scheduling
          </Typography>
        </Box>

        {/* Automation Analytics */}
        {automationAnalytics && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <ScheduleIcon color="primary" />
                    <Typography variant="subtitle2">Scheduled Pages</Typography>
                  </Box>
                  <Typography variant="h4" color="primary">
                    {automationAnalytics.analytics.scheduled_pages}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TimelineIcon color="primary" />
                    <Typography variant="subtitle2">Published Pages</Typography>
                  </Box>
                  <Typography variant="h4" color="primary">
                    {automationAnalytics.analytics.published_pages}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AutoAwesomeIcon color="primary" />
                    <Typography variant="subtitle2">Automated Pages</Typography>
                  </Box>
                  <Typography variant="h4" color="primary">
                    {automationAnalytics.analytics.automated_pages}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AssessmentIcon color="primary" />
                    <Typography variant="subtitle2">Automation Rate</Typography>
                  </Box>
                  <Typography variant="h4" color="primary">
                    {automationAnalytics.analytics.automation_rate.toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={automationAnalytics.analytics.automation_rate}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Scheduling" />
            <Tab label="Templates" />
            <Tab label="Workflows" />
            <Tab label="Bulk Operations" />
          </Tabs>
        </Box>

        {/* Scheduling Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              {pageId && (
                <Button
                  variant="contained"
                  startIcon={<ScheduleIcon />}
                  onClick={() => setScheduleDialogOpen(true)}
                >
                  Schedule This Page
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<PlayIcon />}
                onClick={handleProcessScheduledPublications}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Process Scheduled'}
              </Button>
            </Box>

            {/* Scheduled Pages List */}
            {scheduledPagesData && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Scheduled Pages ({scheduledPagesData.count})
                  </Typography>
                  <List>
                    {scheduledPagesData.scheduled_pages.map((page) => (
                      <ListItem key={page.id} divider>
                        <ListItemIcon>
                          <ScheduleIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={page.title}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Scheduled: {formatDate(page.scheduled_date)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Site: {page.site_domain}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Chip
                            label={page.status}
                            color={getStatusColor(page.status)}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <IconButton
                            onClick={() => handleCancelScheduledPublication(page.id)}
                            disabled={isCancelling}
                          >
                            <CancelIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}
          </Box>
        </TabPanel>

        {/* Templates Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setTemplateDialogOpen(true)}
              >
                Create Template
              </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              Content templates allow you to save and reuse page layouts and content structures.
            </Alert>

            {/* Sample Templates */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Available Templates
                </Typography>
                <List>
                  <ListItem divider>
                    <ListItemIcon>
                      <TemplateIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Blog Post Template"
                      secondary="Standard blog post layout with title, content, and image"
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleApplyTemplate('blog_template')}
                        disabled={isApplyingTemplate}
                      >
                        Apply
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem divider>
                    <ListItemIcon>
                      <TemplateIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Landing Page Template"
                      secondary="High-converting landing page with CTA and features"
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleApplyTemplate('landing_template')}
                        disabled={isApplyingTemplate}
                      >
                        Apply
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* Workflows Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setWorkflowDialogOpen(true)}
              >
                Create Workflow
              </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              Automated workflows can trigger actions based on specific conditions or events.
            </Alert>

            {/* Sample Workflows */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Available Workflows
                </Typography>
                <List>
                  <ListItem divider>
                    <ListItemIcon>
                      <WorkflowIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Auto-Publish Workflow"
                      secondary="Automatically publish pages when they meet certain criteria"
                    />
                    <ListItemSecondaryAction>
                      <IconButton>
                        <EditIcon />
                      </IconButton>
                      <IconButton>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem divider>
                    <ListItemIcon>
                      <WorkflowIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="SEO Optimization Workflow"
                      secondary="Automatically optimize SEO elements when pages are created"
                    />
                    <ListItemSecondaryAction>
                      <IconButton>
                        <EditIcon />
                      </IconButton>
                      <IconButton>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* Bulk Operations Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<SettingsIcon />}
                onClick={() => setBulkUpdateDialogOpen(true)}
                disabled={selectedPages.length === 0}
              >
                Bulk Update ({selectedPages.length})
              </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              Select pages from your site to perform bulk operations like updating metadata or publishing status.
            </Alert>

            {/* Sample Pages for Selection */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Select Pages for Bulk Operations
                </Typography>
                <FormGroup>
                  {[1, 2, 3, 4, 5].map((pageId) => (
                    <FormControlLabel
                      key={pageId}
                      control={
                        <Checkbox
                          checked={selectedPages.includes(pageId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPages([...selectedPages, pageId])
                            } else {
                              setSelectedPages(selectedPages.filter(id => id !== pageId))
                            }
                          }}
                        />
                      }
                      label={`Sample Page ${pageId}`}
                    />
                  ))}
                </FormGroup>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* Schedule Publication Dialog */}
        <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Schedule Page Publication</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <DateTimePicker
                label="Scheduled Date & Time"
                value={scheduledDate}
                onChange={setScheduledDate}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSchedulePublication}
              variant="contained"
              disabled={!scheduledDate || isScheduling}
              startIcon={isScheduling ? <CircularProgress size={20} /> : <ScheduleIcon />}
            >
              {isScheduling ? 'Scheduling...' : 'Schedule'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Template Dialog */}
        <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create Content Template</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                label="Template Name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                fullWidth
                multiline
                rows={3}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateTemplate}
              variant="contained"
              disabled={!templateName || isCreatingTemplate}
              startIcon={isCreatingTemplate ? <CircularProgress size={20} /> : <AddIcon />}
            >
              {isCreatingTemplate ? 'Creating...' : 'Create Template'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Workflow Dialog */}
        <Dialog open={workflowDialogOpen} onClose={() => setWorkflowDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create Automated Workflow</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                label="Workflow Name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Description"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                fullWidth
                multiline
                rows={3}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setWorkflowDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateWorkflow}
              variant="contained"
              disabled={!workflowName || isCreatingWorkflow}
              startIcon={isCreatingWorkflow ? <CircularProgress size={20} /> : <AddIcon />}
            >
              {isCreatingWorkflow ? 'Creating...' : 'Create Workflow'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Update Dialog */}
        <Dialog open={bulkUpdateDialogOpen} onClose={() => setBulkUpdateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Bulk Update Pages</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Selected {selectedPages.length} pages
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Update Field</InputLabel>
                <Select
                  value=""
                  onChange={(e) => {
                    // Handle field selection
                  }}
                  label="Update Field"
                >
                  <MenuItem value="is_published">Publishing Status</MenuItem>
                  <MenuItem value="meta_description">Meta Description</MenuItem>
                  <MenuItem value="keywords">Keywords</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="New Value"
                fullWidth
                placeholder="Enter new value for selected field"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBulkUpdateDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => handleBulkUpdate({})}
              variant="contained"
              disabled={isBulkUpdating}
              startIcon={isBulkUpdating ? <CircularProgress size={20} /> : <SettingsIcon />}
            >
              {isBulkUpdating ? 'Updating...' : 'Update Pages'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </LocalizationProvider>
  )
}

export default ContentAutomationManager
