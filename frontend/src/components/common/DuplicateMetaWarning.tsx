import { useEffect } from 'react'
import {
  Alert,
  AlertTitle,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Link,
  Chip,
} from '@mui/material'
import {
  Warning as WarningIcon,
} from '@mui/icons-material'
import { useCheckDuplicateMetaMutation } from '@/store/api/pagesApi'

interface DuplicateMetaWarningProps {
  siteId: number
  title: string
  metaDescription: string
  excludeId?: number
  onCheck?: (hasDuplicates: boolean) => void
}

const DuplicateMetaWarning = ({
  siteId,
  title,
  metaDescription,
  excludeId,
  onCheck,
}: DuplicateMetaWarningProps) => {
  const [checkDuplicates, { data: duplicateData }] = useCheckDuplicateMetaMutation()

  useEffect(() => {
    // Only check if we have meaningful content and a site
    if (siteId && (title.trim() || metaDescription.trim())) {
      const timeoutId = setTimeout(() => {
        checkDuplicates({
          site_id: siteId,
          title: title.trim(),
          meta_description: metaDescription.trim(),
          exclude_id: excludeId,
        })
      }, 1000) // Debounce for 1 second

      return () => clearTimeout(timeoutId)
    }
  }, [siteId, title, metaDescription, excludeId, checkDuplicates])

  useEffect(() => {
    if (duplicateData && onCheck) {
      onCheck(duplicateData.has_duplicates)
    }
  }, [duplicateData, onCheck])

  if (!duplicateData?.has_duplicates) {
    return null
  }

  const { title_duplicates, description_duplicates } = duplicateData

  return (
    <Alert 
      severity="warning" 
      sx={{ mt: 2 }}
      icon={<WarningIcon />}
    >
      <AlertTitle>Duplicate Meta Tags Detected</AlertTitle>
      
      <Typography variant="body2" sx={{ mb: 1 }}>
        The following meta tags are already used by other pages in this site:
      </Typography>

      {/* Title Duplicates */}
      {title_duplicates.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Chip label="Title" size="small" color="warning" />
            {title_duplicates.length} duplicate{title_duplicates.length > 1 ? 's' : ''} found
          </Typography>
          
          <List dense sx={{ pl: 2 }}>
            {title_duplicates.map((duplicate) => (
              <ListItem key={duplicate.id} sx={{ py: 0.5 }}>
                <ListItemText
                  primary={
                    <Link 
                      href={`/pages/${duplicate.id}/build`} 
                      target="_blank"
                      sx={{ textDecoration: 'none' }}
                    >
                      {duplicate.title}
                    </Link>
                  }
                  secondary={`/${duplicate.slug} • Created ${new Date(duplicate.created_at).toLocaleDateString()}`}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Description Duplicates */}
      {description_duplicates.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Chip label="Description" size="small" color="warning" />
            {description_duplicates.length} duplicate{description_duplicates.length > 1 ? 's' : ''} found
          </Typography>
          
          <List dense sx={{ pl: 2 }}>
            {description_duplicates.map((duplicate) => (
              <ListItem key={duplicate.id} sx={{ py: 0.5 }}>
                <ListItemText
                  primary={
                    <Link 
                      href={`/pages/${duplicate.id}/build`} 
                      target="_blank"
                      sx={{ textDecoration: 'none' }}
                    >
                      {duplicate.title}
                    </Link>
                  }
                  secondary={`/${duplicate.slug} • Created ${new Date(duplicate.created_at).toLocaleDateString()}`}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        💡 <strong>Tip:</strong> Consider making your meta tags unique to improve SEO and avoid confusion in search results.
      </Typography>
    </Alert>
  )
}

export default DuplicateMetaWarning

