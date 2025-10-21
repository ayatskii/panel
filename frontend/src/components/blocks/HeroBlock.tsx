import { Box, Typography, Button, TextField } from '@mui/material'

export interface HeroBlockContent {
  title?: string;
  subtitle?: string;
  background_image?: string;
  cta_text?: string;
  cta_url?: string;
}

interface HeroBlockProps {
  content: HeroBlockContent;
  isEditing: boolean;
  onChange?: (content: HeroBlockContent) => void;
}

const HeroBlock = ({ content, isEditing, onChange }: HeroBlockProps) => {
  if (isEditing) {
    return (
      <Box sx={{ p: 3, border: '2px dashed', borderColor: 'primary.main', borderRadius: 1 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Hero Block Settings</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Title"
            fullWidth
            value={content.title || ''}
            onChange={(e) => onChange?.({ ...content, title: e.target.value })}
          />
          <TextField
            label="Subtitle"
            fullWidth
            value={content.subtitle || ''}
            onChange={(e) => onChange?.({ ...content, subtitle: e.target.value })}
          />
          <TextField
            label="Background Image URL"
            fullWidth
            value={content.background_image || ''}
            onChange={(e) => onChange?.({ ...content, background_image: e.target.value })}
          />
          <TextField
            label="CTA Button Text"
            fullWidth
            value={content.cta_text || ''}
            onChange={(e) => onChange?.({ ...content, cta_text: e.target.value })}
          />
          <TextField
            label="CTA Button URL"
            fullWidth
            value={content.cta_url || ''}
            onChange={(e) => onChange?.({ ...content, cta_url: e.target.value })}
          />
        </Box>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        minHeight: 400,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundImage: content.background_image ? `url(${content.background_image})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white',
        textAlign: 'center',
        p: 4,
      }}
    >
      <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
        {content.title || 'Hero Title'}
      </Typography>
      <Typography variant="h5" sx={{ mb: 4 }}>
        {content.subtitle || 'Hero subtitle goes here'}
      </Typography>
      {content.cta_text && (
        <Button variant="contained" size="large" sx={{ bgcolor: 'white', color: 'primary.main' }}>
          {content.cta_text}
        </Button>
      )}
    </Box>
  )
}

export default HeroBlock
