import { useState, useEffect, useRef } from 'react'
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
  Slider,
  ListSubheader,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Grid,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  PlayArrow as TestIcon,
  ContentCopy as CopyIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material'
import {
  useGetPromptQuery,
  useCreatePromptMutation,
  useUpdatePromptMutation,
  useTestPromptMutation,
} from '@/store/api/aiApi'
import toast from 'react-hot-toast'
import type { AIPrompt } from '@/types'

// Common variable placeholders
const VARIABLE_PLACEHOLDERS = [
  { name: 'keywords', description: 'Comma-separated list of keywords', example: '{keywords}' },
  { name: 'brand_name', description: 'Brand or company name', example: '{brand_name}' },
  { name: 'lsi_phrases', description: 'LSI (Latent Semantic Indexing) phrases', example: '{lsi_phrases}' },
  { name: 'page_title', description: 'Page title', example: '{page_title}' },
  { name: 'domain', description: 'Site domain', example: '{domain}' },
  { name: 'language', description: 'Language code (e.g., en, es)', example: '{language}' },
  { name: 'affiliate_link', description: 'Affiliate link URL', example: '{affiliate_link}' },
  { name: 'button_text', description: 'Call-to-action button text', example: '{button_text}' },
  { name: 'cta_text', description: 'Call-to-action text', example: '{cta_text}' },
]

// Prompt templates for common use cases
const PROMPT_TEMPLATES = [
  {
    name: 'Article Content',
    description: 'Generate SEO-optimized article content',
    prompt: 'Write an informative article about {brand_name} that naturally incorporates these keywords: {keywords} and these LSI phrases: {lsi_phrases}. Make it engaging and SEO-friendly, around 300-400 words.',
    systemPrompt: 'You are an expert content writer specializing in SEO-optimized web content. Generate engaging, informative content that is optimized for search engines.',
  },
  {
    name: 'Hero Section',
    description: 'Create compelling hero section content',
    prompt: 'Create a compelling hero section for {brand_name}. Include: 1) A catchy headline that includes these keywords: {keywords}, 2) A compelling subtitle, 3) A call-to-action button text. Format each on a new line.',
    systemPrompt: 'You are a creative copywriter specializing in conversion-optimized headlines and CTAs.',
  },
  {
    name: 'FAQ Content',
    description: 'Generate FAQ questions and answers',
    prompt: 'Generate 5-7 frequently asked questions and answers about {brand_name} related to {keywords}. Make them natural and helpful.',
    systemPrompt: 'You are a helpful assistant that creates clear, informative FAQ content.',
  },
  {
    name: 'Meta Description',
    description: 'Create SEO meta descriptions',
    prompt: 'Write a compelling meta description (150-160 characters) for {page_title} about {brand_name} that includes {keywords}.',
    systemPrompt: 'You are an SEO expert specializing in meta descriptions that drive clicks.',
  },
]

// AI Models organized by provider
const AI_MODELS = [
  {
    provider: 'OpenAI',
    models: [
      { value: 'gpt-4', label: 'GPT-4', description: 'Most capable model, best for complex tasks' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Faster and cheaper than GPT-4' },
      { value: 'gpt-4o', label: 'GPT-4o', description: 'Optimized GPT-4 variant' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
      { value: 'dall-e-3', label: 'DALL-E 3', description: 'Image generation model' },
    ],
  },
  {
    provider: 'Anthropic',
    models: [
      { value: 'claude-3-opus', label: 'Claude 3 Opus', description: 'Most powerful Claude model' },
      { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet', description: 'Balanced performance and speed' },
      { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', description: 'Latest Claude model with improved performance' },
      { value: 'claude-3-haiku', label: 'Claude 3 Haiku', description: 'Fastest and most affordable' },
    ],
  },
]

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

const PromptFormPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const promptTextRef = useRef<HTMLTextAreaElement>(null)

  // Fetch data
  const { data: prompt, isLoading: promptLoading } = useGetPromptQuery(Number(id), {
    skip: !id,
  })

  // Mutations
  const [createPrompt, { isLoading: isCreating }] = useCreatePromptMutation()
  const [updatePrompt, { isLoading: isUpdating }] = useUpdatePromptMutation()
  const [testPrompt, { isLoading: isTesting, data: testResult }] = useTestPromptMutation()

  // Form state
  const [formData, setFormData] = useState<Partial<AIPrompt>>({
    name: '',
    description: '',
    type: 'text',
    block_type: '',
    prompt_text: '',
    system_prompt: '',
    ai_model: 'gpt-4',
    max_tokens: 1000,
    temperature: 0.7,
    is_active: true,
  })

  // UI state
  const [activeTab, setActiveTab] = useState(0)
  const [testVariables, setTestVariables] = useState<Record<string, string>>({
    keywords: 'example, keywords',
    brand_name: 'Example Brand',
    lsi_phrases: 'related terms',
    page_title: 'Example Page',
    domain: 'example.com',
    language: 'en',
  })
  const [showTestResult, setShowTestResult] = useState(false)

  // Load prompt data for editing
  useEffect(() => {
    if (prompt && isEdit) {
      setFormData({
        name: prompt.name,
        description: prompt.description,
        type: prompt.type,
        block_type: prompt.block_type,
        prompt_text: prompt.prompt_text,
        system_prompt: prompt.system_prompt || '',
        ai_model: prompt.ai_model,
        max_tokens: prompt.max_tokens,
        temperature: prompt.temperature,
        is_active: prompt.is_active,
      })
    }
  }, [prompt, isEdit])

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

  const handleNumberChange = (name: string, value: number) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      is_active: e.target.checked,
    })
  }

  const insertVariable = (variable: string) => {
    if (promptTextRef.current) {
      const textarea = promptTextRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = formData.prompt_text || ''
      const newText = text.substring(0, start) + variable + text.substring(end)
      
      setFormData({
        ...formData,
        prompt_text: newText,
      })

      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length, start + variable.length)
      }, 0)
    }
  }

  const applyTemplate = (template: typeof PROMPT_TEMPLATES[0]) => {
    setFormData({
      ...formData,
      prompt_text: template.prompt,
      system_prompt: template.systemPrompt,
    })
    toast.success(`Applied "${template.name}" template`)
  }

  const handleTestPrompt = async () => {
    if (!id && !formData.prompt_text) {
      toast.error('Please save the prompt first or enter prompt text')
      return
    }

    try {
      // Replace variables in prompt text for testing
      let testPromptText = formData.prompt_text || ''
      Object.entries(testVariables).forEach(([key, value]) => {
        testPromptText = testPromptText.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
      })

      if (isEdit && id) {
        await testPrompt({ id: Number(id), input: testPromptText }).unwrap()
      } else {
        // For new prompts, we'd need a different endpoint or just show preview
        toast.info('Save the prompt first to test it with the AI')
        return
      }
      setShowTestResult(true)
    } catch (error) {
      const apiError = error as { data?: { message?: string } }
      toast.error(apiError.data?.message || 'Failed to test prompt')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.prompt_text || !formData.ai_model) {
      toast.error('Name, prompt text, and AI model are required')
      return
    }

    try {
      if (isEdit && id) {
        await updatePrompt({ id: Number(id), data: formData }).unwrap()
        toast.success('Prompt updated successfully')
      } else {
        await createPrompt(formData).unwrap()
        toast.success('Prompt created successfully')
      }
      navigate('/prompts')
    } catch (error) {
      const apiError = error as { data?: { message?: string } }
      const errorMessage =
        apiError.data?.message || `Failed to ${isEdit ? 'update' : 'create'} prompt`
      toast.error(errorMessage)
    }
  }

  // Calculate estimated tokens (rough approximation: 1 token ≈ 4 characters)
  const estimatedTokens = formData.prompt_text
    ? Math.ceil(formData.prompt_text.length / 4)
    : 0

  // Preview prompt with variables replaced
  const previewPrompt = () => {
    let preview = formData.prompt_text || ''
    Object.entries(testVariables).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
    })
    return preview
  }

  if (promptLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {isEdit ? 'Edit Prompt' : 'Create New Prompt'}
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/prompts')}>
          Back to Prompts
        </Button>
      </Box>

      <form onSubmit={handleSubmit}>
        {/* Basic Information Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="primary" />
            Basic Information
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <TextField
                label="Name"
                name="name"
                fullWidth
                required
                value={formData.name}
                onChange={handleChange}
                helperText="A descriptive name for this prompt"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => handleSelectChange('type', e.target.value)}
                  label="Type"
                >
                  <MenuItem value="text">Text Generation</MenuItem>
                  <MenuItem value="image">Image Generation</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Description"
                name="description"
                fullWidth
                multiline
                rows={2}
                value={formData.description}
                onChange={handleChange}
                helperText="What does this prompt do?"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Block Type</InputLabel>
                <Select
                  value={formData.block_type}
                  onChange={(e) => handleSelectChange('block_type', e.target.value)}
                  label="Block Type"
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="hero">Hero</MenuItem>
                  <MenuItem value="article">Article</MenuItem>
                  <MenuItem value="title">Title</MenuItem>
                  <MenuItem value="description">Description</MenuItem>
                  <MenuItem value="faq">FAQ</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch checked={formData.is_active} onChange={handleSwitchChange} />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Prompt Content Section with Tabs */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab label="Prompt Text" />
              <Tab label="Variables" />
              <Tab label="Templates" />
              <Tab label="Preview" />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Prompt Text"
                name="prompt_text"
                fullWidth
                required
                multiline
                rows={8}
                value={formData.prompt_text}
                onChange={handleChange}
                inputRef={promptTextRef}
                helperText={`Use {variable_name} for placeholders. Estimated tokens: ${estimatedTokens}`}
                placeholder="Enter your prompt instructions here..."
              />

              <TextField
                label="System Prompt (Optional)"
                name="system_prompt"
                fullWidth
                multiline
                rows={3}
                value={formData.system_prompt}
                onChange={handleChange}
                helperText="System prompt for ChatGPT/Claude models (optional)"
                placeholder="You are a helpful assistant that..."
              />
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Click on any variable to insert it into your prompt text at the cursor position.
            </Alert>
            <Grid container spacing={2}>
              {VARIABLE_PLACEHOLDERS.map((variable) => (
                <Grid item xs={12} sm={6} md={4} key={variable.name}>
                  <Paper
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => insertVariable(variable.example)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {variable.example}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {variable.description}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigator.clipboard.writeText(variable.example)
                          toast.success('Copied to clipboard')
                        }}
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Click on a template to apply it to your prompt. You can modify it afterwards.
            </Alert>
            <Grid container spacing={2}>
              {PROMPT_TEMPLATES.map((template) => (
                <Grid item xs={12} md={6} key={template.name}>
                  <Paper
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                      height: '100%',
                    }}
                    onClick={() => applyTemplate(template)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 1, mb: 1 }}>
                      <LightbulbIcon color="primary" />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {template.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {template.description}
                        </Typography>
                      </Box>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        whiteSpace: 'pre-wrap',
                        maxHeight: 100,
                        overflow: 'auto',
                      }}
                    >
                      {template.prompt.substring(0, 150)}
                      {template.prompt.length > 150 ? '...' : ''}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="info">
                Preview how your prompt will look with variables replaced. Edit test values below.
              </Alert>

              <Grid container spacing={2}>
                {Object.entries(testVariables).map(([key, value]) => (
                  <Grid item xs={12} sm={6} md={4} key={key}>
                    <TextField
                      label={`{${key}}`}
                      fullWidth
                      size="small"
                      value={value}
                      onChange={(e) =>
                        setTestVariables({ ...testVariables, [key]: e.target.value })
                      }
                    />
                  </Grid>
                ))}
              </Grid>

              <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Preview:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
                >
                  {previewPrompt() || 'Enter prompt text to see preview'}
                </Typography>
              </Paper>
            </Box>
          </TabPanel>
        </Paper>

        {/* AI Configuration */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="primary" />
            AI Configuration
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>AI Model</InputLabel>
                <Select
                  value={formData.ai_model}
                  onChange={(e) => handleSelectChange('ai_model', e.target.value)}
                  label="AI Model"
                >
                  {AI_MODELS.map((provider) => [
                    <ListSubheader key={provider.provider}>{provider.provider}</ListSubheader>,
                    ...provider.models.map((model) => (
                      <MenuItem key={model.value} value={model.value}>
                        <Box>
                          <Typography variant="body2">{model.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {model.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    )),
                  ])}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Max Tokens</Typography>
                  <TextField
                    size="small"
                    type="number"
                    value={formData.max_tokens || ''}
                    onChange={(e) =>
                      handleNumberChange('max_tokens', parseInt(e.target.value) || 0)
                    }
                    inputProps={{ min: 100, max: 4000, step: 100 }}
                    sx={{ width: 100 }}
                  />
                </Box>
                <Slider
                  value={formData.max_tokens || 1000}
                  onChange={(_, value) => handleNumberChange('max_tokens', value as number)}
                  min={100}
                  max={4000}
                  step={100}
                  marks={[
                    { value: 100, label: '100' },
                    { value: 1000, label: '1000' },
                    { value: 2000, label: '2000' },
                    { value: 4000, label: '4000' },
                  ]}
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Temperature: {formData.temperature}</Typography>
                  <Chip
                    label={
                      formData.temperature < 0.3
                        ? 'Deterministic'
                        : formData.temperature < 0.7
                        ? 'Balanced'
                        : 'Creative'
                    }
                    size="small"
                    color={
                      formData.temperature < 0.3
                        ? 'default'
                        : formData.temperature < 0.7
                        ? 'primary'
                        : 'secondary'
                    }
                  />
                </Box>
                <Slider
                  value={formData.temperature}
                  onChange={(_, value) => handleNumberChange('temperature', value as number)}
                  min={0}
                  max={1}
                  step={0.1}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 0.5, label: '0.5' },
                    { value: 1, label: '1' },
                  ]}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Lower values make output more focused and deterministic. Higher values make it more
                  creative and random.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Test Section */}
        {isEdit && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TestIcon color="primary" />
                  <Typography variant="h6">Test Prompt</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Alert severity="info">
                    Test your prompt with the AI. Variables will be replaced with test values.
                  </Alert>

                  <Button
                    variant="outlined"
                    startIcon={isTesting ? <CircularProgress size={20} /> : <TestIcon />}
                    onClick={handleTestPrompt}
                    disabled={isTesting}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    {isTesting ? 'Testing...' : 'Test Prompt'}
                  </Button>

                  {testResult && showTestResult && (
                    <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Test Result:
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {testResult.content || 'No content returned'}
                      </Typography>
                      {testResult.tokens_used && (
                        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                          Tokens used: {testResult.tokens_used}
                        </Typography>
                      )}
                    </Paper>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Paper>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={() => navigate('/prompts')}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isCreating || isUpdating}
            sx={{ minWidth: 150 }}
          >
            {isCreating || isUpdating ? (
              <CircularProgress size={24} />
            ) : isEdit ? (
              'Update Prompt'
            ) : (
              'Create Prompt'
            )}
          </Button>
        </Box>
      </form>
    </Box>
  )
}

export default PromptFormPage
