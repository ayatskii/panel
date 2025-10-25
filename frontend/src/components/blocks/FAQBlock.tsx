import { useState } from 'react'
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material'
import RichTextEditor from '@/components/common/RichTextEditor'

export interface FAQItem {
  question: string
  answer: string
}

export interface FAQBlockContent {
  title?: string
  items: FAQItem[]
}

interface FAQBlockProps {
  content: FAQBlockContent
  isEditing: boolean
  onChange?: (content: FAQBlockContent) => void
}

const FAQBlock = ({ content, isEditing, onChange }: FAQBlockProps) => {
  const [expandedPanel, setExpandedPanel] = useState<number | false>(false)

  const handleAddItem = () => {
    const newItems = [...(content.items || []), { question: 'New Question', answer: 'New Answer' }]
    onChange?.({ ...content, items: newItems })
  }

  const handleRemoveItem = (index: number) => {
    const newItems = content.items.filter((_, i) => i !== index)
    onChange?.({ ...content, items: newItems })
  }

  const handleUpdateItem = (index: number, field: 'question' | 'answer', value: string) => {
    const newItems = [...content.items]
    newItems[index] = { ...newItems[index], [field]: value }
    onChange?.({ ...content, items: newItems })
  }

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= content.items.length) return

    const newItems = [...content.items]
    const temp = newItems[index]
    newItems[index] = newItems[newIndex]
    newItems[newIndex] = temp
    onChange?.({ ...content, items: newItems })
  }

  if (isEditing) {
    return (
      <Box sx={{ p: 3, border: '2px dashed', borderColor: 'primary.main', borderRadius: 1 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>FAQ Block Settings</Typography>
        
        <TextField
          label="Section Title (Optional)"
          fullWidth
          value={content.title || ''}
          onChange={(e) => onChange?.({ ...content, title: e.target.value })}
          sx={{ mb: 3 }}
        />

        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            FAQ Items
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddItem}
            size="small"
          >
            Add FAQ
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {content.items && content.items.length > 0 ? (
            content.items.map((item, index) => (
              <Paper
                key={index}
                sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <DragIcon sx={{ color: 'text.secondary' }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      FAQ #{index + 1}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleMoveItem(index, 'up')}
                      disabled={index === 0}
                    >
                      ↑
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleMoveItem(index, 'down')}
                      disabled={index === content.items.length - 1}
                    >
                      ↓
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <TextField
                  label="Question"
                  fullWidth
                  value={item.question}
                  onChange={(e) => handleUpdateItem(index, 'question', e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                    Answer
                  </Typography>
                  <RichTextEditor
                    content={item.answer}
                    onChange={(html) => handleUpdateItem(index, 'answer', html)}
                    placeholder="Enter the answer..."
                    minHeight={150}
                  />
                </Box>
              </Paper>
            ))
          ) : (
            <Box sx={{ p: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                No FAQ items yet
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddItem}
              >
                Add First FAQ
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    )
  }

  // Preview/Display Mode
  return (
    <Box sx={{ p: 4 }}>
      {content.title && (
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
          {content.title}
        </Typography>
      )}
      
      {content.items && content.items.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {content.items.map((item, index) => (
            <Accordion
              key={index}
              expanded={expandedPanel === index}
              onChange={() => setExpandedPanel(expandedPanel === index ? false : index)}
              sx={{ 
                boxShadow: 1,
                '&:before': { display: 'none' },
                borderRadius: 1,
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ 
                  fontWeight: 'bold',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {item.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography 
                  variant="body1" 
                  sx={{ color: 'text.secondary', lineHeight: 1.7 }}
                  dangerouslySetInnerHTML={{ __html: item.answer }}
                />
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      ) : (
        <Typography color="text.secondary">No FAQ items to display</Typography>
      )}
    </Box>
  )
}

export default FAQBlock

