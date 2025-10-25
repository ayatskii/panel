import { useState } from 'react'
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
  IconButton,
} from '@mui/material'
import {
  AutoAwesome as AIIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { useGenerateMetaTagsMutation, useAnalyzeSEOMutation } from '@/store/api/pagesApi'
import toast from 'react-hot-toast'

interface AIMetaGeneratorProps {
  pageTitle: string
  pageContent: string
  currentMeta: {
    title?: string
    meta_description?: string
    h1_tag?: string
    keywords?: string
  }
  siteDomain?: string
  onApplyMeta: (meta: {
    title: string
    meta_description: string
    h1_tag: string
    keywords: string
  }) => void
}

const AIMetaGenerator = ({
  pageTitle,
  pageContent,
  currentMeta,
  siteDomain,
  onApplyMeta,
}: AIMetaGeneratorProps) => {
  const [expanded, setExpanded] = useState(false)
  const [targetAudience, setTargetAudience] = useState('')
  const [generatedMeta, setGeneratedMeta] = useState<{
    title: string
    meta_description: string
    h1_tag: string
    keywords: string
  } | null>(null)
  const [seoAnalysis, setSeoAnalysis] = useState<{
    score: number
    recommendations: string[]
    strengths: string[]
    weaknesses: string[]
  } | null>(null)

  const [generateMeta, { isLoading: isGenerating }] = useGenerateMetaTagsMutation()
  const [analyzeSEO, { isLoading: isAnalyzing }] = useAnalyzeSEOMutation()

  const handleGenerateMeta = async () => {
    if (!pageTitle.trim()) {
      toast.error('Page title is required for AI generation')
      return
    }

    try {
      const result = await generateMeta({
        page_title: pageTitle,
        page_content: pageContent,
        keywords: currentMeta.keywords,
        site_domain: siteDomain,
        target_audience: targetAudience,
      }).unwrap()

      if (result.success) {
        setGeneratedMeta(result.meta_tags)
        toast.success('AI meta tags generated successfully!')
      }
    } catch (error) {
      toast.error('Failed to generate meta tags')
      console.error('Meta generation error:', error)
    }
  }

  const handleAnalyzeSEO = async () => {
    if (!pageTitle.trim()) {
      toast.error('Page title is required for SEO analysis')
      return
    }

    try {
      const result = await analyzeSEO({
        page_title: pageTitle,
        page_content: pageContent,
        current_meta: currentMeta,
      }).unwrap()

      if (result.success) {
        setSeoAnalysis(result.analysis)
        toast.success('SEO analysis completed!')
      }
    } catch (error) {
      toast.error('Failed to analyze SEO')
      console.error('SEO analysis error:', error)
    }
  }

  const handleApplyMeta = () => {
    if (generatedMeta) {
      onApplyMeta(generatedMeta)
      toast.success('Meta tags applied successfully!')
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success'
    if (score >= 60) return 'warning'
    return 'error'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Good'
    if (score >= 60) return 'Fair'
    if (score >= 40) return 'Poor'
    return 'Needs Work'
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AIIcon color="primary" />
          AI Meta Generation
        </Typography>
        <IconButton onClick={() => setExpanded(!expanded)}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>AI-Powered SEO:</strong> Generate optimized meta tags using artificial intelligence. 
              The AI analyzes your page content and creates SEO-friendly titles, descriptions, and keywords.
            </Typography>
          </Alert>

          <TextField
            label="Target Audience (Optional)"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            fullWidth
            multiline
            rows={2}
            placeholder="e.g., Casino players, Online gamblers, Gaming enthusiasts"
            helperText="Help AI understand your target audience for better optimization"
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              startIcon={isGenerating ? <CircularProgress size={20} /> : <AIIcon />}
              onClick={handleGenerateMeta}
              disabled={isGenerating || !pageTitle.trim()}
            >
              {isGenerating ? 'Generating...' : 'Generate Meta Tags'}
            </Button>

            <Button
              variant="outlined"
              startIcon={isAnalyzing ? <CircularProgress size={20} /> : <RefreshIcon />}
              onClick={handleAnalyzeSEO}
              disabled={isAnalyzing || !pageTitle.trim()}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze SEO'}
            </Button>
          </Box>

          {/* Generated Meta Tags */}
          {generatedMeta && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AIIcon color="primary" />
                Generated Meta Tags
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="primary">Meta Title</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'grey.50', p: 1, borderRadius: 1 }}>
                    {generatedMeta.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {generatedMeta.title.length} characters
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="primary">Meta Description</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'grey.50', p: 1, borderRadius: 1 }}>
                    {generatedMeta.meta_description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {generatedMeta.meta_description.length} characters
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="primary">H1 Tag</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'grey.50', p: 1, borderRadius: 1 }}>
                    {generatedMeta.h1_tag}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {generatedMeta.h1_tag.length} characters
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="primary">Keywords</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'grey.50', p: 1, borderRadius: 1 }}>
                    {generatedMeta.keywords}
                  </Typography>
                </Box>
              </Paper>

              <Button
                variant="contained"
                color="success"
                onClick={handleApplyMeta}
                startIcon={<CheckIcon />}
              >
                Apply Generated Meta Tags
              </Button>
            </Box>
          )}

          {/* SEO Analysis */}
          {seoAnalysis && (
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RefreshIcon color="primary" />
                SEO Analysis
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">SEO Score</Typography>
                  <Chip
                    label={`${seoAnalysis.score}/100`}
                    color={getScoreColor(seoAnalysis.score)}
                    sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {getScoreLabel(seoAnalysis.score)}
                </Typography>

                <Divider sx={{ my: 2 }} />

                {/* Strengths */}
                {seoAnalysis.strengths.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="success.main" gutterBottom>
                      ✅ Strengths
                    </Typography>
                    <List dense>
                      {seoAnalysis.strengths.map((strength, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <CheckIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={strength} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Weaknesses */}
                {seoAnalysis.weaknesses.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="error.main" gutterBottom>
                      ⚠️ Areas for Improvement
                    </Typography>
                    <List dense>
                      {seoAnalysis.weaknesses.map((weakness, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <WarningIcon color="warning" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={weakness} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Recommendations */}
                {seoAnalysis.recommendations.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      💡 Recommendations
                    </Typography>
                    <List dense>
                      {seoAnalysis.recommendations.map((recommendation, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <AIIcon color="primary" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={recommendation} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Paper>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  )
}

export default AIMetaGenerator
