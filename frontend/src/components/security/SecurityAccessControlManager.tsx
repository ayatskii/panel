import { useState } from 'react'
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material'
import { Grid } from '@mui/material'
import {
  Security as SecurityIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  Shield as ShieldIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Key as KeyIcon,
  AdminPanelSettings as AdminIcon,
  Gavel as GavelIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import {
  useValidatePasswordMutation,
  useCreateUserMutation,
  useVerifyEmailMutation,
  useAuthenticateMutation,
  useAssignRoleMutation,
  useCheckPermissionQuery,
  useGetSecurityEventsQuery,
  useDetectThreatsQuery,
  useEncryptDataMutation,
  useDecryptDataMutation,
  useGetComplianceStatusQuery,
} from '@/store/api/securityApi'
import toast from 'react-hot-toast'

interface SecurityAccessControlManagerProps {
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
      id={`security-tabpanel-${index}`}
      aria-labelledby={`security-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const SecurityAccessControlManager = ({ siteId, siteDomain }: SecurityAccessControlManagerProps) => {
  const [tabValue, setTabValue] = useState(0)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [encryptionDialogOpen, setEncryptionDialogOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    is_staff: false,
  })
  const [roleAssignment, setRoleAssignment] = useState({
    user_id: '',
    role: '',
    site_id: siteId || '',
  })
  const [encryptionData, setEncryptionData] = useState({
    data: '',
    encrypted_data: '',
    key: '',
  })

  const [validatePassword, { isLoading: isValidatingPassword }] = useValidatePasswordMutation()
  const [createUser, { isLoading: isCreatingUser }] = useCreateUserMutation()
  const [verifyEmail, { isLoading: isVerifyingEmail }] = useVerifyEmailMutation()
  const [authenticate, { isLoading: isAuthenticating }] = useAuthenticateMutation()
  const [assignRole, { isLoading: isAssigningRole }] = useAssignRoleMutation()
  const [encryptData, { isLoading: isEncrypting }] = useEncryptDataMutation()
  const [decryptData, { isLoading: isDecrypting }] = useDecryptDataMutation()

  const { data: securityEvents, refetch: refetchSecurityEvents } = useGetSecurityEventsQuery({
    site_id: siteId,
    limit: 50,
  })
  const { data: threats, refetch: refetchThreats } = useDetectThreatsQuery()
  const { data: complianceStatus, refetch: refetchComplianceStatus } = useGetComplianceStatusQuery(
    { site_id: siteId! },
    { skip: !siteId }
  )

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      toast.error('Username, email, and password are required')
      return
    }

    try {
      const result = await createUser(newUser).unwrap()

      if (result.success) {
        toast.success('User created successfully!')
        setUserDialogOpen(false)
        setNewUser({
          username: '',
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          is_staff: false,
        })
      }
    } catch (error) {
      toast.error('Failed to create user')
    }
  }

  const handleAssignRole = async () => {
    if (!roleAssignment.user_id || !roleAssignment.role) {
      toast.error('User ID and role are required')
      return
    }

    try {
      const result = await assignRole({
        user_id: parseInt(roleAssignment.user_id),
        role: roleAssignment.role,
        site_id: roleAssignment.site_id ? parseInt(String(roleAssignment.site_id)) : undefined,
      }).unwrap()

      if (result.success) {
        toast.success('Role assigned successfully!')
        setRoleDialogOpen(false)
        setRoleAssignment({
          user_id: '',
          role: '',
          site_id: siteId || '',
        })
      }
    } catch (error) {
      toast.error('Failed to assign role')
    }
  }

  const handleEncryptData = async () => {
    if (!encryptionData.data) {
      toast.error('Data to encrypt is required')
      return
    }

    try {
      const result = await encryptData({
        data: encryptionData.data,
        key: encryptionData.key || undefined,
      }).unwrap()

      if (result.success) {
        setEncryptionData(prev => ({
          ...prev,
          encrypted_data: result.encrypted_data
        }))
        toast.success('Data encrypted successfully!')
      }
    } catch (error) {
      toast.error('Failed to encrypt data')
    }
  }

  const handleDecryptData = async () => {
    if (!encryptionData.encrypted_data) {
      toast.error('Encrypted data is required')
      return
    }

    try {
      const result = await decryptData({
        encrypted_data: encryptionData.encrypted_data,
        key: encryptionData.key || undefined,
      }).unwrap()

      if (result.success) {
        setEncryptionData(prev => ({
          ...prev,
          data: result.decrypted_data
        }))
        toast.success('Data decrypted successfully!')
      }
    } catch (error) {
      toast.error('Failed to decrypt data')
    }
  }

  const getThreatSeverityColor = (severity: string) => {
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

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'success'
    if (score >= 70) return 'warning'
    return 'error'
  }

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'login_success':
        return 'success'
      case 'login_failed':
        return 'error'
      case 'permission_denied':
        return 'warning'
      default:
        return 'default'
    }
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon color="primary" />
          Security & Access Control
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            refetchSecurityEvents()
            refetchThreats()
            refetchComplianceStatus()
          }}
        >
          Refresh All
        </Button>
      </Box>

      {/* Security Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ShieldIcon color="primary" />
                <Typography variant="subtitle2">Security Score</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {complianceStatus?.overall_score?.toFixed(0) || 0}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={complianceStatus?.overall_score || 0}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <WarningIcon color="primary" />
                <Typography variant="subtitle2">Active Threats</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {threats?.threat_count || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {threats?.high_severity || 0} High Priority
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <HistoryIcon color="primary" />
                <Typography variant="subtitle2">Security Events</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {securityEvents?.total_count || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last 24 hours
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <GavelIcon color="primary" />
                <Typography variant="subtitle2">Compliance</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {complianceStatus?.compliance?.gdpr?.compliant && 
                 complianceStatus?.compliance?.ccpa?.compliant ? '100%' : '85%'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                GDPR & CCPA
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="User Management" />
          <Tab label="Access Control" />
          <Tab label="Security Events" />
          <Tab label="Threat Detection" />
          <Tab label="Data Encryption" />
          <Tab label="Compliance" />
        </Tabs>
      </Box>

      {/* User Management Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            User Management
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Manage user accounts, roles, and permissions for secure access control.
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<PersonIcon />}
              onClick={() => setUserDialogOpen(true)}
            >
              Create User
            </Button>
            <Button
              variant="outlined"
              startIcon={<AdminIcon />}
              onClick={() => setRoleDialogOpen(true)}
            >
              Assign Role
            </Button>
          </Box>

          {/* User List */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Active Users</Typography>
              <List>
                <ListItem divider>
                  <ListItemIcon>
                    <PersonIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Admin User"
                    secondary="admin@example.com - Global Admin"
                  />
                  <ListItemSecondaryAction>
                    <Chip label="Admin" color="error" size="small" />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem divider>
                  <ListItemIcon>
                    <PersonIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Editor User"
                    secondary="editor@example.com - Site Editor"
                  />
                  <ListItemSecondaryAction>
                    <Chip label="Editor" color="warning" size="small" />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem divider>
                  <ListItemIcon>
                    <PersonIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Viewer User"
                    secondary="viewer@example.com - Site Viewer"
                  />
                  <ListItemSecondaryAction>
                    <Chip label="Viewer" color="success" size="small" />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      {/* Access Control Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Access Control
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Configure role-based access control and permissions for different user types.
          </Alert>

          <Grid container spacing={2}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="error">Admin Role</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Read" />
                      <CheckCircleIcon color="success" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Write" />
                      <CheckCircleIcon color="success" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Delete" />
                      <CheckCircleIcon color="success" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Manage Users" />
                      <CheckCircleIcon color="success" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Manage Sites" />
                      <CheckCircleIcon color="success" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Manage Settings" />
                      <CheckCircleIcon color="success" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="warning">Editor Role</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Read" />
                      <CheckCircleIcon color="success" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Write" />
                      <CheckCircleIcon color="success" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Delete" />
                      <ErrorIcon color="error" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Manage Users" />
                      <ErrorIcon color="error" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Manage Sites" />
                      <ErrorIcon color="error" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Manage Settings" />
                      <ErrorIcon color="error" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="success">Viewer Role</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Read" />
                      <CheckCircleIcon color="success" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Write" />
                      <ErrorIcon color="error" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Delete" />
                      <ErrorIcon color="error" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Manage Users" />
                      <ErrorIcon color="error" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Manage Sites" />
                      <ErrorIcon color="error" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Manage Settings" />
                      <ErrorIcon color="error" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
      </TabPanel>

      {/* Security Events Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Security Events
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Monitor security events and user activities for threat detection and compliance.
          </Alert>

          {securityEvents && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Event Type</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {securityEvents.events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <Chip
                          label={event.event_type.replace('_', ' ')}
                          color={getEventTypeColor(event.event_type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{event.username || 'N/A'}</TableCell>
                      <TableCell>{event.ip_address}</TableCell>
                      <TableCell>
                        {new Date(event.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>{event.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </TabPanel>

      {/* Threat Detection Tab */}
      <TabPanel value={tabValue} index={3}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Threat Detection
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Automated threat detection and security analysis to identify potential risks.
          </Alert>

          {threats && (
            <Box>
              {threats.threats.map((threat, index) => (
                <Accordion key={index}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <WarningIcon color={getThreatSeverityColor(threat.severity) as 'error' | 'warning' | 'info' | 'success'} />
                      <Typography variant="h6">{threat.type.replace('_', ' ')}</Typography>
                      <Chip
                        label={threat.severity}
                        color={getThreatSeverityColor(threat.severity)}
                        size="small"
                        sx={{ ml: 'auto' }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {threat.description}
                    </Typography>
                    <Alert severity="info">
                      <strong>Recommendation:</strong> {threat.recommendation}
                    </Alert>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </Box>
      </TabPanel>

      {/* Data Encryption Tab */}
      <TabPanel value={tabValue} index={4}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Data Encryption
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Encrypt and decrypt sensitive data using secure encryption algorithms.
          </Alert>

          <Grid container spacing={2}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Encrypt Data</Typography>
                  <TextField
                    label="Data to Encrypt"
                    value={encryptionData.data}
                    onChange={(e) => setEncryptionData(prev => ({ ...prev, data: e.target.value }))}
                    fullWidth
                    multiline
                    rows={4}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Encryption Key (Optional)"
                    value={encryptionData.key}
                    onChange={(e) => setEncryptionData(prev => ({ ...prev, key: e.target.value }))}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<LockIcon />}
                    onClick={handleEncryptData}
                    disabled={isEncrypting || !encryptionData.data}
                    fullWidth
                  >
                    {isEncrypting ? 'Encrypting...' : 'Encrypt Data'}
                  </Button>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Decrypt Data</Typography>
                  <TextField
                    label="Encrypted Data"
                    value={encryptionData.encrypted_data}
                    onChange={(e) => setEncryptionData(prev => ({ ...prev, encrypted_data: e.target.value }))}
                    fullWidth
                    multiline
                    rows={4}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Decryption Key (Optional)"
                    value={encryptionData.key}
                    onChange={(e) => setEncryptionData(prev => ({ ...prev, key: e.target.value }))}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<KeyIcon />}
                    onClick={handleDecryptData}
                    disabled={isDecrypting || !encryptionData.encrypted_data}
                    fullWidth
                  >
                    {isDecrypting ? 'Decrypting...' : 'Decrypt Data'}
                  </Button>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
      </TabPanel>

      {/* Compliance Tab */}
      <TabPanel value={tabValue} index={5}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Compliance Management
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Monitor compliance with GDPR, CCPA, and other regulatory requirements.
          </Alert>

          {complianceStatus && (
            <Grid container spacing={2}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <GavelIcon color="primary" />
                      <Typography variant="h6">GDPR Compliance</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Typography variant="h4" color={getComplianceColor(complianceStatus.compliance.gdpr.score)}>
                        {complianceStatus.compliance.gdpr.score}
                      </Typography>
                      <Chip
                        label={complianceStatus.compliance.gdpr.compliant ? 'Compliant' : 'Non-Compliant'}
                        color={complianceStatus.compliance.gdpr.compliant ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={complianceStatus.compliance.gdpr.score}
                      sx={{ mb: 2 }}
                    />
                    {complianceStatus.compliance.gdpr.recommendations.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>Recommendations:</Typography>
                        {complianceStatus.compliance.gdpr.recommendations.map((rec, index) => (
                          <Typography key={index} variant="body2" color="text.secondary">
                            • {rec}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <GavelIcon color="primary" />
                      <Typography variant="h6">CCPA Compliance</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Typography variant="h4" color={getComplianceColor(complianceStatus.compliance.ccpa.score)}>
                        {complianceStatus.compliance.ccpa.score}
                      </Typography>
                      <Chip
                        label={complianceStatus.compliance.ccpa.compliant ? 'Compliant' : 'Non-Compliant'}
                        color={complianceStatus.compliance.ccpa.compliant ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={complianceStatus.compliance.ccpa.score}
                      sx={{ mb: 2 }}
                    />
                    {complianceStatus.compliance.ccpa.recommendations.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>Recommendations:</Typography>
                        {complianceStatus.compliance.ccpa.recommendations.map((rec, index) => (
                          <Typography key={index} variant="body2" color="text.secondary">
                            • {rec}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <ShieldIcon color="primary" />
                      <Typography variant="h6">Security Compliance</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Typography variant="h4" color={getComplianceColor(complianceStatus.compliance.security.score)}>
                        {complianceStatus.compliance.security.score}
                      </Typography>
                      <Chip
                        label={complianceStatus.compliance.security.compliant ? 'Compliant' : 'Non-Compliant'}
                        color={complianceStatus.compliance.security.compliant ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={complianceStatus.compliance.security.score}
                      sx={{ mb: 2 }}
                    />
                    {complianceStatus.compliance.security.recommendations.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>Recommendations:</Typography>
                        {complianceStatus.compliance.security.recommendations.map((rec, index) => (
                          <Typography key={index} variant="body2" color="text.secondary">
                            • {rec}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            </Box>
          )}
        </Box>
      </TabPanel>

      {/* Create User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Username"
              value={newUser.username}
              onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={newUser.password}
              onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
              fullWidth
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                ),
              }}
            />
            <TextField
              label="First Name"
              value={newUser.first_name}
              onChange={(e) => setNewUser(prev => ({ ...prev, first_name: e.target.value }))}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Last Name"
              value={newUser.last_name}
              onChange={(e) => setNewUser(prev => ({ ...prev, last_name: e.target.value }))}
              fullWidth
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={newUser.is_staff}
                  onChange={(e) => setNewUser(prev => ({ ...prev, is_staff: e.target.checked }))}
                />
              }
              label="Staff User"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateUser}
            variant="contained"
            disabled={isCreatingUser}
            startIcon={isCreatingUser ? <CircularProgress size={20} /> : <PersonIcon />}
          >
            {isCreatingUser ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Role Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Role</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="User ID"
              type="number"
              value={roleAssignment.user_id}
              onChange={(e) => setRoleAssignment(prev => ({ ...prev, user_id: e.target.value }))}
              fullWidth
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={roleAssignment.role}
                onChange={(e) => setRoleAssignment(prev => ({ ...prev, role: e.target.value }))}
                label="Role"
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="editor">Editor</MenuItem>
                <MenuItem value="viewer">Viewer</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Site ID (Optional)"
              type="number"
              value={roleAssignment.site_id}
              onChange={(e) => setRoleAssignment(prev => ({ ...prev, site_id: e.target.value }))}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAssignRole}
            variant="contained"
            disabled={isAssigningRole}
            startIcon={isAssigningRole ? <CircularProgress size={20} /> : <AdminIcon />}
          >
            {isAssigningRole ? 'Assigning...' : 'Assign Role'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}

export default SecurityAccessControlManager
