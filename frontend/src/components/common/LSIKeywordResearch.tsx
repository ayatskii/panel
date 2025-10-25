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
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Tooltip,
} from '@mui/material'
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  ContentCopy as CopyIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material'
import { useResearchLSIKeywordsMutation, useAnalyzeKeywordDensityMutation } from '@/store/api/pagesApi'
import toast from 'react-hot-toast'

interface LSIKeywordResearchProps {
  pageContent?: string
  onAddKeywords?: (keywords: string[]) => void
}

const LSIKeywordResearch = ({ pageContent = '', onAddKeywords }: LSIKeywordResearchProps) => {
  const [expanded, setExpanded] = useState(false)
  const [primaryKeyword, setPrimaryKeyword] = useState('')
  const [industry, setIndustry] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [maxKeywords, setMaxKeywords] = useState(20)
  const [researchResults, setResearchResults] = useState<any>(null)
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [densityAnalysis, setDensityAnalysis] = useState<any>(null)

  const [researchKeywords, { isLoading: isResearching }] = useResearchLSIKeywordsMutation()
  const [analyzeDensity, { isLoading: isAnalyzingDensity }] = useAnalyzeKeywordDensityMutation()

  const handleResearch = async () => {
    if (!primaryKeyword.trim()) {
      toast.error('Please enter a primary keyword')
      return
    }

    try {
      const result = await researchKeywords({
        primary_keyword: primaryKeyword,
        content: pageContent,
        industry: industry,
        target_audience: targetAudience,
        max_keywords: maxKeywords,
      }).unwrap()

      if (result.success) {
        setResearchResults(result)
        toast.success(`Found ${result.total_keywords} LSI keywords!`)
      }
    } catch (error) {
      toast.error('Failed to research keywords')
      console.error('Keyword research error:', error)
    }
  }

  const handleAnalyzeDensity = async () => {
    if (!pageContent.trim() || selectedKeywords.length === 0) {
      toast.error('Please select keywords and ensure page content is available')
      return
    }

    try {
      const result = await analyzeDensity({
        content: pageContent,
        target_keywords: selectedKeywords,
      }).unwrap()

      if (result.success) {
        setDensityAnalysis(result)
        toast.success('Keyword density analysis completed!')
      }
    } catch (error) {
      toast.error('Failed to analyze keyword density')
      console.error('Density analysis error:', error)
    }
  }

  const handleToggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev => 
      prev.includes(keyword) 
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    )
  }

  const handleAddSelectedKeywords = () => {
    if (selectedKeywords.length > 0 && onAddKeywords) {
      onAddKeywords(selectedKeywords)
      toast.success(`Added ${selectedKeywords.length} keywords!`)
    }
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 30) return 'success'
    if (difficulty <= 60) return 'warning'
    return 'error'
  }

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 80) return 'success'
    if (relevance >= 60) return 'warning'
    return 'error'
  }

  const getKeywordTypeColor = (type: string) => {
    const colors = {
      primary: 'primary',
      related: 'secondary',
      long_tail: 'success',
      question: 'info',
      commercial: 'warning',
      semantic: 'default'
    }
    return colors[type as keyof typeof colors] || 'default'
  }

  const getKeywordTypeIcon = (type: string) => {
    const icons = {
      primary: <CheckIcon />,
      related: <TrendingUpIcon />,
      long_tail: <PsychologyIcon />,
      question: <WarningIcon />,
      commercial: <TrendingUpIcon />,
      semantic: <PsychologyIcon />
    }
    return icons[type as keyof typeof icons] || <PsychologyIcon />
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PsychologyIcon color="primary" />
          LSI Keyword Research
        </Typography>
        <IconButton onClick={() => setExpanded(!expanded)}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>LSI Keywords:</strong> Research semantically related keywords that help search engines 
              understand your content context. These keywords improve SEO and content relevance.
            </Typography>
          </Alert>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Primary Keyword"
                value={primaryKeyword}
                onChange={(e) => setPrimaryKeyword(e.target.value)}
                fullWidth
                placeholder="e.g., casino games"
                helperText="The main keyword to research LSI variations for"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Industry/Niche"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                fullWidth
                placeholder="e.g., online gambling, gaming"
                helperText="Help AI understand your industry context"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Target Audience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                fullWidth
                placeholder="e.g., casino players, gaming enthusiasts"
                helperText="Describe your target audience"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Max Keywords"
                type="number"
                value={maxKeywords}
                onChange={(e) => setMaxKeywords(Number(e.target.value))}
                fullWidth
                inputProps={{ min: 5, max: 50 }}
                helperText="Number of keywords to research (5-50)"
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              startIcon={isResearching ? <CircularProgress size={20} /> : <SearchIcon />}
              onClick={handleResearch}
              disabled={isResearching || !primaryKeyword.trim()}
            >
              {isResearching ? 'Researching...' : 'Research LSI Keywords'}
            </Button>

            {selectedKeywords.length > 0 && (
              <Button
                variant="outlined"
                startIcon={isAnalyzingDensity ? <CircularProgress size={20} /> : <TrendingUpIcon />}
                onClick={handleAnalyzeDensity}
                disabled={isAnalyzingDensity || !pageContent.trim()}
              >
                {isAnalyzingDensity ? 'Analyzing...' : 'Analyze Density'}
              </Button>
            )}
          </Box>

          {/* Research Results */}
          {researchResults && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SearchIcon color="primary" />
                Research Results
              </Typography>
              
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  {researchResults.research_summary}
                </Typography>
              </Alert>

              {/* Content Suggestions */}
              {researchResults.content_suggestions.length > 0 && (
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      💡 Content Suggestions
                    </Typography>
                    <List dense>
                      {researchResults.content_suggestions.map((suggestion: string, index: number) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemText primary={suggestion} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}

              {/* Keywords by Category */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">
                    All Keywords ({researchResults.total_keywords})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {researchResults.keywords.map((keywordData: any, index: number) => (
                      <ListItem key={index} sx={{ border: '1px solid', borderColor: 'divider', mb: 1, borderRadius: 1 }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="body1" fontWeight="bold">
                                {keywordData.keyword}
                              </Typography>
                              <Chip
                                icon={getKeywordTypeIcon(keywordData.keyword_type)}
                                label={keywordData.keyword_type.replace('_', ' ')}
                                size="small"
                                color={getKeywordTypeColor(keywordData.keyword_type)}
                              />
                              {keywordData.recommended && (
                                <Chip label="Recommended" size="small" color="success" />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="caption">Relevance:</Typography>
                                <Chip
                                  label={`${keywordData.relevance_score}%`}
                                  size="small"
                                  color={getRelevanceColor(keywordData.relevance_score)}
                                />
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="caption">Difficulty:</Typography>
                                <Chip
                                  label={`${keywordData.difficulty_score}%`}
                                  size="small"
                                  color={getDifficultyColor(keywordData.difficulty_score)}
                                />
                              </Box>
                              <Typography variant="caption">
                                Volume: {keywordData.search_volume_estimate}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title={selectedKeywords.includes(keywordData.keyword) ? 'Remove' : 'Select'}>
                            <IconButton
                              onClick={() => handleToggleKeyword(keywordData.keyword)}
                              color={selectedKeywords.includes(keywordData.keyword) ? 'primary' : 'default'}
                            >
                              {selectedKeywords.includes(keywordData.keyword) ? <RemoveIcon /> : <AddIcon />}
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>

              {/* Selected Keywords */}
              {selectedKeywords.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Keywords ({selectedKeywords.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {selectedKeywords.map((keyword, index) => (
                      <Chip
                        key={index}
                        label={keyword}
                        onDelete={() => handleToggleKeyword(keyword)}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddSelectedKeywords}
                  >
                    Add Selected Keywords
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* Density Analysis */}
          {densityAnalysis && (
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon color="primary" />
                Keyword Density Analysis
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Total words: {densityAnalysis.total_words} | 
                  Overall density: {densityAnalysis.overall_density}%
                </Typography>
              </Alert>

              <List>
                {densityAnalysis.keyword_analysis.map((analysis: any, index: number) => (
                  <ListItem key={index} sx={{ border: '1px solid', borderColor: 'divider', mb: 1, borderRadius: 1 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="body1" fontWeight="bold">
                            {analysis.keyword}
                          </Typography>
                          <Chip
                            label={analysis.status}
                            size="small"
                            color={analysis.status === 'optimal' ? 'success' : analysis.status === 'low' ? 'warning' : 'error'}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                            <Typography variant="caption">
                              Exact matches: {analysis.exact_matches}
                            </Typography>
                            <Typography variant="caption">
                              Word matches: {analysis.word_matches}
                            </Typography>
                            <Typography variant="caption">
                              Density: {analysis.exact_density}%
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {analysis.recommendation}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  )
}

export default LSIKeywordResearch
