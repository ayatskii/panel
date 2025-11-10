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
  VpnKey as ApiTokenIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Style as StyleIcon,
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
import {
  useGetApiTokensQuery,
  useCreateApiTokenMutation,
  useUpdateApiTokenMutation,
  useDeleteApiTokenMutation,
  useTestApiTokenMutation,
} from '@/store/api/integrationsApi'
import {
  useGetClassListsQuery,
  useCreateClassListMutation,
  useUpdateClassListMutation,
  useDeleteClassListMutation,
} from '@/store/api/templatesApi'
import SwiperPresetManager from '@/components/pages/SwiperPresetManager'
import toast from 'react-hot-toast'
import { formatDate } from '@/utils/formatDate'
import { useTranslation } from 'react-i18next'
import type { Language, AffiliateLink, ApiToken } from '@/types'
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
  const [promptTypeFilter, setPromptTypeFilter] = useState<'all' | 'text' | 'image'>('all')
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
  
  // API Tokens management state
  const { data: apiTokens, refetch: refetchApiTokens } = useGetApiTokensQuery()
  const [createApiToken] = useCreateApiTokenMutation()
  const [updateApiToken] = useUpdateApiTokenMutation()
  const [deleteApiToken] = useDeleteApiTokenMutation()
  const [testApiToken] = useTestApiTokenMutation()
  
  const [apiTokenDialogOpen, setApiTokenDialogOpen] = useState(false)
  const [editingApiToken, setEditingApiToken] = useState<ApiToken | null>(null)
  const [apiTokenForm, setApiTokenForm] = useState({
    name: '',
    service: 'chatgpt' as ApiToken['service'],
    token_value: '',
    is_active: true,
  })
  const [testingTokenId, setTestingTokenId] = useState<number | null>(null)
  
  // CSS Class Lists management state
  const { data: classLists, refetch: refetchClassLists } = useGetClassListsQuery()
  const [createClassList] = useCreateClassListMutation()
  const [updateClassList] = useUpdateClassListMutation()
  const [deleteClassList] = useDeleteClassListMutation()
  
  const [classListDialogOpen, setClassListDialogOpen] = useState(false)
  const [editingClassList, setEditingClassList] = useState<{ name: string; classes: string[] } | null>(null)
  const [classListForm, setClassListForm] = useState({
    name: '',
    classes: '',
  })

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
            label={t('settings.languages')} 
          />
          <Tab 
            icon={<LinkIcon />} 
            iconPosition="start" 
            label={t('settings.affiliateLinks')} 
          />
          <Tab 
            icon={<PromptIcon />} 
            iconPosition="start" 
            label={t('settings.prompts')} 
          />
          <Tab 
            icon={<SwiperIcon />} 
            iconPosition="start"
            label={t('settings.swiperPresets')} 
          />
          <Tab 
            icon={<ApiTokenIcon />} 
            iconPosition="start" 
            label={t('settings.apiTokens')} 
          />
          <Tab 
            icon={<StyleIcon />} 
            iconPosition="start" 
            label={t('settings.cssClassLists')} 
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
              {t('settings.languagesManagement')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('settings.languagesHelper')}
            </Typography>
            <TextField
              label={t('settings.languagesOnePerLine')}
              multiline
              rows={10}
              fullWidth
              value={languagesText}
              onChange={(e) => setLanguagesText(e.target.value)}
              placeholder={t('settings.languagesPlaceholder')}
              helperText={t('settings.languagesFormatHelper')}
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
                    toast.error(t('settings.languagesSaveFailed'))
                    console.error(error)
                  } finally {
                    setIsSavingLanguages(false)
                  }
                }}
                disabled={!languagesText.trim() || isSavingLanguages}
              >
                {isSavingLanguages ? <CircularProgress size={24} /> : t('settings.saveLanguages')}
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
                        <TableCell>{t('settings.code')}</TableCell>
                        <TableCell>{t('settings.name')}</TableCell>
                        <TableCell>{t('settings.status')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {languages.map((lang) => (
                        <TableRow key={lang.id}>
                          <TableCell>{lang.code}</TableCell>
                          <TableCell>{lang.name}</TableCell>
                          <TableCell>
                            <Chip
                              label={lang.is_active ? t('settings.active') : t('settings.inactive')}
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
                      <TableCell>{t('settings.name')}</TableCell>
                      <TableCell>{t('settings.url')}</TableCell>
                      <TableCell>{t('settings.description')}</TableCell>
                      <TableCell>{t('settings.tracking')}</TableCell>
                      <TableCell align="right">{t('settings.actions')}</TableCell>
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
                            label={link.click_tracking ? t('settings.enabled') : t('settings.disabled')}
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
                              if (confirm(t('settings.deleteAffiliateLink'))) {
                                try {
                                  await deleteAffiliateLink(link.id).unwrap()
                                  toast.success(t('settings.affiliateLinkDeleted'))
                                  refetchAffiliateLinks()
                                } catch {
                                  toast.error(t('settings.affiliateLinkDeleteFailed'))
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
              <Alert severity="info">{t('settings.noAffiliateLinks')}</Alert>
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
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>{t('settings.filterByType')}</InputLabel>
                  <Select
                    value={promptTypeFilter}
                    label={t('settings.filterByType')}
                    onChange={(e) => setPromptTypeFilter(e.target.value as 'all' | 'text' | 'image')}
                  >
                    <MenuItem value="all">All Prompts</MenuItem>
                    <MenuItem value="text">Text Only</MenuItem>
                    <MenuItem value="image">Image Only</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                onClick={() => {
                  setEditingPrompt(null)
                  setPromptForm({
                    name: '',
                    description: '',
                    type: promptTypeFilter === 'image' ? 'image' : 'text',
                    block_type: '',
                    ai_model: promptTypeFilter === 'image' ? 'dall-e-3' : 'gpt-4',
                    temperature: 0.7,
                    max_tokens: promptTypeFilter === 'image' ? undefined : 1000,
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
            </Box>
            
            {(() => {
              const filteredPrompts = prompts?.filter(p => 
                promptTypeFilter === 'all' || p.type === promptTypeFilter
              ) || []
              
              return filteredPrompts.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('settings.name')}</TableCell>
                      <TableCell>{t('settings.type')}</TableCell>
                      <TableCell>{t('settings.blockType')}</TableCell>
                      <TableCell>{t('settings.aiModel')}</TableCell>
                      <TableCell>{t('settings.temperature')}</TableCell>
                      <TableCell>{t('settings.status')}</TableCell>
                      <TableCell align="right">{t('settings.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPrompts.map((prompt) => (
                      <TableRow key={prompt.id}>
                        <TableCell>{prompt.name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={prompt.type === 'image' ? t('settings.image') : t('settings.text')} 
                            size="small"
                            color={prompt.type === 'image' ? 'primary' : 'default'}
                            variant={prompt.type === 'image' ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell>{prompt.block_type || '-'}</TableCell>
                        <TableCell>{prompt.ai_model}</TableCell>
                        <TableCell>{prompt.temperature}</TableCell>
                        <TableCell>
                          <Chip
                            label={prompt.is_active ? t('settings.active') : t('settings.inactive')}
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
                              if (confirm(t('settings.deletePrompt'))) {
                                try {
                                  await deletePrompt(prompt.id).unwrap()
                                  toast.success(t('settings.promptDeleted'))
                                  refetchPrompts()
                                } catch {
                                  toast.error(t('settings.promptDeleteFailed'))
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
                <Alert severity="info">
                  {promptTypeFilter === 'all' 
                    ? t('settings.noPromptsYet')
                    : t('settings.noPromptsFound', { type: promptTypeFilter })
                  }
                </Alert>
              )
            })()}
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
                {t('settings.managePresets')}
              </Button>
            </Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              {t('settings.managePresetsDescription')}
            </Alert>
          </Box>
        </TabPanel>

        {/* API Tokens Tab */}
        <TabPanel value={activeTab} index={7}>
          <Box sx={{ px: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  API Tokens
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage API tokens for ChatGPT, Grok, Cloudflare, and other services
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingApiToken(null)
                  setApiTokenForm({
                    name: '',
                    service: 'chatgpt',
                    token_value: '',
                    is_active: true,
                  })
                  setApiTokenDialogOpen(true)
                }}
              >
                Add Token
              </Button>
            </Box>

            {apiTokens && apiTokens.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>{t('settings.name')}</strong></TableCell>
                      <TableCell><strong>{t('settings.service')}</strong></TableCell>
                      <TableCell><strong>{t('settings.token')}</strong></TableCell>
                      <TableCell><strong>{t('settings.status')}</strong></TableCell>
                      <TableCell><strong>{t('settings.usage')}</strong></TableCell>
                      <TableCell><strong>{t('settings.lastUsed')}</strong></TableCell>
                      <TableCell><strong>{t('settings.actions')}</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {apiTokens.map((token) => (
                      <TableRow key={token.id}>
                        <TableCell>{token.name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={token.service_display || token.service} 
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {token.token_masked || '••••••••'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={token.is_active ? t('settings.active') : t('settings.inactive')}
                            size="small"
                            color={token.is_active ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{token.usage_count || 0}</TableCell>
                        <TableCell>
                          {token.last_used ? formatDate(token.last_used) : 'Never'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={async () => {
                                setTestingTokenId(token.id)
                                try {
                                  const result = await testApiToken(token.id).unwrap()
                                  if (result.valid) {
                                    toast.success(t('settings.tokenValid'))
                                  } else {
                                    toast.error(result.info || t('settings.tokenValidationFailed'))
                                  }
                                } catch {
                                  toast.error(t('settings.tokenTestFailed'))
                                } finally {
                                  setTestingTokenId(null)
                                }
                              }}
                              disabled={testingTokenId === token.id}
                            >
                              {testingTokenId === token.id ? (
                                <CircularProgress size={16} />
                              ) : (
                                <CheckIcon fontSize="small" />
                              )}
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingApiToken(token)
                                setApiTokenForm({
                                  name: token.name,
                                  service: token.service,
                                  token_value: '',
                                  is_active: token.is_active,
                                })
                                setApiTokenDialogOpen(true)
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={async () => {
                                if (window.confirm(`Are you sure you want to delete token "${token.name}"?`)) {
                                  try {
                                    await deleteApiToken(token.id).unwrap()
                                    toast.success(t('settings.tokenDeleted'))
                                    refetchApiTokens()
                                  } catch {
                                    toast.error(t('settings.tokenDeleteFailed'))
                                  }
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                {t('settings.noApiTokens')}
              </Alert>
            )}
          </Box>
        </TabPanel>
      </Paper>

      {/* Swiper Preset Manager Dialog */}
      <SwiperPresetManager
        open={swiperPresetManagerOpen}
        onClose={() => setSwiperPresetManagerOpen(false)}
        mode="manage"
      />

      {/* API Token Dialog */}
      <Dialog open={apiTokenDialogOpen} onClose={() => setApiTokenDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingApiToken ? t('settings.editApiToken') : t('settings.addApiToken')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label={t('settings.tokenName')}
              fullWidth
              value={apiTokenForm.name}
              onChange={(e) => setApiTokenForm({ ...apiTokenForm, name: e.target.value })}
              required
              placeholder={t('settings.tokenNamePlaceholder')}
            />
            <FormControl fullWidth required>
              <InputLabel>{t('settings.service')}</InputLabel>
              <Select
                value={apiTokenForm.service}
                label={t('settings.service')}
                onChange={(e) => setApiTokenForm({ ...apiTokenForm, service: e.target.value as ApiToken['service'] })}
              >
                <MenuItem value="chatgpt">ChatGPT</MenuItem>
                <MenuItem value="grok">Grok</MenuItem>
                <MenuItem value="claude">Claude</MenuItem>
                <MenuItem value="cloudflare">Cloudflare</MenuItem>
                <MenuItem value="elevenlabs">ElevenLabs</MenuItem>
                <MenuItem value="dalle">DALL-E</MenuItem>
                <MenuItem value="midjourney">Midjourney</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label={t('settings.apiToken')}
              fullWidth
              type="password"
              value={apiTokenForm.token_value}
              onChange={(e) => setApiTokenForm({ ...apiTokenForm, token_value: e.target.value })}
              required={!editingApiToken}
              helperText={editingApiToken ? t('settings.apiTokenHelperEdit') : t('settings.apiTokenHelper')}
              placeholder={t('settings.apiTokenPlaceholder')}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={apiTokenForm.is_active}
                  onChange={(e) => setApiTokenForm({ ...apiTokenForm, is_active: e.target.checked })}
                />
              }
              label={t('settings.active')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApiTokenDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                if (editingApiToken) {
                  const updateData: Partial<ApiToken> = {
                    name: apiTokenForm.name,
                    service: apiTokenForm.service,
                    is_active: apiTokenForm.is_active,
                  }
                  if (apiTokenForm.token_value) {
                    updateData.token_value = apiTokenForm.token_value
                  }
                  await updateApiToken({ id: editingApiToken.id, data: updateData }).unwrap()
                  toast.success(t('settings.tokenUpdated'))
                } else {
                  await createApiToken(apiTokenForm).unwrap()
                  toast.success(t('settings.tokenCreated'))
                }
                setApiTokenDialogOpen(false)
                refetchApiTokens()
              } catch (error: any) {
                toast.error(error?.data?.detail || error?.data?.error || t('settings.tokenSaveFailed'))
              }
            }}
            disabled={!apiTokenForm.name || (!apiTokenForm.token_value && !editingApiToken)}
          >
            {editingApiToken ? t('common.update') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Affiliate Link Dialog */}
      <Dialog open={affiliateLinkDialogOpen} onClose={() => setAffiliateLinkDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAffiliateLink ? t('settings.editAffiliateLink') : t('settings.addAffiliateLink')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label={t('settings.name')}
              fullWidth
              value={affiliateLinkForm.name}
              onChange={(e) => setAffiliateLinkForm({ ...affiliateLinkForm, name: e.target.value })}
              required
            />
            <TextField
              label={t('settings.url')}
              fullWidth
              value={affiliateLinkForm.url}
              onChange={(e) => setAffiliateLinkForm({ ...affiliateLinkForm, url: e.target.value })}
              required
              placeholder={t('settings.urlPlaceholder')}
            />
            <TextField
              label={t('settings.description')}
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
              label={t('settings.enableClickTracking')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAffiliateLinkDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                if (editingAffiliateLink) {
                  await updateAffiliateLink({ id: editingAffiliateLink.id, data: affiliateLinkForm }).unwrap()
                  toast.success(t('settings.affiliateLinkUpdated'))
                } else {
                  await createAffiliateLink(affiliateLinkForm).unwrap()
                  toast.success(t('settings.affiliateLinkCreated'))
                }
                setAffiliateLinkDialogOpen(false)
                refetchAffiliateLinks()
              } catch {
                toast.error(t('settings.affiliateLinkDeleteFailed'))
              }
            }}
          >
            {editingAffiliateLink ? t('common.update') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Prompt Dialog */}
      <Dialog open={promptDialogOpen} onClose={() => setPromptDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingPrompt ? t('settings.editPrompt') : t('settings.addPrompt')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label={t('settings.name')}
              fullWidth
              value={promptForm.name}
              onChange={(e) => setPromptForm({ ...promptForm, name: e.target.value })}
              required
            />
            <TextField
              label={t('settings.description')}
              fullWidth
              multiline
              rows={2}
              value={promptForm.description}
              onChange={(e) => setPromptForm({ ...promptForm, description: e.target.value })}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>{t('settings.type')}</InputLabel>
                <Select
                  value={promptForm.type}
                  label={t('settings.type')}
                  onChange={(e) => setPromptForm({ ...promptForm, type: e.target.value as 'text' | 'image' })}
                >
                  <MenuItem value="text">{t('settings.textGeneration')}</MenuItem>
                  <MenuItem value="image">{t('settings.imageGeneration')}</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label={t('settings.blockType')}
                fullWidth
                value={promptForm.block_type}
                onChange={(e) => setPromptForm({ ...promptForm, block_type: e.target.value })}
                placeholder={t('settings.blockTypePlaceholder')}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label={t('settings.aiModel')}
                fullWidth
                value={promptForm.ai_model}
                onChange={(e) => setPromptForm({ ...promptForm, ai_model: e.target.value })}
                placeholder={promptForm.type === 'image' ? t('settings.aiModelImagePlaceholder') : t('settings.aiModelPlaceholder')}
                helperText={promptForm.type === 'image' ? t('settings.aiModelImagePlaceholder') : t('settings.aiModelPlaceholder')}
              />
              <TextField
                label={t('settings.temperature')}
                type="number"
                inputProps={{ min: 0, max: 1, step: 0.1 }}
                fullWidth
                value={promptForm.temperature}
                onChange={(e) => setPromptForm({ ...promptForm, temperature: parseFloat(e.target.value) })}
                helperText={t('settings.temperature')}
              />
            </Box>
            {promptForm.type === 'text' && (
              <TextField
                label={t('settings.maxTokens')}
                type="number"
                fullWidth
                value={promptForm.max_tokens}
                onChange={(e) => setPromptForm({ ...promptForm, max_tokens: parseInt(e.target.value) || undefined })}
                helperText={t('settings.maxTokens')}
              />
            )}
            <TextField
              label={promptForm.type === 'image' ? t('settings.imagePromptText') : t('settings.promptText')}
              fullWidth
              multiline
              rows={6}
              value={promptForm.prompt_text}
              onChange={(e) => setPromptForm({ ...promptForm, prompt_text: e.target.value })}
              required
              placeholder={t('settings.promptPlaceholder')}
              helperText={promptForm.type === 'image' ? t('settings.imagePromptText') : t('settings.promptText')}
            />
            {promptForm.type === 'text' && (
              <TextField
                label={t('settings.systemPrompt')}
                fullWidth
                multiline
                rows={3}
                value={promptForm.system_prompt}
                onChange={(e) => setPromptForm({ ...promptForm, system_prompt: e.target.value })}
                helperText={t('settings.systemPrompt')}
              />
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={promptForm.is_active}
                  onChange={(e) => setPromptForm({ ...promptForm, is_active: e.target.checked })}
                />
              }
              label={t('settings.active')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPromptDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                if (editingPrompt) {
                  await updatePrompt({ id: editingPrompt.id, data: promptForm }).unwrap()
                  toast.success(t('settings.promptUpdated'))
                } else {
                  await createPrompt(promptForm as AIPrompt).unwrap()
                  toast.success(t('settings.promptCreated'))
                }
                setPromptDialogOpen(false)
                refetchPrompts()
              } catch {
                toast.error(editingPrompt ? t('settings.promptDeleteFailed') : t('settings.promptDeleteFailed'))
              }
            }}
          >
            {editingPrompt ? t('common.update') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSS Class Lists Tab */}
      <TabPanel value={activeTab} index={8}>
        <Box sx={{ px: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                CSS Class Lists
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage custom CSS class lists for template uniqueness
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingClassList(null)
                setClassListForm({
                  name: '',
                  classes: '',
                })
                setClassListDialogOpen(true)
              }}
            >
              Add Class List
            </Button>
          </Box>

          {classLists && Object.keys(classLists).length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>{t('settings.name')}</strong></TableCell>
                    <TableCell><strong>{t('settings.classesCount')}</strong></TableCell>
                    <TableCell><strong>{t('settings.preview')}</strong></TableCell>
                    <TableCell align="right"><strong>{t('settings.actions')}</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(classLists).map(([name, classes]) => (
                    <TableRow key={name} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {name}
                        </Typography>
                      </TableCell>
                      <TableCell>{classes.length}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 400 }}>
                          {classes.slice(0, 5).map((cls, idx) => (
                            <Chip key={idx} label={cls} size="small" variant="outlined" />
                          ))}
                          {classes.length > 5 && (
                            <Chip label={t('settings.moreClasses', { count: classes.length - 5 })} size="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingClassList({ name, classes })
                              setClassListForm({
                                name,
                                classes: classes.join('\n'),
                              })
                              setClassListDialogOpen(true)
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to delete class list "${name}"?`)) {
                                try {
                                  await deleteClassList(name).unwrap()
                                  toast.success(t('settings.classListDeleted'))
                                  refetchClassLists()
                                } catch {
                                  toast.error(t('settings.classListDeleteFailed'))
                                }
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              {t('settings.noClassLists')}
            </Alert>
          )}
        </Box>
      </TabPanel>

      {/* CSS Class List Dialog */}
      <Dialog open={classListDialogOpen} onClose={() => setClassListDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingClassList ? t('settings.editCssClassList') : t('settings.addCssClassList')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label={t('settings.listName')}
              fullWidth
              value={classListForm.name}
              onChange={(e) => setClassListForm({ ...classListForm, name: e.target.value })}
              required
              placeholder={t('settings.listNamePlaceholder')}
              disabled={!!editingClassList}
              helperText={editingClassList ? t('settings.listNameHelperEdit') : t('settings.listNameHelper')}
            />
            <TextField
              label={t('settings.cssClasses')}
              fullWidth
              multiline
              rows={15}
              value={classListForm.classes}
              onChange={(e) => setClassListForm({ ...classListForm, classes: e.target.value })}
              required
              placeholder={t('settings.cssClassesPlaceholder')}
              helperText={t('settings.cssClasses')}
              InputProps={{
                sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
              }}
            />
            <Alert severity="info">
              <Typography variant="body2">
                <strong>{t('common.info')}:</strong> {t('settings.cssClassesTip')}
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClassListDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                const classesArray = classListForm.classes
                  .split('\n')
                  .map(c => c.trim())
                  .filter(c => c.length > 0)
                
                if (classesArray.length === 0) {
                  toast.error(t('settings.enterAtLeastOneClass'))
                  return
                }

                if (editingClassList) {
                  await updateClassList({
                    name: classListForm.name,
                    classes: classesArray,
                  }).unwrap()
                  toast.success(t('settings.classListUpdated'))
                } else {
                  await createClassList({
                    name: classListForm.name,
                    classes: classesArray,
                  }).unwrap()
                  toast.success(t('settings.classListCreated'))
                }
                setClassListDialogOpen(false)
                refetchClassLists()
              } catch (error: any) {
                toast.error(error?.data?.error || error?.data?.detail || t('settings.classListSaveFailed'))
              }
            }}
            disabled={!classListForm.name || !classListForm.classes.trim()}
          >
            {editingClassList ? t('common.update') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SettingsPage

