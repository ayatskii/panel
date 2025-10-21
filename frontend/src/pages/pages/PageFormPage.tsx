import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import {
  useGetPageQuery,
  useCreatePageMutation,
  useUpdatePageMutation,
} from '@/store/api/pagesApi'
import { useGetSitesQuery } from '@/store/api/sitesApi'
import toast from 'react-hot-toast'
import type { PageFormData } from '@/types'

const PageFormPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const { data: page, isLoading: pageLoading } = useGetPageQuery(Number(id), { skip: !id })
  const { data: sites, isLoading: sitesLoading } = useGetSitesQuery()
  const [createPage, { isLoading: isCreating }] = useCreatePageMutation()
  const [updatePage, { isLoading: isUpdating }] = useUpdatePageMutation()

  const [formData, setFormData] = useState<PageFormData>({
    site: 0,
    title: '',
    slug: '',
    page_type: 'custom',
    meta_title: '',
    meta_description: '',
    order: 0,
  })

  useEffect(() => {
    if (page && isEdit) {
      setFormData({
        site: page.site,
        title: page.title,
        slug: page.slug,
        page_type: page.page_type,
        meta_title: page.meta_title,
        meta_description: page.meta_description,
        order: page.order,
      })
    }
  }, [page, isEdit])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    // Auto-generate slug from title
    if (name === 'title' && !isEdit) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  const handleSelectChange = (name: string, value: string | number) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (isEdit && id) {
        await updatePage({ id: Number(id), data: formData }).unwrap()
        toast.success('Page updated successfully')
        navigate('/pages')
      } else {
        const newPage = await createPage(formData).unwrap()
        toast.success('Page created successfully')
        navigate(`/pages/${newPage.id}/build`)
      }
    } catch (error) {
      const apiError = error as { data?: { message?: string } };
      toast.error(apiError.data?.message || `Failed to ${isEdit ? 'update' : 'create'} page`);
    }
  }

  if (pageLoading || sitesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        {isEdit ? 'Edit Page' : 'Create New Page'}
      </Typography>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth required>
              <InputLabel>Site</InputLabel>
              <Select
                value={formData.site || ''}
                onChange={(e) => handleSelectChange('site', e.target.value)}
                label="Site"
                disabled={isEdit}
              >
                {sites?.map((site) => (
                  <MenuItem key={site.id} value={site.id}>
                    {site.brand_name} ({site.domain})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Page Title"
              name="title"
              fullWidth
              required
              value={formData.title}
              onChange={handleChange}
            />

            <TextField
              label="Slug"
              name="slug"
              fullWidth
              required
              value={formData.slug}
              onChange={handleChange}
              helperText="URL-friendly version (e.g., about-us)"
            />

            <FormControl fullWidth required>
              <InputLabel>Page Type</InputLabel>
              <Select
                value={formData.page_type}
                onChange={(e) => handleSelectChange('page_type', e.target.value)}
                label="Page Type"
              >
                <MenuItem value="home">Home</MenuItem>
                <MenuItem value="about">About</MenuItem>
                <MenuItem value="contact">Contact</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Meta Title"
              name="meta_title"
              fullWidth
              required
              value={formData.meta_title}
              onChange={handleChange}
              helperText="SEO title"
            />

            <TextField
              label="Meta Description"
              name="meta_description"
              fullWidth
              required
              multiline
              rows={3}
              value={formData.meta_description}
              onChange={handleChange}
              helperText="SEO description"
            />

            <TextField
              label="Order"
              name="order"
              type="number"
              fullWidth
              value={formData.order}
              onChange={handleChange}
              helperText="Display order in navigation"
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={isCreating || isUpdating}
              >
                {isCreating || isUpdating ? (
                  <CircularProgress size={24} />
                ) : isEdit ? (
                  'Update Page'
                ) : (
                  'Create Page'
                )}
              </Button>

              <Button variant="outlined" onClick={() => navigate('/pages')}>
                Cancel
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  )
}

export default PageFormPage
