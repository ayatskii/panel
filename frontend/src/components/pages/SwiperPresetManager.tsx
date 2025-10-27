import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Chip,
  TextField,
  Alert,
  CircularProgress,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  Grid,
} from '@mui/material'
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  PlayArrow as ApplyIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material'
import { useGetSwiperPresetsQuery, useCreateSwiperPresetMutation, useDeleteSwiperPresetMutation } from '@/store/api/pagesApi'
import toast from 'react-hot-toast'

interface SwiperPreset {
  id: number
  name: string
  games_data: Array<{
    title: string
    description: string
    image: string
    button_text: string
  }>
  button_text: string
  game_count: number
  created_at: string
}

interface SwiperPresetManagerProps {
  open: boolean
  onClose: () => void
  onSelectPreset?: (preset: SwiperPreset) => void
  blockId?: number
  mode?: 'select' | 'manage'
}

const SwiperPresetManager = ({ 
  open, 
  onClose, 
  onSelectPreset, 
  blockId, 
  mode = 'manage' 
}: SwiperPresetManagerProps) => {
  const [selectedPreset, setSelectedPreset] = useState<SwiperPreset | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [aiCreateDialogOpen, setAiCreateDialogOpen] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [newPresetKeywords, setNewPresetKeywords] = useState('')
  const [newPresetButtonText, setNewPresetButtonText] = useState('Play Now')

  const { data: presets, isLoading, refetch } = useGetSwiperPresetsQuery()
  const [createPreset] = useCreateSwiperPresetMutation()
  const [deletePreset] = useDeleteSwiperPresetMutation()

  const handleSelectPreset = (preset: SwiperPreset) => {
    if (mode === 'select' && onSelectPreset) {
      onSelectPreset(preset)
      onClose()
    } else {
      setSelectedPreset(preset)
    }
  }

  const handleApplyPreset = async (preset: SwiperPreset) => {
    if (!blockId) {
      toast.error('No block selected')
      return
    }

    try {
      // Apply preset to block via API
      const response = await fetch(`/api/page-blocks/${blockId}/apply_preset/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ preset_id: preset.id })
      })

      if (response.ok) {
        toast.success('Preset applied successfully')
        onClose()
      } else {
        toast.error('Failed to apply preset')
      }
    } catch {
      toast.error('Failed to apply preset')
    }
  }

  const handleCreatePreset = async () => {
    if (!newPresetName.trim()) {
      toast.error('Please enter a preset name')
      return
    }

    try {
      await createPreset({
        name: newPresetName,
        games_data: [
          {
            title: 'Sample Game 1',
            description: 'Description for sample game 1',
            image: '',
            button_text: newPresetButtonText
          },
          {
            title: 'Sample Game 2',
            description: 'Description for sample game 2',
            image: '',
            button_text: newPresetButtonText
          },
          {
            title: 'Sample Game 3',
            description: 'Description for sample game 3',
            image: '',
            button_text: newPresetButtonText
          }
        ],
        button_text: newPresetButtonText
      }).unwrap()

      toast.success('Preset created successfully')
      setCreateDialogOpen(false)
      setNewPresetName('')
      setNewPresetButtonText('Play Now')
      refetch()
    } catch {
      toast.error('Failed to create preset')
    }
  }

  const handleCreateWithAI = async () => {
    if (!newPresetName.trim()) {
      toast.error('Please enter a preset name')
      return
    }

    try {
      const response = await fetch('/api/swiper-presets/create_from_ai/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          name: newPresetName,
          keywords: newPresetKeywords.split(',').map(k => k.trim()).filter(k => k),
          button_text: newPresetButtonText
        })
      })

      if (response.ok) {
        toast.success('AI-generated preset created successfully')
        setAiCreateDialogOpen(false)
        setNewPresetName('')
        setNewPresetKeywords('')
        setNewPresetButtonText('Play Now')
        refetch()
      } else {
        toast.error('Failed to create AI-generated preset')
      }
    } catch {
      toast.error('Failed to create AI-generated preset')
    }
  }

  const handleDeletePreset = async (preset: SwiperPreset) => {
    if (!window.confirm(`Are you sure you want to delete "${preset.name}"?`)) {
      return
    }

    try {
      await deletePreset(preset.id).unwrap()
      toast.success('Preset deleted successfully')
      refetch()
    } catch {
      toast.error('Failed to delete preset')
    }
  }

  const handleDuplicatePreset = async (preset: SwiperPreset) => {
    try {
      const response = await fetch(`/api/swiper-presets/${preset.id}/duplicate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (response.ok) {
        toast.success('Preset duplicated successfully')
        refetch()
      } else {
        toast.error('Failed to duplicate preset')
      }
    } catch {
      toast.error('Failed to duplicate preset')
    }
  }

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '600px' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {mode === 'select' ? 'Select Swiper Preset' : 'Manage Swiper Presets'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<AIIcon />}
                onClick={() => setAiCreateDialogOpen(true)}
                size="small"
              >
                AI Create
              </Button>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
                size="small"
              >
                Create
              </Button>
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {presets?.map((preset) => (
                <Grid item xs={12} md={6} lg={4} key={preset.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      border: selectedPreset?.id === preset.id ? 2 : 1,
                      borderColor: selectedPreset?.id === preset.id ? 'primary.main' : 'divider'
                    }}
                    onClick={() => handleSelectPreset(preset)}
                  >
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        {preset.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip 
                          label={`${preset.game_count} games`} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                        <Chip 
                          label={preset.button_text} 
                          size="small" 
                          color="secondary" 
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Created: {new Date(preset.created_at).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      {mode === 'select' && blockId && (
                        <Button
                          size="small"
                          startIcon={<ApplyIcon />}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleApplyPreset(preset)
                          }}
                        >
                          Apply
                        </Button>
                      )}
                      <Tooltip title="Duplicate">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDuplicatePreset(preset)
                          }}
                        >
                          <DuplicateIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeletePreset(preset)
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {presets?.length === 0 && !isLoading && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No swiper presets found. Create your first preset to get started.
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>
            {mode === 'select' ? 'Cancel' : 'Close'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Preset Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Swiper Preset</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Preset Name"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              fullWidth
              placeholder="e.g., Top 10 Slots"
            />
            <TextField
              label="Button Text"
              value={newPresetButtonText}
              onChange={(e) => setNewPresetButtonText(e.target.value)}
              fullWidth
              placeholder="e.g., Play Now"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreatePreset}>
            Create Preset
          </Button>
        </DialogActions>
      </Dialog>

      {/* AI Create Preset Dialog */}
      <Dialog open={aiCreateDialogOpen} onClose={() => setAiCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Swiper Preset with AI</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Preset Name"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              fullWidth
              placeholder="e.g., Top 10 Slots"
            />
            <TextField
              label="Keywords (comma-separated)"
              value={newPresetKeywords}
              onChange={(e) => setNewPresetKeywords(e.target.value)}
              fullWidth
              placeholder="e.g., slots, casino, jackpot"
              multiline
              rows={2}
            />
            <TextField
              label="Button Text"
              value={newPresetButtonText}
              onChange={(e) => setNewPresetButtonText(e.target.value)}
              fullWidth
              placeholder="e.g., Play Now"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAiCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateWithAI} startIcon={<AIIcon />}>
            Generate with AI
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default SwiperPresetManager
