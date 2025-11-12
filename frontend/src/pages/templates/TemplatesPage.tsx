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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Palette as PaletteIcon,
  Speed as SpeedIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Code as CodeIcon,
  ViewModule as GridViewIcon,
  TableChart as TableViewIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material'
import { 
  useGetTemplatesQuery, 
  useLazyPreviewTemplateQuery,
  useGetTemplateQuery,
  useDeleteTemplateMutation,
} from '@/store/api/templatesApi'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { formatDate } from '@/utils/formatDate'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel = ({ children, value, index }: TabPanelProps) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  )
}

const TemplatesPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: templates, isLoading, refetch } = useGetTemplatesQuery()
  const [triggerPreview, { data: previewData, isLoading: isLoadingPreview }] = useLazyPreviewTemplateQuery()
  const [deleteTemplate] = useDeleteTemplateMutation()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [formatViewOpen, setFormatViewOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [selectedTemplateForMenu, setSelectedTemplateForMenu] = useState<number | null>(null)
  const [formatViewTab, setFormatViewTab] = useState(0)
  
  const { data: selectedTemplate } = useGetTemplateQuery(selectedTemplateId || 0, {
    skip: !selectedTemplateId || !formatViewOpen
  })

  const handlePreview = async (templateId: number) => {
    await triggerPreview(templateId)
    setPreviewOpen(true)
  }

  const handleClosePreview = () => {
    setPreviewOpen(false)
  }

  const handleViewFormat = (templateId: number) => {
    setSelectedTemplateId(templateId)
    setFormatViewOpen(true)
    setMenuAnchor(null)
  }

  const handleCloseFormatView = () => {
    setFormatViewOpen(false)
    setSelectedTemplateId(null)
    setFormatViewTab(0)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, templateId: number) => {
    setMenuAnchor(event.currentTarget)
    setSelectedTemplateForMenu(templateId)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setSelectedTemplateForMenu(null)
  }

  const handleDelete = async (templateId: number) => {
    if (window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      try {
        await deleteTemplate(templateId).unwrap()
        toast.success('Template deleted successfully')
        refetch()
      } catch {
        toast.error('Failed to delete template')
      }
    }
    handleMenuClose()
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
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <IconButton
              size="small"
              onClick={() => setViewMode('table')}
              color={viewMode === 'table' ? 'primary' : 'default'}
            >
              <TableViewIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setViewMode('grid')}
              color={viewMode === 'grid' ? 'primary' : 'default'}
            >
              <GridViewIcon />
            </IconButton>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/templates/create')}
          >
            {t('templates.createTemplate')}
          </Button>
        </Box>
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

      {/* Templates List */}
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
      ) : viewMode === 'table' ? (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell><strong>Version</strong></TableCell>
                <TableCell><strong>Framework</strong></TableCell>
                <TableCell><strong>Sites</strong></TableCell>
                <TableCell><strong>Created</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTemplates.map((template) => (
                <TableRow key={template.id} hover>
                  <TableCell>{template.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {template.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={template.type_display || template.type} 
                      size="small"
                      color={template.type === 'sectional' ? 'primary' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
                      {template.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>{template.version || '1.0.0'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={template.css_framework || 'custom'} 
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{template.sites_count || 0}</TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {formatDate(template.created_at, 'PP')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Tooltip title="Preview">
                        <IconButton
                          size="small"
                          onClick={() => handlePreview(template.id)}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Format">
                        <IconButton
                          size="small"
                          onClick={() => handleViewFormat(template.id)}
                        >
                          <CodeIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/templates/${template.id}/edit`)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, template.id)}
                      >
                        <MoreIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedTemplateForMenu) {
            handleViewFormat(selectedTemplateForMenu)
          }
        }}>
          <CodeIcon sx={{ mr: 1 }} fontSize="small" />
          View Format
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedTemplateForMenu) {
            navigate(`/templates/${selectedTemplateForMenu}/edit`)
          }
          handleMenuClose()
        }}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (selectedTemplateForMenu) {
              handleDelete(selectedTemplateForMenu)
            }
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Preview Dialog */}
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

      {/* Template Format Viewer Dialog */}
      <Dialog
        open={formatViewOpen}
        onClose={handleCloseFormatView}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Template Format: {selectedTemplate?.name || 'Loading...'}
          </Typography>
          <IconButton onClick={handleCloseFormatView} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedTemplate ? (
            <Box>
              <Tabs value={formatViewTab} onChange={(_, v) => setFormatViewTab(v)}>
                <Tab label="HTML" />
                <Tab label="CSS" />
                <Tab label="JavaScript" />
                {selectedTemplate.menu_html && <Tab label="Menu HTML" />}
                {selectedTemplate.footer_menu_html && <Tab label="Footer Menu" />}
                {selectedTemplate.faq_block_html && <Tab label="FAQ Block" />}
              </Tabs>

              <TabPanel value={formatViewTab} index={0}>
                <TextField
                  fullWidth
                  multiline
                  rows={20}
                  value={selectedTemplate.html_content || ''}
                  InputProps={{
                    readOnly: true,
                    sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
                  }}
                  variant="outlined"
                />
              </TabPanel>

              <TabPanel value={formatViewTab} index={1}>
                <TextField
                  fullWidth
                  multiline
                  rows={20}
                  value={selectedTemplate.css_content || ''}
                  InputProps={{
                    readOnly: true,
                    sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
                  }}
                  variant="outlined"
                />
              </TabPanel>

              <TabPanel value={formatViewTab} index={2}>
                <TextField
                  fullWidth
                  multiline
                  rows={20}
                  value={selectedTemplate.js_content || '// No JavaScript content'}
                  InputProps={{
                    readOnly: true,
                    sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
                  }}
                  variant="outlined"
                />
              </TabPanel>

              {selectedTemplate.menu_html && (
                <TabPanel value={formatViewTab} index={3}>
                  <TextField
                    fullWidth
                    multiline
                    rows={15}
                    value={selectedTemplate.menu_html}
                    InputProps={{
                      readOnly: true,
                      sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
                    }}
                    variant="outlined"
                  />
                </TabPanel>
              )}

              {selectedTemplate.footer_menu_html && (
                <TabPanel value={formatViewTab} index={selectedTemplate.menu_html ? 4 : 3}>
                  <TextField
                    fullWidth
                    multiline
                    rows={15}
                    value={selectedTemplate.footer_menu_html}
                    InputProps={{
                      readOnly: true,
                      sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
                    }}
                    variant="outlined"
                  />
                </TabPanel>
              )}

              {selectedTemplate.faq_block_html && (
                <TabPanel value={formatViewTab} index={
                  (selectedTemplate.menu_html ? 1 : 0) + (selectedTemplate.footer_menu_html ? 1 : 0) + 3
                }>
                  <TextField
                    fullWidth
                    multiline
                    rows={15}
                    value={selectedTemplate.faq_block_html}
                    InputProps={{
                      readOnly: true,
                      sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
                    }}
                    variant="outlined"
                  />
                </TabPanel>
              )}

              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Template Information:
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Type:</Typography>
                    <Typography variant="body2">{selectedTemplate.type_display || selectedTemplate.type}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">CSS Framework:</Typography>
                    <Typography variant="body2">{selectedTemplate.css_framework || 'custom'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">CSS Output:</Typography>
                    <Typography variant="body2">{selectedTemplate.css_output_type_display || selectedTemplate.css_output_type || 'external'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">JS Output:</Typography>
                    <Typography variant="body2">{selectedTemplate.js_output_type_display || selectedTemplate.js_output_type || 'defer'}</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFormatView}>Close</Button>
          {selectedTemplate && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => {
                handleCloseFormatView()
                navigate(`/templates/${selectedTemplate.id}/edit`)
              }}
            >
              Edit Template
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TemplatesPage
