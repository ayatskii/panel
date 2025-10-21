import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material'
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Folder as FolderIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material'
import { useGetMediaQuery, useGetFoldersQuery } from '@/store/api/mediaApi'
import type { Media } from '@/types'

interface MediaSelectorProps {
  open: boolean
  onClose: () => void
  onSelect: (media: Media) => void
  fileType?: 'image' | 'document' | 'video'
}

const MediaSelector = ({ open, onClose, onSelect, fileType = 'image' }: MediaSelectorProps) => {
  const [currentFolder, setCurrentFolder] = useState<number | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [tabValue, setTabValue] = useState(0)

  const { data: media, isLoading: mediaLoading } = useGetMediaQuery({
    folder: currentFolder,
    type: fileType,
  })
  const { data: folders, isLoading: foldersLoading } = useGetFoldersQuery({
    parent: currentFolder ? currentFolder.toString() : 'null',
  })

  const filteredMedia = media?.filter(item =>
    item.original_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const handleSelect = () => {
    const selected = media?.find(m => m.id === selectedId)
    if (selected) {
      onSelect(selected)
      onClose()
      setSelectedId(null)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Select Media</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Search */}
        <TextField
          placeholder="Search files..."
          fullWidth
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
          <Tab label="Files" />
          <Tab label="Folders" />
        </Tabs>

        {/* Loading */}
        {(mediaLoading || foldersLoading) && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Folders Tab */}
        {tabValue === 1 && folders && folders.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 2,
            }}
          >
            {currentFolder && (
              <Card
                sx={{ cursor: 'pointer' }}
                onClick={() => setCurrentFolder(undefined)}
              >
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <FolderIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                  <Typography variant="caption">.. Back</Typography>
                </CardContent>
              </Card>
            )}
            {folders.map((folder) => (
              <Card
                key={folder.id}
                sx={{ cursor: 'pointer' }}
                onClick={() => setCurrentFolder(folder.id)}
              >
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <FolderIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                  <Typography variant="caption" noWrap>
                    {folder.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {folder.media_count || 0} files
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* Files Tab */}
        {tabValue === 0 && (
          <>
            {filteredMedia.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">No files found</Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: 2,
                  maxHeight: 400,
                  overflow: 'auto',
                }}
              >
                {filteredMedia.map((item) => (
                  <Card
                    key={item.id}
                    sx={{
                      cursor: 'pointer',
                      position: 'relative',
                      border: selectedId === item.id ? 2 : 0,
                      borderColor: 'primary.main',
                    }}
                    onClick={() => setSelectedId(item.id)}
                  >
                    {selectedId === item.id && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'primary.main',
                          borderRadius: '50%',
                          zIndex: 1,
                        }}
                      >
                        <CheckIcon sx={{ color: 'white', fontSize: 20 }} />
                      </Box>
                    )}
                    {item.file_type === 'image' ? (
                      <CardMedia
                        component="img"
                        height="120"
                        image={item.thumbnail_url || item.file_url}
                        alt={item.alt_text || item.original_name}
                        sx={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 120,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'grey.100',
                        }}
                      >
                        <Typography variant="caption">{item.file_type}</Typography>
                      </Box>
                    )}
                    <CardContent sx={{ p: 1 }}>
                      <Typography variant="caption" noWrap>
                        {item.original_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {item.size_mb.toFixed(2)} MB
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSelect}
          variant="contained"
          disabled={!selectedId}
        >
          Select
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default MediaSelector
