import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
} from '@mui/material'
import {
  Palette as PaletteIcon,
  Code as CodeIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import {
  useGenerateUniqueTemplateMutation,
  useGenerateCssClassListMutation,
} from '@/store/api/templatesApi'
import toast from 'react-hot-toast'
import type { Site, Template } from '@/types'

interface TemplateUniquenessManagerProps {
  site: Site
  template?: Template
  onTemplateProcessed?: (result: UniqueTemplateResult) => void
}

const TemplateUniquenessManager: React.FC<TemplateUniquenessManagerProps> = ({
  site,
  template,
  onTemplateProcessed,
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingClassList, setIsGeneratingClassList] = useState(false)
  const [uniqueResult, setUniqueResult] = useState<UniqueTemplateResult | null>(null)
  const [classListResult, setClassListResult] = useState<CssClassListResult | null>(null)
  const [showCssDialog, setShowCssDialog] = useState(false)
  const [showClassListDialog, setShowClassListDialog] = useState(false)
  const [newListName, setNewListName] = useState('')

  const [generateUniqueTemplate] = useGenerateUniqueTemplateMutation()
  const [generateCssClassList] = useGenerateCssClassListMutation()

  const handleGenerateUniqueTemplate = async () => {
    if (!template) {
      toast.error('No template selected')
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateUniqueTemplate({
        template_id: template.id,
        site_id: site.id,
      }).unwrap()

      setUniqueResult(result)
      onTemplateProcessed?.(result)
      
      if (result.success) {
        toast.success(`Generated ${result.total_classes} unique classes and ${result.total_styles} styles!`)
      } else {
        toast.error(result.error || 'Failed to generate unique template')
      }
    } catch {
      toast.error('Failed to generate unique template')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateClassList = async (listName: string = 'default') => {
    setIsGeneratingClassList(true)
    try {
      const result = await generateCssClassList({
        site_id: site.id,
        list_name: listName,
      }).unwrap()

      setClassListResult(result)
      
      if (result.success) {
        toast.success(`Generated ${result.count} unique CSS classes!`)
      } else {
        toast.error(result.error || 'Failed to generate CSS class list')
      }
    } catch {
      toast.error('Failed to generate CSS class list')
    } finally {
      setIsGeneratingClassList(false)
    }
  }

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopiedText(null), 2000)
  }

  const handleCreateNewClassList = () => {
    if (!newListName.trim()) {
      toast.error('Please enter a list name')
      return
    }
    handleGenerateClassList(newListName.trim())
    setNewListName('')
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <PaletteIcon color="primary" />
            <Typography variant="h6">Template Uniqueness</Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Generate unique CSS classes and styles to make your template unique and avoid conflicts.
          </Typography>

          <Grid container spacing={2}>
            {/* Template Uniqueness */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Template Uniqueness
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Generate unique CSS classes and styles for your template.
                  </Typography>
                  
                  {template ? (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        Template: <strong>{template.name}</strong>
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={handleGenerateUniqueTemplate}
                        disabled={isGenerating}
                        startIcon={isGenerating ? <CircularProgress size={16} /> : <RefreshIcon />}
                        fullWidth
                      >
                        {isGenerating ? 'Generating...' : 'Generate Unique Template'}
                      </Button>
                    </Box>
                  ) : (
                    <Alert severity="info">
                      No template selected. Please select a template first.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* CSS Class Lists */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    CSS Class Lists
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Generate custom CSS class lists for your site.
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      fullWidth
                      label="List Name"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="Enter list name"
                      size="small"
                    />
                    <Button
                      variant="outlined"
                      onClick={handleCreateNewClassList}
                      disabled={isGeneratingClassList || !newListName.trim()}
                      startIcon={isGeneratingClassList ? <CircularProgress size={16} /> : <AddIcon />}
                    >
                      Create
                    </Button>
                  </Box>
                  
                  <Button
                    variant="outlined"
                    onClick={() => handleGenerateClassList()}
                    disabled={isGeneratingClassList}
                    startIcon={isGeneratingClassList ? <CircularProgress size={16} /> : <RefreshIcon />}
                    fullWidth
                  >
                    {isGeneratingClassList ? 'Generating...' : 'Generate Default List'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Results */}
          {uniqueResult && uniqueResult.success && (
            <Box sx={{ mt: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Template Uniqueness Results</Typography>
                    <Box display="flex" gap={1}>
                      <Button
                        variant="outlined"
                        startIcon={<CodeIcon />}
                        onClick={() => setShowCssDialog(true)}
                      >
                        View CSS
                      </Button>
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Unique Classes Generated
                      </Typography>
                      <Typography variant="h4" color="primary">
                        {uniqueResult.total_classes}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Unique Styles Generated
                      </Typography>
                      <Typography variant="h4" color="primary">
                        {uniqueResult.total_styles}
                      </Typography>
                    </Grid>
                  </Grid>

                  {uniqueResult.unique_classes && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Sample Unique Classes:
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {Object.entries(uniqueResult.unique_classes).slice(0, 5).map(([original, unique]) => (
                          <Chip
                            key={original}
                            label={`${original} → ${unique}`}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {Object.keys(uniqueResult.unique_classes).length > 5 && (
                          <Chip
                            label={`+${Object.keys(uniqueResult.unique_classes).length - 5} more`}
                            size="small"
                            color="primary"
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}

          {classListResult && classListResult.success && (
            <Box sx={{ mt: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">CSS Class List Generated</Typography>
                    <Button
                      variant="outlined"
                      startIcon={<CodeIcon />}
                      onClick={() => setShowClassListDialog(true)}
                    >
                      View Classes
                    </Button>
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    List Name: <strong>{classListResult.list_name}</strong>
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {classListResult.count} Classes
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}

          {uniqueResult?.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {uniqueResult.error}
            </Alert>
          )}

          {classListResult?.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {classListResult.error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* CSS Dialog */}
      <Dialog
        open={showCssDialog}
        onClose={() => setShowCssDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Generated CSS</Typography>
            <Button
              variant="outlined"
              startIcon={<CopyIcon />}
              onClick={() => uniqueResult?.custom_css && handleCopyText(uniqueResult.custom_css)}
            >
              Copy CSS
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box component="pre" sx={{ 
            p: 2, 
            bgcolor: 'grey.100', 
            borderRadius: 1, 
            fontSize: '0.875rem',
            overflow: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {uniqueResult?.custom_css}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCssDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Class List Dialog */}
      <Dialog
        open={showClassListDialog}
        onClose={() => setShowClassListDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">CSS Class List: {classListResult?.list_name}</Typography>
            <Button
              variant="outlined"
              startIcon={<CopyIcon />}
              onClick={() => classListResult?.classes && handleCopyText(classListResult.classes.join('\n'))}
            >
              Copy Classes
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {classListResult?.classes?.map((className: string, index: number) => (
              <Chip
                key={index}
                label={className}
                size="small"
                variant="outlined"
                onClick={() => handleCopyText(className)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowClassListDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TemplateUniquenessManager
