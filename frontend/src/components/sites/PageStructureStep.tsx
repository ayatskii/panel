import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Home as HomeIcon,
} from '@mui/icons-material'
import type { SiteFormData } from '@/types'

interface PageStructureStepProps {
  data: Partial<SiteFormData>
  onChange: (data: Partial<SiteFormData>) => void
  errors: Record<string, string>
}

interface PageStructure {
  id: string
  url: string
  name: string
  isHome: boolean
  showInHeader: boolean
  showInFooter: boolean
  showInSidebar: boolean
}

const PageStructureStep: React.FC<PageStructureStepProps> = ({
  onChange,
}) => {
  const [pages, setPages] = useState<PageStructure[]>([
    {
      id: 'home',
      url: '',
      name: 'Home',
      isHome: true,
      showInHeader: true,
      showInFooter: false,
      showInSidebar: false,
    }
  ])
  const [editingPage, setEditingPage] = useState<PageStructure | null>(null)

  const handleAddPage = () => {
    const newPage: PageStructure = {
      id: `page_${Date.now()}`,
      url: '',
      name: '',
      isHome: false,
      showInHeader: true,
      showInFooter: false,
      showInSidebar: false,
    }
    setPages([...pages, newPage])
    setEditingPage(newPage)
  }

  const handleEditPage = (page: PageStructure) => {
    setEditingPage(page)
  }

  const handleSavePage = (updatedPage: PageStructure) => {
    setPages(pages.map(p => p.id === updatedPage.id ? updatedPage : p))
    setEditingPage(null)
    onChange({ pages: pages })
  }

  const handleDeletePage = (pageId: string) => {
    if (pages.find(p => p.id === pageId)?.isHome) {
      return // Don't delete home page
    }
    const updatedPages = pages.filter(p => p.id !== pageId)
    setPages(updatedPages)
    onChange({ pages: updatedPages })
  }

  const handlePageChange = (pageId: string, field: keyof PageStructure, value: string | boolean) => {
    const updatedPages = pages.map(p => 
      p.id === pageId ? { ...p, [field]: value } : p
    )
    setPages(updatedPages)
    onChange({ pages: updatedPages })
  }

  const handleCancelEdit = () => {
    setEditingPage(null)
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Page Structure
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Define the pages for your site and configure their menu placement. The home page is required and cannot be deleted.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Pages</Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddPage}
            >
              Add Page
            </Button>
          </Box>

          {pages.length === 0 ? (
            <Alert severity="info">
              No pages defined. Add at least one page to continue.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Page</TableCell>
                    <TableCell>URL</TableCell>
                    <TableCell>Menu Placement</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {page.isHome && <HomeIcon color="primary" fontSize="small" />}
                          <Typography variant="body2" fontWeight={page.isHome ? 'bold' : 'normal'}>
                            {page.name || 'Untitled Page'}
                          </Typography>
                          {page.isHome && (
                            <Chip label="Home" size="small" color="primary" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {page.isHome ? '/' : `/${page.url}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          {page.showInHeader && (
                            <Chip label="Header" size="small" color="primary" />
                          )}
                          {page.showInFooter && (
                            <Chip label="Footer" size="small" color="secondary" />
                          )}
                          {page.showInSidebar && (
                            <Chip label="Sidebar" size="small" color="default" />
                          )}
                          {!page.showInHeader && !page.showInFooter && !page.showInSidebar && (
                            <Typography variant="caption" color="text.secondary">
                              No menu
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleEditPage(page)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        {!page.isHome && (
                          <IconButton
                            size="small"
                            onClick={() => handleDeletePage(page.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Page Edit Dialog */}
      {editingPage && (
        <Card sx={{ bgcolor: 'grey.50' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {editingPage.isHome ? 'Edit Home Page' : 'Edit Page'}
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Page Name"
                value={editingPage.name}
                onChange={(e) => handlePageChange(editingPage.id, 'name', e.target.value)}
                placeholder="Enter page name"
                disabled={editingPage.isHome}
              />
              
              {!editingPage.isHome && (
                <TextField
                  fullWidth
                  label="URL Slug"
                  value={editingPage.url}
                  onChange={(e) => handlePageChange(editingPage.id, 'url', e.target.value)}
                  placeholder="page-url"
                  helperText="URL path for this page (e.g., 'about', 'contact')"
                />
              )}
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Menu Placement
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editingPage.showInHeader}
                        onChange={(e) => handlePageChange(editingPage.id, 'showInHeader', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Show in header navigation"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editingPage.showInFooter}
                        onChange={(e) => handlePageChange(editingPage.id, 'showInFooter', e.target.checked)}
                        color="secondary"
                      />
                    }
                    label="Show in footer navigation"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editingPage.showInSidebar}
                        onChange={(e) => handlePageChange(editingPage.id, 'showInSidebar', e.target.checked)}
                      />
                    }
                    label="Show in sidebar (if available)"
                  />
                </Box>
              </Box>
              
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  onClick={() => handleSavePage(editingPage)}
                  disabled={!editingPage.name}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Note:</strong> The home page is automatically created and cannot be deleted. 
          You can add additional pages and configure where they appear in the site navigation.
        </Typography>
      </Alert>
    </Box>
  )
}

export default PageStructureStep
