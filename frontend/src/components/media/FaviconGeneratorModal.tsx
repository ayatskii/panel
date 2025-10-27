import React, { useState } from 'react'
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
  Alert,
} from '@mui/material'
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Folder as FolderIcon,
  CheckCircle as CheckIcon,
  Image as ImageIcon,
} from '@mui/icons-material'
import { useGetMediaQuery, useGetFoldersQuery } from '@/store/api/mediaApi'
import FaviconGenerator from './FaviconGenerator'
import type { Media } from '@/types'

interface FaviconGeneratorModalProps {
  open: boolean
  onClose: () => void
  siteDomain?: string
  onFaviconsGenerated?: (result: FaviconGenerationResult) => void
}

const FaviconGeneratorModal = ({ 
  open, 
  onClose, 
  siteDomain = '',
  onFaviconsGenerated 
}: FaviconGeneratorModalProps) => {
  const [currentFolder, setCurrentFolder] = useState<number | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null)
  const [tabValue, setTabValue] = useState(0)

  const { data: media, isLoading: mediaLoading } = useGetMediaQuery({
    folder: currentFolder,
    type: 'image',
  })
  const { data: folders, isLoading: foldersLoading } = useGetFoldersQuery({
    parent: currentFolder ? currentFolder.toString() : 'null',
  })

  const filteredMedia = media?.filter(item =>
    item.original_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelect = (media: Media) => {
    setSelectedMedia(media)
    setTabValue(1) // Switch to generator tab
  }

  const handleFaviconsGenerated = (result: FaviconGenerationResult) => {
    onFaviconsGenerated?.(result)
    if (result.success) {
      // Optionally close the modal after successful generation
      // onClose()
    }
  }

  const handleClose = () => {
    setSelectedMedia(null)
    setTabValue(0)
    setSearchQuery('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Favicon Generator</Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
          <Tab label="Select Image" />
          <Tab label="Generate Favicons" disabled={!selectedMedia} />
        </Tabs>

        {tabValue === 0 && (
          <>
            <TextField
              fullWidth
              placeholder="Search images..."
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

            {foldersLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {folders && folders.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Button
                      variant={currentFolder === undefined ? 'contained' : 'outlined'}
                      startIcon={<FolderIcon />}
                      onClick={() => setCurrentFolder(undefined)}
                      size="small"
                    >
                      All Images
                    </Button>
                    {folders.map((folder) => (
                      <Button
                        key={folder.id}
                        variant={currentFolder === folder.id ? 'contained' : 'outlined'}
                        startIcon={<FolderIcon />}
                        onClick={() => setCurrentFolder(folder.id)}
                        size="small"
                      >
                        {folder.name}
                      </Button>
                    ))}
                  </Box>
                )}

                {mediaLoading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {filteredMedia && filteredMedia.length > 0 ? (
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
                              border: selectedMedia?.id === item.id ? 2 : 0,
                              borderColor: 'primary.main',
                            }}
                            onClick={() => handleSelect(item)}
                          >
                            {selectedMedia?.id === item.id && (
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
                            <CardMedia
                              component="img"
                              height="120"
                              image={item.thumbnail_url || item.file_url}
                              alt={item.alt_text || item.original_name}
                              sx={{ objectFit: 'cover' }}
                            />
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
                    ) : (
                      <Box textAlign="center" py={4}>
                        <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography color="text.secondary">
                          No images found
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}

        {tabValue === 1 && selectedMedia && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Generating favicons from: <strong>{selectedMedia.original_name}</strong>
              </Typography>
            </Alert>
            <FaviconGenerator
              media={selectedMedia}
              siteDomain={siteDomain}
              onGenerated={handleFaviconsGenerated}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          {tabValue === 0 ? 'Cancel' : 'Close'}
        </Button>
        {tabValue === 0 && (
          <Button
            onClick={() => selectedMedia && handleSelect(selectedMedia)}
            variant="contained"
            disabled={!selectedMedia}
          >
            Continue
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default FaviconGeneratorModal
