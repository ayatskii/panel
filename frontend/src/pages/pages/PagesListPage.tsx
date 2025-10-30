import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material'
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as DuplicateIcon,
  Publish as PublishIcon,
  Unpublished as UnpublishIcon,
} from '@mui/icons-material'
import { useGetPagesQuery, useDeletePageMutation, useDuplicatePageMutation, usePublishPageMutation, useUnpublishPageMutation } from '@/store/api/pagesApi'
import { useGetSitesQuery } from '@/store/api/sitesApi'
import toast from 'react-hot-toast'
import { formatDate } from '@/utils/formatDate'

const PagesListPage = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedSite = searchParams.get('site')

  const { data: sites } = useGetSitesQuery()
  const { data: pages, isLoading } = useGetPagesQuery({ site: selectedSite ? Number(selectedSite) : undefined })
  const [deletePage] = useDeletePageMutation()
  const [duplicatePage] = useDuplicatePageMutation()
  const [publishPage] = usePublishPageMutation()
  const [unpublishPage] = useUnpublishPageMutation()

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, pageId: number) => {
    setAnchorEl(event.currentTarget)
    setSelectedPageId(pageId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedPageId(null)
  }

  const handleDelete = async (pageId: number) => {
    if (window.confirm('Are you sure you want to delete this page?')) {
      try {
        await deletePage(pageId).unwrap()
        toast.success('Page deleted successfully')
        handleMenuClose()
      } catch {
        toast.error('Failed to delete page');
      }
    }
  }

  const handleDuplicate = async (pageId: number) => {
    try {
      await duplicatePage(pageId).unwrap()
      toast.success('Page duplicated successfully')
      handleMenuClose()
    } catch {
      toast.error('Failed to duplicate page');
    }
  }

  const handlePublish = async (pageId: number) => {
    try {
      await publishPage(pageId).unwrap()
      toast.success('Page published successfully')
      handleMenuClose()
    } catch {
      toast.error('Failed to publish page');
    }
  }

  const handleUnpublish = async (pageId: number) => {
    try {
      await unpublishPage(pageId).unwrap()
      toast.success('Page unpublished successfully')
      handleMenuClose()
    } catch {
      toast.error('Failed to unpublish page');
    }
  }

  const filteredPages = pages?.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Pages
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/pages/create')}
        >
          Create Page
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Site</InputLabel>
            <Select
              value={selectedSite || ''}
              onChange={(e) => {
                if (e.target.value) {
                  setSearchParams({ site: e.target.value as string })
                } else {
                  setSearchParams({})
                }
              }}
              label="Site"
            >
              <MenuItem value="">All Sites</MenuItem>
              {sites?.map((site) => (
                <MenuItem key={site.id} value={site.id}>
                  {site.brand_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            placeholder="Search pages..."
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
        </Box>
      </Paper>

      {/* Pages Table */}
      {filteredPages.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="textSecondary" sx={{ mb: 2 }}>
            No pages found
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/pages/create')}
          >
            Create Your First Page
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Site</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Blocks</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPages.map((page) => (
                <TableRow key={page.id} hover>
                  <TableCell>{page.title}</TableCell>
                  <TableCell>{page.site_domain}</TableCell>
                  <TableCell>/{page.slug}</TableCell>
                  <TableCell>{page.blocks_count || 0}</TableCell>
                  <TableCell>
                    <Chip
                      label={page.is_published ? 'Published' : 'Draft'}
                      color={page.is_published ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {formatDate(page.created_at, 'PPP')}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, page.id)}
                    >
                      <MoreIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          navigate(`/pages/${selectedPageId}/edit`)
          handleMenuClose()
        }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => selectedPageId && handleDuplicate(selectedPageId)}>
          <DuplicateIcon fontSize="small" sx={{ mr: 1 }} />
          Duplicate
        </MenuItem>
        {pages?.find(p => p.id === selectedPageId)?.is_published ? (
          <MenuItem onClick={() => selectedPageId && handleUnpublish(selectedPageId)}>
            <UnpublishIcon fontSize="small" sx={{ mr: 1 }} />
            Unpublish
          </MenuItem>
        ) : (
          <MenuItem onClick={() => selectedPageId && handlePublish(selectedPageId)}>
            <PublishIcon fontSize="small" sx={{ mr: 1 }} />
            Publish
          </MenuItem>
        )}
        <MenuItem
          onClick={() => selectedPageId && handleDelete(selectedPageId)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default PagesListPage
