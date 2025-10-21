import { Box, Typography } from '@mui/material';

export interface SwiperBlockContent {
  slides?: Array<{ title: string; image: string; description: string }>;
}

interface SwiperBlockProps {
  content: SwiperBlockContent;
  isEditing: boolean;
  onChange?: (content: SwiperBlockContent) => void;
}

const SwiperBlock = ({ isEditing }: SwiperBlockProps) => {
  if (isEditing) {
    return (
      <Box sx={{ p: 3, border: '2px dashed', borderColor: 'primary.main', borderRadius: 1 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Swiper Block Settings</Typography>
        <Typography variant="body2" color="text.secondary">
          Advanced swiper configuration coming soon
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 4, bgcolor: 'grey.100' }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Swiper Slider
      </Typography>
      <Typography color="text.secondary">
        Swiper component will be implemented here
      </Typography>
    </Box>
  )
}

export default SwiperBlock
