import { useState } from 'react'
import { Box, Typography, TextField, Button, IconButton } from '@mui/material'
import { Delete as DeleteIcon, Add as AddIcon, PhotoLibrary as PhotoLibraryIcon } from '@mui/icons-material'
import MediaSelector from '@/components/media/MediaSelector'
import type { Media } from '@/types'

export interface GalleryBlockContent {
  images?: Array<{ url: string; alt: string }>;
}

interface GalleryBlockProps {
  content: GalleryBlockContent;
  isEditing: boolean;
  onChange?: (content: GalleryBlockContent) => void;
}

const GalleryBlock = ({ content, isEditing, onChange }: GalleryBlockProps) => {
  const [mediaSelectorOpen, setMediaSelectorOpen] = useState(false)
  const images = content.images || []

  const handleMediaSelect = (media: Media) => {
    onChange?.({
      ...content,
      images: [...images, { url: media.file_url, alt: media.alt_text || media.original_name }]
    })
  }

  const addImage = () => {
    onChange?.({
      ...content,
      images: [...images, { url: '', alt: '' }]
    })
  }

  const removeImage = (index: number) => {
    onChange?.({
      ...content,
      images: images.filter((_, i) => i !== index)
    })
  }

  const updateImage = (index: number, field: 'url' | 'alt', value: string) => {
    const newImages = [...images]
    newImages[index] = { ...newImages[index], [field]: value }
    onChange?.({ ...content, images: newImages })
  }

  if (isEditing) {
    return (
      <>
        <Box sx={{ p: 3, border: '2px dashed', borderColor: 'primary.main', borderRadius: 1 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Gallery Block Settings</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<PhotoLibraryIcon />}
              onClick={() => setMediaSelectorOpen(true)}
              fullWidth
            >
              Add from Library
            </Button>

            <Typography variant="caption" color="text.secondary" textAlign="center">
              OR
            </Typography>

            {images.map((image, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  label="Image URL"
                  fullWidth
                  value={image.url}
                  onChange={(e) => updateImage(index, 'url', e.target.value)}
                />
                <TextField
                  label="Alt Text"
                  fullWidth
                  value={image.alt}
                  onChange={(e) => updateImage(index, 'alt', e.target.value)}
                />
                <IconButton onClick={() => removeImage(index)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            <Button startIcon={<AddIcon />} onClick={addImage} variant="outlined">
              Add Image URL
            </Button>
          </Box>
        </Box>

        <MediaSelector
          open={mediaSelectorOpen}
          onClose={() => setMediaSelectorOpen(false)}
          onSelect={handleMediaSelect}
          fileType="image"
        />
      </>
    )
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 2,
        }}
      >
        {images.length > 0 ? (
          images.map((image, index) => (
            <Box
              key={index}
              component="img"
              src={image.url}
              alt={image.alt}
              sx={{
                width: '100%',
                height: 250,
                objectFit: 'cover',
                borderRadius: 2,
              }}
            />
          ))
        ) : (
          <Typography color="text.secondary">No images in gallery</Typography>
        )}
      </Box>
    </Box>
  )
}

export default GalleryBlock
