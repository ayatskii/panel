import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Breadcrumbs,
  Link,
  CircularProgress,
} from '@mui/material'
import {
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material'
import { useGetFoldersQuery } from '@/store/api/mediaApi'
import type { MediaFolder } from '@/types'

interface FolderMoveDialogProps {
  open: boolean
  onClose: () => void
  onMove: (folderId: number | null) => void
  selectedCount: number
}

const FolderMoveDialog = ({ open, onClose, onMove, selectedCount }: FolderMoveDialogProps) => {
  const [currentFolder, setCurrentFolder] = useState<number | null>(null)
  const [folderPath, setFolderPath] = useState<MediaFolder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null)
  
  const { data: folders, isLoading } = useGetFoldersQuery({
    parent: currentFolder === null ? 'null' : currentFolder.toString(),
  })

  const handleFolderClick = (folder: MediaFolder) => {
    setCurrentFolder(folder.id)
    setFolderPath([...folderPath, folder])
  }

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      // Root
      setCurrentFolder(null)
      setFolderPath([])
    } else {
      const newPath = folderPath.slice(0, index + 1)
      setCurrentFolder(newPath[newPath.length - 1].id)
      setFolderPath(newPath)
    }
  }

  const handleSelectFolder = (folderId: number | null) => {
    setSelectedFolder(folderId)
  }

  const handleMove = () => {
    onMove(selectedFolder)
    onClose()
    // Reset state
    setCurrentFolder(null)
    setFolderPath([])
    setSelectedFolder(null)
  }

  const handleCancel = () => {
    onClose()
    // Reset state
    setCurrentFolder(null)
    setFolderPath([])
    setSelectedFolder(null)
  }

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        Move {selectedCount} {selectedCount === 1 ? 'file' : 'files'} to folder
      </DialogTitle>
      
      <DialogContent>
        {/* Breadcrumbs */}
        <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
            <Link
              component="button"
              variant="body2"
              onClick={() => handleBreadcrumbClick(-1)}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <HomeIcon fontSize="small" />
              Root
            </Link>
            {folderPath.map((folder, index) => (
              <Link
                key={folder.id}
                component="button"
                variant="body2"
                onClick={() => handleBreadcrumbClick(index)}
                color={index === folderPath.length - 1 ? 'text.primary' : 'primary'}
              >
                {folder.name}
              </Link>
            ))}
          </Breadcrumbs>
        </Box>

        {/* Current Location Option */}
        <Box sx={{ mb: 2 }}>
          <ListItemButton
            selected={selectedFolder === currentFolder}
            onClick={() => handleSelectFolder(currentFolder)}
            sx={{
              border: '2px solid',
              borderColor: selectedFolder === currentFolder ? 'primary.main' : 'divider',
              borderRadius: 1,
              mb: 1,
            }}
          >
            <ListItemIcon>
              <FolderOpenIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={folderPath.length === 0 ? 'Move to Root' : `Move to "${folderPath[folderPath.length - 1]?.name || 'Current Folder'}"`}
              secondary="Select this folder as destination"
            />
          </ListItemButton>
        </Box>

        {/* Folder List */}
        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
          Or navigate to a subfolder:
        </Typography>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : folders && folders.length > 0 ? (
          <List sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            {folders.map((folder) => (
              <ListItemButton
                key={folder.id}
                onClick={() => handleFolderClick(folder)}
              >
                <ListItemIcon>
                  <FolderIcon />
                </ListItemIcon>
                <ListItemText
                  primary={folder.name}
                  secondary={`${folder.file_count || 0} files, ${folder.subfolder_count || 0} subfolders`}
                />
              </ListItemButton>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
            <Typography color="text.secondary">
              No subfolders in this location
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleMove}
          disabled={selectedFolder === null}
        >
          Move Here
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default FolderMoveDialog

