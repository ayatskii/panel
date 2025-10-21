import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  CircularProgress,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Checkbox,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Breadcrumbs,
  Link,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Search as SearchIcon,
  Folder as FolderIcon,
  Image as ImageIcon,
  Description as DocumentIcon,
  VideoLibrary as VideoIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  CreateNewFolder as NewFolderIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import {
  useGetMediaQuery,
  useGetFoldersQuery,
  useUploadMediaMutation,
  useBulkUploadMediaMutation,
  useDeleteMediaMutation,
  useBulkDeleteMediaMutation,
  useCreateFolderMutation,
  useDeleteFolderMutation,
} from '@/store/api/mediaApi';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';

const MediaLibraryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentFolder = searchParams.get('folder');
  const currentType = searchParams.get('type');

  const { data: media, isLoading: mediaLoading } = useGetMediaQuery({
    folder: currentFolder || undefined,
    type: currentType || undefined,
  });
  const { data: folders, isLoading: foldersLoading } = useGetFoldersQuery({
    parent: currentFolder || 'null',
  });
  const [uploadMedia] = useUploadMediaMutation();
  const [bulkUpload] = useBulkUploadMediaMutation();
  const [deleteMedia] = useDeleteMediaMutation();
  const [bulkDelete] = useBulkDeleteMediaMutation();
  const [createFolder] = useCreateFolderMutation();
  const [deleteFolder] = useDeleteFolderMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<number[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<{ id: number; type: 'media' | 'folder' } | null>(null);

  // File upload with dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      return;
    }

    if (acceptedFiles.length === 1) {
      // Single file upload
      const file = acceptedFiles[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      if (currentFolder) {
        formData.append('folder', currentFolder);
      }

      try {
        await uploadMedia(formData).unwrap();
        toast.success(`${file.name} uploaded successfully`);
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    } else if (acceptedFiles.length > 1) {
      // Bulk upload
      const formData = new FormData();
      acceptedFiles.forEach(file => {
        formData.append('files', file);
      });
      if (currentFolder) {
        formData.append('folder', currentFolder);
      }

      try {
        await bulkUpload(formData).unwrap();
        toast.success(`${acceptedFiles.length} files uploaded successfully`);
      } catch {
        toast.error('Failed to upload files');
      }
    }
    setUploadDialogOpen(false);
  }, [uploadMedia, bulkUpload, currentFolder]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg'],
      'application/pdf': ['.pdf'],
      'video/*': ['.mp4', '.webm', '.ogg'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await createFolder({
        name: newFolderName,
        parent_folder: currentFolder ? Number(currentFolder) : undefined,
      }).unwrap();
      toast.success('Folder created successfully');
      setFolderDialogOpen(false);
      setNewFolderName('');
    } catch (error) {
      const apiError = error as { data?: { name?: string[] } };
      toast.error(apiError.data?.name?.[0] || 'Failed to create folder');
    }
  };

  const handleDeleteMedia = async (mediaId: number) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await deleteMedia(mediaId).unwrap();
        toast.success('File deleted successfully');
      } catch {
        toast.error('Failed to delete file');
      }
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    if (window.confirm('Delete this folder and all its contents?')) {
      try {
        await deleteFolder(folderId).unwrap();
        toast.success('Folder deleted successfully');
      } catch {
        toast.error('Failed to delete folder');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Delete ${selectedMedia.length} selected files?`)) {
      try {
        await bulkDelete(selectedMedia).unwrap();
        toast.success('Files deleted successfully');
        setSelectedMedia([]);
      } catch {
        toast.error('Failed to delete files');
      }
    }
  };

  const toggleSelection = (mediaId: number) => {
    setSelectedMedia(prev =>
      prev.includes(mediaId)
        ? prev.filter(id => id !== mediaId)
        : [...prev, mediaId]
    );
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, id: number, type: 'media' | 'folder') => {
    setAnchorEl(event.currentTarget);
    setSelectedItem({ id, type });
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const filteredMedia = media?.filter(item =>
    item.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.filename.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon sx={{ fontSize: 60, color: 'primary.main' }} />;
      case 'document': return <DocumentIcon sx={{ fontSize: 60, color: 'error.main' }} />;
      case 'video': return <VideoIcon sx={{ fontSize: 60, color: 'success.main' }} />;
      default: return <FileIcon sx={{ fontSize: 60, color: 'text.secondary' }} />;
    }
  };

  if (mediaLoading || foldersLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Media Library
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<NewFolderIcon />}
            onClick={() => setFolderDialogOpen(true)}
          >
            New Folder
          </Button>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload
          </Button>
        </Box>
      </Box>

      {/* Breadcrumbs */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          <Link
            component="button"
            variant="body1"
            onClick={() => setSearchParams({})}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <HomeIcon fontSize="small" />
            Home
          </Link>
          {currentFolder && (
            <Typography color="text.primary">Current Folder</Typography>
          )}
        </Breadcrumbs>
      </Paper>

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* File type filter */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label="All"
              onClick={() => setSearchParams(currentFolder ? { folder: currentFolder } : {})}
              color={!currentType ? 'primary' : 'default'}
              clickable
            />
            <Chip
              label="Images"
              icon={<ImageIcon />}
              onClick={() => {
                const params: Record<string, string> = { type: 'image' };
                if (currentFolder) params.folder = currentFolder;
                setSearchParams(params);
              }}
              color={currentType === 'image' ? 'primary' : 'default'}
              clickable
            />
            <Chip
              label="Documents"
              icon={<DocumentIcon />}
              onClick={() => {
                const params: Record<string, string> = { type: 'document' };
                if (currentFolder) params.folder = currentFolder;
                setSearchParams(params);
              }}
              color={currentType === 'document' ? 'primary' : 'default'}
              clickable
            />
            <Chip
              label="Videos"
              icon={<VideoIcon />}
              onClick={() => {
                const params: Record<string, string> = { type: 'video' };
                if (currentFolder) params.folder = currentFolder;
                setSearchParams(params);
              }}
              color={currentType === 'video' ? 'primary' : 'default'}
              clickable
            />
          </Box>

          <TextField
            placeholder="Search files..."
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
            sx={{ flexGrow: 1 }}
          />

          {selectedMedia.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleBulkDelete}
            >
              Delete ({selectedMedia.length})
            </Button>
          )}
        </Box>
      </Paper>

      {/* Folders */}
      {folders && folders.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Folders</Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
                lg: 'repeat(6, 1fr)',
              },
              gap: 2,
            }}
          >
            {folders.map((folder) => (
              <Card
                key={folder.id}
                sx={{ cursor: 'pointer', position: 'relative' }}
              >
                <IconButton
                  size="small"
                  sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'background.paper' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuOpen(e, folder.id, 'folder');
                  }}
                >
                  <MoreIcon />
                </IconButton>
                <CardContent
                  sx={{ textAlign: 'center' }}
                  onClick={() => setSearchParams({ folder: folder.id.toString() })}
                >
                  <FolderIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                  <Typography variant="body2" sx={{ mt: 1 }} noWrap>
                    {folder.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {folder.media_count || folder.file_count || 0} files
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* Media Grid */}
      {filteredMedia.length === 0 && (!folders || folders.length === 0) ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <Typography color="textSecondary" sx={{ mb: 2 }}>
            No media files found
          </Typography>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload Your First File
          </Button>
        </Paper>
      ) : (
        <>
          {filteredMedia.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>Files</Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(4, 1fr)',
                  },
                  gap: 2,
                }}
              >
                {filteredMedia.map((item) => (
                  <Card key={item.id} sx={{ position: 'relative' }}>
                    <Box sx={{ position: 'relative' }}>
                      <Checkbox
                        checked={selectedMedia.includes(item.id)}
                        onChange={() => toggleSelection(item.id)}
                        sx={{ position: 'absolute', top: 8, left: 8, bgcolor: 'background.paper', borderRadius: 1 }}
                      />
                      <IconButton
                        size="small"
                        sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'background.paper' }}
                        onClick={(e) => handleMenuOpen(e, item.id, 'media')}
                      >
                        <MoreIcon />
                      </IconButton>
                      {item.file_type === 'image' ? (
                        <CardMedia
                          component="img"
                          height="200"
                          image={item.thumbnail_url || item.file_url}
                          alt={item.alt_text || item.original_name}
                          sx={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <Box
                          sx={{
                            height: 200,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'grey.100',
                          }}
                        >
                          {getFileIcon(item.file_type)}
                        </Box>
                      )}
                    </Box>
                    <CardContent>
                      <Tooltip title={item.original_name}>
                        <Typography variant="body2" noWrap>
                          {item.original_name}
                        </Typography>
                      </Tooltip>
                      <Typography variant="caption" color="text.secondary">
                        {item.size_mb.toFixed(2)} MB • {format(new Date(item.created_at), 'MMM dd, yyyy')}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Chip label={item.file_type} size="small" />
                      {item.width && item.height && (
                        <Typography variant="caption" color="text.secondary">
                          {item.width} × {item.height}
                        </Typography>
                      )}
                    </CardActions>
                  </Card>
                ))}
              </Box>
            </>
          )}
        </>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedItem?.type === 'media' ? (
          <>
            <MenuItem onClick={() => {
              // Open edit dialog
              handleMenuClose();
            }}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Edit Details
            </MenuItem>
            <MenuItem
              onClick={() => {
                if (selectedItem) handleDeleteMedia(selectedItem.id);
                handleMenuClose();
              }}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          </>
        ) : (
          <MenuItem
            onClick={() => {
              if (selectedItem) handleDeleteFolder(selectedItem.id);
              handleMenuClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete Folder
          </MenuItem>
        )}
      </Menu>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Files</DialogTitle>
        <DialogContent>
          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.400',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: isDragActive ? 'action.hover' : 'background.paper',
              transition: 'all 0.2s',
            }}
          >
            <input {...getInputProps()} />
            <UploadIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              or click to browse
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Supported: Images (JPG, PNG, GIF, WebP, SVG), PDFs, Videos (MP4, WebM, OGG)
            </Typography>
            <Typography variant="caption" color="error" sx={{ display: 'block' }}>
              Maximum file size: 50MB
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={folderDialogOpen} onClose={() => setFolderDialogOpen(false)}>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            label="Folder Name"
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            autoFocus
            sx={{ mt: 2 }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateFolder();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFolderDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateFolder} variant="contained" disabled={!newFolderName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MediaLibraryPage;