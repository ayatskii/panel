import { useState, useCallback, useEffect } from 'react';
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
  Label as LabelIcon,
  FilterList as FilterIcon,
  DriveFileMove as MoveIcon,
  Visibility as ViewUsageIcon,
  Assessment as AnalyticsIcon,
} from '@mui/icons-material';
import {
  useGetMediaQuery,
  useGetFoldersQuery,
  useUploadMediaMutation,
  useBulkUploadMediaMutation,
  useUpdateMediaMutation,
  useDeleteMediaMutation,
  useBulkDeleteMediaMutation,
  useBulkMoveMediaMutation,
  useCreateFolderMutation,
  useDeleteFolderMutation,
} from '@/store/api/mediaApi';
import TagManager from '@/components/media/TagManager';
import MediaTagSelector from '@/components/media/MediaTagSelector';
import AdvancedFilters, { type MediaFilters } from '@/components/media/AdvancedFilters';
import FolderMoveDialog from '@/components/media/FolderMoveDialog';
import MediaUsageDialog from '@/components/media/MediaUsageDialog';
import MediaAnalyticsDashboard from '@/components/media/MediaAnalyticsDashboard';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/utils/formatDate';
import type { Media, MediaTag } from '@/types';

const MediaLibraryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
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
  const [updateMedia] = useUpdateMediaMutation();
  const [deleteMedia] = useDeleteMediaMutation();
  const [bulkDelete] = useBulkDeleteMediaMutation();
  const [bulkMove] = useBulkMoveMediaMutation();
  const [createFolder] = useCreateFolderMutation();
  const [deleteFolder] = useDeleteFolderMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<number[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [usageDialogOpen, setUsageDialogOpen] = useState(false);
  const [usageMediaId, setUsageMediaId] = useState<number | null>(null);
  const [usageMediaName, setUsageMediaName] = useState<string>('');
  const [editingMediaTags, setEditingMediaTags] = useState<Media | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<{ id: number; type: 'media' | 'folder' } | null>(null);
  const [filters, setFilters] = useState<MediaFilters>({
    search: '',
    type: (currentType as 'image' | 'video' | 'document' | '') || '',
    tags: [],
  });

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
        toast.success(t('media.uploadedSuccessfully', { name: file.name }));
      } catch {
        toast.error(t('media.failedToUploadNamed', { name: file.name }));
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
        toast.success(t('media.filesUploadedSuccessfully', { count: acceptedFiles.length }));
      } catch {
        toast.error(t('media.failedToUploadFiles'));
      }
    }
    setUploadDialogOpen(false);
  }, [uploadMedia, bulkUpload, currentFolder, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg'],
      'application/pdf': ['.pdf'],
      'video/*': ['.mp4', '.webm', '.ogg'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  // Clipboard paste handler
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      // Check if clipboard contains image data
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Handle image paste
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          
          const blob = item.getAsFile();
          if (!blob) continue;

          // Create a File object from the blob
          const file = new File([blob], `pasted-image-${Date.now()}.png`, {
            type: blob.type || 'image/png',
          });

          // Upload the file
          const formData = new FormData();
          formData.append('file', file);
          formData.append('name', file.name);
          if (currentFolder) {
            formData.append('folder', currentFolder);
          }

          try {
            await uploadMedia(formData).unwrap();
            toast.success(t('media.uploadedSuccessfully', { name: file.name }));
          } catch {
            toast.error(t('media.failedToUploadNamed', { name: file.name }));
          }
        }
      }
    };

    // Add paste event listener to document
    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [uploadMedia, currentFolder, t]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await createFolder({
        name: newFolderName,
        parent_folder: currentFolder ? Number(currentFolder) : undefined,
      }).unwrap();
      toast.success(t('media.folderCreated'));
      setFolderDialogOpen(false);
      setNewFolderName('');
    } catch (error) {
      const apiError = error as { data?: { name?: string[] } };
      toast.error(apiError.data?.name?.[0] || t('media.failedToCreateFolder'));
    }
  };

  const handleDeleteMedia = async (mediaId: number) => {
    if (window.confirm(t('media.confirmDeleteFile'))) {
      try {
        await deleteMedia(mediaId).unwrap();
        toast.success(t('media.fileDeleted'));
      } catch {
        toast.error(t('media.failedToDeleteFile'));
      }
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    if (window.confirm(t('media.confirmDeleteFolder'))) {
      try {
        await deleteFolder(folderId).unwrap();
        toast.success(t('media.folderDeleted'));
      } catch {
        toast.error(t('media.failedToDeleteFolder'));
      }
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(t('media.confirmDeleteFilesCount', { count: selectedMedia.length }))) {
      try {
        await bulkDelete(selectedMedia).unwrap();
        toast.success(t('media.filesDeleted'));
        setSelectedMedia([]);
      } catch {
        toast.error(t('media.failedToDeleteFiles'));
      }
    }
  };

  const handleBulkMove = async (folderId: number | null) => {
    try {
      const result = await bulkMove({ ids: selectedMedia, folderId }).unwrap();
      toast.success(result.message);
      setSelectedMedia([]);
      setMoveDialogOpen(false);
    } catch (error) {
      toast.error(t('media.failedToMoveFiles'));
      console.error(error);
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
          {t('media.title')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<AnalyticsIcon />}
            onClick={() => setAnalyticsOpen(!analyticsOpen)}
            color={analyticsOpen ? 'primary' : 'inherit'}
          >
            {analyticsOpen ? t('media.hideAnalytics') : t('media.showAnalytics')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<NewFolderIcon />}
            onClick={() => setFolderDialogOpen(true)}
          >
            {t('media.newFolder')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<LabelIcon />}
            onClick={() => setTagManagerOpen(true)}
          >
            {t('media.manageTags')}
          </Button>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            {t('media.upload')}
          </Button>
        </Box>
      </Box>

      {/* Analytics Dashboard */}
      {analyticsOpen && (
        <Box sx={{ mb: 3 }}>
          <MediaAnalyticsDashboard />
        </Box>
      )}

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
            {t('media.home')}
          </Link>
          {currentFolder && (
            <Typography color="text.primary">{t('media.currentFolder')}</Typography>
          )}
        </Breadcrumbs>
      </Paper>

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* File type filter */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={t('media.all')}
              onClick={() => setSearchParams(currentFolder ? { folder: currentFolder } : {})}
              color={!currentType ? 'primary' : 'default'}
              clickable
            />
            <Chip
              label={t('media.images')}
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
              label={t('media.documents')}
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
              label={t('media.videos')}
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
            placeholder={t('media.searchFiles') as string}
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

          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFiltersOpen(true)}
          >
            {t('media.filters')}
          </Button>

          {selectedMedia.length > 0 && (
            <>
              <Button
                variant="outlined"
                startIcon={<MoveIcon />}
                onClick={() => setMoveDialogOpen(true)}
              >
                {t('media.moveCount', { count: selectedMedia.length })}
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleBulkDelete}
              >
                {t('media.deleteCount', { count: selectedMedia.length })}
              </Button>
            </>
          )}
        </Box>
      </Paper>

      {/* Folders */}
      {folders && folders.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>{t('media.folders')}</Typography>
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
                    {folder.media_count || folder.file_count || 0} {t('media.files')}
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
            {t('media.noFiles')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            {t('media.uploadFirstFile')}
          </Button>
        </Paper>
      ) : (
        <>
          {filteredMedia.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>{t('media.filesTitle')}</Typography>
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
                        {item.size_mb.toFixed(2)} MB • {formatDate(item.created_at, 'PPP')}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Chip label={item.file_type} size="small" />
                        {item.width && item.height && (
                          <Typography variant="caption" color="text.secondary">
                            {item.width} × {item.height}
                          </Typography>
                        )}
                      </Box>
                      {item.tags && item.tags.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {item.tags.slice(0, 3).map((tag) => (
                            <Chip
                              key={tag.id}
                              label={tag.name}
                              size="small"
                              sx={{
                                bgcolor: tag.color,
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.65rem',
                                height: '18px',
                              }}
                            />
                          ))}
                          {item.tags.length > 3 && (
                            <Chip
                              label={`+${item.tags.length - 3}`}
                              size="small"
                              sx={{ fontSize: '0.65rem', height: '18px' }}
                            />
                          )}
                        </Box>
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
              {t('media.editDetails')}
            </MenuItem>
            <MenuItem onClick={() => {
              const mediaItem = media?.find(m => m.id === selectedItem.id);
              if (mediaItem) {
                setEditingMediaTags(mediaItem);
              }
              handleMenuClose();
            }}>
              <LabelIcon fontSize="small" sx={{ mr: 1 }} />
              {t('media.editTags')}
            </MenuItem>
            <MenuItem onClick={() => {
              const mediaItem = media?.find(m => m.id === selectedItem.id);
              if (mediaItem) {
                setUsageMediaId(mediaItem.id);
                setUsageMediaName(mediaItem.original_name);
                setUsageDialogOpen(true);
              }
              handleMenuClose();
            }}>
              <ViewUsageIcon fontSize="small" sx={{ mr: 1 }} />
              {t('media.showUsage')}
            </MenuItem>
            <MenuItem
              onClick={() => {
                if (selectedItem) handleDeleteMedia(selectedItem.id);
                handleMenuClose();
              }}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              {t('common.delete')}
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
            {t('media.deleteFolder')}
          </MenuItem>
        )}
      </Menu>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('media.uploadFiles')}</DialogTitle>
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
              {isDragActive ? t('media.dropFilesHere') : t('media.dragDropHere')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('media.orClickToBrowse')}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              {t('media.supportedFormatsDetailed')}
            </Typography>
            <Typography variant="caption" color="error" sx={{ display: 'block' }}>
              {t('media.maxFileSize')}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>{t('common.cancel')}</Button>
        </DialogActions>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={folderDialogOpen} onClose={() => setFolderDialogOpen(false)}>
        <DialogTitle>{t('media.createNewFolder')}</DialogTitle>
        <DialogContent>
          <TextField
            label={t('media.folderName')}
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
          <Button onClick={() => setFolderDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleCreateFolder} variant="contained" disabled={!newFolderName.trim()}>
            {t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tag Manager Dialog */}
      <TagManager
        open={tagManagerOpen}
        onClose={() => setTagManagerOpen(false)}
      />

      {/* Edit Media Tags Dialog */}
      <Dialog
        open={!!editingMediaTags}
        onClose={() => setEditingMediaTags(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('media.editTags')}</DialogTitle>
        <DialogContent>
          {editingMediaTags && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                {editingMediaTags.original_name}
              </Typography>
              <MediaTagSelector
                selectedTags={editingMediaTags.tags || []}
                onChange={async (tags: MediaTag[]) => {
                  try {
                    await updateMedia({
                      id: editingMediaTags.id,
                      data: {
                        tag_ids: tags.map(t => t.id),
                      },
                    }).unwrap();
                    toast.success(t('media.tagsUpdated'));
                    setEditingMediaTags(null);
                  } catch (error) {
                    toast.error(t('media.failedToUpdateTags'));
                    console.error(error);
                  }
                }}
                label={t('media.tags') as string}
                size="medium"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingMediaTags(null)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* Advanced Filters */}
      <AdvancedFilters
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        onApply={() => {
          // Filters are automatically applied via the filters state
          toast.success(t('media.filtersApplied'));
        }}
        onClear={() => {
          toast.info(t('media.filtersCleared'));
        }}
      />

      {/* Folder Move Dialog */}
      <FolderMoveDialog
        open={moveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        onMove={handleBulkMove}
        selectedCount={selectedMedia.length}
      />

      {/* Media Usage Dialog */}
      <MediaUsageDialog
        open={usageDialogOpen}
        onClose={() => {
          setUsageDialogOpen(false);
          setUsageMediaId(null);
          setUsageMediaName('');
        }}
        mediaId={usageMediaId}
        mediaName={usageMediaName}
      />
    </Box>
  );
};

export default MediaLibraryPage;