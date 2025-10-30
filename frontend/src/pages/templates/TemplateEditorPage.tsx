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
  Chip,
  FormHelperText,
} from '@mui/material'
import {
  useGetTemplateQuery,
  useUpdateTemplateMutation,
} from '@/store/api/templatesApi'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

interface TemplateFormData {
  name: string
  description: string
  type: 'monolithic' | 'sectional'
  version: string
  html_content: string
  css_content: string
  js_content: string
  css_output_type: 'inline' | 'external' | 'async' | 'path_only'
  js_output_type: 'inline' | 'external' | 'defer' | 'async' | 'path_only'
  menu_html: string
  footer_menu_html: string
  faq_block_html: string
  available_blocks: string[]
  css_framework: 'tailwind' | 'bootstrap' | 'custom'
  supports_color_customization: boolean
  color_variables: Record<string, string>
  supports_page_speed: boolean
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
      id={`template-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

const AVAILABLE_BLOCKS_OPTIONS = [
  { id: 'hero', label: 'Hero Section', description: 'Large intro section' },
  { id: 'article', label: 'Article', description: 'Text content block' },
  { id: 'image', label: 'Image', description: 'Single image block' },
  { id: 'text_image', label: 'Text + Image', description: 'Combined content' },
  { id: 'cta', label: 'Call-to-Action', description: 'Action buttons' },
  { id: 'faq', label: 'FAQ', description: 'Frequently asked questions' },
  { id: 'swiper', label: 'Swiper/Carousel', description: 'Image carousel' },
]

const TemplateEditorPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const templateId = id ? Number(id) : 0

  const { data: template, isLoading } = useGetTemplateQuery(templateId)
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateTemplateMutation()

  const [activeTab, setActiveTab] = useState(0)
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    type: 'sectional',
    version: '1.0.0',
    html_content: '<!DOCTYPE html>\n<html>\n<head>\n</head>\n<body>\n</body>\n</html>',
    css_content: 'body {\n  font-family: sans-serif;\n}',
    js_content: '',
    css_output_type: 'external',
    js_output_type: 'defer',
    menu_html: '<nav></nav>',
    footer_menu_html: '<footer></footer>',
    faq_block_html: '<div class="faq"></div>',
    available_blocks: ['hero', 'article', 'cta'],
    css_framework: 'custom',
    supports_color_customization: true,
    color_variables: {
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#F59E0B',
    },
    supports_page_speed: true,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof TemplateFormData, string>>>({})

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        type: template.type,
        version: template.version || '1.0.0',
        html_content: template.html_content || '',
        css_content: template.css_content || '',
        js_content: template.js_content || '',
        css_output_type: template.css_output_type || 'external',
        js_output_type: template.js_output_type || 'defer',
        menu_html: template.menu_html || '',
        footer_menu_html: template.footer_menu_html || '',
        faq_block_html: template.faq_block_html || '',
        available_blocks: template.available_blocks || [],
        css_framework: template.css_framework || 'custom',
        supports_color_customization: template.supports_color_customization,
        color_variables: template.color_variables || {
          primary: '#3B82F6',
          secondary: '#10B981',
          accent: '#F59E0B',
        },
        supports_page_speed: template.supports_page_speed,
      })
    }
  }, [template])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev: TemplateFormData) => ({
      ...prev,
      [name]: value,
    }))
    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'type') {
      if (value === 'monolithic' && formData.type === 'sectional') {
        setFormData({
          ...formData,
          type: value as 'monolithic' | 'sectional',
          available_blocks: [],
        })
      } else {
        setFormData({
          ...formData,
          type: value as 'monolithic' | 'sectional',
        })
      }
    } else if (name === 'css_framework') {
      setFormData({
        ...formData,
        css_framework: value as 'tailwind' | 'bootstrap' | 'custom',
      })
    } else if (name === 'css_output_type') {
      setFormData({
        ...formData,
        css_output_type: value as 'inline' | 'external' | 'async' | 'path_only',
      })
    } else if (name === 'js_output_type') {
      setFormData({
        ...formData,
        js_output_type: value as 'inline' | 'external' | 'defer' | 'async' | 'path_only',
      })
    }
    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }))
  }

  const handleSwitchChange = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev: TemplateFormData) => ({
      ...prev,
      [name]: e.target.checked,
    }))
  }

  const handleColorChange = (colorKey: string, value: string) => {
    setFormData((prev: TemplateFormData) => ({
      ...prev,
      color_variables: {
        ...prev.color_variables,
        [colorKey]: value,
      },
    }))
  }

  const toggleBlock = (blockId: string) => {
    setFormData((prev: TemplateFormData) => ({
      ...prev,
      available_blocks: prev.available_blocks.includes(blockId)
        ? prev.available_blocks.filter((b: string) => b !== blockId)
        : [...prev.available_blocks, blockId],
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TemplateFormData, string>> = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (formData.name.length > 255) newErrors.name = 'Name must be less than 255 characters'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.html_content.trim()) newErrors.html_content = 'HTML content is required'
    if (!formData.css_content.trim()) newErrors.css_content = 'CSS content is required'

    if (formData.type === 'sectional' && formData.available_blocks.length === 0) {
      newErrors.available_blocks = 'Sectional templates must have at least one available block'
    }

    if (formData.type === 'monolithic' && formData.available_blocks.length > 0) {
      newErrors.available_blocks = 'Monolithic templates cannot have modular blocks'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the form errors')
      return
    }

    try {
      await updateTemplate({ id: templateId, data: formData }).unwrap()
      toast.success('Template updated successfully')
      navigate('/templates')
    } catch (error) {
      const apiError = error as { data?: { message?: string } }
      toast.error(apiError.data?.message || 'Failed to update template')
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
        {t('templates.editTemplate')}
      </Typography>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <strong>{t('templates.adminFeature')}:</strong> {t('templates.adminFeatureDescription')}
      </Alert>

      <form onSubmit={handleSubmit}>
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Basic Info" />
            <Tab label="Content" />
            <Tab label="Sections" />
            <Tab label="Colors & Features" />
          </Tabs>

          {/* Basic Info Tab */}
          <TabPanel value={activeTab} index={0}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
              <TextField
                label="Template Name"
                name="name"
                fullWidth
                required
                value={formData.name}
                onChange={handleChange}
                error={Boolean(errors.name)}
                helperText={errors.name || 'Give your template a memorable name'}
              />

              <TextField
                label="Description"
                name="description"
                fullWidth
                required
                multiline
                rows={4}
                value={formData.description}
                onChange={handleChange}
                error={Boolean(errors.description)}
                helperText={errors.description || 'Describe what this template is for'}
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <FormControl fullWidth required>
                  <InputLabel>Template Type</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => handleSelectChange('type', e.target.value)}
                    label="Template Type"
                  >
                    <MenuItem value="monolithic">Monolithic (Fixed Structure)</MenuItem>
                    <MenuItem value="sectional">Sectional (Modular)</MenuItem>
                  </Select>
                  <FormHelperText>
                    {formData.type === 'monolithic'
                      ? 'Fixed layout - ideal for specific CMS systems'
                      : 'Modular blocks - flexible and customizable'}
                  </FormHelperText>
                </FormControl>

                <TextField
                  label="Version"
                  name="version"
                  fullWidth
                  value={formData.version}
                  onChange={handleChange}
                  helperText="e.g., 1.0.0"
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>CSS Framework</InputLabel>
                  <Select
                    value={formData.css_framework}
                    onChange={(e) => handleSelectChange('css_framework', e.target.value)}
                    label="CSS Framework"
                  >
                    <MenuItem value="tailwind">Tailwind CSS</MenuItem>
                    <MenuItem value="bootstrap">Bootstrap</MenuItem>
                    <MenuItem value="custom">Custom CSS</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>CSS Output Type</InputLabel>
                  <Select
                    value={formData.css_output_type}
                    onChange={(e) => handleSelectChange('css_output_type', e.target.value)}
                    label="CSS Output Type"
                  >
                    <MenuItem value="inline">Inline in &lt;style&gt; tags</MenuItem>
                    <MenuItem value="external">External stylesheet</MenuItem>
                    <MenuItem value="async">Async loading</MenuItem>
                    <MenuItem value="path_only">Path-only reference</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <FormControl fullWidth>
                <InputLabel>JS Output Type</InputLabel>
                <Select
                  value={formData.js_output_type}
                  onChange={(e) => handleSelectChange('js_output_type', e.target.value)}
                  label="JS Output Type"
                >
                  <MenuItem value="inline">Inline script</MenuItem>
                  <MenuItem value="external">External file</MenuItem>
                  <MenuItem value="defer">Defer loading</MenuItem>
                  <MenuItem value="async">Async loading</MenuItem>
                  <MenuItem value="path_only">Path-only reference</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </TabPanel>

          {/* Content Tab */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
              <TextField
                label="HTML Content"
                name="html_content"
                fullWidth
                multiline
                rows={15}
                value={formData.html_content}
                onChange={handleChange}
                error={Boolean(errors.html_content)}
                helperText={errors.html_content || 'Main HTML structure for your template'}
                InputProps={{
                  sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
                }}
              />

              <TextField
                label="CSS Content"
                name="css_content"
                fullWidth
                multiline
                rows={15}
                value={formData.css_content}
                onChange={handleChange}
                error={Boolean(errors.css_content)}
                helperText={errors.css_content || 'CSS styling for your template'}
                InputProps={{
                  sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
                }}
              />

              <TextField
                label="JavaScript Content"
                name="js_content"
                fullWidth
                multiline
                rows={10}
                value={formData.js_content}
                onChange={handleChange}
                helperText="Optional: JavaScript functionality for your template"
                InputProps={{
                  sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
                }}
              />
            </Box>
          </TabPanel>

          {/* Sections Tab */}
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
              <TextField
                label="Menu HTML"
                name="menu_html"
                fullWidth
                multiline
                rows={6}
                value={formData.menu_html}
                onChange={handleChange}
                helperText="Navigation menu structure"
                InputProps={{
                  sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
                }}
              />

              <TextField
                label="Footer Menu HTML"
                name="footer_menu_html"
                fullWidth
                multiline
                rows={6}
                value={formData.footer_menu_html}
                onChange={handleChange}
                helperText="Footer navigation structure"
                InputProps={{
                  sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
                }}
              />

              <TextField
                label="FAQ Block HTML"
                name="faq_block_html"
                fullWidth
                multiline
                rows={6}
                value={formData.faq_block_html}
                onChange={handleChange}
                helperText="FAQ section template"
                InputProps={{
                  sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
                }}
              />

              {formData.type === 'sectional' && (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Available Blocks
                  </Typography>
                  {errors.available_blocks && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {errors.available_blocks}
                    </Alert>
                  )}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {AVAILABLE_BLOCKS_OPTIONS.map((block) => (
                      <Chip
                        key={block.id}
                        label={block.label}
                        onClick={() => toggleBlock(block.id)}
                        variant={formData.available_blocks.includes(block.id) ? 'filled' : 'outlined'}
                        color={formData.available_blocks.includes(block.id) ? 'primary' : 'default'}
                        title={block.description}
                      />
                    ))}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                    Click to select/deselect available blocks for this template
                  </Typography>
                </Box>
              )}
            </Box>
          </TabPanel>

          {/* Colors & Features Tab */}
          <TabPanel value={activeTab} index={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Features
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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

              {formData.supports_color_customization && (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Color Variables
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    {Object.entries(formData.color_variables).map(([key, value]) => (
                      <Box key={key} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField
                          label={key.charAt(0).toUpperCase() + key.slice(1)}
                          type="color"
                          value={value}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          sx={{ width: 60 }}
                          InputProps={{
                            sx: { height: 40, cursor: 'pointer' },
                          }}
                        />
                        <TextField
                          value={value}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          fullWidth
                          placeholder="#000000"
                          helperText={`${key} color hex value`}
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </TabPanel>
        </Paper>

        {/* Form Actions */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isUpdating}
            sx={{ minWidth: 150 }}
          >
            {isUpdating ? <CircularProgress size={24} /> : 'Update Template'}
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/templates')}
            disabled={isUpdating}
          >
            Cancel
          </Button>
        </Box>
      </form>
    </Box>
  )
}

export default TemplateEditorPage
