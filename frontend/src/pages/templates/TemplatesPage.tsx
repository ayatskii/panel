import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Palette as PaletteIcon,
  Speed as SpeedIcon,
  Edit as EditIcon,
} from '@mui/icons-material'
import { useGetTemplatesQuery, useLazyPreviewTemplateQuery } from '@/store/api/templatesApi'
import { useTranslation } from 'react-i18next'

const TemplatesPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: templates, isLoading } = useGetTemplatesQuery()
  const [triggerPreview, { data: previewData, isLoading: isLoadingPreview }] = useLazyPreviewTemplateQuery()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)

  const handlePreview = async (templateId: number) => {
    await triggerPreview(templateId)
    setPreviewOpen(true)
  }

  const handleClosePreview = () => {
    setPreviewOpen(false)
  }

  const filteredTemplates = templates?.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {t('templates.title')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/templates/create')}
        >
          {t('templates.createTemplate')}
        </Button>
      </Box>

      {/* Search */}
      <TextField
        placeholder={t('templates.searchTemplates') as string}
        fullWidth
        sx={{ mb: 3 }}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="textSecondary" sx={{ mb: 2 }}>
            {t('templates.noTemplatesFound')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/templates/create')}
          >
            {t('templates.createFirstTemplate')}
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 3,
          }}
        >
          {filteredTemplates.map((template) => (
            <Card key={template.id} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Thumbnail */}
              {template.thumbnail_url ? (
                <CardMedia
                  component="img"
                  height="200"
                  image={template.thumbnail_url}
                  alt={template.name}
                />
              ) : (
                <Box
                  sx={{
                    height: 200,
                    bgcolor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography color="text.secondary">{t('templates.noPreview')}</Typography>
                </Box>
              )}

              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                  {template.name}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {template.description}
                </Typography>

                {/* Features */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  <Chip label={template.type} size="small" color="primary" variant="outlined" />
                  {template.supports_color_customization && (
                    <Chip
                      icon={<PaletteIcon fontSize="small" />}
                      label={t('templates.customizable')}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  {template.supports_page_speed && (
                    <Chip
                      icon={<SpeedIcon fontSize="small" />}
                      label={t('templates.fast')}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>

                {/* Counts */}
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {template.sites_count || 0} {t('templates.sites')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {template.footprints_count || 0} {t('templates.footprints')}
                  </Typography>
                </Box>
              </CardContent>

              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Button
                  size="small"
                  startIcon={<ViewIcon />}
                  onClick={() => handlePreview(template.id)}
                >
                  {t('common.preview')}
                </Button>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/templates/${template.id}/edit`)}
                >
                  {t('common.edit')}
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {t('templates.templatePreview')}: {previewData?.name}
          </Typography>
          <IconButton onClick={handleClosePreview} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {isLoadingPreview ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : previewData?.html ? (
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                overflow: 'hidden',
                minHeight: 400,
              }}
            >
              <iframe
                srcDoc={previewData.html}
                style={{
                  width: '100%',
                  height: '600px',
                  border: 'none',
                }}
                title={t('templates.templatePreview')}
              />
            </Box>
          ) : (
            <Typography color="text.secondary">{t('templates.noPreviewAvailable')}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TemplatesPage
