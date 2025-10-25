import { Box, Typography, TextField, Button, IconButton, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import RichTextEditor from '@/components/common/RichTextEditor'

export interface CTAButton {
  text: string
  url: string
  style: 'primary' | 'secondary' | 'outlined'
}

export interface CTABlockContent {
  title?: string
  description?: string
  buttons: CTAButton[]
  background_color?: string
  text_color?: string
}

interface CTABlockProps {
  content: CTABlockContent
  isEditing: boolean
  onChange?: (content: CTABlockContent) => void
}

const CTABlock = ({ content, isEditing, onChange }: CTABlockProps) => {
  const handleAddButton = () => {
    const newButtons = [...(content.buttons || []), { text: 'Click Here', url: '#', style: 'primary' as const }]
    onChange?.({ ...content, buttons: newButtons })
  }

  const handleRemoveButton = (index: number) => {
    const newButtons = content.buttons.filter((_, i) => i !== index)
    onChange?.({ ...content, buttons: newButtons })
  }

  const handleUpdateButton = (index: number, field: keyof CTAButton, value: string) => {
    const newButtons = [...content.buttons]
    newButtons[index] = { ...newButtons[index], [field]: value }
    onChange?.({ ...content, buttons: newButtons })
  }

  if (isEditing) {
    return (
      <Box sx={{ p: 3, border: '2px dashed', borderColor: 'primary.main', borderRadius: 1 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>CTA Block Settings</Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Title"
            fullWidth
            value={content.title || ''}
            onChange={(e) => onChange?.({ ...content, title: e.target.value })}
          />
          
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Description
            </Typography>
            <RichTextEditor
              content={content.description || ''}
              onChange={(html) => onChange?.({ ...content, description: html })}
              placeholder="Enter your CTA description..."
              minHeight={120}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Background Color"
              value={content.background_color || '#1976d2'}
              onChange={(e) => onChange?.({ ...content, background_color: e.target.value })}
              type="color"
              sx={{ flex: 1 }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Text Color"
              value={content.text_color || '#ffffff'}
              onChange={(e) => onChange?.({ ...content, text_color: e.target.value })}
              type="color"
              sx={{ flex: 1 }}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Buttons
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddButton}
                size="small"
              >
                Add Button
              </Button>
            </Box>

            {content.buttons && content.buttons.length > 0 ? (
              content.buttons.map((button, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Button #{index + 1}
                    </Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveButton(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Button Text"
                      fullWidth
                      value={button.text}
                      onChange={(e) => handleUpdateButton(index, 'text', e.target.value)}
                    />
                    <TextField
                      label="Button URL"
                      fullWidth
                      value={button.url}
                      onChange={(e) => handleUpdateButton(index, 'url', e.target.value)}
                      placeholder="https://example.com or #section"
                    />
                    <FormControl fullWidth>
                      <InputLabel>Button Style</InputLabel>
                      <Select
                        value={button.style}
                        label="Button Style"
                        onChange={(e) => handleUpdateButton(index, 'style', e.target.value)}
                      >
                        <MenuItem value="primary">Primary (Filled)</MenuItem>
                        <MenuItem value="secondary">Secondary (Filled)</MenuItem>
                        <MenuItem value="outlined">Outlined</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Paper>
              ))
            ) : (
              <Box sx={{ p: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  No buttons yet
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddButton}
                >
                  Add First Button
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    )
  }

  // Preview/Display Mode
  const bgColor = content.background_color || '#1976d2'
  const textColor = content.text_color || '#ffffff'

  return (
    <Box 
      sx={{ 
        p: 6, 
        textAlign: 'center',
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      {content.title && (
        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2, color: textColor }}>
          {content.title}
        </Typography>
      )}
      
      {content.description && (
        <Box 
          sx={{ mb: 4, maxWidth: 800, mx: 'auto', color: textColor }}
          dangerouslySetInnerHTML={{ __html: content.description }}
        />
      )}

      {content.buttons && content.buttons.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {content.buttons.map((button, index) => {
            const buttonVariant = button.style === 'outlined' ? 'outlined' : 'contained'
            const buttonColor = button.style === 'secondary' ? 'secondary' : 'primary'
            
            return (
              <Button
                key={index}
                variant={buttonVariant}
                color={buttonColor}
                size="large"
                href={button.url}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  ...(button.style === 'outlined' && {
                    borderColor: textColor,
                    color: textColor,
                    '&:hover': {
                      borderColor: textColor,
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    }
                  }),
                }}
              >
                {button.text}
              </Button>
            )
          })}
        </Box>
      )}
    </Box>
  )
}

export default CTABlock

