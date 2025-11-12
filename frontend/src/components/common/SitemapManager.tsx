import { useState } from 'react'
import {
  Box,
  Button,
  Paper,
  Typography,
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
  TextField,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Tabs,
  Tab,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckIcon,
  AccountTree as SitemapIcon,
  SmartToy as RobotIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  Settings as SettingsIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material'
import {
  useGenerateSitemapMutation,
  useGenerateRobotsTxtMutation,
  useGenerateSitemapIndexMutation,
  useValidateSitemapMutation,
  useGetSitemapStatsQuery,
} from '@/store/api/pagesApi'
import toast from 'react-hot-toast'

interface SitemapManagerProps {
  siteId: number
  siteDomain?: string
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`sitemap-tabpanel-${index}`}
      aria-labelledby={`sitemap-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const SitemapManager = ({ siteId, siteDomain }: SitemapManagerProps) => {
  const [expanded, setExpanded] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sitemapResults, setSitemapResults] = useState<Record<string, unknown> | null>(null)
  const [robotsResults, setRobotsResults] = useState<Record<string, unknown> | null>(null)
  const [indexResults, setIndexResults] = useState<Record<string, unknown> | null>(null)
  const [validationResults, setValidationResults] = useState<Record<string, unknown> | null>(null)

  // Settings state
  const [includeImages, setIncludeImages] = useState(true)
  const [includeMedia, setIncludeMedia] = useState(true)
  const [customRules, setCustomRules] = useState<string[]>([''])
  const [priorityBoosts] = useState<Record<string, number>>({})

  const [generateSitemap, { isLoading: isGeneratingSitemap }] = useGenerateSitemapMutation()
  const [generateRobotsTxt, { isLoading: isGeneratingRobots }] = useGenerateRobotsTxtMutation()
  const [generateSitemapIndex, { isLoading: isGeneratingIndex }] = useGenerateSitemapIndexMutation()
  const [validateSitemap] = useValidateSitemapMutation()

  const { data: statsData, refetch: refetchStats } = useGetSitemapStatsQuery(
    { site_id: siteId },
    { skip: !siteId }
  )

  const handleGenerateSitemap = async () => {
    try {
      const result = await generateSitemap({
        site_id: siteId,
        include_images: includeImages,
        include_media: includeMedia,
        priority_boost: priorityBoosts,
      }).unwrap()

      if (result.success) {
        setSitemapResults(result)
        toast.success(`Generated sitemap with ${result.page_count} pages!`)
        refetchStats()
      }
    } catch (error) {
      toast.error('Failed to generate sitemap')
      console.error('Sitemap generation error:', error)
    }
  }

  const handleGenerateRobotsTxt = async () => {
    try {
      const result = await generateRobotsTxt({
        site_id: siteId,
        custom_rules: customRules.filter(rule => rule.trim()),
        sitemap_url: siteDomain ? `https://${siteDomain}/sitemap.xml` : undefined,
      }).unwrap()

      if (result.success) {
        setRobotsResults(result)
        toast.success('Generated robots.txt file!')
      }
    } catch (error) {
      toast.error('Failed to generate robots.txt')
      console.error('Robots.txt generation error:', error)
    }
  }

  const handleGenerateSitemapIndex = async () => {
    try {
      const result = await generateSitemapIndex({
        site_id: siteId,
        sitemap_types: ['pages', 'images', 'media'],
      }).unwrap()

      if (result.success) {
        setIndexResults(result)
        toast.success('Generated sitemap index!')
      }
    } catch (error) {
      toast.error('Failed to generate sitemap index')
      console.error('Sitemap index generation error:', error)
    }
  }

  const handleValidateSitemap = async (xmlContent: string) => {
    try {
      const result = await validateSitemap({
        xml_content: xmlContent,
      }).unwrap()

      setValidationResults(result)
      
      if (result.valid) {
        toast.success('Sitemap is valid!')
      } else {
        toast.error('Sitemap validation failed')
      }
    } catch (error) {
      toast.error('Failed to validate sitemap')
      console.error('Sitemap validation error:', error)
    }
  }

  const handleCopyToClipboard = (content: string, type: string) => {
    navigator.clipboard.writeText(content)
    toast.success(`${type} copied to clipboard!`)
  }

  const handleDownloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${filename}!`)
  }

  const handleAddCustomRule = () => {
    setCustomRules([...customRules, ''])
  }

  const handleRemoveCustomRule = (index: number) => {
    setCustomRules(customRules.filter((_, i) => i !== index))
  }

  const handleCustomRuleChange = (index: number, value: string) => {
    const newRules = [...customRules]
    newRules[index] = value
    setCustomRules(newRules)
  }

  const getValidationColor = (valid: boolean) => {
    return valid ? 'success' : 'error'
  }

  const getValidationIcon = (valid: boolean) => {
    return valid ? <CheckIcon /> : <ErrorIcon />
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SitemapIcon color="primary" />
          Sitemap & Robots.txt Manager
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={() => setSettingsOpen(true)}>
            <SettingsIcon />
          </IconButton>
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Sitemap & Robots.txt:</strong> Generate XML sitemaps and robots.txt files 
              to help search engines crawl and index your website effectively.
            </Typography>
          </Alert>

          {/* Statistics */}
          {statsData && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Published Pages
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {statsData.published_pages}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {statsData.publish_percentage.toFixed(1)}% of total
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Total Pages
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {statsData.total_pages}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      All pages
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Media Files
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {statsData.media_files}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Images & files
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Last Updated
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {statsData.last_updated ? new Date(statsData.last_updated).toLocaleDateString() : 'Never'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab label="Sitemap" />
              <Tab label="Robots.txt" />
              <Tab label="Sitemap Index" />
              <Tab label="Validation" />
            </Tabs>
          </Box>

          {/* Sitemap Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Generate XML Sitemap
              </Typography>
              
              <FormGroup sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeImages}
                      onChange={(e) => setIncludeImages(e.target.checked)}
                    />
                  }
                  label="Include images in sitemap"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeMedia}
                      onChange={(e) => setIncludeMedia(e.target.checked)}
                    />
                  }
                  label="Include media files in sitemap"
                />
              </FormGroup>

              <Button
                variant="contained"
                startIcon={isGeneratingSitemap ? <CircularProgress size={20} /> : <SitemapIcon />}
                onClick={handleGenerateSitemap}
                disabled={isGeneratingSitemap}
                sx={{ mb: 2 }}
              >
                {isGeneratingSitemap ? 'Generating...' : 'Generate Sitemap'}
              </Button>

              {sitemapResults && (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Generated sitemap for {sitemapResults.site_domain} with {sitemapResults.page_count} pages and {sitemapResults.image_count} images
                    </Typography>
                  </Alert>

                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<CopyIcon />}
                      onClick={() => handleCopyToClipboard(sitemapResults.xml_content, 'Sitemap')}
                    >
                      Copy XML
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownloadFile(sitemapResults.xml_content, 'sitemap.xml')}
                    >
                      Download
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      onClick={() => handleValidateSitemap(sitemapResults.xml_content)}
                    >
                      Validate
                    </Button>
                  </Box>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2">View XML Content</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Code sx={{ display: 'block', whiteSpace: 'pre-wrap', maxHeight: 400, overflow: 'auto' }}>
                        {sitemapResults.xml_content}
                      </Code>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              )}
            </Box>
          </TabPanel>

          {/* Robots.txt Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Generate Robots.txt
              </Typography>

              <Button
                variant="contained"
                startIcon={isGeneratingRobots ? <CircularProgress size={20} /> : <RobotIcon />}
                onClick={handleGenerateRobotsTxt}
                disabled={isGeneratingRobots}
                sx={{ mb: 2 }}
              >
                {isGeneratingRobots ? 'Generating...' : 'Generate Robots.txt'}
              </Button>

              {robotsResults && (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Generated robots.txt for {robotsResults.site_domain}
                    </Typography>
                  </Alert>

                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<CopyIcon />}
                      onClick={() => handleCopyToClipboard(robotsResults.robots_content, 'Robots.txt')}
                    >
                      Copy Content
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownloadFile(robotsResults.robots_content, 'robots.txt')}
                    >
                      Download
                    </Button>
                  </Box>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2">View Robots.txt Content</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Code sx={{ display: 'block', whiteSpace: 'pre-wrap' }}>
                        {robotsResults.robots_content}
                      </Code>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              )}
            </Box>
          </TabPanel>

          {/* Sitemap Index Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Generate Sitemap Index
              </Typography>

              <Button
                variant="contained"
                startIcon={isGeneratingIndex ? <CircularProgress size={20} /> : <SitemapIcon />}
                onClick={handleGenerateSitemapIndex}
                disabled={isGeneratingIndex}
                sx={{ mb: 2 }}
              >
                {isGeneratingIndex ? 'Generating...' : 'Generate Sitemap Index'}
              </Button>

              {indexResults && (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Generated sitemap index for {indexResults.site_domain}
                    </Typography>
                  </Alert>

                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<CopyIcon />}
                      onClick={() => handleCopyToClipboard(indexResults.xml_content, 'Sitemap Index')}
                    >
                      Copy XML
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownloadFile(indexResults.xml_content, 'sitemap-index.xml')}
                    >
                      Download
                    </Button>
                  </Box>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2">View Sitemap Index Content</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Code sx={{ display: 'block', whiteSpace: 'pre-wrap' }}>
                        {indexResults.xml_content}
                      </Code>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              )}
            </Box>
          </TabPanel>

          {/* Validation Tab */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Validate Sitemap XML
              </Typography>

              {validationResults && (
                <Box>
                  <Alert 
                    severity={validationResults.valid ? 'success' : 'error'} 
                    sx={{ mb: 2 }}
                    icon={getValidationIcon(validationResults.valid)}
                  >
                    <Typography variant="body2">
                      {validationResults.valid ? 'Sitemap is valid!' : 'Sitemap validation failed'}
                    </Typography>
                  </Alert>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card>
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            Validation Results
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Chip
                              label={validationResults.valid ? 'Valid' : 'Invalid'}
                              color={getValidationColor(validationResults.valid)}
                              size="small"
                            />
                            <Chip
                              label={validationResults.element_type}
                              color="primary"
                              size="small"
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {validationResults.element_count} elements
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card>
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            File Information
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Size: {(validationResults.file_size / 1024).toFixed(2)} KB
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Namespace: {validationResults.namespace_valid ? 'Valid' : 'Invalid'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  {validationResults.validation_errors.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Validation Errors
                      </Typography>
                      <List dense>
                        {validationResults.validation_errors.map((error: string, index: number) => (
                          <ListItem key={index} sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <ErrorIcon color="error" />
                            </ListItemIcon>
                            <ListItemText primary={error} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </TabPanel>
        </Box>
      </Collapse>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Sitemap Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Custom Robots.txt Rules
            </Typography>
            {customRules.map((rule, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  value={rule}
                  onChange={(e) => handleCustomRuleChange(index, e.target.value)}
                  placeholder="e.g., Disallow: /private/"
                  size="small"
                />
                <IconButton onClick={() => handleRemoveCustomRule(index)}>
                  <ErrorIcon />
                </IconButton>
              </Box>
            ))}
            <Button
              variant="outlined"
              startIcon={<CheckIcon />}
              onClick={handleAddCustomRule}
              size="small"
            >
              Add Rule
            </Button>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Priority Boosts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Boost priority for specific pages (0.0 - 1.0)
            </Typography>
            {/* Priority boost inputs would go here */}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}

export default SitemapManager
