import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Chip,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import {
  useGetTagsQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
} from '@/store/api/mediaApi'
import toast from 'react-hot-toast'
import type { MediaTag } from '@/types'

interface TagManagerProps {
  open: boolean
  onClose: () => void
}

const TAG_COLORS = [
  '#f44336', // Red
  '#e91e63', // Pink
  '#9c27b0', // Purple
  '#673ab7', // Deep Purple
  '#3f51b5', // Indigo
  '#2196f3', // Blue
  '#03a9f4', // Light Blue
  '#00bcd4', // Cyan
  '#009688', // Teal
  '#4caf50', // Green
  '#8bc34a', // Light Green
  '#cddc39', // Lime
  '#ffeb3b', // Yellow
  '#ffc107', // Amber
  '#ff9800', // Orange
  '#ff5722', // Deep Orange
]

const TagManager = ({ open, onClose }: TagManagerProps) => {
  const { data: tags, isLoading } = useGetTagsQuery()
  const [createTag] = useCreateTagMutation()
  const [updateTag] = useUpdateTagMutation()
  const [deleteTag] = useDeleteTagMutation()

  const [editingTag, setEditingTag] = useState<MediaTag | null>(null)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.error('Tag name is required')
      return
    }

    try {
      await createTag({
        name: newTagName.trim(),
        color: newTagColor,
      }).unwrap()
      
      toast.success('Tag created successfully')
      setNewTagName('')
      setNewTagColor(TAG_COLORS[0])
    } catch (error) {
      toast.error('Failed to create tag')
      console.error(error)
    }
  }

  const handleUpdateTag = async () => {
    if (!editingTag || !editingTag.name.trim()) {
      toast.error('Tag name is required')
      return
    }

    try {
      await updateTag({
        id: editingTag.id,
        data: {
          name: editingTag.name.trim(),
          color: editingTag.color,
        },
      }).unwrap()
      
      toast.success('Tag updated successfully')
      setEditingTag(null)
    } catch (error) {
      toast.error('Failed to update tag')
      console.error(error)
    }
  }

  const handleDeleteTag = async (tagId: number) => {
    if (!confirm('Are you sure you want to delete this tag? It will be removed from all media files.')) {
      return
    }

    try {
      await deleteTag(tagId).unwrap()
      toast.success('Tag deleted successfully')
    } catch (error) {
      toast.error('Failed to delete tag')
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Manage Tags</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Create New Tag */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
            Create New Tag
          </Typography>
          
          <TextField
            label="Tag Name"
            fullWidth
            size="small"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateTag()
              }
            }}
            sx={{ mb: 2 }}
          />

          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ mb: 1, display: 'block', color: 'text.secondary' }}>
              Select Color
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {TAG_COLORS.map((color) => (
                <Box
                  key={color}
                  onClick={() => setNewTagColor(color)}
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: color,
                    borderRadius: 1,
                    cursor: 'pointer',
                    border: newTagColor === color ? '3px solid' : '2px solid',
                    borderColor: newTagColor === color ? 'primary.main' : 'transparent',
                    '&:hover': {
                      opacity: 0.8,
                    },
                  }}
                />
              ))}
            </Box>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateTag}
            fullWidth
          >
            Create Tag
          </Button>
        </Box>

        {/* Existing Tags */}
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
          Existing Tags
        </Typography>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : tags && tags.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {tags.map((tag) => (
              <Box
                key={tag.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                {editingTag?.id === tag.id ? (
                  // Edit Mode
                  <Box sx={{ flex: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      value={editingTag.name}
                      onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                      sx={{ flex: 1 }}
                    />
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {TAG_COLORS.slice(0, 8).map((color) => (
                        <Box
                          key={color}
                          onClick={() => setEditingTag({ ...editingTag, color })}
                          sx={{
                            width: 24,
                            height: 24,
                            bgcolor: color,
                            borderRadius: 0.5,
                            cursor: 'pointer',
                            border: editingTag.color === color ? '2px solid' : '1px solid',
                            borderColor: editingTag.color === color ? 'primary.main' : 'transparent',
                          }}
                        />
                      ))}
                    </Box>
                    <Button size="small" onClick={handleUpdateTag}>
                      Save
                    </Button>
                    <Button size="small" onClick={() => setEditingTag(null)}>
                      Cancel
                    </Button>
                  </Box>
                ) : (
                  // Display Mode
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={tag.name}
                        size="small"
                        sx={{
                          bgcolor: tag.color,
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        ({tag.media_count} files)
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => setEditingTag(tag)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteTag(tag.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </>
                )}
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No tags yet. Create your first tag above!
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default TagManager

