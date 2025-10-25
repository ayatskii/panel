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
  Divider,
} from '@mui/material'
import {
  useGetPageQuery,
  useCreatePageMutation,
  useUpdatePageMutation,
} from '@/store/api/pagesApi'
import { useGetSitesQuery } from '@/store/api/sitesApi'
import MetaFieldWithCounter from '@/components/common/MetaFieldWithCounter'
import GoogleSearchPreview from '@/components/common/GoogleSearchPreview'
import SEOScoreCard from '@/components/common/SEOScoreCard'
import DuplicateMetaWarning from '@/components/common/DuplicateMetaWarning'
import AIMetaGenerator from '@/components/common/AIMetaGenerator'
import LSIKeywordResearch from '@/components/common/LSIKeywordResearch'
import CompetitorAnalysis from '@/components/common/CompetitorAnalysis'
import SitemapManager from '@/components/common/SitemapManager'
import SchemaManager from '@/components/common/SchemaManager'
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
    meta_description: '',
    h1_tag: '',
    keywords: '',
    order: 0,
  })

  useEffect(() => {
    if (page && isEdit) {
      setFormData({
        site: page.site,
        title: page.title,
        slug: page.slug,
        meta_description: page.meta_description,
        h1_tag: page.h1_tag,
        keywords: page.keywords,
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

  const handleApplyGeneratedMeta = (meta: {
    title: string
    meta_description: string
    h1_tag: string
    keywords: string
  }) => {
    setFormData({
      ...formData,
      title: meta.title,
      meta_description: meta.meta_description,
      h1_tag: meta.h1_tag,
      keywords: meta.keywords,
    })
  }

  const handleAddKeywords = (newKeywords: string[]) => {
    const existingKeywords = formData.keywords ? formData.keywords.split('\n').filter(k => k.trim()) : []
    const combinedKeywords = [...existingKeywords, ...newKeywords]
    const uniqueKeywords = [...new Set(combinedKeywords)]
    
    setFormData({
      ...formData,
      keywords: uniqueKeywords.join('\n'),
    })
  }

  const handleCompetitorInsights = (insights: string[]) => {
    // Log insights for now - could be used to update form data or show notifications
    console.log('Competitor insights:', insights)
    toast.success(`Received ${insights.length} competitor insights!`)
  }

  const getTargetKeywords = (): string[] => {
    if (!formData.keywords) return []
    return formData.keywords.split('\n').filter(k => k.trim()).map(k => k.trim())
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

            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>
              SEO Settings
            </Typography>

            {/* SEO Score Card */}
            <SEOScoreCard
              title={formData.title}
              metaDescription={formData.meta_description}
              h1Tag={formData.h1_tag || ''}
              slug={formData.slug}
              keywords={formData.keywords || ''}
            />

            {/* AI Meta Generator */}
            <AIMetaGenerator
              pageTitle={formData.title}
              pageContent=""
              currentMeta={{
                title: formData.title,
                meta_description: formData.meta_description,
                h1_tag: formData.h1_tag || '',
                keywords: formData.keywords || '',
              }}
              siteDomain={sites?.find(s => s.id === formData.site)?.domain}
              onApplyMeta={handleApplyGeneratedMeta}
            />

            {/* LSI Keyword Research */}
            <LSIKeywordResearch
              pageContent=""
              onAddKeywords={handleAddKeywords}
            />

            {/* Competitor Analysis */}
            <CompetitorAnalysis
              targetKeywords={getTargetKeywords()}
              onInsightsGenerated={handleCompetitorInsights}
            />

            {/* Sitemap Manager */}
            {formData.site && (
              <SitemapManager
                siteId={formData.site}
                siteDomain={sites?.find(s => s.id === formData.site)?.domain}
              />
            )}

            {/* Schema Manager */}
            {isEdit && id && (
              <SchemaManager
                pageId={parseInt(id)}
                siteId={formData.site}
                siteDomain={sites?.find(s => s.id === formData.site)?.domain}
              />
            )}

            {/* Google Search Preview */}
            <GoogleSearchPreview
              title={formData.title}
              description={formData.meta_description}
              url={`${sites?.find(s => s.id === formData.site)?.domain || 'example.com'}/${formData.slug}`}
              siteName={sites?.find(s => s.id === formData.site)?.brand_name}
            />

            {/* Duplicate Meta Warning */}
            {formData.site > 0 && (
              <DuplicateMetaWarning
                siteId={formData.site}
                title={formData.title}
                metaDescription={formData.meta_description}
                excludeId={isEdit ? Number(id) : undefined}
              />
            )}

            {/* Meta Title with Counter */}
            <MetaFieldWithCounter
              label="Meta Title"
              value={formData.title}
              onChange={(value) => setFormData({ ...formData, title: value })}
              minLength={30}
              maxLength={60}
              helperText="The title that appears in search results and browser tabs"
              placeholder="Enter your SEO-optimized title here..."
              required
            />

            {/* Meta Description with Counter */}
            <MetaFieldWithCounter
              label="Meta Description"
              value={formData.meta_description}
              onChange={(value) => setFormData({ ...formData, meta_description: value })}
              minLength={50}
              maxLength={160}
              helperText="A brief description that appears under your title in search results"
              multiline
              rows={3}
              placeholder="Write a compelling description that encourages clicks..."
              required
            />

            {/* H1 Tag with Counter */}
            <MetaFieldWithCounter
              label="H1 Tag"
              value={formData.h1_tag || ''}
              onChange={(value) => setFormData({ ...formData, h1_tag: value })}
              minLength={1}
              maxLength={70}
              helperText="The main heading that appears on your page"
              placeholder="Enter your main page heading..."
            />

            {/* Keywords */}
            <TextField
              label="Keywords"
              name="keywords"
              fullWidth
              multiline
              rows={3}
              value={formData.keywords}
              onChange={handleChange}
              helperText="Enter keywords one per line (e.g., casino games, online slots, gambling)"
              placeholder="casino games&#10;online slots&#10;gambling&#10;best casino"
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
