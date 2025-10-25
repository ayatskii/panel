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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Warning as WarningIcon,
  Error as ErrorIcon,
  Schema as SchemaIcon,
  Lightbulb as LightbulbIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material'
import {
  useGeneratePageSchemaMutation,
  useGetSchemaRecommendationsQuery,
  useGenerateWebsiteSchemaMutation,
  useValidateSchemaMutation,
} from '@/store/api/pagesApi'
import toast from 'react-hot-toast'

interface SchemaManagerProps {
  pageId?: number
  siteId?: number
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
      id={`schema-tabpanel-${index}`}
      aria-labelledby={`schema-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const SchemaManager = ({ pageId, siteId }: SchemaManagerProps) => {
  const [expanded, setExpanded] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [schemaResults, setSchemaResults] = useState<Record<string, unknown> | null>(null)
  const [websiteSchemaResults, setWebsiteSchemaResults] = useState<Record<string, unknown> | null>(null)
  const [validationResults, setValidationResults] = useState<Record<string, unknown> | null>(null)

  // Settings state
  const [schemaType, setSchemaType] = useState('WebPage')
  const [includeBreadcrumbs, setIncludeBreadcrumbs] = useState(true)
  const [includeOrganization, setIncludeOrganization] = useState(true)

  const [generatePageSchema, { isLoading: isGeneratingSchema }] = useGeneratePageSchemaMutation()
  const [generateWebsiteSchema, { isLoading: isGeneratingWebsiteSchema }] = useGenerateWebsiteSchemaMutation()
  const [validateSchema] = useValidateSchemaMutation()

  const { data: recommendationsData, refetch: refetchRecommendations } = useGetSchemaRecommendationsQuery(
    { pageId: pageId! },
    { skip: !pageId }
  )

  const schemaTypes = [
    { value: 'WebPage', label: 'Web Page' },
    { value: 'Article', label: 'Article' },
    { value: 'BlogPosting', label: 'Blog Post' },
    { value: 'FAQPage', label: 'FAQ Page' },
    { value: 'HowTo', label: 'How-To Guide' },
    { value: 'Product', label: 'Product' },
    { value: 'Event', label: 'Event' },
  ]

  const handleGeneratePageSchema = async () => {
    if (!pageId) {
      toast.error('Page ID is required')
      return
    }

    try {
      const result = await generatePageSchema({
        pageId,
        schema_type: schemaType,
        include_breadcrumbs: includeBreadcrumbs,
        include_organization: includeOrganization,
      }).unwrap()

      if (result.success) {
        setSchemaResults(result)
        toast.success(`Generated ${result.schema_type} schema!`)
        refetchRecommendations()
      }
    } catch (error) {
      toast.error('Failed to generate page schema')
      console.error('Schema generation error:', error)
    }
  }

  const handleGenerateWebsiteSchema = async () => {
    if (!siteId) {
      toast.error('Site ID is required')
      return
    }

    try {
      const result = await generateWebsiteSchema({
        site_id: siteId,
      }).unwrap()

      if (result.success) {
        setWebsiteSchemaResults(result)
        toast.success('Generated website schema!')
      }
    } catch (error) {
      toast.error('Failed to generate website schema')
      console.error('Website schema generation error:', error)
    }
  }

  const handleValidateSchema = async (schemaData: Record<string, unknown>) => {
    try {
      const result = await validateSchema({
        schema_data: schemaData,
      }).unwrap()

      setValidationResults(result)
      
      if (result.valid) {
        toast.success('Schema is valid!')
      } else {
        toast.error('Schema validation failed')
      }
    } catch (error) {
      toast.error('Failed to validate schema')
      console.error('Schema validation error:', error)
    }
  }

  const handleCopyToClipboard = (content: string, type: string) => {
    navigator.clipboard.writeText(content)
    toast.success(`${type} copied to clipboard!`)
  }

  const handleDownloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/json' })
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

  const getValidationColor = (valid: boolean) => {
    return valid ? 'success' : 'error'
  }

  const getValidationIcon = (valid: boolean) => {
    return valid ? <CheckIcon /> : <ErrorIcon />
  }

  const getSchemaTypeColor = (type: string) => {
    const colors = {
      'WebPage': 'default',
      'Article': 'primary',
      'BlogPosting': 'secondary',
      'FAQPage': 'success',
      'HowTo': 'warning',
      'Product': 'info',
      'Event': 'error'
    }
    return colors[type as keyof typeof colors] || 'default'
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchemaIcon color="primary" />
          Schema.org & Microdata Manager
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
              <strong>Schema.org & Microdata:</strong> Generate structured data markup to help search engines 
              understand your content and display rich snippets in search results.
            </Typography>
          </Alert>

          {/* Schema Recommendations */}
          {recommendationsData && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LightbulbIcon color="primary" />
                Schema Recommendations
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Suggested Schema Types
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {recommendationsData.suggested_schema_types.map((type: string) => (
                          <Chip
                            key={type}
                            label={type}
                            color={getSchemaTypeColor(type)}
                            size="small"
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Content Analysis
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="caption">
                          Word count: {recommendationsData.content_analysis.word_count}
                        </Typography>
                        <Typography variant="caption">
                          Has FAQ content: {recommendationsData.content_analysis.has_faq_content ? 'Yes' : 'No'}
                        </Typography>
                        <Typography variant="caption">
                          Has images: {recommendationsData.content_analysis.has_image_content ? 'Yes' : 'No'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {recommendationsData.recommendations.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Recommendations
                  </Typography>
                  <List dense>
                    {recommendationsData.recommendations.map((recommendation: string, index: number) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <WarningIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText primary={recommendation} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab label="Page Schema" />
              <Tab label="Website Schema" />
              <Tab label="Validation" />
            </Tabs>
          </Box>

          {/* Page Schema Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Generate Page Schema
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Schema Type</InputLabel>
                    <Select
                      value={schemaType}
                      onChange={(e) => setSchemaType(e.target.value)}
                      label="Schema Type"
                    >
                      {schemaTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={includeBreadcrumbs}
                          onChange={(e) => setIncludeBreadcrumbs(e.target.checked)}
                        />
                      }
                      label="Include breadcrumbs"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={includeOrganization}
                          onChange={(e) => setIncludeOrganization(e.target.checked)}
                        />
                      }
                      label="Include organization"
                    />
                  </FormGroup>
                </Grid>
              </Grid>

              <Button
                variant="contained"
                startIcon={isGeneratingSchema ? <CircularProgress size={20} /> : <SchemaIcon />}
                onClick={handleGeneratePageSchema}
                disabled={isGeneratingSchema || !pageId}
                sx={{ mb: 2 }}
              >
                {isGeneratingSchema ? 'Generating...' : 'Generate Page Schema'}
              </Button>

              {schemaResults && (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Generated {schemaResults.schema_type} schema for page: {schemaResults.page_slug}
                    </Typography>
                  </Alert>

                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<CopyIcon />}
                      onClick={() => handleCopyToClipboard(schemaResults.json_ld, 'Schema JSON-LD')}
                    >
                      Copy JSON-LD
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownloadFile(schemaResults.json_ld, 'schema.json')}
                    >
                      Download
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      onClick={() => handleValidateSchema(schemaResults.structured_data)}
                    >
                      Validate
                    </Button>
                  </Box>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2">View JSON-LD Schema</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Code sx={{ display: 'block', whiteSpace: 'pre-wrap', maxHeight: 400, overflow: 'auto' }}>
                        {schemaResults.json_ld}
                      </Code>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              )}
            </Box>
          </TabPanel>

          {/* Website Schema Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Generate Website Schema
              </Typography>

              <Button
                variant="contained"
                startIcon={isGeneratingWebsiteSchema ? <CircularProgress size={20} /> : <SchemaIcon />}
                onClick={handleGenerateWebsiteSchema}
                disabled={isGeneratingWebsiteSchema || !siteId}
                sx={{ mb: 2 }}
              >
                {isGeneratingWebsiteSchema ? 'Generating...' : 'Generate Website Schema'}
              </Button>

              {websiteSchemaResults && (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Generated website schema for {websiteSchemaResults.site_domain}
                    </Typography>
                  </Alert>

                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<CopyIcon />}
                      onClick={() => handleCopyToClipboard(websiteSchemaResults.json_ld, 'Website Schema JSON-LD')}
                    >
                      Copy JSON-LD
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownloadFile(websiteSchemaResults.json_ld, 'website-schema.json')}
                    >
                      Download
                    </Button>
                  </Box>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2">View Website Schema JSON-LD</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Code sx={{ display: 'block', whiteSpace: 'pre-wrap', maxHeight: 400, overflow: 'auto' }}>
                        {websiteSchemaResults.json_ld}
                      </Code>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              )}
            </Box>
          </TabPanel>

          {/* Validation Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Validate Schema.org Markup
              </Typography>

              {validationResults && (
                <Box>
                  <Alert 
                    severity={validationResults.valid ? 'success' : 'error'} 
                    sx={{ mb: 2 }}
                    icon={getValidationIcon(validationResults.valid)}
                  >
                    <Typography variant="body2">
                      {validationResults.valid ? 'Schema is valid!' : 'Schema validation failed'}
                    </Typography>
                  </Alert>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={6}>
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
                              label={validationResults.schema_type}
                              color="primary"
                              size="small"
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {validationResults.field_count} fields
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            Issues Found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Errors: {validationResults.validation_errors.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Warnings: {validationResults.warnings.length}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  {validationResults.validation_errors.length > 0 && (
                    <Box sx={{ mb: 2 }}>
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

                  {validationResults.warnings.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Warnings
                      </Typography>
                      <List dense>
                        {validationResults.warnings.map((warning: string, index: number) => (
                          <ListItem key={index} sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <WarningIcon color="warning" />
                            </ListItemIcon>
                            <ListItemText primary={warning} />
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
        <DialogTitle>Schema Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Schema Generation Options
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeBreadcrumbs}
                    onChange={(e) => setIncludeBreadcrumbs(e.target.checked)}
                  />
                }
                label="Include breadcrumb navigation"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeOrganization}
                    onChange={(e) => setIncludeOrganization(e.target.checked)}
                  />
                }
                label="Include organization information"
              />
            </FormGroup>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Schema Type Information
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • WebPage: General web page content<br/>
              • Article: News articles, blog posts, stories<br/>
              • FAQPage: Frequently asked questions<br/>
              • HowTo: Step-by-step instructions<br/>
              • Product: Product information and reviews<br/>
              • Event: Event details and scheduling
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}

export default SchemaManager
