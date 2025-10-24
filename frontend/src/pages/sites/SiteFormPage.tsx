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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material'
import {
  useGetSiteQuery,
  useCreateSiteMutation,
  useUpdateSiteMutation,
} from '@/store/api/sitesApi'
import { useGetTemplatesQuery } from '@/store/api/templatesApi'
import { useGetAffiliateLinksQuery } from '@/store/api/sitesApi'
import toast from 'react-hot-toast'
import type { SiteFormData } from '@/types'

const SiteFormPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  // Fetch data
  const { data: site, isLoading: siteLoading } = useGetSiteQuery(Number(id), { skip: !id })
  const { data: templates, isLoading: templatesLoading } = useGetTemplatesQuery()
  const { data: affiliateLinks, isLoading: linksLoading } = useGetAffiliateLinksQuery()

  // Mutations
  const [createSite, { isLoading: isCreating }] = useCreateSiteMutation()
  const [updateSite, { isLoading: isUpdating }] = useUpdateSiteMutation()

  // Form state
  const [formData, setFormData] = useState<SiteFormData>({
    domain: '',
    brand_name: '',
    language_code: 'en',
    template: 0, // Start with 0 (no template selected)
    template_footprint: undefined,
    template_variables: {},
    custom_colors: {},
    enable_page_speed: false,
    cloudflare_token: undefined,
    affiliate_link: undefined,
    allow_indexing: true,
    redirect_404_to_home: false,
    use_www_version: false,
  })

  // Set default template when templates are loaded
  useEffect(() => {
    // Template is now optional - no auto-selection needed
    // Users can choose to add a template or skip it
  }, [templates, isEdit, formData.template])

  // Selected template for feature checks
  const selectedTemplate = templates?.find(t => t.id === formData.template)

  // Load site data for editing
  useEffect(() => {
    if (site && isEdit) {
      setFormData({
        domain: site.domain,
        brand_name: site.brand_name,
        language_code: site.language_code,
        template: site.template,
        template_footprint: site.template_footprint,
        template_variables: site.template_variables || {},
        custom_colors: site.custom_colors || {},
        enable_page_speed: site.enable_page_speed || false,
        cloudflare_token: site.cloudflare_token,
        affiliate_link: site.affiliate_link,
        allow_indexing: site.allow_indexing,
        redirect_404_to_home: site.redirect_404_to_home,
        use_www_version: site.use_www_version,
      })
    }
  }, [site, isEdit])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSelectChange = (name: string, value: string | number) => {
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

  const handleColorChange = (colorKey: string, value: string) => {
    setFormData({
      ...formData,
      custom_colors: {
        ...formData.custom_colors,
        [colorKey]: value,
      },
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Template is now optional - removed strict validation
    // Users can create sites and add templates later

    try {
      // Prepare data: convert template 0 or empty string to null
      const dataToSend = {
        ...formData,
        template: formData.template && formData.template !== 0 ? formData.template : null,
        template_footprint: formData.template_footprint || null,
        affiliate_link: formData.affiliate_link || null,
        cloudflare_token: formData.cloudflare_token || null,
      }

      if (isEdit && id) {
        await updateSite({ id: Number(id), data: dataToSend }).unwrap()
        toast.success('Site updated successfully')
      } else {
        await createSite(dataToSend).unwrap()
        toast.success('Site created successfully')
      }
      navigate('/sites')
    } catch (error) {
      const apiError = error as { data?: { domain?: string[]; message?: string } };
      const errorMessage = apiError.data?.domain?.[0] || 
                          apiError.data?.message || 
                          `Failed to ${isEdit ? 'update' : 'create'} site`;
      toast.error(errorMessage);
    }
  }

  if (siteLoading || templatesLoading || linksLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        {isEdit ? 'Edit Site' : 'Create New Site'}
      </Typography>

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Basic Information
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Brand Name"
              name="brand_name"
              fullWidth
              required
              value={formData.brand_name}
              onChange={handleChange}
              helperText="The name of your website"
            />

            <TextField
              label="Domain"
              name="domain"
              fullWidth
              required
              value={formData.domain}
              onChange={handleChange}
              helperText="e.g., example.com (without http://)"
              placeholder="example.com"
            />

            <FormControl fullWidth required>
              <InputLabel>Language</InputLabel>
              <Select
                value={formData.language_code}
                onChange={(e) => handleSelectChange('language_code', e.target.value)}
                label="Language"
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
                <MenuItem value="fr">French</MenuItem>
                <MenuItem value="de">German</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Template Selection */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Template Configuration (Optional)
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth error={false}>
              <InputLabel>Template (Optional)</InputLabel>
              <Select
                value={formData.template || ''}
                onChange={(e) => handleSelectChange('template', e.target.value as number)}
                label="Template (Optional)"
              >
                <MenuItem value="">
                  None - Add template later
                </MenuItem>
                {templates?.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name} - {template.type}
                  </MenuItem>
                ))}
              </Select>
              <Typography sx={{ mt: 1, fontSize: '0.875rem', color: 'text.secondary' }}>
                You can create a site without a template and add one later
              </Typography>
            </FormControl>

            {selectedTemplate && (
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {selectedTemplate.supports_page_speed && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.enable_page_speed || false}
                        onChange={handleSwitchChange('enable_page_speed')}
                      />
                    }
                    label="Enable Page Speed Optimization"
                  />
                )}
              </Box>
            )}
          </Box>
        </Paper>

        {/* Color Customization */}
        {selectedTemplate?.supports_color_customization && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Color Customization</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Primary Color"
                  type="color"
                  value={formData.custom_colors?.primary || '#007bff'}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Secondary Color"
                  type="color"
                  value={formData.custom_colors?.secondary || '#6c757d'}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Accent Color"
                  type="color"
                  value={formData.custom_colors?.accent || '#28a745'}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Advanced Settings */}
        <Accordion sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Advanced Settings</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Affiliate Link</InputLabel>
                <Select
                  value={formData.affiliate_link || ''}
                  onChange={(e) => handleSelectChange('affiliate_link', e.target.value)}
                  label="Affiliate Link"
                >
                  <MenuItem value="">None</MenuItem>
                  {affiliateLinks?.map((link) => (
                    <MenuItem key={link.id} value={link.id}>
                      {link.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Divider />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.allow_indexing}
                    onChange={handleSwitchChange('allow_indexing')}
                  />
                }
                label="Allow Search Engine Indexing"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.redirect_404_to_home}
                    onChange={handleSwitchChange('redirect_404_to_home')}
                  />
                }
                label="Redirect 404 to Homepage"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.use_www_version}
                    onChange={handleSwitchChange('use_www_version')}
                  />
                }
                label="Use WWW Version (www.domain.com)"
              />
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={isCreating || isUpdating}
          >
            {isCreating || isUpdating ? (
              <CircularProgress size={24} />
            ) : isEdit ? (
              'Update Site'
            ) : (
              'Create Site'
            )}
          </Button>

          <Button
            variant="outlined"
            onClick={() => navigate('/sites')}
          >
            Cancel
          </Button>
        </Box>
      </form>
    </Box>
  )
}

export default SiteFormPage
