import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  CircularProgress,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material'
import {
  Save as SaveIcon,
  Preview as PreviewIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  ArrowUpward as MoveUpIcon,
  ArrowDownward as MoveDownIcon,
  Publish as PublishIcon,
  Unpublished as UnpublishedIcon,
  AutoAwesome as GenerateIcon,
  Refresh as RegenerateIcon,
} from '@mui/icons-material'
import ContentGenerationModal from '@/components/pages/ContentGenerationModal'
import BlockRegenerationModal from '@/components/pages/BlockRegenerationModal'
import {
  useGetPageQuery,
  useGetBlocksQuery,
  useCreateBlockMutation,
  useUpdateBlockMutation,
  useDeleteBlockMutation,
  useReorderBlocksMutation,
  usePublishPageMutation,
  useUnpublishPageMutation,
} from '@/store/api/pagesApi'
import HeroBlock from '@/components/blocks/HeroBlock'
import TextBlock from '@/components/blocks/TextBlock'
import ImageBlock from '@/components/blocks/ImageBlock'
import GalleryBlock from '@/components/blocks/GalleryBlock'
import SwiperBlock from '@/components/blocks/SwiperBlock'
import FAQBlock from '@/components/blocks/FAQBlock'
import CTABlock from '@/components/blocks/CTABlock'
import TextImageBlock from '@/components/blocks/TextImageBlock'
import ArticleBlock from '@/components/blocks/ArticleBlock'
import toast from 'react-hot-toast'
import type { PageBlock } from '@/types'
import type { HeroBlockContent } from '@/components/blocks/HeroBlock'
import type { TextBlockContent } from '@/components/blocks/TextBlock'
import type { ImageBlockContent } from '@/components/blocks/ImageBlock'
import type { GalleryBlockContent } from '@/components/blocks/GalleryBlock'
import type { SwiperBlockContent } from '@/components/blocks/SwiperBlock'
import type { FAQBlockContent } from '@/components/blocks/FAQBlock'
import type { CTABlockContent } from '@/components/blocks/CTABlock'
import type { TextImageBlockContent } from '@/components/blocks/TextImageBlock'
import type { ArticleBlockContent } from '@/components/blocks/ArticleBlock'

const PageBuilderPage = () => {
  const { t } = useTranslation()
  
  const BLOCK_TYPES = [
    { type: 'hero', label: t('pages.blockTypes.heroSection'), defaultContent: { title: 'Hero Title', subtitle: 'Subtitle' } },
    { type: 'article', label: t('pages.blockTypes.articleContent'), defaultContent: { title: 'Article Title', text: '<p>Write your article content here. Use paragraphs and formatting.</p>' } },
    { type: 'text', label: t('pages.blockTypes.textContent'), defaultContent: { title: 'Section Title', text: 'Your text here' } },
    { type: 'image', label: t('pages.blockTypes.singleImage'), defaultContent: { image_url: '', alt_text: '' } },
    { type: 'text_image', label: t('pages.blockTypes.textImage'), defaultContent: { title: 'Feature Highlight', text: 'Describe your amazing feature here', image_url: '', image_position: 'left' as const, image_size: 'medium' as const } },
    { type: 'gallery', label: t('pages.blockTypes.imageGallery'), defaultContent: { images: [] } },
    { type: 'cta', label: t('pages.blockTypes.callToAction'), defaultContent: { title: 'Ready to get started?', description: 'Join thousands of satisfied customers', buttons: [] } },
    { type: 'faq', label: t('pages.blockTypes.faqSection'), defaultContent: { title: 'Frequently Asked Questions', items: [] } },
    { type: 'swiper', label: t('pages.blockTypes.slider'), defaultContent: { slides: [] } },
  ]
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: page, isLoading: pageLoading } = useGetPageQuery(Number(id))
  const { data: blocks, isLoading: blocksLoading } = useGetBlocksQuery({ page: Number(id) })
  const [createBlock] = useCreateBlockMutation()
  const [updateBlock] = useUpdateBlockMutation()
  const [deleteBlock] = useDeleteBlockMutation()
  const [reorderBlocks] = useReorderBlocksMutation()
  const [publishPage] = usePublishPageMutation()
  const [unpublishPage] = useUnpublishPageMutation()

  const [localBlocks, setLocalBlocks] = useState<PageBlock[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [regenerateBlockId, setRegenerateBlockId] = useState<number | null>(null)

  useEffect(() => {
    if (blocks) {
      setLocalBlocks([...blocks].sort((a, b) => a.order - b.order))
    }
  }, [blocks])

  const handleAddBlock = async (blockType: string, defaultContent: Record<string, unknown>) => {
    try {
      await createBlock({
        page: Number(id),
        block_type: blockType as PageBlock['block_type'],
        order: localBlocks.length,
        content: defaultContent,
      }).unwrap();
      
      toast.success(t('pageBuilder.blockAdded'))
      setDrawerOpen(false)
    } catch {
      toast.error(t('pageBuilder.blockAddFailed'));
    }
  }

  const handleUpdateBlock = async (blockId: number, content: Record<string, unknown>) => {
    try {
      await updateBlock({
        id: blockId,
        data: { content }
      }).unwrap()
      toast.success(t('pageBuilder.blockUpdated'))
    } catch {
      toast.error(t('pageBuilder.blockUpdateFailed'));
    }
  }

  const handleDeleteBlock = async (blockId: number) => {
    if (window.confirm(t('common.delete') + '?')) {
      try {
        await deleteBlock(blockId).unwrap()
        toast.success(t('pageBuilder.blockDeleted'))
      } catch {
        toast.error(t('pageBuilder.blockDeleteFailed'));
      }
    }
  }

  const handleMoveBlock = async (blockId: number, direction: 'up' | 'down') => {
    const currentIndex = localBlocks.findIndex(b => b.id === blockId)
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === localBlocks.length - 1)
    ) {
      return
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const newBlocks = [...localBlocks]
    const [movedBlock] = newBlocks.splice(currentIndex, 1)
    newBlocks.splice(newIndex, 0, movedBlock)

    setLocalBlocks(newBlocks)

    // Save new order
    try {
      await reorderBlocks(
        newBlocks.map((block, index) => ({ id: block.id, order: index }))
      ).unwrap()
      toast.success(t('pageBuilder.blocksReordered'))
    } catch {
      toast.error(t('pageBuilder.blockDeleteFailed'));
    }
  }

  const handlePublish = async () => {
    try {
      await publishPage(Number(id)).unwrap()
      toast.success('Page published successfully!')
    } catch {
      toast.error('Failed to publish page')
    }
  }

  const handleUnpublish = async () => {
    try {
      await unpublishPage(Number(id)).unwrap()
      toast.success('Page unpublished successfully!')
    } catch {
      toast.error('Failed to unpublish page')
    }
  }

  const renderBlock = (block: PageBlock) => {
    const isEditing = !previewMode && selectedBlockId === block.id

    switch (block.block_type) {
      case 'hero':
        return <HeroBlock
          content={block.content as HeroBlockContent}
          isEditing={isEditing}
          onChange={(content) => handleUpdateBlock(block.id, content as Record<string, unknown>)}
        />
      case 'article':
        return <ArticleBlock
          content={block.content as ArticleBlockContent}
          isEditing={isEditing}
          onChange={(content) => handleUpdateBlock(block.id, content as Record<string, unknown>)}
        />
      case 'text':
        return <TextBlock
          content={block.content as TextBlockContent}
          isEditing={isEditing}
          onChange={(content) => handleUpdateBlock(block.id, content as Record<string, unknown>)}
        />
      case 'image':
        return <ImageBlock
          content={block.content as ImageBlockContent}
          isEditing={isEditing}
          onChange={(content) => handleUpdateBlock(block.id, content as Record<string, unknown>)}
        />
      case 'text_image':
        return <TextImageBlock
          content={block.content as TextImageBlockContent}
          isEditing={isEditing}
          onChange={(content) => handleUpdateBlock(block.id, content as Record<string, unknown>)}
        />
      case 'gallery':
        return <GalleryBlock
          content={block.content as GalleryBlockContent}
          isEditing={isEditing}
          onChange={(content) => handleUpdateBlock(block.id, content as Record<string, unknown>)}
        />
      case 'cta':
        return <CTABlock
          content={block.content as CTABlockContent}
          isEditing={isEditing}
          onChange={(content) => handleUpdateBlock(block.id, content as Record<string, unknown>)}
        />
      case 'faq':
        return <FAQBlock
          content={block.content as FAQBlockContent}
          isEditing={isEditing}
          onChange={(content) => handleUpdateBlock(block.id, content as Record<string, unknown>)}
        />
      case 'swiper':
        return <SwiperBlock
          content={block.content as SwiperBlockContent}
          isEditing={isEditing}
          onChange={(content) => handleUpdateBlock(block.id, content as Record<string, unknown>)}
        />
      default:
        return <Typography>Unknown block type</Typography>
    }
  }

  if (pageLoading || blocksLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!page) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography>Page not found</Typography>
        <Button onClick={() => navigate('/pages')} sx={{ mt: 2 }}>
          Back to Pages
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {page.title}
              </Typography>
              <Chip 
                label={page.is_published ? t('pageBuilder.published') : t('pageBuilder.draft')} 
                color={page.is_published ? 'success' : 'default'}
                size="small"
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Page Builder
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setDrawerOpen(true)}
            >
              Add Block
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<GenerateIcon />}
              onClick={() => setGenerateModalOpen(true)}
            >
              Generate Content
            </Button>
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={() => setPreviewMode(!previewMode)}
              color={previewMode ? 'primary' : 'inherit'}
            >
              {previewMode ? t('pageBuilder.editMode') : t('pageBuilder.preview')}
            </Button>
            {page.is_published ? (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<UnpublishedIcon />}
                onClick={handleUnpublish}
              >
                Unpublish
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="success"
                startIcon={<PublishIcon />}
                onClick={handlePublish}
              >
                Publish
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => {
                toast.success('Changes saved automatically')
                navigate('/pages')
              }}
            >
              Done
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Blocks */}
      {localBlocks.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No blocks yet
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDrawerOpen(true)}
          >
            Add Your First Block
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {localBlocks.map((block, index) => (
            <Paper
              key={block.id}
              sx={{
                position: 'relative',
                overflow: 'hidden',
                border: selectedBlockId === block.id ? 2 : 0,
                borderColor: 'primary.main',
              }}
              onClick={() => !previewMode && setSelectedBlockId(block.id)}
            >
              {/* Block Controls */}
              {!previewMode && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    display: 'flex',
                    gap: 1,
                    zIndex: 10,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMoveBlock(block.id, 'up')
                    }}
                    disabled={index === 0}
                    sx={{ bgcolor: 'background.paper' }}
                  >
                    <MoveUpIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMoveBlock(block.id, 'down')
                    }}
                    disabled={index === localBlocks.length - 1}
                    sx={{ bgcolor: 'background.paper' }}
                  >
                    <MoveDownIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      setRegenerateBlockId(block.id)
                    }}
                    title={t('pageBuilder.regenerateWithAi')}
                    sx={{ bgcolor: 'background.paper' }}
                  >
                    <RegenerateIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteBlock(block.id)
                    }}
                    color="error"
                    sx={{ bgcolor: 'background.paper' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}

              {/* Block Content */}
              {renderBlock(block)}
            </Paper>
          ))}
        </Box>
      )}

      {/* Add Block Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 300, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Add Block</Typography>
            <IconButton onClick={() => setDrawerOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <List>
            {BLOCK_TYPES.map((blockType) => (
              <ListItem key={blockType.type} disablePadding>
                <ListItemButton onClick={() => handleAddBlock(blockType.type, blockType.defaultContent)}>
                  <ListItemText
                    primary={blockType.label}
                    secondary={blockType.type}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Content Generation Modal */}
      {page && (
        <ContentGenerationModal
          open={generateModalOpen}
          onClose={() => setGenerateModalOpen(false)}
          pageId={page.id}
          onContentGenerated={() => {
            toast.success('Content generated successfully')
            setGenerateModalOpen(false)
            // Refresh blocks
            window.location.reload()
          }}
        />
      )}

      {/* Block Regeneration Modal */}
      {regenerateBlockId && localBlocks.find(b => b.id === regenerateBlockId) && (
        <BlockRegenerationModal
          open={!!regenerateBlockId}
          onClose={() => setRegenerateBlockId(null)}
          block={localBlocks.find(b => b.id === regenerateBlockId)!}
          onContentRegenerated={(result) => {
            if (result.success) {
              toast.success('Block content regenerated successfully')
              setRegenerateBlockId(null)
              // Refresh blocks
              window.location.reload()
            }
          }}
        />
      )}
    </Box>
  )
}

export default PageBuilderPage
