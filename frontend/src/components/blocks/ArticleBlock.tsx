import { Box, Typography, TextField, FormControlLabel, Checkbox } from '@mui/material'
import RichTextEditor from '@/components/common/RichTextEditor'

export interface ArticleBlockContent {
  title?: string
  text: string
  alignment?: 'left' | 'center' | 'right'
}

interface ArticleBlockProps {
  content: ArticleBlockContent
  isEditing: boolean
  onChange?: (content: ArticleBlockContent) => void
  openArticleTag?: boolean
  closeArticleTag?: boolean
  onOpenArticleTagChange?: (value: boolean) => void
  onCloseArticleTagChange?: (value: boolean) => void
}

const ArticleBlock = ({ 
  content, 
  isEditing, 
  onChange,
  openArticleTag = false,
  closeArticleTag = false,
  onOpenArticleTagChange,
  onCloseArticleTagChange
}: ArticleBlockProps) => {
  if (isEditing) {
    return (
      <Box sx={{ p: 3, border: '2px dashed', borderColor: 'primary.main', borderRadius: 1 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Article Block Settings</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={openArticleTag}
                  onChange={(e) => onOpenArticleTagChange?.(e.target.checked)}
                />
              }
              label="Открыть article"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={closeArticleTag}
                  onChange={(e) => onCloseArticleTagChange?.(e.target.checked)}
                />
              }
              label="Закрыть article"
            />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
            Первый чекбокс вставляет открывающий тег &lt;article&gt; перед содержимым, второй - закрывающий тег &lt;/article&gt; после содержимого
          </Typography>
          <TextField
            label="Title"
            fullWidth
            value={content.title || ''}
            onChange={(e) => onChange?.({ ...content, title: e.target.value })}
            helperText="Main article title (will be wrapped in H2)"
          />
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Article Content
            </Typography>
            <RichTextEditor
              content={content.text || ''}
              onChange={(html) => onChange?.({ ...content, text: html })}
              placeholder="Write your article content here..."
              minHeight={300}
            />
          </Box>
        </Box>
      </Box>
    )
  }

  // Preview/Display Mode - Using semantic article HTML
  // If article tags are controlled manually, wrap content differently
  const articleContent = (
    <>
      {content.title && (
        <Typography 
          variant="h3" 
          component="h2"
          sx={{ 
            mb: 3, 
            fontWeight: 'bold',
            lineHeight: 1.3 
          }}
        >
          {content.title}
        </Typography>
      )}
      
      <Box 
        sx={{ 
          '& p': { 
            mb: 2,
            lineHeight: 1.8,
            fontSize: '1.1rem',
            color: 'text.primary'
          },
          '& h3': {
            mt: 4,
            mb: 2,
            fontWeight: 'bold'
          },
          '& h4': {
            mt: 3,
            mb: 1.5,
            fontWeight: 'bold'
          },
          '& ul, & ol': {
            mb: 2,
            pl: 4
          },
          '& li': {
            mb: 1,
            lineHeight: 1.7
          },
          '& blockquote': {
            borderLeft: '4px solid',
            borderColor: 'primary.main',
            pl: 2,
            py: 1,
            my: 3,
            fontStyle: 'italic',
            color: 'text.secondary'
          },
          '& code': {
            bgcolor: 'grey.100',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.9em'
          },
          '& pre': {
            bgcolor: 'grey.900',
            color: 'grey.100',
            p: 2,
            borderRadius: 1,
            overflow: 'auto',
            my: 2
          }
        }}
        dangerouslySetInnerHTML={{ __html: content.text || '<p>Article content goes here</p>' }}
      />
    </>
  )
  
  // Use article tag only if not manually controlled
  if (!openArticleTag && !closeArticleTag) {
    return (
      <Box 
        component="article" 
        sx={{ 
          p: 4, 
          maxWidth: 900,
          mx: 'auto',
          textAlign: content.alignment || 'left' 
        }}
      >
        {articleContent}
      </Box>
    )
  }
  
  // Manual article tag control
  return (
    <Box
      sx={{ 
        p: 4, 
        maxWidth: 900,
        mx: 'auto',
        textAlign: content.alignment || 'left' 
      }}
    >
      {openArticleTag && (
        <div dangerouslySetInnerHTML={{ __html: '<article>' }} style={{ display: 'none' }} />
      )}
      {articleContent}
      {closeArticleTag && (
        <div dangerouslySetInnerHTML={{ __html: '</article>' }} style={{ display: 'none' }} />
      )}
    </Box>
  )
}

export default ArticleBlock

