import { Box, Typography, TextField } from '@mui/material'

export interface TextBlockContent {
  title?: string;
  text?: string;
  alignment?: 'left' | 'center' | 'right';
}

interface TextBlockProps {
  content: TextBlockContent;
  isEditing: boolean;
  onChange?: (content: TextBlockContent) => void;
}

const TextBlock = ({ content, isEditing, onChange }: TextBlockProps) => {
  if (isEditing) {
    return (
      <Box sx={{ p: 3, border: '2px dashed', borderColor: 'primary.main', borderRadius: 1 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Text Block Settings</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Title"
            fullWidth
            value={content.title || ''}
            onChange={(e) => onChange?.({ ...content, title: e.target.value })}
          />
          <TextField
            label="Text"
            fullWidth
            multiline
            rows={6}
            value={content.text || ''}
            onChange={(e) => onChange?.({ ...content, text: e.target.value })}
          />
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 4, textAlign: content.alignment || 'left' }}>
      {content.title && (
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
          {content.title}
        </Typography>
      )}
      <Typography 
        variant="body1" 
        sx={{ lineHeight: 1.8 }}
        dangerouslySetInnerHTML={{ __html: content.text || 'Text content goes here' }}
      />
    </Box>
  )
}

export default TextBlock
