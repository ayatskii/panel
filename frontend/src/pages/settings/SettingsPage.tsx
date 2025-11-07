import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Alert,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
} from '@mui/material'
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  Info as InfoIcon,
  Language as LanguageIcon,
  Link as LinkIcon,
  AutoFixHigh as PromptIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  ContentCopy as CopyIcon,
  ViewCarousel as SwiperIcon,
} from '@mui/icons-material'
import { useGetCurrentUserQuery } from '@/store/api/authApi'
import { useUpdateUserMutation, useChangePasswordMutation } from '@/store/api/usersApi'
import { 
  useGetLanguagesQuery,
  useCreateAffiliateLinkMutation,
  useUpdateAffiliateLinkMutation,
  useDeleteAffiliateLinkMutation,
  useGetAffiliateLinksQuery,
} from '@/store/api/sitesApi'
import { 
  useGetPromptsQuery,
  useCreatePromptMutation,
  useUpdatePromptMutation,
  useDeletePromptMutation,
} from '@/store/api/aiApi'
import SwiperPresetManager from '@/components/pages/SwiperPresetManager'
import toast from 'react-hot-toast'
import { formatDate } from '@/utils/formatDate'
import { useTranslation } from 'react-i18next'
import type { Language, AffiliateLink } from '@/types'
import type { AIPrompt } from '@/types'

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

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState(0)
  const { t } = useTranslation()
  const { data: currentUser, isLoading } = useGetCurrentUserQuery()
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation()
  
  // Data queries
  const { data: languages, refetch: refetchLanguages } = useGetLanguagesQuery()
  const { data: affiliateLinks, refetch: refetchAffiliateLinks } = useGetAffiliateLinksQuery()
  const { data: prompts, refetch: refetchPrompts } = useGetPromptsQuery({})
  
  // Mutations
  const [createAffiliateLink] = useCreateAffiliateLinkMutation()
  const [updateAffiliateLink] = useUpdateAffiliateLinkMutation()
  const [deleteAffiliateLink] = useDeleteAffiliateLinkMutation()
  const [createPrompt] = useCreatePromptMutation()
  const [updatePrompt] = useUpdatePromptMutation()
  const [deletePrompt] = useDeletePromptMutation()
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
  })
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: ''
  })
  
  const [passwordError, setPasswordError] = useState('')
  
  // Languages management state
  const [languagesText, setLanguagesText] = useState('')
  const [isSavingLanguages, setIsSavingLanguages] = useState(false)
  
  // Affiliate Links management state
  const [affiliateLinkDialogOpen, setAffiliateLinkDialogOpen] = useState(false)
  const [editingAffiliateLink, setEditingAffiliateLink] = useState<AffiliateLink | null>(null)
  const [affiliateLinkForm, setAffiliateLinkForm] = useState({
    name: '',
    url: '',
    description: '',
    click_tracking: true,
  })
  
  // Prompts management state
  const [promptDialogOpen, setPromptDialogOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null)
  const [promptForm, setPromptForm] = useState<Partial<AIPrompt>>({
    name: '',
    description: '',
    type: 'text',
    block_type: '',
    ai_model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 1000,
    prompt_text: '',
    system_prompt: '',
    is_active: true,
  })
  
  // Swiper Presets management state
  const [swiperPresetManagerOpen, setSwiperPresetManagerOpen] = useState(false)

  // Update form when user data loads
  useEffect(() => {
    if (currentUser) {
      setProfileData({
        username: currentUser.username,
        email: currentUser.email,
      })
    }
  }, [currentUser])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    })
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    })
    setPasswordError('')
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser) return
    
    try {
      await updateUser({
        id: currentUser.id,
        data: profileData
      }).unwrap()
      toast.success(t('settings.profileUpdated'))
    } catch (error) {
      const apiError = error as { data?: { username?: string[]; email?: string[]; detail?: string } };
      
      if (apiError.data?.username) {
        toast.error(apiError.data.username[0])
      } else if (apiError.data?.email) {
        toast.error(apiError.data.email[0])
      } else if (apiError.data?.detail) {
        toast.error(apiError.data.detail)
      } else {
        toast.error(t('settings.profileUpdateFailed'))
      }
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser) return
    
    // Client-side validation
    if (passwordData.new_password !== passwordData.new_password_confirm) {
      setPasswordError(t('settings.passwordsDoNotMatch'))
      return
    }
    
    if (passwordData.new_password.length < 8) {
      setPasswordError(t('settings.passwordTooShort'))
      return
    }
    
    try {
      await changePassword({
        id: currentUser.id,
        data: passwordData
      }).unwrap()
      toast.success(t('settings.passwordChanged'))
      setPasswordData({ old_password: '', new_password: '', new_password_confirm: '' })
      setPasswordError('')
    } catch (error) {
      const apiError = error as { 
        data?: { 
          old_password?: string[];
          new_password?: string[];
          new_password_confirm?: string[];
          detail?: string 
        } 
      };
      
      if (apiError.data?.old_password) {
        setPasswordError(apiError.data.old_password[0])
      } else if (apiError.data?.new_password) {
        setPasswordError(apiError.data.new_password[0])
      } else if (apiError.data?.new_password_confirm) {
        setPasswordError(apiError.data.new_password_confirm[0])
      } else if (apiError.data?.detail) {
        setPasswordError(apiError.data.detail)
      } else {
        setPasswordError(t('settings.passwordChangeFailed'))
      }
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!currentUser) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography>{t('settings.unableToLoadUserData')}</Typography>
      </Box>
    )
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
          {t('settings.title')}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#5a6872',
            fontSize: '0.875rem'
          }}
        >
          {t('settings.description')}
        </Typography>
      </Box>

      <Paper 
        sx={{ 
          mb: 3,
          borderRadius: 3,
          border: '1px solid rgba(0, 0, 0, 0.06)',
          overflow: 'hidden'
        }}
      >
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            px: 2,
            '& .MuiTab-root': {
              minHeight: 64,
              fontWeight: 500
            }
          }}
        >
          <Tab 
            icon={<PersonIcon />} 
            iconPosition="start" 
            label={t('settings.tabs.profile')} 
          />
          <Tab 
            icon={<SecurityIcon />} 
            iconPosition="start" 
            label={t('settings.tabs.security')} 
          />
          <Tab 
            icon={<InfoIcon />} 
            iconPosition="start" 
            label={t('settings.tabs.accountInfo')} 
          />
          <Tab 
            icon={<LanguageIcon />} 
            iconPosition="start" 
            label="Languages" 
          />
          <Tab 
            icon={<LinkIcon />} 
            iconPosition="start" 
            label="Affiliate Links" 
          />
          <Tab 
            icon={<PromptIcon />} 
            iconPosition="start" 
            label="Prompts" 
          />
          <Tab 
            icon={<SwiperIcon />} 
            iconPosition="start" 
            label="Swiper Presets" 
          />
        </Tabs>

        {/* Profile Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ px: 3 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 1,
                fontWeight: 600,
                color: '#1a2027'
              }}
            >
              {t('settings.profileInformation')}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 4,
                fontSize: '0.875rem'
              }}
            >
              {t('settings.profileInformationDescription')}
            </Typography>

            <form onSubmit={handleProfileSubmit}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: 'repeat(2, 1fr)',
                  },
                  gap: 3,
                  mb: 3,
                }}
              >
                <TextField
                  label={t('settings.username')}
                  name="username"
                  fullWidth
                  value={profileData.username}
                  onChange={handleProfileChange}
                  required
                  helperText={t('settings.usernameHelper')}
                />
                
                <TextField
                  label={t('settings.email')}
                  name="email"
                  type="email"
                  fullWidth
                  value={profileData.email}
                  onChange={handleProfileChange}
                  required
                  helperText={t('settings.emailHelper')}
                />
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isUpdating}
                >
                  {isUpdating ? <CircularProgress size={24} /> : t('settings.saveChanges')}
                </Button>
              </Box>
            </form>
          </Box>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ px: 3 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 1,
                fontWeight: 600,
                color: '#1a2027'
              }}
            >
              {t('settings.changePassword')}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 4,
                fontSize: '0.875rem'
              }}
            >
              {t('settings.passwordSecurityDescription')}
            </Typography>

            {passwordError && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setPasswordError('')}>
                {passwordError}
              </Alert>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 500 }}>
                <TextField
                  label={t('settings.currentPassword')}
                  name="old_password"
                  type="password"
                  fullWidth
                  value={passwordData.old_password}
                  onChange={handlePasswordChange}
                  required
                />
                
                <TextField
                  label={t('settings.newPassword')}
                  name="new_password"
                  type="password"
                  fullWidth
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  required
                  helperText={t('settings.passwordHelper')}
                />
                
                <TextField
                  label={t('settings.confirmNewPassword')}
                  name="new_password_confirm"
                  type="password"
                  fullWidth
                  value={passwordData.new_password_confirm}
                  onChange={handlePasswordChange}
                  required
                />
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? <CircularProgress size={24} /> : t('settings.updatePassword')}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setPasswordData({ old_password: '', new_password: '', new_password_confirm: '' })
                    setPasswordError('')
                  }}
                  disabled={isChangingPassword}
                >
                  {t('common.cancel')}
                </Button>
              </Box>
            </form>
          </Box>
        </TabPanel>

        {/* Account Info Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ px: 3 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 1,
                fontWeight: 600,
                color: '#1a2027'
              }}
            >
              {t('settings.accountInformation')}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 4,
                fontSize: '0.875rem'
              }}
            >
              {t('settings.accountInformationDescription')}
            </Typography>

            <Card 
              variant="outlined"
              sx={{
                borderRadius: 2,
                border: '1px solid rgba(0, 0, 0, 0.08)'
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: 'repeat(2, 1fr)',
                    },
                    gap: 3,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t('settings.userId')}
                    </Typography>
                    <Typography variant="body1">
                      #{currentUser.id}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t('settings.username')}
                    </Typography>
                    <Typography variant="body1">
                      {currentUser.username}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t('settings.email')}
                    </Typography>
                    <Typography variant="body1">
                      {currentUser.email}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t('settings.role')}
                    </Typography>
                    <Chip 
                      label={currentUser.role.toUpperCase()} 
                      color={currentUser.is_admin ? 'primary' : 'default'}
                      size="small"
                    />
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t('settings.accountCreated')}
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(currentUser.created_at, 'PPP')}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t('settings.accountStatus')}
                    </Typography>
                    <Chip 
                      label={t('settings.active')} 
                      color="success"
                      size="small"
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* Languages Tab */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ px: 3 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              Languages Management
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add languages in format en-EN, fr-FR (one per line)
            </Typography>
            <TextField
              label="Languages (one per line)"
              multiline
              rows={10}
              fullWidth
              value={languagesText}
              onChange={(e) => setLanguagesText(e.target.value)}
              placeholder="en-EN&#10;fr-FR&#10;de-DE"
              helperText="Format: language code (e.g., en-EN) - one per line"
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={async () => {
                  if (!languagesText.trim()) return
                  
                  setIsSavingLanguages(true)
                  try {
                    const response = await fetch('/api/languages/bulk_create/', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                      },
                      body: JSON.stringify({ text: languagesText }),
                    })
                    
                    const result = await response.json()
                    
                    if (response.ok && result.success) {
                      toast.success(`Successfully created ${result.successful} language(s)`)
                      if (result.errors && result.errors.length > 0) {
                        toast.error(`Some languages failed: ${result.errors.join(', ')}`)
                      }
                      setLanguagesText('')
                      refetchLanguages()
                    } else {
                      toast.error(result.error || 'Failed to save languages')
                    }
                  } catch (error) {
                    toast.error('Failed to save languages')
                    console.error(error)
                  } finally {
                    setIsSavingLanguages(false)
                  }
                }}
                disabled={!languagesText.trim() || isSavingLanguages}
              >
                {isSavingLanguages ? <CircularProgress size={24} /> : 'Save Languages'}
              </Button>
            </Box>
            {languages && languages.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Current Languages ({languages.length})
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Code</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {languages.map((lang) => (
                        <TableRow key={lang.id}>
                          <TableCell>{lang.code}</TableCell>
                          <TableCell>{lang.name}</TableCell>
                          <TableCell>
                            <Chip
                              label={lang.is_active ? 'Active' : 'Inactive'}
                              size="small"
                              color={lang.is_active ? 'success' : 'default'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Affiliate Links Tab */}
        <TabPanel value={activeTab} index={4}>
          <Box sx={{ px: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Affiliate Links
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage affiliate marketing links for sites
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingAffiliateLink(null)
                  setAffiliateLinkForm({ name: '', url: '', description: '', click_tracking: true })
                  setAffiliateLinkDialogOpen(true)
                }}
              >
                Add Link
              </Button>
            </Box>
            {affiliateLinks && affiliateLinks.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>URL</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Tracking</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {affiliateLinks.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell>{link.name}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                            {link.url}
                          </Typography>
                        </TableCell>
                        <TableCell>{link.description || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={link.click_tracking ? 'Enabled' : 'Disabled'}
                            size="small"
                            color={link.click_tracking ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingAffiliateLink(link)
                              setAffiliateLinkForm({
                                name: link.name,
                                url: link.url,
                                description: link.description || '',
                                click_tracking: link.click_tracking,
                              })
                              setAffiliateLinkDialogOpen(true)
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={async () => {
                              if (confirm('Delete this affiliate link?')) {
                                try {
                                  await deleteAffiliateLink(link.id).unwrap()
                                  toast.success('Affiliate link deleted')
                                  refetchAffiliateLinks()
                                } catch {
                                  toast.error('Failed to delete affiliate link')
                                }
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">No affiliate links yet. Click "Add Link" to create one.</Alert>
            )}
          </Box>
        </TabPanel>

        {/* Prompts Tab */}
        <TabPanel value={activeTab} index={5}>
          <Box sx={{ px: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  AI Prompts
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage prompts for text and image generation
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingPrompt(null)
                  setPromptForm({
                    name: '',
                    description: '',
                    type: 'text',
                    block_type: '',
                    ai_model: 'gpt-4',
                    temperature: 0.7,
                    max_tokens: 1000,
                    prompt_text: '',
                    system_prompt: '',
                    is_active: true,
                  })
                  setPromptDialogOpen(true)
                }}
              >
                Add Prompt
              </Button>
            </Box>
            {prompts && prompts.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Block Type</TableCell>
                      <TableCell>AI Model</TableCell>
                      <TableCell>Temperature</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {prompts.map((prompt) => (
                      <TableRow key={prompt.id}>
                        <TableCell>{prompt.name}</TableCell>
                        <TableCell>
                          <Chip label={prompt.type} size="small" />
                        </TableCell>
                        <TableCell>{prompt.block_type || '-'}</TableCell>
                        <TableCell>{prompt.ai_model}</TableCell>
                        <TableCell>{prompt.temperature}</TableCell>
                        <TableCell>
                          <Chip
                            label={prompt.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            color={prompt.is_active ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingPrompt(prompt)
                              setPromptForm({
                                name: prompt.name,
                                description: prompt.description || '',
                                type: prompt.type,
                                block_type: prompt.block_type || '',
                                ai_model: prompt.ai_model,
                                temperature: prompt.temperature,
                                max_tokens: prompt.max_tokens,
                                prompt_text: prompt.prompt_text,
                                system_prompt: prompt.system_prompt || '',
                                is_active: prompt.is_active,
                              })
                              setPromptDialogOpen(true)
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={async () => {
                              if (confirm('Delete this prompt?')) {
                                try {
                                  await deletePrompt(prompt.id).unwrap()
                                  toast.success('Prompt deleted')
                                  refetchPrompts()
                                } catch {
                                  toast.error('Failed to delete prompt')
                                }
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">No prompts yet. Click "Add Prompt" to create one.</Alert>
            )}
          </Box>
        </TabPanel>

        {/* Swiper Presets Tab */}
        <TabPanel value={activeTab} index={6}>
          <Box sx={{ px: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Swiper Presets
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage predefined game carousels for swiper blocks
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setSwiperPresetManagerOpen(true)}
              >
                Manage Presets
              </Button>
            </Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Click "Manage Presets" to create, edit, and organize swiper presets. 
              Presets can be selected when creating swiper blocks on pages.
            </Alert>
          </Box>
        </TabPanel>
      </Paper>

      {/* Swiper Preset Manager Dialog */}
      <SwiperPresetManager
        open={swiperPresetManagerOpen}
        onClose={() => setSwiperPresetManagerOpen(false)}
        mode="manage"
      />

      {/* Affiliate Link Dialog */}
      <Dialog open={affiliateLinkDialogOpen} onClose={() => setAffiliateLinkDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAffiliateLink ? 'Edit Affiliate Link' : 'Add Affiliate Link'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={affiliateLinkForm.name}
              onChange={(e) => setAffiliateLinkForm({ ...affiliateLinkForm, name: e.target.value })}
              required
            />
            <TextField
              label="URL"
              fullWidth
              value={affiliateLinkForm.url}
              onChange={(e) => setAffiliateLinkForm({ ...affiliateLinkForm, url: e.target.value })}
              required
              placeholder="https://example.com/affiliate"
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={affiliateLinkForm.description}
              onChange={(e) => setAffiliateLinkForm({ ...affiliateLinkForm, description: e.target.value })}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={affiliateLinkForm.click_tracking}
                  onChange={(e) => setAffiliateLinkForm({ ...affiliateLinkForm, click_tracking: e.target.checked })}
                />
              }
              label="Enable click tracking"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAffiliateLinkDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                if (editingAffiliateLink) {
                  await updateAffiliateLink({ id: editingAffiliateLink.id, data: affiliateLinkForm }).unwrap()
                  toast.success('Affiliate link updated')
                } else {
                  await createAffiliateLink(affiliateLinkForm).unwrap()
                  toast.success('Affiliate link created')
                }
                setAffiliateLinkDialogOpen(false)
                refetchAffiliateLinks()
              } catch {
                toast.error(`Failed to ${editingAffiliateLink ? 'update' : 'create'} affiliate link`)
              }
            }}
          >
            {editingAffiliateLink ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Prompt Dialog */}
      <Dialog open={promptDialogOpen} onClose={() => setPromptDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingPrompt ? 'Edit Prompt' : 'Add Prompt'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={promptForm.name}
              onChange={(e) => setPromptForm({ ...promptForm, name: e.target.value })}
              required
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={promptForm.description}
              onChange={(e) => setPromptForm({ ...promptForm, description: e.target.value })}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={promptForm.type}
                  label="Type"
                  onChange={(e) => setPromptForm({ ...promptForm, type: e.target.value as 'text' | 'image' })}
                >
                  <MenuItem value="text">Text Generation</MenuItem>
                  <MenuItem value="image">Image Generation</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Block Type"
                fullWidth
                value={promptForm.block_type}
                onChange={(e) => setPromptForm({ ...promptForm, block_type: e.target.value })}
                placeholder="article, title, description, faq, hero"
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="AI Model"
                fullWidth
                value={promptForm.ai_model}
                onChange={(e) => setPromptForm({ ...promptForm, ai_model: e.target.value })}
                placeholder="gpt-4, gpt-3.5-turbo, claude-3"
              />
              <TextField
                label="Temperature"
                type="number"
                inputProps={{ min: 0, max: 1, step: 0.1 }}
                fullWidth
                value={promptForm.temperature}
                onChange={(e) => setPromptForm({ ...promptForm, temperature: parseFloat(e.target.value) })}
              />
            </Box>
            <TextField
              label="Max Tokens"
              type="number"
              fullWidth
              value={promptForm.max_tokens}
              onChange={(e) => setPromptForm({ ...promptForm, max_tokens: parseInt(e.target.value) || undefined })}
            />
            <TextField
              label="Prompt Text"
              fullWidth
              multiline
              rows={6}
              value={promptForm.prompt_text}
              onChange={(e) => setPromptForm({ ...promptForm, prompt_text: e.target.value })}
              required
              placeholder="Use {keywords}, {brand_name}, etc. as placeholders"
            />
            <TextField
              label="System Prompt (optional)"
              fullWidth
              multiline
              rows={3}
              value={promptForm.system_prompt}
              onChange={(e) => setPromptForm({ ...promptForm, system_prompt: e.target.value })}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={promptForm.is_active}
                  onChange={(e) => setPromptForm({ ...promptForm, is_active: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPromptDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                if (editingPrompt) {
                  await updatePrompt({ id: editingPrompt.id, data: promptForm }).unwrap()
                  toast.success('Prompt updated')
                } else {
                  await createPrompt(promptForm as AIPrompt).unwrap()
                  toast.success('Prompt created')
                }
                setPromptDialogOpen(false)
                refetchPrompts()
              } catch {
                toast.error(`Failed to ${editingPrompt ? 'update' : 'create'} prompt`)
              }
            }}
          >
            {editingPrompt ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SettingsPage

