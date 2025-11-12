import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Image as ImageIcon,
  Download as DownloadIcon,
  Code as CodeIcon,
  CheckCircle as CheckCircleIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { useGenerateFaviconsMutation } from '@/store/api/mediaApi'
import toast from 'react-hot-toast'
import type { Media, FaviconGenerationResult } from '@/types'

interface FaviconGeneratorProps {
  media: Media
  siteDomain?: string
  onGenerated?: (result: FaviconGenerationResult) => void
}

const FaviconGenerator: React.FC<FaviconGeneratorProps> = ({
  media,
  siteDomain = '',
  onGenerated,
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationResult, setGenerationResult] = useState<FaviconGenerationResult | null>(null)
  const [domain, setDomain] = useState(siteDomain)
  const [showHtmlDialog, setShowHtmlDialog] = useState(false)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  const [generateFavicons] = useGenerateFaviconsMutation()

  const handleGenerate = async () => {
    if (!domain.trim()) {
      toast.error('Please enter a site domain')
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateFavicons({
        media_id: media.id,
        site_domain: domain.trim(),
      }).unwrap()

      setGenerationResult(result)
      onGenerated?.(result)
      
      if (result.success) {
        toast.success(`Generated ${result.total_files} favicon files successfully!`)
      } else {
        toast.error(result.error || 'Failed to generate favicons')
      }
    } catch {
      toast.error('Failed to generate favicons')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedLink(url)
    toast.success('Link copied to clipboard')
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const handleCopyHtml = () => {
    if (generationResult?.html_links) {
      const html = generationResult.html_links.join('\n')
      navigator.clipboard.writeText(html)
      toast.success('HTML links copied to clipboard')
    }
  }

  const getFileTypeIcon = (filename: string) => {
    if (filename.endsWith('.ico')) return '🔗'
    if (filename.endsWith('.svg')) return '📐'
    if (filename.endsWith('.png')) return '🖼️'
    return '📄'
  }

  const getFileTypeLabel = (filename: string) => {
    if (filename.includes('apple-touch-icon')) return 'Apple Touch Icon'
    if (filename.includes('safari-pinned-tab')) return 'Safari Pinned Tab'
    if (filename.endsWith('.ico')) return 'Favicon ICO'
    if (filename.endsWith('.svg')) return 'Favicon SVG'
    if (filename.includes('favicon-')) return 'Favicon PNG'
    return 'Favicon'
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <ImageIcon color="primary" />
            <Typography variant="h6">Favicon Generator</Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Generate multiple favicon formats from your image. This will create ICO, PNG, SVG, 
            Apple Touch Icon, and Safari Pinned Tab versions.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              label="Site Domain"
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              helperText="Domain name for the site (used in file naming)"
            />
            <Button
              variant="contained"
              onClick={handleGenerate}
              disabled={isGenerating || !domain.trim()}
              startIcon={isGenerating ? <CircularProgress size={16} /> : <RefreshIcon />}
              sx={{ minWidth: 140 }}
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </Box>

          {generationResult && (
            <Box>
              {generationResult.success ? (
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    Successfully generated {generationResult.total_files} favicon files!
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="error" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    {generationResult.error || 'Failed to generate favicons'}
                  </Typography>
                </Alert>
              )}

              {generationResult.success && generationResult.generated_files && (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Generated Files</Typography>
                    <Button
                      variant="outlined"
                      startIcon={<CodeIcon />}
                      onClick={() => setShowHtmlDialog(true)}
                    >
                      View HTML
                    </Button>
                  </Box>

                  <Grid container spacing={2}>
                    {Object.entries(generationResult.generated_files).map(([key, file]) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={key}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <Typography variant="h6" component="span">
                                {getFileTypeIcon(file.filename)}
                              </Typography>
                              <Typography variant="subtitle2" noWrap>
                                {getFileTypeLabel(file.filename)}
                              </Typography>
                            </Box>
                            
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                              {file.filename}
                            </Typography>
                            
                            {file.size && (
                              <Chip
                                label={`${file.size}x${file.size}px`}
                                size="small"
                                color="primary"
                                sx={{ mb: 1 }}
                              />
                            )}
                            
                            {file.sizes && (
                              <Box display="flex" gap={0.5} flexWrap="wrap" sx={{ mb: 1 }}>
                                {file.sizes.map((size) => (
                                  <Chip
                                    key={size}
                                    label={`${size}px`}
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                            )}

                            <Box display="flex" gap={1}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Download
                              </Button>
                              <Tooltip title={copiedLink === file.url ? 'Copied!' : 'Copy URL'}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleCopyLink(file.url)}
                                >
                                  {copiedLink === file.url ? <CheckCircleIcon /> : <CopyIcon />}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* HTML Links Dialog */}
      <Dialog
        open={showHtmlDialog}
        onClose={() => setShowHtmlDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">HTML Link Tags</Typography>
            <Button
              variant="outlined"
              startIcon={<CopyIcon />}
              onClick={handleCopyHtml}
            >
              Copy All
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Copy these HTML link tags to your site's &lt;head&gt; section:
          </Typography>
          
          <Box component="pre" sx={{ 
            mt: 2, 
            p: 2, 
            bgcolor: 'grey.100', 
            borderRadius: 1, 
            fontSize: '0.875rem',
            overflow: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {generationResult?.html_links?.join('\n')}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHtmlDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default FaviconGenerator
