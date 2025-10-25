import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material'
import {
  Storage as StorageIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  Description as DocumentIcon,
  Folder as FolderIcon,
  CheckCircle as OptimizedIcon,
} from '@mui/icons-material'
import { useGetMediaAnalyticsQuery } from '@/store/api/mediaApi'
import { format } from 'date-fns'

const MediaAnalyticsDashboard = () => {
  const { data: analytics, isLoading, error } = useGetMediaAnalyticsQuery()

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load analytics data
      </Alert>
    )
  }

  if (!analytics) {
    return null
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'images':
        return <ImageIcon color="primary" />
      case 'video':
        return <VideoIcon color="success" />
      case 'documents':
        return <DocumentIcon color="error" />
      default:
        return <FileIcon />
    }
  }

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Total Files */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <FileIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Files
                </Typography>
              </Box>
              <Typography variant="h4">{analytics.total_files}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Storage */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StorageIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Storage
                </Typography>
              </Box>
              <Typography variant="h4">
                {analytics.total_size_gb > 1
                  ? `${analytics.total_size_gb} GB`
                  : `${analytics.total_size_mb} MB`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Average File Size */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ImageIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Avg File Size
                </Typography>
              </Box>
              <Typography variant="h4">
                {formatFileSize(analytics.average_size_bytes)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Optimized Images */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <OptimizedIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Optimized
                </Typography>
              </Box>
              <Typography variant="h4">{analytics.optimization_percentage}%</Typography>
              <Typography variant="caption" color="text.secondary">
                {analytics.optimized_images} images
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Storage by Type */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Storage by Type
          </Typography>
          {analytics.storage_by_type.map((typeData) => (
            <Box key={typeData.type} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getTypeIcon(typeData.type)}
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    {typeData.type}
                  </Typography>
                  <Chip
                    label={`${typeData.count} files`}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Box>
                <Typography variant="body2" fontWeight="bold">
                  {typeData.size_mb} MB ({typeData.percentage}%)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={typeData.percentage}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>
          ))}
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Storage by Folder */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Storage by Folder
              </Typography>
              <List dense>
                {analytics.storage_by_folder.slice(0, 10).map((folderData, index) => (
                  <Box key={folderData.folder_id || 'root'}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <FolderIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">{folderData.folder_name}</Typography>
                            <Chip label={`${folderData.count} files`} size="small" />
                          </Box>
                        }
                        secondary={folderData.folder_path}
                      />
                      <Typography variant="body2" fontWeight="bold">
                        {folderData.size_mb} MB
                      </Typography>
                    </ListItem>
                  </Box>
                ))}
                {analytics.storage_by_folder.length === 0 && (
                  <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                    No folders yet
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Largest Files */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Largest Files
              </Typography>
              <List dense>
                {analytics.largest_files.map((file, index) => (
                  <Box key={file.id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemText
                        primary={
                          <Typography variant="body2" noWrap>
                            {file.original_name}
                          </Typography>
                        }
                        secondary={format(new Date(file.created_at), 'MMM d, yyyy')}
                      />
                      <Typography variant="body2" fontWeight="bold" color="error.main">
                        {formatFileSize(file.file_size)}
                      </Typography>
                    </ListItem>
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default MediaAnalyticsDashboard

