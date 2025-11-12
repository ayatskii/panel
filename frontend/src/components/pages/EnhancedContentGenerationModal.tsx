import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  IconButton,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  AutoAwesome as AutoAwesomeIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material'
import {
  useGenerateEnhancedContentMutation,
  useGetAvailablePromptsQuery,
  useGetBlockTypesQuery,
} from '@/store/api/pagesApi'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import type { Page, Prompt } from '@/types'

interface EnhancedContentGenerationModalProps {
  open: boolean
  onClose: () => void
  page: Page
  onContentGenerated?: (result: EnhancedContentResult) => void
}

const EnhancedContentGenerationModal: React.FC<EnhancedContentGenerationModalProps> = ({
  open,
  onClose,
  page,
  onContentGenerated,
}) => {
  const { t } = useTranslation()
  const [selectedBlockTypes, setSelectedBlockTypes] = useState<string[]>([])
  const [selectedPrompts, setSelectedPrompts] = useState<Record<string, number>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationResult, setGenerationResult] = useState<EnhancedContentResult | null>(null)

  const { data: blockTypesData } = useGetBlockTypesQuery()
  const [generateEnhancedContent] = useGenerateEnhancedContentMutation()

  const blockTypes = blockTypesData?.block_types || {}

  const handleBlockTypeToggle = (blockType: string) => {
    setSelectedBlockTypes(prev => {
      if (prev.includes(blockType)) {
        // Remove block type and its prompts
        const newPrompts = { ...selectedPrompts }
        const promptsToRemove = blockTypes[blockType]?.ai_prompts || []
        promptsToRemove.forEach(promptType => {
          delete newPrompts[promptType]
        })
        setSelectedPrompts(newPrompts)
        return prev.filter(type => type !== blockType)
      } else {
        return [...prev, blockType]
      }
    })
  }

  const handlePromptSelect = (promptType: string, promptId: number) => {
    setSelectedPrompts(prev => ({
      ...prev,
      [promptType]: promptId
    }))
  }

  const handleGenerate = async () => {
    if (selectedBlockTypes.length === 0) {
      toast.error(t('pages.selectAtLeastOneBlock'))
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateEnhancedContent({
        page_id: page.id,
        block_types: selectedBlockTypes,
        prompts: selectedPrompts,
      }).unwrap()

      setGenerationResult(result)
      onContentGenerated?.(result)
      
      if (result.success) {
        toast.success(t('pages.generatedBlocksCount', { count: result.generated_blocks?.length || 0 }))
      } else {
        toast.error(result.error || t('pages.generationFailed'))
      }
    } catch {
      toast.error(t('pages.generationFailed'))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClose = () => {
    setSelectedBlockTypes([])
    setSelectedPrompts({})
    setGenerationResult(null)
    onClose()
  }

  const getBlockTypeIcon = (blockType: string) => {
    const icons: Record<string, string> = {
      hero: '🎯',
      article: '📝',
      image: '🖼️',
      text_image: '📄🖼️',
      cta: '📢',
      faq: '❓',
      swiper: '🎠',
    }
    return icons[blockType] || '📦'
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <AutoAwesomeIcon color="primary" />
            <Typography variant="h6">{t('pages.enhancedContentGeneration')}</Typography>
          </Box>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('pages.enhancedContentDescription')}
        </Typography>

        {/* Block Types Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('pages.selectBlockTypes')}
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(blockTypes).map(([blockType, config]) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={blockType}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedBlockTypes.includes(blockType) ? 2 : 1,
                    borderColor: selectedBlockTypes.includes(blockType) ? 'primary.main' : 'grey.300',
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                  }}
                  onClick={() => handleBlockTypeToggle(blockType)}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Typography variant="h6" component="span">
                        {getBlockTypeIcon(blockType)}
                      </Typography>
                      <Typography variant="subtitle1">
                        {config.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {config.description}
                    </Typography>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {config.required_fields.slice(0, 2).map((field) => (
                        <Chip
                          key={field}
                          label={field}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                      {config.required_fields.length > 2 && (
                        <Chip
                          label={`+${config.required_fields.length - 2}`}
                          size="small"
                          color="default"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Prompt Selection */}
        {selectedBlockTypes.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('pages.configurePrompts')}
            </Typography>
            {selectedBlockTypes.map((blockType) => (
              <BlockTypePromptConfig
                key={blockType}
                blockType={blockType}
                config={blockTypes[blockType]}
                selectedPrompts={selectedPrompts}
                onPromptSelect={handlePromptSelect}
              />
            ))}
          </Box>
        )}

        {/* Generation Results */}
        {generationResult && (
          <Box sx={{ mb: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('pages.generationResults')}
                </Typography>
                
                {generationResult.success ? (
                  <Box>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      {t('pages.generatedBlocksCount', { count: generationResult.generated_blocks?.length || 0 })}
                    </Alert>
                    
                    {generationResult.generated_blocks?.map((block: PageBlock, index: number) => (
                      <Box key={index} sx={{ mb: 1 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {block.success ? (
                            <CheckCircleIcon color="success" fontSize="small" />
                          ) : (
                            <ErrorIcon color="error" fontSize="small" />
                          )}
                          <Typography variant="body2">
                            {block.block_type} - {block.success ? t('common.success') : t('common.failed')}
                          </Typography>
                        </Box>
                        {block.error && (
                          <Typography variant="caption" color="error" sx={{ ml: 3 }}>
                            {block.error}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="error">
                    {generationResult.error || t('pages.generationFailed')}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Errors */}
        {generationResult?.errors && generationResult.errors.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>{t('common.warnings')}:</strong>
          </Typography>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {generationResult.errors.map((error: string, index: number) => (
                <li key={index}>
                  <Typography variant="body2">{error}</Typography>
                </li>
              ))}
            </ul>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          {generationResult ? t('common.close') : t('common.cancel')}
        </Button>
        <Button
          onClick={handleGenerate}
          variant="contained"
          disabled={isGenerating || selectedBlockTypes.length === 0}
          startIcon={isGenerating ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
        >
          {isGenerating ? t('pages.generating') : t('pages.generateContent')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// Block Type Prompt Configuration Component
interface BlockTypePromptConfigProps {
  blockType: string
  config: Record<string, unknown>
  selectedPrompts: Record<string, number>
  onPromptSelect: (promptType: string, promptId: number) => void
}

const BlockTypePromptConfig: React.FC<BlockTypePromptConfigProps> = ({
  blockType,
  config,
  selectedPrompts,
  onPromptSelect,
}) => {
  const { data: promptsData, isLoading } = useGetAvailablePromptsQuery({
    block_type: blockType
  })

  const prompts = promptsData?.prompts || []

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="subtitle1">
            {config.name} Prompts
          </Typography>
          <Chip
            label={`${config.ai_prompts.length} prompts`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={20} />
          </Box>
        ) : (
          <Box>
            {config.ai_prompts.map((promptType: string) => (
              <Box key={promptType} sx={{ mb: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>
                    {promptType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </InputLabel>
                  <Select
                    value={selectedPrompts[promptType] || ''}
                    onChange={(e) => onPromptSelect(promptType, Number(e.target.value))}
                    label={promptType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  >
                    <MenuItem value="">
                      <em>No prompt selected</em>
                    </MenuItem>
                    {prompts
                      .filter((prompt: Prompt) => prompt.type === promptType)
                      .map((prompt: Prompt) => (
                        <MenuItem key={prompt.id} value={prompt.id}>
                          <Box>
                            <Typography variant="body2">{prompt.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {prompt.ai_model} • Temp: {prompt.temperature}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Box>
            ))}
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  )
}

export default EnhancedContentGenerationModal
