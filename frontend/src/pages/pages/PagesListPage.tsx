import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
    if (window.confirm(t('pages.deleteConfirm'))) {
      try {
        await deletePage(pageId).unwrap()
        toast.success(t('pages.pageDeleted'))
        handleMenuClose()
      } catch {
        toast.error(t('pages.pageDeleteFailed'));
      }
    }
  }

  const handleDuplicate = async (pageId: number) => {
    try {
      await duplicatePage(pageId).unwrap()
      toast.success(t('pages.pageDuplicated'))
      handleMenuClose()
    } catch {
      toast.error(t('pages.pageDuplicateFailed'));
    }
  }

  const handlePublish = async (pageId: number) => {
    try {
      await publishPage(pageId).unwrap()
      toast.success(t('pages.pagePublished'))
      handleMenuClose()
    } catch {
      toast.error(t('pages.pagePublishFailed'));
    }
  }

  const handleUnpublish = async (pageId: number) => {
    try {
      await unpublishPage(pageId).unwrap()
      toast.success(t('pages.pageUnpublished'))
      handleMenuClose()
    } catch {
      toast.error(t('pages.pageUnpublishFailed'));
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
          {t('pages.title')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/pages/create')}
        >
          {t('pages.createPage')}
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>{t('pages.site')}</InputLabel>
            <Select
              value={selectedSite || ''}
              onChange={(e) => {
                if (e.target.value) {
                  setSearchParams({ site: e.target.value as string })
                } else {
                  setSearchParams({})
                }
              }}
              label={t('pages.site')}
            >
              <MenuItem value="">{t('pages.allSites')}</MenuItem>
              {sites?.map((site) => (
                <MenuItem key={site.id} value={site.id}>
                  {site.brand_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            placeholder={t('pages.searchPages')}
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
            {t('pages.noPagesFound')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/pages/create')}
          >
            {t('pages.createFirstPage')}
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>{t('pages.id')}</strong></TableCell>
                <TableCell><strong>{t('pages.pageTitle')}</strong></TableCell>
                <TableCell><strong>{t('pages.slug')}</strong></TableCell>
                <TableCell><strong>{t('pages.site')}</strong></TableCell>
                <TableCell><strong>{t('pages.blocks')}</strong></TableCell>
                <TableCell><strong>{t('pages.status')}</strong></TableCell>
                <TableCell><strong>{t('pages.created')}</strong></TableCell>
                <TableCell><strong>{t('pages.updated')}</strong></TableCell>
                <TableCell align="right"><strong>{t('settings.actions')}</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPages.map((page) => (
                <TableRow key={page.id} hover>
                  <TableCell>{page.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {page.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                      /{page.slug}
                    </Typography>
                  </TableCell>
                  <TableCell>{page.site_domain || '-'}</TableCell>
                  <TableCell>{page.blocks_count || 0}</TableCell>
                  <TableCell>
                    <Chip
                      label={page.is_published ? t('pages.published') : t('pages.draft')}
                      color={page.is_published ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {formatDate(page.created_at, 'PP')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {page.updated_at ? formatDate(page.updated_at, 'PP') : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/pages/${page.id}/edit`)}
                        title={t('common.edit')}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDuplicate(page.id)}
                        title={t('pages.duplicate')}
                      >
                        <DuplicateIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(page.id)}
                        color="error"
                        title={t('common.delete')}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, page.id)}
                        title={t('pages.moreOptions')}
                      >
                        <MoreIcon fontSize="small" />
                      </IconButton>
                    </Box>
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
          {t('common.edit')}
        </MenuItem>
        <MenuItem onClick={() => selectedPageId && handleDuplicate(selectedPageId)}>
          <DuplicateIcon fontSize="small" sx={{ mr: 1 }} />
          {t('pages.duplicate')}
        </MenuItem>
        {pages?.find(p => p.id === selectedPageId)?.is_published ? (
          <MenuItem onClick={() => selectedPageId && handleUnpublish(selectedPageId)}>
            <UnpublishIcon fontSize="small" sx={{ mr: 1 }} />
            {t('pages.unpublish')}
          </MenuItem>
        ) : (
          <MenuItem onClick={() => selectedPageId && handlePublish(selectedPageId)}>
            <PublishIcon fontSize="small" sx={{ mr: 1 }} />
            {t('pages.publish')}
          </MenuItem>
        )}
        <MenuItem
          onClick={() => selectedPageId && handleDelete(selectedPageId)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          {t('common.delete')}
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default PagesListPage
