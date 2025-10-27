import React from 'react'
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Alert,
  Chip,
} from '@mui/material'
import {
  Search as SearchIcon,
  ArrowForward as RedirectIcon,
  Public as PublicIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material'
import type { SiteFormData } from '@/types'

interface SEOSettingsStepProps {
  data: Partial<SiteFormData>
  onChange: (data: Partial<SiteFormData>) => void
  errors: Record<string, string>
}

const SEOSettingsStep: React.FC<SEOSettingsStepProps> = ({
  data,
  onChange,
}) => {
  const handleIndexingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ allow_indexing: event.target.checked })
  }

  const handleRedirect404Change = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ redirect_404_to_home: event.target.checked })
  }

  const handleWwwVersionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ use_www_version: event.target.checked })
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        SEO & Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure SEO settings and redirect rules for your site.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Search Engine Indexing */}
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <SearchIcon color="primary" />
              <Typography variant="h6">Search Engine Indexing</Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={data.allow_indexing ?? true}
                  onChange={handleIndexingChange}
                  color="primary"
                />
              }
              label="Allow search engines to index this site"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {data.allow_indexing ? (
                <>
                  <Chip label="Indexed" size="small" color="success" sx={{ mr: 1 }} />
                  Search engines can crawl and index your site. Meta tag: 
                  <code style={{ margin: '0 4px', padding: '2px 4px', background: '#f5f5f5', borderRadius: '3px' }}>
                    &lt;meta name="robots" content="index, follow"&gt;
                  </code>
                </>
              ) : (
                <>
                  <Chip label="No Index" size="small" color="warning" sx={{ mr: 1 }} />
                  Search engines will not index your site. Meta tag: 
                  <code style={{ margin: '0 4px', padding: '2px 4px', background: '#f5f5f5', borderRadius: '3px' }}>
                    &lt;meta name="robots" content="noindex"&gt;
                  </code>
                </>
              )}
            </Typography>
          </CardContent>
        </Card>

        {/* 404 Redirect */}
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <RedirectIcon color="primary" />
              <Typography variant="h6">404 Page Redirect</Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={data.redirect_404_to_home ?? false}
                  onChange={handleRedirect404Change}
                  color="primary"
                />
              }
              label="Redirect 404 pages to home page"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {data.redirect_404_to_home ? (
                <>
                  <Chip label="Enabled" size="small" color="success" sx={{ mr: 1 }} />
                  All 404 errors will redirect to the home page using Cloudflare page rules.
                </>
              ) : (
                <>
                  <Chip label="Disabled" size="small" color="default" sx={{ mr: 1 }} />
                  Standard 404 error pages will be shown.
                </>
              )}
            </Typography>
            {data.redirect_404_to_home && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Cloudflare Rule Expression:</strong>
                </Typography>
                <Box component="pre" sx={{ 
                  mt: 1, 
                  p: 1, 
                  bgcolor: 'grey.100', 
                  borderRadius: 1, 
                  fontSize: '0.75rem',
                  overflow: 'auto'
                }}>
{`(http.request.uri.path wildcard r"/*" and 
 http.request.uri.path ne "/" and 
 not http.request.uri.path contains "_assets" and 
 not http.request.uri.path contains "sitemap" and 
 not http.request.uri.path in {"/robots.txt" "/static/index.js" "/static/e" "/go/login" "/go/register"})`}
                </Box>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* WWW Version */}
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <PublicIcon color="primary" />
              <Typography variant="h6">WWW Version</Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={data.use_www_version ?? false}
                  onChange={handleWwwVersionChange}
                  color="primary"
                />
              }
              label="Use www version of the domain"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {data.use_www_version ? (
                <>
                  <Chip label="WWW Enabled" size="small" color="success" sx={{ mr: 1 }} />
                  www.{data.domain} will redirect to {data.domain} using Cloudflare page rules.
                </>
              ) : (
                <>
                  <Chip label="No WWW" size="small" color="default" sx={{ mr: 1 }} />
                  Both www and non-www versions will work normally.
                </>
              )}
            </Typography>
            {data.use_www_version && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Cloudflare Rule Expression:</strong>
                </Typography>
                <Box component="pre" sx={{ 
                  mt: 1, 
                  p: 1, 
                  bgcolor: 'grey.100', 
                  borderRadius: 1, 
                  fontSize: '0.75rem',
                  overflow: 'auto'
                }}>
{`(http.host eq "www.${data.domain}")
Dynamic concat("https://${data.domain}", http.request.uri.path) 301 first`}
                </Box>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Page Speed Optimization */}
        <Card sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <SpeedIcon color="success" />
              <Typography variant="h6" color="success.main">
                Page Speed Optimization
              </Typography>
              <Chip label="Enabled" size="small" color="success" />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Images will be automatically optimized with WebP format and responsive picture tags for better performance.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default SEOSettingsStep
