import { useState } from 'react'
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
} from '@mui/material'
import {
  AutoAwesome as AIIcon,
  Title as TitleIcon,
  Quiz as FAQIcon,
  Slideshow as SwiperIcon,
  Campaign as CTAIcon,
  Article as ArticleIcon,
  PlayArrow as StartIcon,
} from '@mui/icons-material'
import ContentGenerationModal from './ContentGenerationModal'
import { useTranslation } from 'react-i18next'

interface QuickGenerationButtonProps {
  pageId: number
  onContentGenerated?: (content: unknown) => void
  variant?: 'contained' | 'outlined' | 'text'
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
}

const QuickGenerationButton = ({ 
  pageId, 
  onContentGenerated, 
  variant = 'contained',
  size = 'medium',
  showLabel = true
}: QuickGenerationButtonProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [generationModalOpen, setGenerationModalOpen] = useState(false)
  const [quickGenerateType, setQuickGenerateType] = useState<string | null>(null)
  const { t } = useTranslation()

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleQuickGenerate = (type: string) => {
    setQuickGenerateType(type)
    setGenerationModalOpen(true)
    handleClose()
  }

  const handleFullGeneration = () => {
    setQuickGenerateType(null)
    setGenerationModalOpen(true)
    handleClose()
  }

  const quickOptions = [
    {
      id: 'meta',
      label: t('pages.metaContent'),
      description: t('pages.metaContentDescription'),
      icon: <TitleIcon />,
      color: 'primary' as const
    },
    {
      id: 'hero',
      label: t('pages.heroBanner'),
      description: t('pages.heroBannerDescription'),
      icon: <StartIcon />,
      color: 'secondary' as const
    },
    {
      id: 'article',
      label: t('pages.article'),
      description: t('pages.articleDescription'),
      icon: <ArticleIcon />,
      color: 'info' as const
    },
    {
      id: 'faq',
      label: t('pages.faqSection'),
      description: t('pages.faqDescription'),
      icon: <FAQIcon />,
      color: 'warning' as const
    },
    {
      id: 'swiper',
      label: t('pages.gameCarousel'),
      description: t('pages.carouselDescription'),
      icon: <SwiperIcon />,
      color: 'success' as const
    },
    {
      id: 'cta',
      label: t('pages.callToAction'),
      description: t('pages.ctaDescription'),
      icon: <CTAIcon />,
      color: 'error' as const
    }
  ]

  const getInitialConfig = (type: string) => {
    switch (type) {
      case 'meta':
        return {
          generate_meta: true,
          generate_images: false,
          block_types: [],
          model: 'gpt-3.5-turbo'
        }
      case 'hero':
        return {
          generate_meta: false,
          generate_images: false,
          block_types: ['hero'],
          model: 'gpt-3.5-turbo'
        }
      case 'article':
        return {
          generate_meta: false,
          generate_images: false,
          block_types: ['article'],
          model: 'gpt-3.5-turbo'
        }
      case 'faq':
        return {
          generate_meta: false,
          generate_images: false,
          block_types: ['faq'],
          model: 'gpt-3.5-turbo'
        }
      case 'swiper':
        return {
          generate_meta: false,
          generate_images: false,
          block_types: ['swiper'],
          model: 'gpt-3.5-turbo'
        }
      case 'cta':
        return {
          generate_meta: false,
          generate_images: false,
          block_types: ['cta'],
          model: 'gpt-3.5-turbo'
        }
      default:
        return {
          generate_meta: true,
          generate_images: false,
          block_types: ['hero', 'article', 'faq'],
          model: 'gpt-3.5-turbo'
        }
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        startIcon={<AIIcon />}
        onClick={handleClick}
        sx={{
          background: variant === 'contained' 
            ? 'linear-gradient(45deg, #FF6B6B, #4ECDC4)' 
            : undefined,
          '&:hover': {
            background: variant === 'contained' 
              ? 'linear-gradient(45deg, #FF5252, #26A69A)' 
              : undefined,
          }
        }}
      >
        {showLabel && t('pages.generateContent')}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { minWidth: 280 }
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {t('pages.quickGenerate')}
          </Typography>
        </Box>
        
        {quickOptions.map((option) => (
          <MenuItem 
            key={option.id} 
            onClick={() => handleQuickGenerate(option.id)}
            sx={{ py: 1.5 }}
          >
            <ListItemIcon>
              <Box sx={{ color: `${option.color}.main` }}>
                {option.icon}
              </Box>
            </ListItemIcon>
            <ListItemText
              primary={option.label}
              secondary={option.description}
            />
          </MenuItem>
        ))}
        
        <Divider />
        
        <MenuItem onClick={handleFullGeneration} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <AIIcon color="primary" />
          </ListItemIcon>
          <ListItemText
            primary={t('pages.generateContent')}
            secondary={t('pages.quickGenerate')}
          />
        </MenuItem>
      </Menu>

      <ContentGenerationModal
        open={generationModalOpen}
        onClose={() => setGenerationModalOpen(false)}
        pageId={pageId}
        onContentGenerated={onContentGenerated}
        initialConfig={quickGenerateType ? getInitialConfig(quickGenerateType) : undefined}
      />
    </>
  )
}

export default QuickGenerationButton
