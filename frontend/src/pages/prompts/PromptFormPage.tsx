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
  Slider,
  ListSubheader,
} from '@mui/material'
import {
  useGetPromptQuery,
  useCreatePromptMutation,
  useUpdatePromptMutation,
} from '@/store/api/aiApi'
import toast from 'react-hot-toast'
import type { AIPrompt } from '@/types'

const PromptFormPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  // Fetch data
  const { data: prompt, isLoading: promptLoading } = useGetPromptQuery(Number(id), { 
    skip: !id 
  })

  // Mutations
  const [createPrompt, { isLoading: isCreating }] = useCreatePromptMutation()
  const [updatePrompt, { isLoading: isUpdating }] = useUpdatePromptMutation()

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
      const errorMessage = apiError.data?.message || 
                          `Failed to ${isEdit ? 'update' : 'create'} prompt`
      toast.error(errorMessage)
    }
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
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        {isEdit ? 'Edit Prompt' : 'Create New Prompt'}
      </Typography>

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Basic Information
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Name"
              name="name"
              fullWidth
              required
              value={formData.name}
              onChange={handleChange}
              helperText="A descriptive name for this prompt"
            />

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

            <TextField
              label="Prompt Text"
              name="prompt_text"
              fullWidth
              required
              multiline
              rows={6}
              value={formData.prompt_text}
              onChange={handleChange}
              helperText="The actual prompt text to send to the AI. Use placeholders like {keywords}, {brand_name}, etc."
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
        </Paper>

        {/* AI Configuration */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            AI Configuration
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth required>
              <InputLabel>AI Model</InputLabel>
              <Select
                value={formData.ai_model}
                onChange={(e) => handleSelectChange('ai_model', e.target.value)}
                label="AI Model"
              >
                <ListSubheader>OpenAI</ListSubheader>
                <MenuItem value="gpt-4">GPT-4</MenuItem>
                <MenuItem value="gpt-4-turbo">GPT-4 Turbo</MenuItem>
                <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
                <MenuItem value="dall-e-3">DALL-E 3</MenuItem>
                
                <ListSubheader>Anthropic</ListSubheader>
                <MenuItem value="claude-3-opus">Claude 3 Opus</MenuItem>
                <MenuItem value="claude-3-sonnet">Claude 3 Sonnet</MenuItem>
                <MenuItem value="claude-3-haiku">Claude 3 Haiku</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography gutterBottom>
                Max Tokens: {formData.max_tokens || 'Not set'}
              </Typography>
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

            <Box>
              <Typography gutterBottom>
                Temperature: {formData.temperature}
              </Typography>
              <Slider
                value={formData.temperature}
                onChange={(_, value) => handleNumberChange('temperature', value as number)}
                min={0}
                max={1}
                step={0.1}
                marks={[
                  { value: 0, label: '0 (Deterministic)' },
                  { value: 0.5, label: '0.5 (Balanced)' },
                  { value: 1, label: '1 (Creative)' },
                ]}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={handleSwitchChange}
                />
              }
              label="Active"
            />
          </Box>
        </Paper>

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
              'Update Prompt'
            ) : (
              'Create Prompt'
            )}
          </Button>

          <Button
            variant="outlined"
            onClick={() => navigate('/prompts')}
          >
            Cancel
          </Button>
        </Box>
      </form>
    </Box>
  )
}

export default PromptFormPage
