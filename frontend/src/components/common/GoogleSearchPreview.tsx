import { Box, Paper, Typography, Link } from '@mui/material'
import { Language as WebIcon } from '@mui/icons-material'

interface GoogleSearchPreviewProps {
  title: string
  description: string
  url: string
  siteName?: string
}

const GoogleSearchPreview = ({
  title,
  description,
  url,
  siteName,
}: GoogleSearchPreviewProps) => {
  // Truncate title to 60 characters (Google's limit)
  const truncatedTitle = title
    ? title.length > 60
      ? title.substring(0, 57) + '...'
      : title
    : 'Your Page Title'

  // Truncate description to 160 characters (Google's limit)
  const truncatedDescription = description
    ? description.length > 160
      ? description.substring(0, 157) + '...'
      : description
    : 'Your meta description will appear here...'

  // Format URL for display
  const displayUrl = url || 'example.com/your-page'

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <WebIcon fontSize="small" />
        Google Search Preview
      </Typography>

      <Paper
        sx={{
          p: 2,
          bgcolor: '#fff',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
        }}
      >
        {/* Site Name / Breadcrumb */}
        {siteName && (
          <Typography
            variant="caption"
            sx={{
              color: '#5f6368',
              fontSize: '14px',
              lineHeight: '20px',
              mb: 0.5,
              display: 'block',
            }}
          >
            {siteName}
          </Typography>
        )}

        {/* URL */}
        <Typography
          variant="body2"
          sx={{
            color: '#202124',
            fontSize: '14px',
            lineHeight: '20px',
            mb: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <Box
            component="span"
            sx={{
              width: 18,
              height: 18,
              bgcolor: '#f8f9fa',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
            }}
          >
            🌐
          </Box>
          {displayUrl}
        </Typography>

        {/* Title */}
        <Link
          component="div"
          sx={{
            color: '#1a0dab',
            fontSize: '20px',
            lineHeight: '26px',
            fontWeight: 400,
            textDecoration: 'none',
            cursor: 'pointer',
            mb: 0.5,
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
          {truncatedTitle}
        </Link>

        {/* Description */}
        <Typography
          variant="body2"
          sx={{
            color: '#4d5156',
            fontSize: '14px',
            lineHeight: '22px',
          }}
        >
          {truncatedDescription}
        </Typography>

        {/* Truncation Warning */}
        {(title.length > 60 || description.length > 160) && (
          <Box
            sx={{
              mt: 1.5,
              pt: 1.5,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" color="warning.main">
              ⚠️ {title.length > 60 && 'Title'}{title.length > 60 && description.length > 160 && ' and '}{description.length > 160 && 'Description'} will be truncated in search results
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Help Text */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        This is how your page will appear in Google search results. Keep your title under 60 characters and description under 160 characters for best results.
      </Typography>
    </Box>
  )
}

export default GoogleSearchPreview

