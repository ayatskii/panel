import React, { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  CircularProgress,
} from '@mui/material'
import {
  Business as BusinessIcon,
  Language as LanguageIcon,
  Link as LinkIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material'
import { useGetLanguagesQuery } from '@/store/api/sitesApi'
import { useGetTemplatesQuery } from '@/store/api/templatesApi'
import { useGetAffiliateLinksQuery } from '@/store/api/sitesApi'
import type { SiteFormData } from '@/types'

interface BasicConfigStepProps {
  data: Partial<SiteFormData>
  onChange: (data: Partial<SiteFormData>) => void
  errors: Record<string, string>
}

const BasicConfigStep: React.FC<BasicConfigStepProps> = ({
  data,
  onChange,
  errors,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

  const { data: languages, isLoading: languagesLoading } = useGetLanguagesQuery()
  const { data: templates, isLoading: templatesLoading } = useGetTemplatesQuery()
  const { data: affiliateLinks, isLoading: affiliateLinksLoading } = useGetAffiliateLinksQuery()

  useEffect(() => {
    if (templates && data.template_id) {
      const template = templates.find(t => t.id === data.template_id)
      setSelectedTemplate(template)
    }
  }, [templates, data.template_id])

  const handleBrandNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ brand_name: event.target.value })
  }

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ language_code: event.target.value })
  }

  const handleTemplateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = event.target.value
    const template = templates?.find(t => t.id === templateId)
    setSelectedTemplate(template)
    onChange({ template_id: templateId })
  }

  const handleAffiliateLinkChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ affiliate_link_id: event.target.value })
  }

  const selectedAffiliateLink = affiliateLinks?.find(link => link.id === data.affiliate_link_id)

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Basic Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure the basic settings for your site including brand name, language, template, and affiliate links.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Brand Name */}
        <TextField
          fullWidth
          label="Brand Name"
          placeholder="Enter your brand name"
          value={data.brand_name || ''}
          onChange={handleBrandNameChange}
          error={!!errors.brand_name}
          helperText={errors.brand_name || 'The name of your brand or website'}
          InputProps={{
            startAdornment: <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />

        {/* Language Selection */}
        <FormControl fullWidth error={!!errors.language_code}>
          <InputLabel>Language</InputLabel>
          <Select
            value={data.language_code || ''}
            onChange={handleLanguageChange}
            label="Language"
            startAdornment={<LanguageIcon sx={{ mr: 1, color: 'text.secondary' }} />}
          >
            {languagesLoading ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Loading languages...
              </MenuItem>
            ) : (
              languages?.map((language) => (
                <MenuItem key={language.id} value={language.code}>
                  {language.name} ({language.code})
                </MenuItem>
              ))
            )}
          </Select>
          {errors.language_code && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
              {errors.language_code}
            </Typography>
          )}
        </FormControl>

        {/* Template Selection */}
        <FormControl fullWidth error={!!errors.template_id}>
          <InputLabel>Template</InputLabel>
          <Select
            value={data.template_id || ''}
            onChange={handleTemplateChange}
            label="Template"
            startAdornment={<PaletteIcon sx={{ mr: 1, color: 'text.secondary' }} />}
          >
            {templatesLoading ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Loading templates...
              </MenuItem>
            ) : (
              templates?.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography variant="body2">{template.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {template.type_display} • {template.css_framework}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
          </Select>
          {errors.template_id && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
              {errors.template_id}
            </Typography>
          )}
        </FormControl>

        {/* Template Preview */}
        {selectedTemplate && (
          <Card sx={{ bgcolor: 'grey.50' }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Selected Template: {selectedTemplate.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={selectedTemplate.type_display} size="small" />
                <Chip label={selectedTemplate.css_framework} size="small" />
                {selectedTemplate.supports_color_customization && (
                  <Chip label="Color Customization" size="small" color="primary" />
                )}
                {selectedTemplate.supports_page_speed && (
                  <Chip label="Page Speed Optimized" size="small" color="success" />
                )}
              </Box>
              {selectedTemplate.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {selectedTemplate.description}
                </Typography>
              )}
            </CardContent>
          </Card>
        )}

        {/* Affiliate Link Selection */}
        <FormControl fullWidth>
          <InputLabel>Affiliate Link (Optional)</InputLabel>
          <Select
            value={data.affiliate_link_id || ''}
            onChange={handleAffiliateLinkChange}
            label="Affiliate Link (Optional)"
            startAdornment={<LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />}
          >
            <MenuItem value="">
              <em>No affiliate link</em>
            </MenuItem>
            {affiliateLinksLoading ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Loading affiliate links...
              </MenuItem>
            ) : (
              affiliateLinks?.map((link) => (
                <MenuItem key={link.id} value={link.id}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography variant="body2">{link.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {link.url}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        {/* Selected Affiliate Link Preview */}
        {selectedAffiliateLink && (
          <Card sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Selected Affiliate Link
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                {selectedAffiliateLink.url}
              </Typography>
              {selectedAffiliateLink.description && (
                <Typography variant="body2" color="text.secondary">
                  {selectedAffiliateLink.description}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip 
                  label={selectedAffiliateLink.click_tracking ? 'Tracking Enabled' : 'No Tracking'} 
                  size="small" 
                  color={selectedAffiliateLink.click_tracking ? 'success' : 'default'}
                />
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  )
}

export default BasicConfigStep
