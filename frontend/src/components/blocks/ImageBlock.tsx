import { useState } from 'react'
import { Box, Typography, TextField, Button } from '@mui/material'
import { PhotoLibrary as PhotoLibraryIcon } from '@mui/icons-material'
import MediaSelector from '@/components/media/MediaSelector'
import type { Media } from '@/types'

export interface ImageBlockContent {
  image_url?: string
  alt_text?: string
  caption?: string
}

interface ImageBlockProps {
  content: ImageBlockContent
  isEditing: boolean
  onChange?: (content: ImageBlockContent) => void
}

const ImageBlock = ({ content, isEditing, onChange }: ImageBlockProps) => {
  const [mediaSelectorOpen, setMediaSelectorOpen] = useState(false)

  const handleMediaSelect = (media: Media) => {
    onChange?.({
      ...content,
      image_url: media.file_url,
      alt_text: media.alt_text || media.original_name,
    })
  }

  if (isEditing) {
    return (
      <>
        <Box sx={{ p: 3, border: '2px dashed', borderColor: 'primary.main', borderRadius: 1 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Image Block Settings</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Preview selected image */}
            {content.image_url && (
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  maxHeight: 200,
                  overflow: 'hidden',
                  borderRadius: 1,
                  mb: 2,
                }}
              >
                <Box
                  component="img"
                  src={content.image_url}
                  alt={content.alt_text || 'Preview'}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    objectFit: 'cover',
                  }}
                />
              </Box>
            )}

            <Button
              variant="contained"
              startIcon={<PhotoLibraryIcon />}
              onClick={() => setMediaSelectorOpen(true)}
              fullWidth
            >
              Select from Library
            </Button>

            <Typography variant="caption" color="text.secondary" textAlign="center">
              OR
            </Typography>

            <TextField
              label="Image URL"
              fullWidth
              value={content.image_url || ''}
              onChange={(e) => onChange?.({ ...content, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />

            <TextField
              label="Alt Text"
              fullWidth
              value={content.alt_text || ''}
              onChange={(e) => onChange?.({ ...content, alt_text: e.target.value })}
              helperText="Describe the image for accessibility"
            />

            <TextField
              label="Caption"
              fullWidth
              value={content.caption || ''}
              onChange={(e) => onChange?.({ ...content, caption: e.target.value })}
              helperText="Optional caption displayed below image"
            />
          </Box>
        </Box>

        {/* Media Selector Dialog */}
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
    <Box sx={{ p: 4, textAlign: 'center' }}>
      {content.image_url ? (
        <Box
          component="img"
          src={content.image_url}
          alt={content.alt_text || 'Image'}
          sx={{
            maxWidth: '100%',
            height: 'auto',
            borderRadius: 2,
          }}
        />
      ) : (
        <Box
          sx={{
            width: '100%',
            height: 300,
            bgcolor: 'grey.200',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2,
          }}
        >
          <Typography color="text.secondary">No image selected</Typography>
        </Box>
      )}
      {content.caption && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {content.caption}
        </Typography>
      )}
    </Box>
  )
}

export default ImageBlock
