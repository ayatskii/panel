import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Avatar,
  IconButton,
  Alert,
  Chip,
} from '@mui/material'
import {
  Image as ImageIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
} from '@mui/icons-material'
import MediaSelector from '@/components/media/MediaSelector'
import FaviconGeneratorModal from '@/components/media/FaviconGeneratorModal'
import type { SiteFormData, Media } from '@/types'

interface MediaAssetsStepProps {
  data: Partial<SiteFormData>
  onChange: (data: Partial<SiteFormData>) => void
  errors: Record<string, string>
}

const MediaAssetsStep: React.FC<MediaAssetsStepProps> = ({
  data,
  onChange,
}) => {
  const [faviconSelectorOpen, setFaviconSelectorOpen] = useState(false)
  const [logoSelectorOpen, setLogoSelectorOpen] = useState(false)
  const [footerImageSelectorOpen, setFooterImageSelectorOpen] = useState(false)
  const [faviconGeneratorOpen, setFaviconGeneratorOpen] = useState(false)

  const handleFaviconSelect = (media: Media) => {
    onChange({ favicon_media_id: media.id, favicon_media: media })
    setFaviconSelectorOpen(false)
  }

  const handleLogoSelect = (media: Media) => {
    onChange({ logo_media_id: media.id, logo_media: media })
    setLogoSelectorOpen(false)
  }

  const handleFooterImageSelect = (media: Media) => {
    onChange({ footer_image_id: media.id, footer_image: media })
    setFooterImageSelectorOpen(false)
  }

  const handleRemoveFavicon = () => {
    onChange({ favicon_media_id: undefined, favicon_media: undefined })
  }

  const handleRemoveLogo = () => {
    onChange({ logo_media_id: undefined, logo_media: undefined })
  }

  const handleRemoveFooterImage = () => {
    onChange({ footer_image_id: undefined, footer_image: undefined })
  }

  const handleFaviconsGenerated = (result: FaviconGenerationResult) => {
    if (result.success) {
      // Optionally update the form data with generated favicon info
      console.log('Favicons generated:', result)
    }
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Media & Assets
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select favicon, logo, and footer images for your site. These will be automatically optimized and deployed.
      </Typography>

      <Grid container spacing={3}>
        {/* Favicon */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <ImageIcon color="primary" />
                <Typography variant="h6">Favicon</Typography>
                <Chip label="Required" size="small" color="primary" />
              </Box>
              
              {data.favicon_media ? (
                <Box>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar
                      src={data.favicon_media.thumbnail_url || data.favicon_media.file_url}
                      variant="rounded"
                      sx={{ width: 48, height: 48 }}
                    />
                    <Box flex={1}>
                      <Typography variant="subtitle2">
                        {data.favicon_media.original_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {data.favicon_media.width}x{data.favicon_media.height}px
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => setFaviconSelectorOpen(true)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={handleRemoveFavicon}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  <Alert severity="info" sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      This image will be automatically converted to multiple favicon formats:
                      ICO, PNG (16x16, 32x32, 48x48), SVG, and Apple Touch Icon.
                    </Typography>
                  </Alert>
                </Box>
              ) : (
                <Box textAlign="center" py={3}>
                  <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    No favicon selected
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => setFaviconSelectorOpen(true)}
                    >
                      Select Favicon
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      onClick={() => setFaviconGeneratorOpen(true)}
                    >
                      Generate Favicons
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Logo */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <ImageIcon color="primary" />
                <Typography variant="h6">Logo</Typography>
                <Chip label="Required" size="small" color="primary" />
              </Box>
              
              {data.logo_media ? (
                <Box>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar
                      src={data.logo_media.thumbnail_url || data.logo_media.file_url}
                      variant="rounded"
                      sx={{ width: 48, height: 48 }}
                    />
                    <Box flex={1}>
                      <Typography variant="subtitle2">
                        {data.logo_media.original_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {data.logo_media.width}x{data.logo_media.height}px
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => setLogoSelectorOpen(true)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={handleRemoveLogo}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  <Alert severity="info" sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      This logo will be used in the header and footer of your site.
                    </Typography>
                  </Alert>
                </Box>
              ) : (
                <Box textAlign="center" py={3}>
                  <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    No logo selected
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setLogoSelectorOpen(true)}
                  >
                    Select Logo
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Footer Image */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <ImageIcon color="primary" />
                <Typography variant="h6">Footer Image</Typography>
                <Chip label="Optional" size="small" color="default" />
              </Box>
              
              {data.footer_image ? (
                <Box>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar
                      src={data.footer_image.thumbnail_url || data.footer_image.file_url}
                      variant="rounded"
                      sx={{ width: 48, height: 48 }}
                    />
                    <Box flex={1}>
                      <Typography variant="subtitle2">
                        {data.footer_image.original_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {data.footer_image.width}x{data.footer_image.height}px
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => setFooterImageSelectorOpen(true)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={handleRemoveFooterImage}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  <Alert severity="info" sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      This image will be displayed in the footer of your site.
                    </Typography>
                  </Alert>
                </Box>
              ) : (
                <Box textAlign="center" py={3}>
                  <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    No footer image selected
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setFooterImageSelectorOpen(true)}
                  >
                    Select Footer Image
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Media Selector Dialogs */}
      <MediaSelector
        open={faviconSelectorOpen}
        onClose={() => setFaviconSelectorOpen(false)}
        onSelect={handleFaviconSelect}
        title="Select Favicon"
        acceptTypes={['image/svg+xml', 'image/png', 'image/jpeg']}
      />

      <MediaSelector
        open={logoSelectorOpen}
        onClose={() => setLogoSelectorOpen(false)}
        onSelect={handleLogoSelect}
        title="Select Logo"
        acceptTypes={['image/svg+xml', 'image/png', 'image/jpeg']}
      />

      <MediaSelector
        open={footerImageSelectorOpen}
        onClose={() => setFooterImageSelectorOpen(false)}
        onSelect={handleFooterImageSelect}
        title="Select Footer Image"
        acceptTypes={['image/svg+xml', 'image/png', 'image/jpeg']}
      />

      <FaviconGeneratorModal
        open={faviconGeneratorOpen}
        onClose={() => setFaviconGeneratorOpen(false)}
        siteDomain={data.domain}
        onFaviconsGenerated={handleFaviconsGenerated}
      />
    </Box>
  )
}

export default MediaAssetsStep
