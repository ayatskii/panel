import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  IconButton,
} from '@mui/material'
import {
  Close as CloseIcon,
  AutoAwesome as AIIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { useGetPromptsQuery } from '@/store/api/aiApi'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

interface ContentGenerationModalProps {
  open: boolean
  onClose: () => void
  pageId: number
  onContentGenerated?: (content: unknown) => void
  initialConfig?: {
    generate_meta: boolean
    generate_images: boolean
    block_types: string[]
    model: string
  }
}

interface GenerationStep {
  id: string
  name: string
  type: 'meta' | 'block' | 'image'
  blockType?: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: unknown
  error?: string
}

const ContentGenerationModal = ({ 
  open, 
  onClose, 
  pageId, 
  onContentGenerated,
  initialConfig
}: ContentGenerationModalProps) => {
  const { t } = useTranslation()
  const [activeStep, setActiveStep] = useState(0)
  const [workflowId, setWorkflowId] = useState<string | null>(null)
  const [workflowStatus, setWorkflowStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle')
  const [steps, setSteps] = useState<GenerationStep[]>([])
  const [selectedBlockTypes, setSelectedBlockTypes] = useState<string[]>([])
  const [selectedPrompts, setSelectedPrompts] = useState<Record<string, number>>({})
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo')
  const [generateMeta, setGenerateMeta] = useState(true)
  const [generateImages, setGenerateImages] = useState(false)
  const [workflowError, setWorkflowError] = useState<string | null>(null)

  const { data: prompts } = useGetPromptsQuery()

  // Apply initial config when provided
  useEffect(() => {
    if (initialConfig && open) {
      setGenerateMeta(initialConfig.generate_meta)
      setGenerateImages(initialConfig.generate_images)
      setSelectedBlockTypes(initialConfig.block_types)
      setSelectedModel(initialConfig.model)
    }
  }, [initialConfig, open])

  const availableBlockTypes = [
    { id: 'hero', name: t('pages.blockTypes.heroBanner'), description: t('pages.blockTypes.heroBannerDesc') },
    { id: 'article', name: t('pages.blockTypes.articleContent'), description: t('pages.blockTypes.articleContentDesc') },
    { id: 'faq', name: t('pages.blockTypes.faqSection'), description: t('pages.blockTypes.faqSectionDesc') },
    { id: 'swiper', name: t('pages.blockTypes.gameCarousel'), description: t('pages.blockTypes.gameCarouselDesc') },
    { id: 'cta', name: t('pages.blockTypes.callToAction'), description: t('pages.blockTypes.callToActionDesc') },
    { id: 'image', name: t('pages.blockTypes.imageBlock'), description: t('pages.blockTypes.imageBlockDesc') },
  ]

  const availableModels = [
    { id: 'gpt-3.5-turbo', name: t('pages.aiModels.gpt35Turbo'), description: t('pages.aiModels.gpt35TurboDesc') },
    { id: 'gpt-4', name: t('pages.aiModels.gpt4'), description: t('pages.aiModels.gpt4Desc') },
    { id: 'claude-3-sonnet', name: t('pages.aiModels.claude3Sonnet'), description: t('pages.aiModels.claude3SonnetDesc') },
    { id: 'claude-3-opus', name: t('pages.aiModels.claude3Opus'), description: t('pages.aiModels.claude3OpusDesc') },
  ]

  const handleBlockTypeChange = (blockType: string, checked: boolean) => {
    if (checked) {
      setSelectedBlockTypes(prev => [...prev, blockType])
    } else {
      setSelectedBlockTypes(prev => prev.filter(bt => bt !== blockType))
      // Remove prompt selection for this block type
      setSelectedPrompts(prev => {
        const newPrompts = { ...prev }
        delete newPrompts[blockType]
        return newPrompts
      })
    }
  }

  const handlePromptChange = (blockType: string, promptId: number) => {
    setSelectedPrompts(prev => ({
      ...prev,
      [blockType]: promptId
    }))
  }

  const createWorkflowSteps = (): GenerationStep[] => {
    const workflowSteps: GenerationStep[] = []

    if (generateMeta) {
      workflowSteps.push({
        id: 'meta',
        name: t('pages.generateMetaContent'),
        type: 'meta',
        status: 'pending'
      })
    }

    selectedBlockTypes.forEach((blockType) => {
      const blockTypeInfo = availableBlockTypes.find(bt => bt.id === blockType)
      workflowSteps.push({
        id: `block_${blockType}`,
        name: t('pages.generateBlockContent', { blockType: blockTypeInfo?.name || blockType }),
        type: 'block',
        blockType,
        status: 'pending'
      })
    })

    if (generateImages) {
      workflowSteps.push({
        id: 'images',
        name: t('pages.generateImages'),
        type: 'image',
        status: 'pending'
      })
    }

    return workflowSteps
  }

  const startWorkflow = async () => {
    if (selectedBlockTypes.length === 0 && !generateMeta) {
      toast.error(t('pages.selectAtLeastOne'))
      return
    }

    try {
      setWorkflowStatus('running')
      setWorkflowError(null)
      setSteps(createWorkflowSteps())

      const workflowConfig = {
        generate_meta: generateMeta,
        generate_images: generateImages,
        block_types: selectedBlockTypes,
        prompt_ids: selectedPrompts,
        model: selectedModel
      }

      const response = await fetch(`/api/pages/${pageId}/start_workflow/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ config: workflowConfig })
      })

      if (response.ok) {
        const data = await response.json()
        setWorkflowId(data.workflow.workflow_id)
        toast.success(t('pages.workflowStarted'))
        
        // Start polling for workflow status
        pollWorkflowStatus(data.workflow.workflow_id)
      } else {
        const errorData = await response.json()
        setWorkflowError(errorData.error || t('pages.failedStartWorkflow'))
        setWorkflowStatus('failed')
      }
    } catch {
      setWorkflowError(t('pages.failedStartWorkflow'))
      setWorkflowStatus('failed')
      toast.error(t('pages.failedStartWorkflow'))
    }
  }

  const pollWorkflowStatus = async (id: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/pages/workflow_status/?workflow_id=${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        })

        if (response.ok) {
          const statusData = await response.json()
          
          if (statusData.status === 'completed') {
            setWorkflowStatus('completed')
            setSteps(prev => prev.map(step => ({ ...step, status: 'completed' })))
            clearInterval(pollInterval)
            toast.success(t('pages.generationCompleted'))
            
            if (onContentGenerated) {
              onContentGenerated(statusData.results)
            }
          } else if (statusData.status === 'failed') {
            setWorkflowStatus('failed')
            setWorkflowError(statusData.error || t('pages.workflowFailed'))
            clearInterval(pollInterval)
            toast.error(t('pages.generationFailed'))
          }
        }
      } catch (error) {
        console.error('Failed to poll workflow status:', error)
      }
    }, 2000) // Poll every 2 seconds

    // Cleanup interval after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
    }, 300000)
  }

  const cancelWorkflow = async () => {
    if (!workflowId) return

    try {
      const response = await fetch('/api/pages/cancel_workflow/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ workflow_id: workflowId })
      })

      if (response.ok) {
        setWorkflowStatus('idle')
        setWorkflowId(null)
        toast.success(t('pages.workflowCancelled'))
      }
    } catch {
      toast.error(t('pages.failedCancelWorkflow'))
    }
  }

  const resetWorkflow = () => {
    setWorkflowStatus('idle')
    setWorkflowId(null)
    setSteps([])
    setWorkflowError(null)
    setActiveStep(0)
  }

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <SuccessIcon color="success" />
      case 'failed':
        return <ErrorIcon color="error" />
      case 'running':
        return <CircularProgress size={20} />
      default:
        return null
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '700px' }
      }}
    >
      <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon color="primary" />
            <Typography variant="h6">{t('pages.aiContentGeneration')}</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {workflowStatus === 'idle' && (
          <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>
              {t('pages.configureGeneration')}
            </Typography>

            {/* Meta Generation */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={generateMeta}
                      onChange={(e) => setGenerateMeta(e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle1">{t('pages.generateMeta')}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('pages.generateMetaDescription')}
                      </Typography>
                    </Box>
                  }
                />
              </CardContent>
            </Card>

            {/* Block Types */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  {t('pages.selectBlocksToGenerate')}
                </Typography>
                <FormGroup>
                  {availableBlockTypes.map((blockType) => (
                    <Box key={blockType.id} sx={{ mb: 2 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedBlockTypes.includes(blockType.id)}
                            onChange={(e) => handleBlockTypeChange(blockType.id, e.target.checked)}
                          />
                        }
                        label={
                          <Box>
                      <Typography variant="subtitle2">{blockType.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                          {blockType.description}
                            </Typography>
                          </Box>
                        }
                      />
                      
                      {/* Prompt Selection for this block type */}
                      {selectedBlockTypes.includes(blockType.id) && prompts && (
                        <Box sx={{ ml: 4, mt: 1 }}>
                          <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>{t('pages.selectPrompt')}</InputLabel>
                            <Select
                              value={selectedPrompts[blockType.id] || ''}
                              onChange={(e) => handlePromptChange(blockType.id, Number(e.target.value))}
                              label={t('pages.selectPrompt')}
                            >
                              <MenuItem value="">
                                <em>{t('pages.useDefaultPrompt')}</em>
                              </MenuItem>
                              {prompts
                                .filter(prompt => prompt.block_type === blockType.id)
                                .map((prompt) => (
                                  <MenuItem key={prompt.id} value={prompt.id}>
                                    {prompt.name}
                                  </MenuItem>
                                ))}
                            </Select>
                          </FormControl>
                        </Box>
                      )}
                    </Box>
                  ))}
                </FormGroup>
              </CardContent>
            </Card>

            {/* Image Generation */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={generateImages}
                      onChange={(e) => setGenerateImages(e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle1">{t('pages.generateImages')}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('pages.generateImagesDescription')}
                      </Typography>
                    </Box>
                  }
                />
              </CardContent>
            </Card>

            {/* Model Selection */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  {t('pages.selectAiModel')}
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>{t('pages.aiModel')}</InputLabel>
                  <Select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    label={t('pages.aiModel')}
                  >
                    {availableModels.map((model) => (
                      <MenuItem key={model.id} value={model.id}>
                        <Box>
                          <Typography variant="subtitle2">{model.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {model.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Box>
        )}

        {workflowStatus === 'running' && (
          <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>
              {t('pages.generatingContent')}
            </Typography>
            
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((step) => (
                <Step key={step.id}>
                  <StepLabel
                    icon={getStepIcon(step.status)}
                    optional={
                      step.status === 'completed' && (
                        <Typography variant="caption" color="success.main">
                          {t('common.completed')}
                        </Typography>
                      )
                    }
                  >
                    {step.name}
                  </StepLabel>
                  <StepContent>
                    {step.status === 'running' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} />
                        <Typography variant="body2">{t('pages.generatingContent')}</Typography>
                      </Box>
                    )}
                    {step.status === 'failed' && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        {step.error || t('pages.generationFailed')}
                      </Alert>
                    )}
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}

        {workflowStatus === 'completed' && (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              {t('pages.generationCompleted')}
            </Alert>
            
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('pages.generatedContentSummary')}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {steps.map((step) => (
                <Chip
                  key={step.id}
                  label={step.name}
                  color={step.status === 'completed' ? 'success' : 'default'}
                  icon={getStepIcon(step.status)}
                />
              ))}
            </Box>
          </Box>
        )}

        {workflowStatus === 'failed' && (
          <Box>
            <Alert severity="error" sx={{ mb: 3 }}>
              {workflowError || t('pages.generationFailed')}
            </Alert>
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={resetWorkflow}
            >
              {t('common.tryAgain')}
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {workflowStatus === 'idle' && (
          <>
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            <Button
              variant="contained"
              startIcon={<StartIcon />}
              onClick={startWorkflow}
              disabled={selectedBlockTypes.length === 0 && !generateMeta}
            >
              {t('pages.startGeneration')}
            </Button>
          </>
        )}
        
        {workflowStatus === 'running' && (
          <Button
            variant="outlined"
            startIcon={<StopIcon />}
            onClick={cancelWorkflow}
            color="error"
          >
            {t('pages.cancelWorkflow')}
          </Button>
        )}
        
        {(workflowStatus === 'completed' || workflowStatus === 'failed') && (
          <>
            <Button onClick={onClose}>{t('common.close')}</Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={resetWorkflow}
            >
              {t('pages.generateMore')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ContentGenerationModal
