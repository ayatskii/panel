import React, { useState } from 'react'
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
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Divider,
} from '@mui/material'
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  AutoAwesome as AutoAwesomeIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material'
import {
  useRegenerateBlockContentMutation,
  useGetAvailablePromptsQuery,
} from '@/store/api/pagesApi'
import toast from 'react-hot-toast'
import type { PageBlock } from '@/types'

interface BlockRegenerationModalProps {
  open: boolean
  onClose: () => void
  block: PageBlock
  onContentRegenerated?: (result: RegenerateBlockResult) => void
}

const BlockRegenerationModal: React.FC<BlockRegenerationModalProps> = ({
  open,
  onClose,
  block,
  onContentRegenerated,
}) => {
  const [selectedPromptId, setSelectedPromptId] = useState<number | ''>('')
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [regenerationResult, setRegenerationResult] = useState<RegenerateBlockResult | null>(null)

  const { data: promptsData, isLoading } = useGetAvailablePromptsQuery({
    block_type: block.block_type
  })
  const [regenerateBlockContent] = useRegenerateBlockContentMutation()

  const prompts = promptsData?.prompts || []

  const handleRegenerate = async () => {
    if (!selectedPromptId) {
      toast.error('Please select a prompt')
      return
    }

    setIsRegenerating(true)
    try {
      const result = await regenerateBlockContent({
        block_id: block.id,
        prompt_id: Number(selectedPromptId),
      }).unwrap()

      setRegenerationResult(result)
      onContentRegenerated?.(result)
      
      if (result.success) {
        toast.success('Block content regenerated successfully!')
      } else {
        toast.error(result.error || 'Failed to regenerate content')
      }
    } catch {
      toast.error('Failed to regenerate content')
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleClose = () => {
    setSelectedPromptId('')
    setRegenerationResult(null)
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
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <AutoAwesomeIcon color="primary" />
            <Typography variant="h6">Regenerate Block Content</Typography>
          </Box>
          <Button onClick={handleClose} startIcon={<CloseIcon />}>
            Close
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Block Info */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="h6" component="span">
                {getBlockTypeIcon(block.block_type)}
              </Typography>
              <Typography variant="h6">
                {block.block_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Block
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Block ID: {block.id} • Order: {block.order}
            </Typography>
            <Box display="flex" gap={1} mt={1}>
              <Chip
                label={block.is_active ? 'Active' : 'Inactive'}
                size="small"
                color={block.is_active ? 'success' : 'default'}
              />
              <Chip
                label={`Updated: ${new Date(block.updated_at).toLocaleDateString()}`}
                size="small"
                variant="outlined"
              />
            </Box>
          </CardContent>
        </Card>

        {/* Current Content Preview */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Current Content
          </Typography>
          <Card variant="outlined">
            <CardContent>
              <Box component="pre" sx={{ 
                fontSize: '0.875rem',
                overflow: 'auto',
                maxHeight: '200px',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                bgcolor: 'grey.50',
                p: 1,
                borderRadius: 1
              }}>
                {JSON.stringify(block.content, null, 2)}
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Prompt Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Select AI Prompt
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose a prompt to regenerate content for this block.
          </Typography>
          
          {isLoading ? (
            <Box display="flex" justifyContent="center" py={2}>
              <CircularProgress size={20} />
            </Box>
          ) : (
            <FormControl fullWidth>
              <InputLabel>Available Prompts</InputLabel>
              <Select
                value={selectedPromptId}
                onChange={(e) => setSelectedPromptId(e.target.value as number | '')}
                label="Available Prompts"
              >
                <MenuItem value="">
                  <em>Select a prompt...</em>
                </MenuItem>
                {prompts.map((prompt: Prompt) => (
                  <MenuItem key={prompt.id} value={prompt.id}>
                    <Box>
                      <Typography variant="body2">{prompt.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {prompt.description} • {prompt.ai_model} • Temp: {prompt.temperature}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        {/* Regeneration Results */}
        {regenerationResult && (
          <Box sx={{ mb: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Regeneration Results
                </Typography>
                
                {regenerationResult.success ? (
                  <Box>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CheckCircleIcon />
                        <Typography variant="body2">
                          Content regenerated successfully!
                        </Typography>
                      </Box>
                    </Alert>
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Updated Content:
                    </Typography>
                    <Box component="pre" sx={{ 
                      fontSize: '0.875rem',
                      overflow: 'auto',
                      maxHeight: '150px',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      bgcolor: 'grey.50',
                      p: 1,
                      borderRadius: 1
                    }}>
                      {regenerationResult.updated_content}
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="error">
                    <Box display="flex" alignItems="center" gap={1}>
                      <ErrorIcon />
                      <Typography variant="body2">
                        {regenerationResult.error || 'Failed to regenerate content'}
                      </Typography>
                    </Box>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Box>
        )}

        {prompts.length === 0 && !isLoading && (
          <Alert severity="info">
            <Typography variant="body2">
              No prompts available for this block type. Please create some prompts first.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          {regenerationResult ? 'Close' : 'Cancel'}
        </Button>
        <Button
          onClick={handleRegenerate}
          variant="contained"
          disabled={isRegenerating || !selectedPromptId || prompts.length === 0}
          startIcon={isRegenerating ? <CircularProgress size={16} /> : <RefreshIcon />}
        >
          {isRegenerating ? 'Regenerating...' : 'Regenerate Content'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BlockRegenerationModal
