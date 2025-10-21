import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Alert,
} from '@mui/material'
import {
  useGetTemplateQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
} from '@/store/api/templatesApi'
import toast from 'react-hot-toast'

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
      id={`template-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

const TemplateEditorPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const { data: template, isLoading } = useGetTemplateQuery(Number(id), { skip: !id })
  const [createTemplate, { isLoading: isCreating }] = useCreateTemplateMutation()
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateTemplateMutation()

  const [activeTab, setActiveTab] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    type: 'blog',
    description: '',
    base_html: '',
    base_css: '',
    base_js: '',
    is_monolithic: false,
    supports_color_customization: false,
    supports_page_speed: false,
    thumbnail_url: '',
  })

  useEffect(() => {
    if (template && isEdit) {
      setFormData({
        name: template.name,
        type: template.type,
        description: template.description,
        base_html: template.base_html || '',
        base_css: template.base_css || '',
        base_js: template.base_js || '',
        is_monolithic: template.is_monolithic,
        supports_color_customization: template.supports_color_customization,
        supports_page_speed: template.supports_page_speed,
        thumbnail_url: template.thumbnail_url || '',
      })
    }
  }, [template, isEdit])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSwitchChange = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [name]: e.target.checked,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (isEdit && id) {
        await updateTemplate({ id: Number(id), data: formData }).unwrap()
        toast.success('Template updated successfully')
      } else {
        await createTemplate(formData).unwrap()
        toast.success('Template created successfully')
      }
      navigate('/templates')
    } catch (error) {
      const apiError = error as { data?: { message?: string } };
      toast.error(apiError.data?.message || `Failed to ${isEdit ? 'update' : 'create'} template`);
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        {isEdit ? 'Edit Template' : 'Create Template'}
      </Typography>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <strong>Admin Only:</strong> Template changes affect all sites using this template.
      </Alert>

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Basic Info" />
            <Tab label="HTML" />
            <Tab label="CSS" />
            <Tab label="JavaScript" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
              <TextField
                label="Template Name"
                name="name"
                fullWidth
                required
                value={formData.name}
                onChange={handleChange}
              />

              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => handleSelectChange('type', e.target.value)}
                  label="Type"
                >
                  <MenuItem value="blog">Blog</MenuItem>
                  <MenuItem value="landing">Landing Page</MenuItem>
                  <MenuItem value="portfolio">Portfolio</MenuItem>
                  <MenuItem value="business">Business</MenuItem>
                  <MenuItem value="ecommerce">E-commerce</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Description"
                name="description"
                fullWidth
                required
                multiline
                rows={3}
                value={formData.description}
                onChange={handleChange}
              />

              <TextField
                label="Thumbnail URL"
                name="thumbnail_url"
                fullWidth
                value={formData.thumbnail_url}
                onChange={handleChange}
                helperText="Optional: URL to template thumbnail image"
              />

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Features</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_monolithic}
                        onChange={handleSwitchChange('is_monolithic')}
                      />
                    }
                    label="Monolithic Template (requires footprint)"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.supports_color_customization}
                        onChange={handleSwitchChange('supports_color_customization')}
                      />
                    }
                    label="Supports Color Customization"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.supports_page_speed}
                        onChange={handleSwitchChange('supports_page_speed')}
                      />
                    }
                    label="Supports Page Speed Optimization"
                  />
                </Box>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Box sx={{ p: 3 }}>
              <TextField
                label="Base HTML"
                name="base_html"
                fullWidth
                multiline
                rows={20}
                value={formData.base_html}
                onChange={handleChange}
                placeholder="Enter HTML template code..."
                InputProps={{
                  sx: { fontFamily: 'monospace', fontSize: '0.9rem' }
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Use variables like {'{'}{'{'} brand_name {'}'}{'}'},  {'{'}{'{'} content {'}'}{'}'}
              </Typography>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Box sx={{ p: 3 }}>
              <TextField
                label="Base CSS"
                name="base_css"
                fullWidth
                multiline
                rows={20}
                value={formData.base_css}
                onChange={handleChange}
                placeholder="Enter CSS code..."
                InputProps={{
                  sx: { fontFamily: 'monospace', fontSize: '0.9rem' }
                }}
              />
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <Box sx={{ p: 3 }}>
              <TextField
                label="Base JavaScript"
                name="base_js"
                fullWidth
                multiline
                rows={20}
                value={formData.base_js}
                onChange={handleChange}
                placeholder="Enter JavaScript code..."
                InputProps={{
                  sx: { fontFamily: 'monospace', fontSize: '0.9rem' }
                }}
              />
            </Box>
          </TabPanel>
        </Paper>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={isCreating || isUpdating}
          >
            {isCreating || isUpdating ? (
              <CircularProgress size={24} />
            ) : isEdit ? (
              'Update Template'
            ) : (
              'Create Template'
            )}
          </Button>

          <Button
            variant="outlined"
            onClick={() => navigate('/templates')}
          >
            Cancel
          </Button>
        </Box>
      </form>
    </Box>
  )
}

export default TemplateEditorPage
