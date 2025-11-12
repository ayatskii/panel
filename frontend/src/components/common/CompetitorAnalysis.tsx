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
  ListItemIcon,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Compare as CompareIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { useAnalyzeCompetitorMutation, useCompareCompetitorsMutation } from '@/store/api/pagesApi'
import toast from 'react-hot-toast'

interface CompetitorAnalysisProps {
  targetKeywords?: string[]
  onInsightsGenerated?: (insights: string[]) => void
}

const CompetitorAnalysis = ({ targetKeywords = [], onInsightsGenerated }: CompetitorAnalysisProps) => {
  const [expanded, setExpanded] = useState(false)
  const [competitorUrl, setCompetitorUrl] = useState('')
  const [competitorUrls, setCompetitorUrls] = useState<string[]>([])
  const [analysisResults, setAnalysisResults] = useState<Record<string, unknown> | null>(null)
  const [comparisonResults, setComparisonResults] = useState<Record<string, unknown> | null>(null)
  const [compareDialogOpen, setCompareDialogOpen] = useState(false)
  const [newCompetitorUrl, setNewCompetitorUrl] = useState('')

  const [analyzeCompetitor, { isLoading: isAnalyzing }] = useAnalyzeCompetitorMutation()
  const [compareCompetitors, { isLoading: isComparing }] = useCompareCompetitorsMutation()

  const handleAnalyzeCompetitor = async () => {
    if (!competitorUrl.trim()) {
      toast.error('Please enter a competitor URL')
      return
    }

    try {
      const result = await analyzeCompetitor({
        competitor_url: competitorUrl,
        target_keywords: targetKeywords,
        analysis_depth: 'detailed',
      }).unwrap()

      if (result.success) {
        setAnalysisResults(result)
        toast.success('Competitor analysis completed!')
        
        if (onInsightsGenerated) {
          onInsightsGenerated(result.insights)
        }
      }
    } catch (error) {
      toast.error('Failed to analyze competitor')
      console.error('Competitor analysis error:', error)
    }
  }

  const handleCompareCompetitors = async () => {
    if (competitorUrls.length < 2) {
      toast.error('Please add at least 2 competitor URLs')
      return
    }

    try {
      const result = await compareCompetitors({
        competitor_urls: competitorUrls,
        target_keywords: targetKeywords,
      }).unwrap()

      if (result.success) {
        setComparisonResults(result)
        toast.success(`Compared ${result.competitor_count} competitors!`)
      }
    } catch (error) {
      toast.error('Failed to compare competitors')
      console.error('Competitor comparison error:', error)
    }
  }

  const handleAddCompetitorUrl = () => {
    if (newCompetitorUrl.trim() && !competitorUrls.includes(newCompetitorUrl.trim())) {
      setCompetitorUrls([...competitorUrls, newCompetitorUrl.trim()])
      setNewCompetitorUrl('')
    }
  }

  const handleRemoveCompetitorUrl = (url: string) => {
    setCompetitorUrls(competitorUrls.filter(u => u !== url))
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
          <CompareIcon color="primary" />
          Competitor Analysis
        </Typography>
        <IconButton onClick={() => setExpanded(!expanded)}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Competitor Analysis:</strong> Analyze competitor websites to understand their SEO strategies, 
              keyword usage, and content structure. Get insights to improve your own SEO performance.
            </Typography>
          </Alert>

          {/* Single Competitor Analysis */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Analyze Single Competitor
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Competitor URL"
                value={competitorUrl}
                onChange={(e) => setCompetitorUrl(e.target.value)}
                placeholder="https://example.com"
                fullWidth
                helperText="Enter the competitor website URL to analyze"
              />
              <Button
                variant="contained"
                startIcon={isAnalyzing ? <CircularProgress size={20} /> : <SearchIcon />}
                onClick={handleAnalyzeCompetitor}
                disabled={isAnalyzing || !competitorUrl.trim()}
                sx={{ minWidth: 150 }}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze'}
              </Button>
            </Box>
          </Box>

          {/* Multiple Competitor Comparison */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1">
                Compare Multiple Competitors
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setCompareDialogOpen(true)}
              >
                Add Competitor
              </Button>
            </Box>

            {competitorUrls.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Competitor URLs ({competitorUrls.length}):
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {competitorUrls.map((url, index) => (
                    <Chip
                      key={index}
                      label={url}
                      onDelete={() => handleRemoveCompetitorUrl(url)}
                      deleteIcon={<DeleteIcon />}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}

            <Button
              variant="contained"
              startIcon={isComparing ? <CircularProgress size={20} /> : <CompareIcon />}
              onClick={handleCompareCompetitors}
              disabled={isComparing || competitorUrls.length < 2}
            >
              {isComparing ? 'Comparing...' : `Compare ${competitorUrls.length} Competitors`}
            </Button>
          </Box>

          {/* Analysis Results */}
          {analysisResults && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SearchIcon color="primary" />
                Analysis Results: {analysisResults.competitor_url}
              </Typography>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Basic SEO Score
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                          label={`${analysisResults.basic_analysis.title_optimal ? '✓' : '✗'} Title`}
                          color={analysisResults.basic_analysis.title_optimal ? 'success' : 'error'}
                          size="small"
                        />
                        <Chip
                          label={`${analysisResults.basic_analysis.meta_description_optimal ? '✓' : '✗'} Meta`}
                          color={analysisResults.basic_analysis.meta_description_optimal ? 'success' : 'error'}
                          size="small"
                        />
                        <Chip
                          label={`${analysisResults.basic_analysis.h1_optimal ? '✓' : '✗'} H1`}
                          color={analysisResults.basic_analysis.h1_optimal ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {analysisResults.basic_analysis.word_count} words
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Content Structure
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                          label={`${analysisResults.content_analysis.content_structure_score}/100`}
                          color={getScoreColor(analysisResults.content_analysis.content_structure_score)}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {getScoreLabel(analysisResults.content_analysis.content_structure_score)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Technical SEO
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                          label={`${analysisResults.technical_analysis.technical_score}/100`}
                          color={getScoreColor(analysisResults.technical_analysis.technical_score)}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {getScoreLabel(analysisResults.technical_analysis.technical_score)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Detailed Analysis */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">Detailed Analysis</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {/* Meta Analysis */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            Meta Tags
                          </Typography>
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" fontWeight="bold">
                              Title: {analysisResults.meta_analysis.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {analysisResults.basic_analysis.title_length} characters
                            </Typography>
                          </Box>
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2">
                              Description: {analysisResults.meta_analysis.meta_description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {analysisResults.basic_analysis.meta_description_length} characters
                            </Typography>
                          </Box>
                          <Chip
                            label={`Meta Score: ${analysisResults.meta_analysis.meta_score}/100`}
                            color={getScoreColor(analysisResults.meta_analysis.meta_score)}
                            size="small"
                          />
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Keyword Analysis */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            Keyword Usage
                          </Typography>
                          {targetKeywords.length > 0 ? (
                            <Box>
                              <Typography variant="body2" gutterBottom>
                                Target keywords found: {analysisResults.keyword_analysis.target_keywords_found.length}/{targetKeywords.length}
                              </Typography>
                              {analysisResults.keyword_analysis.target_keywords_found.map((keyword: string) => (
                                <Chip
                                  key={keyword}
                                  label={keyword}
                                  size="small"
                                  color="success"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No target keywords specified
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Insights and Recommendations */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Key Insights
                </Typography>
                <List dense>
                  {analysisResults.insights.map((insight: string, index: number) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <WarningIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText primary={insight} />
                    </ListItem>
                  ))}
                </List>

                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Recommendations
                </Typography>
                <List dense>
                  {analysisResults.recommendations.map((recommendation: string, index: number) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CheckIcon color="success" />
                      </ListItemIcon>
                      <ListItemText primary={recommendation} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Box>
          )}

          {/* Comparison Results */}
          {comparisonResults && (
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CompareIcon color="primary" />
                Comparison Results ({comparisonResults.competitor_count} competitors)
              </Typography>

              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Successfully compared {comparisonResults.competitor_count} competitors
                </Typography>
              </Alert>

              <Typography variant="subtitle2" gutterBottom>
                Comparison Insights
              </Typography>
              <List dense>
                {comparisonResults.comparison_insights.map((insight: string, index: number) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <TrendingUpIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={insight} />
                  </ListItem>
                ))}
              </List>

              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Recommendations
              </Typography>
              <List dense>
                {comparisonResults.recommendations.map((recommendation: string, index: number) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary={recommendation} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>
      </Collapse>

      {/* Add Competitor Dialog */}
      <Dialog open={compareDialogOpen} onClose={() => setCompareDialogOpen(false)}>
        <DialogTitle>Add Competitor URL</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Competitor URL"
            fullWidth
            variant="outlined"
            value={newCompetitorUrl}
            onChange={(e) => setNewCompetitorUrl(e.target.value)}
            placeholder="https://example.com"
            helperText="Enter the competitor website URL"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddCompetitorUrl} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}

export default CompetitorAnalysis
