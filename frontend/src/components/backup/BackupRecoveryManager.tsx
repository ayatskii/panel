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
  DialogContentText,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material'
import {
  Backup as BackupIcon,
  Restore as RestoreIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  Schedule as ScheduleIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  Database as DatabaseIcon,
  Folder as FolderIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  GetApp as DownloadIcon,
  Publish as UploadIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import {
  useCreateDatabaseBackupMutation,
  useRestoreDatabaseBackupMutation,
  useCreateFilesystemBackupMutation,
  useRestoreFilesystemBackupMutation,
  useCreateCompleteBackupMutation,
  useRestoreCompleteBackupMutation,
  useListBackupsQuery,
  useDeleteBackupMutation,
  useCleanupOldBackupsMutation,
  useUploadToCloudMutation,
  useDownloadFromCloudMutation,
  useScheduleBackupMutation,
  useGetBackupScheduleQuery,
  useGetBackupAnalyticsQuery,
} from '@/store/api/backupApi'
import toast from 'react-hot-toast'

interface BackupRecoveryManagerProps {
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
      id={`backup-tabpanel-${index}`}
      aria-labelledby={`backup-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const BackupRecoveryManager = ({ siteId, siteDomain }: BackupRecoveryManagerProps) => {
  const [tabValue, setTabValue] = useState(0)
  const [backupDialogOpen, setBackupDialogOpen] = useState(false)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [cloudDialogOpen, setCloudDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  
  const [backupConfig, setBackupConfig] = useState({
    backup_name: '',
    backup_type: 'complete',
    include_media: true,
  })
  const [restoreConfig, setRestoreConfig] = useState({
    backup_name: '',
    backup_type: 'complete',
  })
  const [scheduleConfig, setScheduleConfig] = useState({
    backup_type: 'complete',
    schedule_time: 'daily',
    backup_name: '',
  })
  const [cloudConfig, setCloudConfig] = useState({
    backup_name: '',
    cloud_provider: 's3',
    operation: 'upload',
  })
  const [deleteConfig, setDeleteConfig] = useState({
    backup_name: '',
  })

  const [createDatabaseBackup, { isLoading: isCreatingDatabaseBackup }] = useCreateDatabaseBackupMutation()
  const [restoreDatabaseBackup, { isLoading: isRestoringDatabaseBackup }] = useRestoreDatabaseBackupMutation()
  const [createFilesystemBackup, { isLoading: isCreatingFilesystemBackup }] = useCreateFilesystemBackupMutation()
  const [restoreFilesystemBackup, { isLoading: isRestoringFilesystemBackup }] = useRestoreFilesystemBackupMutation()
  const [createCompleteBackup, { isLoading: isCreatingCompleteBackup }] = useCreateCompleteBackupMutation()
  const [restoreCompleteBackup, { isLoading: isRestoringCompleteBackup }] = useRestoreCompleteBackupMutation()
  const [deleteBackup, { isLoading: isDeletingBackup }] = useDeleteBackupMutation()
  const [cleanupOldBackups, { isLoading: isCleaningUp }] = useCleanupOldBackupsMutation()
  const [uploadToCloud, { isLoading: isUploadingToCloud }] = useUploadToCloudMutation()
  const [downloadFromCloud, { isLoading: isDownloadingFromCloud }] = useDownloadFromCloudMutation()
  const [scheduleBackup, { isLoading: isSchedulingBackup }] = useScheduleBackupMutation()

  const { data: backups, refetch: refetchBackups } = useListBackupsQuery({})
  const { data: schedule, refetch: refetchSchedule } = useGetBackupScheduleQuery()
  const { data: analytics, refetch: refetchAnalytics } = useGetBackupAnalyticsQuery()

  const handleCreateBackup = async () => {
    if (!backupConfig.backup_type) {
      toast.error('Backup type is required')
      return
    }

    try {
      let result
      
      switch (backupConfig.backup_type) {
        case 'database':
          result = await createDatabaseBackup({ backup_name: backupConfig.backup_name || undefined }).unwrap()
          break
        case 'filesystem':
          result = await createFilesystemBackup({ 
            backup_name: backupConfig.backup_name || undefined,
            include_media: backupConfig.include_media 
          }).unwrap()
          break
        case 'complete':
          result = await createCompleteBackup({ backup_name: backupConfig.backup_name || undefined }).unwrap()
          break
        default:
          toast.error('Invalid backup type')
          return
      }

      if (result.success) {
        toast.success('Backup created successfully!')
        setBackupDialogOpen(false)
        setBackupConfig({
          backup_name: '',
          backup_type: 'complete',
          include_media: true,
        })
        refetchBackups()
        refetchAnalytics()
      }
    } catch (error) {
      toast.error('Failed to create backup')
    }
  }

  const handleRestoreBackup = async () => {
    if (!restoreConfig.backup_name) {
      toast.error('Backup name is required')
      return
    }

    try {
      let result
      
      switch (restoreConfig.backup_type) {
        case 'database':
          result = await restoreDatabaseBackup({ backup_name: restoreConfig.backup_name }).unwrap()
          break
        case 'filesystem':
          result = await restoreFilesystemBackup({ backup_name: restoreConfig.backup_name }).unwrap()
          break
        case 'complete':
          result = await restoreCompleteBackup({ backup_name: restoreConfig.backup_name }).unwrap()
          break
        default:
          toast.error('Invalid backup type')
          return
      }

      if (result.success) {
        toast.success('Backup restored successfully!')
        setRestoreDialogOpen(false)
        setRestoreConfig({
          backup_name: '',
          backup_type: 'complete',
        })
        refetchBackups()
      }
    } catch (error) {
      toast.error('Failed to restore backup')
    }
  }

  const handleDeleteBackup = async () => {
    if (!deleteConfig.backup_name) {
      toast.error('Backup name is required')
      return
    }

    try {
      const result = await deleteBackup({ backup_name: deleteConfig.backup_name }).unwrap()

      if (result.success) {
        toast.success('Backup deleted successfully!')
        setDeleteDialogOpen(false)
        setDeleteConfig({ backup_name: '' })
        refetchBackups()
        refetchAnalytics()
      }
    } catch (error) {
      toast.error('Failed to delete backup')
    }
  }

  const handleScheduleBackup = async () => {
    if (!scheduleConfig.backup_type || !scheduleConfig.schedule_time) {
      toast.error('Backup type and schedule time are required')
      return
    }

    try {
      const result = await scheduleBackup({
        backup_type: scheduleConfig.backup_type,
        schedule_time: scheduleConfig.schedule_time,
        backup_name: scheduleConfig.backup_name || undefined,
      }).unwrap()

      if (result.success) {
        toast.success('Backup scheduled successfully!')
        setScheduleDialogOpen(false)
        setScheduleConfig({
          backup_type: 'complete',
          schedule_time: 'daily',
          backup_name: '',
        })
        refetchSchedule()
      }
    } catch (error) {
      toast.error('Failed to schedule backup')
    }
  }

  const handleCloudOperation = async () => {
    if (!cloudConfig.backup_name) {
      toast.error('Backup name is required')
      return
    }

    try {
      let result
      
      if (cloudConfig.operation === 'upload') {
        result = await uploadToCloud({
          backup_name: cloudConfig.backup_name,
          cloud_provider: cloudConfig.cloud_provider,
        }).unwrap()
      } else {
        result = await downloadFromCloud({
          backup_name: cloudConfig.backup_name,
          cloud_provider: cloudConfig.cloud_provider,
        }).unwrap()
      }

      if (result.success) {
        toast.success(`Backup ${cloudConfig.operation}ed successfully!`)
        setCloudDialogOpen(false)
        setCloudConfig({
          backup_name: '',
          cloud_provider: 's3',
          operation: 'upload',
        })
        refetchBackups()
      }
    } catch (error) {
      toast.error(`Failed to ${cloudConfig.operation} backup`)
    }
  }

  const handleCleanupOldBackups = async () => {
    try {
      const result = await cleanupOldBackups().unwrap()

      if (result.success) {
        toast.success(`Cleaned up ${result.deleted_count} old backups!`)
        refetchBackups()
        refetchAnalytics()
      }
    } catch (error) {
      toast.error('Failed to cleanup old backups')
    }
  }

  const getBackupTypeColor = (type: string) => {
    switch (type) {
      case 'database':
        return 'primary'
      case 'filesystem':
        return 'secondary'
      case 'complete':
        return 'success'
      default:
        return 'default'
    }
  }

  const getBackupTypeIcon = (type: string) => {
    switch (type) {
      case 'database':
        return <DatabaseIcon />
      case 'filesystem':
        return <FolderIcon />
      case 'complete':
        return <BackupIcon />
      default:
        return <StorageIcon />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BackupIcon color="primary" />
          Backup & Recovery System
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            refetchBackups()
            refetchSchedule()
            refetchAnalytics()
          }}
        >
          Refresh All
        </Button>
      </Box>

      {/* Backup Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <StorageIcon color="primary" />
                <Typography variant="subtitle2">Total Backups</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {analytics?.analytics?.total_backups || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {analytics?.analytics?.total_size_mb || 0} MB total
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TimelineIcon color="primary" />
                <Typography variant="subtitle2">Recent Backups</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {analytics?.analytics?.recent_backups || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last 7 days
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ScheduleIcon color="primary" />
                <Typography variant="subtitle2">Scheduled</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {schedule?.total_count || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active schedules
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <SpeedIcon color="primary" />
                <Typography variant="subtitle2">Frequency</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {analytics?.analytics?.backup_frequency || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Backups per day
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Backup Management" />
          <Tab label="Recovery" />
          <Tab label="Scheduling" />
          <Tab label="Cloud Storage" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      {/* Backup Management Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Backup Management
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Create and manage backups of your database, filesystem, or complete system.
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<BackupIcon />}
              onClick={() => setBackupDialogOpen(true)}
            >
              Create Backup
            </Button>
            <Button
              variant="outlined"
              startIcon={<DeleteIcon />}
              onClick={handleCleanupOldBackups}
              disabled={isCleaningUp}
            >
              {isCleaningUp ? 'Cleaning...' : 'Cleanup Old Backups'}
            </Button>
          </Box>

          {/* Backup List */}
          {backups && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Backup Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {backups.backups.map((backup) => (
                    <TableRow key={backup.backup_name}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getBackupTypeIcon(backup.backup_type)}
                          <Typography variant="body2">{backup.backup_name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={backup.backup_type}
                          color={getBackupTypeColor(backup.backup_type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatFileSize(backup.backup_size)}</TableCell>
                      <TableCell>{formatDate(backup.created_at)}</TableCell>
                      <TableCell>
                        <Chip
                          label={backup.status}
                          color={backup.status === 'completed' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Restore">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setRestoreConfig({
                                  backup_name: backup.backup_name,
                                  backup_type: backup.backup_type,
                                })
                                setRestoreDialogOpen(true)
                              }}
                            >
                              <RestoreIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setDeleteConfig({ backup_name: backup.backup_name })
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </TabPanel>

      {/* Recovery Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recovery
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>Warning:</strong> Restoring a backup will overwrite your current data. Make sure you have a recent backup before proceeding.
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<RestoreIcon />}
              onClick={() => setRestoreDialogOpen(true)}
            >
              Restore Backup
            </Button>
          </Box>

          {/* Recovery Steps */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recovery Process</Typography>
              <Stepper activeStep={activeStep} orientation="vertical">
                <Step>
                  <StepLabel>Select Backup</StepLabel>
                  <StepContent>
                    <Typography>Choose the backup you want to restore from the list above.</Typography>
                  </StepContent>
                </Step>
                <Step>
                  <StepLabel>Verify Backup</StepLabel>
                  <StepContent>
                    <Typography>Verify the backup integrity and ensure it's the correct version.</Typography>
                  </StepContent>
                </Step>
                <Step>
                  <StepLabel>Create Current Backup</StepLabel>
                  <StepContent>
                    <Typography>Create a backup of your current system before restoring.</Typography>
                  </StepContent>
                </Step>
                <Step>
                  <StepLabel>Restore Data</StepLabel>
                  <StepContent>
                    <Typography>Restore the selected backup to your system.</Typography>
                  </StepContent>
                </Step>
                <Step>
                  <StepLabel>Verify Restoration</StepLabel>
                  <StepContent>
                    <Typography>Verify that the restoration was successful and your system is working correctly.</Typography>
                  </StepContent>
                </Step>
              </Stepper>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      {/* Scheduling Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Backup Scheduling
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Schedule automatic backups to ensure your data is always protected.
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<ScheduleIcon />}
              onClick={() => setScheduleDialogOpen(true)}
            >
              Schedule Backup
            </Button>
          </Box>

          {/* Schedule List */}
          {schedule && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Active Schedules</Typography>
                <List>
                  {schedule.schedules.map((scheduleItem, index) => (
                    <ListItem key={index} divider>
                      <ListItemIcon>
                        <ScheduleIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${scheduleItem.backup_type} backup`}
                        secondary={`Schedule: ${scheduleItem.schedule_time} - Created: ${formatDate(scheduleItem.created_at)}`}
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={scheduleItem.status}
                          color={scheduleItem.status === 'scheduled' ? 'success' : 'warning'}
                          size="small"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Box>
      </TabPanel>

      {/* Cloud Storage Tab */}
      <TabPanel value={tabValue} index={3}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Cloud Storage
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Upload backups to cloud storage for off-site protection and disaster recovery.
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={() => {
                setCloudConfig(prev => ({ ...prev, operation: 'upload' }))
                setCloudDialogOpen(true)
              }}
            >
              Upload to Cloud
            </Button>
            <Button
              variant="outlined"
              startIcon={<CloudDownloadIcon />}
              onClick={() => {
                setCloudConfig(prev => ({ ...prev, operation: 'download' }))
                setCloudDialogOpen(true)
              }}
            >
              Download from Cloud
            </Button>
          </Box>

          {/* Cloud Storage Info */}
          <Grid container spacing={2}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Cloud Storage Benefits</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText primary="Off-site protection" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText primary="Disaster recovery" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText primary="Scalable storage" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText primary="Cost-effective" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Supported Providers</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CloudUploadIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary="Amazon S3" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CloudUploadIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary="Google Cloud Storage" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CloudUploadIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary="Azure Blob Storage" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CloudUploadIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary="DigitalOcean Spaces" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
      </TabPanel>

      {/* Analytics Tab */}
      <TabPanel value={tabValue} index={4}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Backup Analytics
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Monitor backup performance, storage usage, and trends to optimize your backup strategy.
          </Alert>

          {analytics && (
            <Grid container spacing={2}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Backup Statistics</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Total Backups"
                          secondary={analytics.analytics.total_backups}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Total Size"
                          secondary={formatFileSize(analytics.analytics.total_size)}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Recent Backups"
                          secondary={`${analytics.analytics.recent_backups} in last 7 days`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Backup Frequency"
                          secondary={`${analytics.analytics.backup_frequency} per day`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Backup Types</Typography>
                    {Object.entries(analytics.analytics.by_type).map(([type, data]) => (
                      <Box key={type} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {type} Backups
                          </Typography>
                          <Typography variant="body2">
                            {data.count} ({formatFileSize(data.size)})
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(data.count / analytics.analytics.total_backups) * 100}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Box>
            </Box>
          )}
        </Box>
      </TabPanel>

      {/* Create Backup Dialog */}
      <Dialog open={backupDialogOpen} onClose={() => setBackupDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Backup</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Backup Type</InputLabel>
              <Select
                value={backupConfig.backup_type}
                onChange={(e) => setBackupConfig(prev => ({ ...prev, backup_type: e.target.value }))}
                label="Backup Type"
              >
                <MenuItem value="database">Database Only</MenuItem>
                <MenuItem value="filesystem">Filesystem Only</MenuItem>
                <MenuItem value="complete">Complete Backup</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Backup Name (Optional)"
              value={backupConfig.backup_name}
              onChange={(e) => setBackupConfig(prev => ({ ...prev, backup_name: e.target.value }))}
              fullWidth
              sx={{ mb: 2 }}
              placeholder="Leave empty for auto-generated name"
            />
            {backupConfig.backup_type === 'filesystem' && (
              <FormControlLabel
                control={
                  <Switch
                    checked={backupConfig.include_media}
                    onChange={(e) => setBackupConfig(prev => ({ ...prev, include_media: e.target.checked }))}
                  />
                }
                label="Include Media Files"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateBackup}
            variant="contained"
            disabled={isCreatingDatabaseBackup || isCreatingFilesystemBackup || isCreatingCompleteBackup}
            startIcon={
              (isCreatingDatabaseBackup || isCreatingFilesystemBackup || isCreatingCompleteBackup) ? 
              <CircularProgress size={20} /> : <BackupIcon />
            }
          >
            {(isCreatingDatabaseBackup || isCreatingFilesystemBackup || isCreatingCompleteBackup) ? 
             'Creating...' : 'Create Backup'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Backup Dialog */}
      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Restore Backup</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            <strong>Warning:</strong> This will overwrite your current data. Make sure you have a recent backup before proceeding.
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Backup Type</InputLabel>
              <Select
                value={restoreConfig.backup_type}
                onChange={(e) => setRestoreConfig(prev => ({ ...prev, backup_type: e.target.value }))}
                label="Backup Type"
              >
                <MenuItem value="database">Database Only</MenuItem>
                <MenuItem value="filesystem">Filesystem Only</MenuItem>
                <MenuItem value="complete">Complete Backup</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Backup Name</InputLabel>
              <Select
                value={restoreConfig.backup_name}
                onChange={(e) => setRestoreConfig(prev => ({ ...prev, backup_name: e.target.value }))}
                label="Backup Name"
              >
                {backups?.backups
                  .filter(backup => backup.backup_type === restoreConfig.backup_type)
                  .map((backup) => (
                    <MenuItem key={backup.backup_name} value={backup.backup_name}>
                      {backup.backup_name} ({formatFileSize(backup.backup_size)})
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRestoreBackup}
            variant="contained"
            color="warning"
            disabled={isRestoringDatabaseBackup || isRestoringFilesystemBackup || isRestoringCompleteBackup}
            startIcon={
              (isRestoringDatabaseBackup || isRestoringFilesystemBackup || isRestoringCompleteBackup) ? 
              <CircularProgress size={20} /> : <RestoreIcon />
            }
          >
            {(isRestoringDatabaseBackup || isRestoringFilesystemBackup || isRestoringCompleteBackup) ? 
             'Restoring...' : 'Restore Backup'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Backup Dialog */}
      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Backup</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Backup Type</InputLabel>
              <Select
                value={scheduleConfig.backup_type}
                onChange={(e) => setScheduleConfig(prev => ({ ...prev, backup_type: e.target.value }))}
                label="Backup Type"
              >
                <MenuItem value="database">Database Only</MenuItem>
                <MenuItem value="filesystem">Filesystem Only</MenuItem>
                <MenuItem value="complete">Complete Backup</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Schedule Time</InputLabel>
              <Select
                value={scheduleConfig.schedule_time}
                onChange={(e) => setScheduleConfig(prev => ({ ...prev, schedule_time: e.target.value }))}
                label="Schedule Time"
              >
                <MenuItem value="hourly">Hourly</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Backup Name (Optional)"
              value={scheduleConfig.backup_name}
              onChange={(e) => setScheduleConfig(prev => ({ ...prev, backup_name: e.target.value }))}
              fullWidth
              placeholder="Leave empty for auto-generated name"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleScheduleBackup}
            variant="contained"
            disabled={isSchedulingBackup}
            startIcon={isSchedulingBackup ? <CircularProgress size={20} /> : <ScheduleIcon />}
          >
            {isSchedulingBackup ? 'Scheduling...' : 'Schedule Backup'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cloud Storage Dialog */}
      <Dialog open={cloudDialogOpen} onClose={() => setCloudDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {cloudConfig.operation === 'upload' ? 'Upload to Cloud' : 'Download from Cloud'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Cloud Provider</InputLabel>
              <Select
                value={cloudConfig.cloud_provider}
                onChange={(e) => setCloudConfig(prev => ({ ...prev, cloud_provider: e.target.value }))}
                label="Cloud Provider"
              >
                <MenuItem value="s3">Amazon S3</MenuItem>
                <MenuItem value="gcs">Google Cloud Storage</MenuItem>
                <MenuItem value="azure">Azure Blob Storage</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Backup Name</InputLabel>
              <Select
                value={cloudConfig.backup_name}
                onChange={(e) => setCloudConfig(prev => ({ ...prev, backup_name: e.target.value }))}
                label="Backup Name"
              >
                {backups?.backups.map((backup) => (
                  <MenuItem key={backup.backup_name} value={backup.backup_name}>
                    {backup.backup_name} ({backup.backup_type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloudDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCloudOperation}
            variant="contained"
            disabled={isUploadingToCloud || isDownloadingFromCloud}
            startIcon={
              (isUploadingToCloud || isDownloadingFromCloud) ? 
              <CircularProgress size={20} /> : 
              (cloudConfig.operation === 'upload' ? <CloudUploadIcon /> : <CloudDownloadIcon />)
            }
          >
            {(isUploadingToCloud || isDownloadingFromCloud) ? 
             `${cloudConfig.operation}ing...` : 
             `${cloudConfig.operation.charAt(0).toUpperCase() + cloudConfig.operation.slice(1)}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Backup Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Backup</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to delete the backup "{deleteConfig.backup_name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteBackup}
            variant="contained"
            color="error"
            disabled={isDeletingBackup}
            startIcon={isDeletingBackup ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {isDeletingBackup ? 'Deleting...' : 'Delete Backup'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}

export default BackupRecoveryManager
