import { Box, Typography, TextField, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material'
import { PhotoLibrary as PhotoLibraryIcon } from '@mui/icons-material'
import { useState } from 'react'
import MediaSelector from '@/components/media/MediaSelector'
import RichTextEditor from '@/components/common/RichTextEditor'
import type { Media } from '@/types'

export interface TextImageBlockContent {
  title?: string
  text: string
  image_url: string
  alt_text?: string
  image_position: 'left' | 'right' | 'top' | 'bottom'
  image_size: 'small' | 'medium' | 'large'
}

interface TextImageBlockProps {
  content: TextImageBlockContent
  isEditing: boolean
  onChange?: (content: TextImageBlockContent) => void
}

const TextImageBlock = ({ content, isEditing, onChange }: TextImageBlockProps) => {
  const [mediaSelectorOpen, setMediaSelectorOpen] = useState(false)

  const handleMediaSelect = (media: Media) => {
    onChange?.({ ...content, image_url: media.file_url, alt_text: media.alt_text || '' })
    setMediaSelectorOpen(false)
  }

  if (isEditing) {
    return (
      <>
        <Box sx={{ p: 3, border: '2px dashed', borderColor: 'primary.main', borderRadius: 1 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Text + Image Block Settings</Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Title (Optional)"
              fullWidth
              value={content.title || ''}
              onChange={(e) => onChange?.({ ...content, title: e.target.value })}
            />
            
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                Text Content
              </Typography>
              <RichTextEditor
                content={content.text || ''}
                onChange={(html) => onChange?.({ ...content, text: html })}
                placeholder="Describe your feature..."
                minHeight={200}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Image Position</InputLabel>
                <Select
                  value={content.image_position || 'left'}
                  label="Image Position"
                  onChange={(e) => onChange?.({ ...content, image_position: e.target.value as TextImageBlockContent['image_position'] })}
                >
                  <MenuItem value="left">Left</MenuItem>
                  <MenuItem value="right">Right</MenuItem>
                  <MenuItem value="top">Top</MenuItem>
                  <MenuItem value="bottom">Bottom</MenuItem>
                </Select>
              </FormControl>

              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Image Size</InputLabel>
                <Select
                  value={content.image_size || 'medium'}
                  label="Image Size"
                  onChange={(e) => onChange?.({ ...content, image_size: e.target.value as TextImageBlockContent['image_size'] })}
                >
                  <MenuItem value="small">Small (33%)</MenuItem>
                  <MenuItem value="medium">Medium (50%)</MenuItem>
                  <MenuItem value="large">Large (66%)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 1, p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Image</Typography>
              
              {content.image_url ? (
                <Box>
                  <Box
                    component="img"
                    src={content.image_url}
                    alt={content.alt_text || 'Preview'}
                    sx={{ maxWidth: '100%', maxHeight: 200, display: 'block', mb: 1, borderRadius: 1 }}
                  />
                  <TextField
                    label="Alt Text"
                    fullWidth
                    size="small"
                    value={content.alt_text || ''}
                    onChange={(e) => onChange?.({ ...content, alt_text: e.target.value })}
                    sx={{ mb: 1 }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<PhotoLibraryIcon />}
                    onClick={() => setMediaSelectorOpen(true)}
                    fullWidth
                  >
                    Change Image
                  </Button>
                </Box>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<PhotoLibraryIcon />}
                  onClick={() => setMediaSelectorOpen(true)}
                  fullWidth
                >
                  Select Image
                </Button>
              )}
            </Box>
          </Box>
        </Box>

        <MediaSelector
          open={mediaSelectorOpen}
          onClose={() => setMediaSelectorOpen(false)}
          onSelect={handleMediaSelect}
          accept="image/*"
        />
      </>
    )
  }

  // Preview/Display Mode
  const isHorizontal = content.image_position === 'left' || content.image_position === 'right'
  const imageSize = content.image_size || 'medium'
  const imageSizeMap = { small: '33%', medium: '50%', large: '66%' }
  const imageWidth = isHorizontal ? imageSizeMap[imageSize] : '100%'
  const textWidth = isHorizontal ? `calc(100% - ${imageSizeMap[imageSize]} - 2rem)` : '100%'

  return (
    <Box sx={{ p: 4 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 
            content.image_position === 'top' ? 'column' :
            content.image_position === 'bottom' ? 'column-reverse' :
            content.image_position === 'left' ? 'row' : 'row-reverse',
          gap: 4,
          alignItems: content.image_position === 'top' || content.image_position === 'bottom' ? 'center' : 'flex-start',
        }}
      >
        {/* Image */}
        <Box sx={{ flex: isHorizontal ? '0 0 auto' : '1', width: imageWidth }}>
          <Box
            component="img"
            src={content.image_url}
            alt={content.alt_text || ''}
            sx={{
              width: '100%',
              height: 'auto',
              borderRadius: 1,
              boxShadow: 2,
            }}
          />
        </Box>

        {/* Text */}
        <Box sx={{ flex: '1', width: textWidth }}>
          {content.title && (
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
              {content.title}
            </Typography>
          )}
          <Typography 
            variant="body1" 
            sx={{ lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: content.text }}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default TextImageBlock

