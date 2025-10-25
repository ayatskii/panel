import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Link as MuiLink,
  Divider,
} from '@mui/material'
import {
  Description as PageIcon,
  ViewModule as BlockIcon,
  Language as SiteIcon,
  CheckCircle as UsedIcon,
  Cancel as NotUsedIcon,
} from '@mui/icons-material'
import { useGetMediaUsageQuery } from '@/store/api/mediaApi'

interface MediaUsageDialogProps {
  open: boolean
  onClose: () => void
  mediaId: number | null
  mediaName?: string
}

const MediaUsageDialog = ({ open, onClose, mediaId, mediaName }: MediaUsageDialogProps) => {
  const { data: usageData, isLoading, error } = useGetMediaUsageQuery(mediaId!, {
    skip: !mediaId || !open,
  })

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UsedIcon color="primary" />
          <Typography variant="h6">Media Usage</Typography>
        </Box>
        {mediaName && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {mediaName}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load usage information
          </Alert>
        )}

        {usageData && (
          <>
            {/* Summary */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                {usageData.usage_count > 0 ? (
                  <>
                    <UsedIcon color="success" />
                    <Typography variant="h6" color="success.main">
                      Used in {usageData.usage_count} {usageData.usage_count === 1 ? 'location' : 'locations'}
                    </Typography>
                  </>
                ) : (
                  <>
                    <NotUsedIcon color="warning" />
                    <Typography variant="h6" color="warning.main">
                      Not used anywhere
                    </Typography>
                  </>
                )}
              </Box>
              {usageData.usage_count === 0 && (
                <Typography variant="body2" color="text.secondary">
                  This media file is not currently used in any pages or blocks. It can be safely deleted.
                </Typography>
              )}
            </Box>

            {/* Usage List */}
            {usageData.usage_count > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Used in the following pages:
                </Typography>

                <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  {usageData.usage.map((usage, index) => (
                    <Box key={usage.block_id}>
                      {index > 0 && <Divider />}
                      <ListItem
                        sx={{
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          py: 2,
                        }}
                      >
                        {/* Page Info */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, width: '100%' }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <PageIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {usage.page_title}
                                </Typography>
                                <Chip label={usage.page_slug} size="small" variant="outlined" />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                <SiteIcon sx={{ fontSize: 16 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {usage.site_domain}
                                </Typography>
                              </Box>
                            }
                          />
                        </Box>

                        {/* Block Info */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            ml: 5,
                            p: 1,
                            bgcolor: 'action.hover',
                            borderRadius: 1,
                            width: 'calc(100% - 40px)',
                          }}
                        >
                          <BlockIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            Block: <strong>{usage.block_type}</strong> (Position #{usage.block_order + 1})
                          </Typography>
                        </Box>

                        {/* View Link */}
                        <Box sx={{ ml: 5, mt: 1 }}>
                          <MuiLink
                            href={`/pages?id=${usage.page_id}`}
                            target="_blank"
                            rel="noopener"
                            sx={{ fontSize: 14 }}
                          >
                            View page in editor →
                          </MuiLink>
                        </Box>
                      </ListItem>
                    </Box>
                  ))}
                </List>

                {/* Warning */}
                <Alert severity="warning" sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    <strong>Warning:</strong> Deleting this media file will affect {usageData.usage_count} {usageData.usage_count === 1 ? 'page' : 'pages'}. 
                    The content blocks will lose their images and may display broken image placeholders.
                  </Typography>
                </Alert>
              </>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default MediaUsageDialog

