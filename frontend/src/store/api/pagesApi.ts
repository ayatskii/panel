import { apiSlice } from './apiSlice'
import type { Page, PageBlock, SwiperPreset, PageFormData } from '@/types'

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const pagesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Pages
    getPages: builder.query<Page[], { site?: number }>({
      query: (params) => ({
        url: '/pages/',
        params,
      }),
      transformResponse: (response: PaginatedResponse<Page> | Page[]): Page[] => {
        if (Array.isArray(response)) return response
        if (response && 'results' in response) return response.results
        return []
      },
      providesTags: ['Page'],
    }),
    getPage: builder.query<Page, number>({
      query: (id) => `/pages/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Page', id }],
    }),
    createPage: builder.mutation<Page, PageFormData>({
      query: (data) => ({
        url: '/pages/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Page'],
    }),
    updatePage: builder.mutation<Page, { id: number; data: Partial<PageFormData> }>({
      query: ({ id, data }) => ({
        url: `/pages/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Page', id }, 'Page'],
    }),
    deletePage: builder.mutation<void, number>({
      query: (id) => ({
        url: `/pages/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Page'],
    }),
    duplicatePage: builder.mutation<Page, number>({
      query: (id) => ({
        url: `/pages/${id}/duplicate/`,
        method: 'POST',
      }),
      invalidatesTags: ['Page'],
    }),
    publishPage: builder.mutation<{ message: string; is_published: boolean }, number>({
      query: (id) => ({
        url: `/pages/${id}/publish/`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Page', id }, 'Page'],
    }),
    unpublishPage: builder.mutation<{ message: string; is_published: boolean }, number>({
      query: (id) => ({
        url: `/pages/${id}/unpublish/`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Page', id }, 'Page'],
    }),
    reorderPages: builder.mutation<{ message: string }, Array<{ id: number; order: number }>>({
      query: (pages) => ({
        url: '/pages/reorder/',
        method: 'POST',
        body: { pages },
      }),
      invalidatesTags: ['Page'],
    }),
    checkDuplicateMeta: builder.mutation<{
      title_duplicates: Array<{ id: number; title: string; slug: string; created_at: string }>
      description_duplicates: Array<{ id: number; title: string; slug: string; created_at: string }>
      has_duplicates: boolean
    }, {
      site_id: number
      title: string
      meta_description: string
      exclude_id?: number
    }>({
      query: (data) => ({
        url: '/pages/check_duplicates/',
        method: 'POST',
        body: data,
      }),
    }),
    generateMetaTags: builder.mutation<{
      success: boolean
      meta_tags: {
        title: string
        meta_description: string
        h1_tag: string
        keywords: string
      }
    }, {
      page_title: string
      page_content: string
      keywords?: string
      site_domain?: string
      target_audience?: string
    }>({
      query: (data) => ({
        url: '/pages/generate_meta/',
        method: 'POST',
        body: data,
      }),
    }),
    analyzeSEO: builder.mutation<{
      success: boolean
      analysis: {
        score: number
        recommendations: string[]
        strengths: string[]
        weaknesses: string[]
      }
    }, {
      page_title: string
      page_content: string
      current_meta: {
        title?: string
        meta_description?: string
        h1_tag?: string
        keywords?: string
      }
    }>({
      query: (data) => ({
        url: '/pages/analyze_seo/',
        method: 'POST',
        body: data,
      }),
    }),
    researchLSIKeywords: builder.mutation<{
      success: boolean
      primary_keyword: string
      total_keywords: number
      keywords: Array<{
        keyword: string
        relevance_score: number
        difficulty_score: number
        search_volume_estimate: string
        keyword_type: string
        recommended: boolean
        priority: number
      }>
      categories: {
        primary: Record<string, unknown>[]
        related: Record<string, unknown>[]
        long_tail: Record<string, unknown>[]
        question: Record<string, unknown>[]
        commercial: Record<string, unknown>[]
        semantic: Record<string, unknown>[]
      }
      content_suggestions: string[]
      research_summary: string
    }, {
      primary_keyword: string
      content?: string
      industry?: string
      target_audience?: string
      max_keywords?: number
    }>({
      query: (data) => ({
        url: '/pages/research_lsi_keywords/',
        method: 'POST',
        body: data,
      }),
    }),
    analyzeKeywordDensity: builder.mutation<{
      success: boolean
      total_words: number
      keyword_analysis: Array<{
        keyword: string
        exact_matches: number
        word_matches: number
        exact_density: number
        word_density: number
        status: string
        recommendation: string
      }>
      overall_density: number
    }, {
      content: string
      target_keywords: string[]
    }>({
      query: (data) => ({
        url: '/pages/analyze_keyword_density/',
        method: 'POST',
        body: data,
      }),
    }),
    analyzeCompetitor: builder.mutation<{
      success: boolean
      competitor_url: string
      analysis_timestamp: string
      basic_analysis: {
        title_length: number
        title_optimal: boolean
        meta_description_length: number
        meta_description_optimal: boolean
        h1_count: number
        h1_optimal: boolean
        has_meta_description: boolean
        has_title: boolean
        word_count: number
        content_optimal: boolean
      }
      keyword_analysis: {
        target_keywords_found: string[]
        keyword_density: Record<string, { count: number; density: number }>
        title_keyword_usage: Record<string, boolean>
        meta_keyword_usage: Record<string, boolean>
        h1_keyword_usage: Record<string, boolean>
      }
      content_analysis: {
        heading_analysis: Record<string, unknown>
        image_analysis: Record<string, unknown>
        link_analysis: Record<string, unknown>
        content_structure_score: number
      }
      technical_analysis: {
        has_canonical: boolean
        canonical_url: string
        robots_meta: string
        content_type: string
        content_length: number
        page_size_optimal: boolean
        technical_score: number
      }
      meta_analysis: {
        title: string
        meta_description: string
        meta_keywords: string
        has_meta_keywords: boolean
        meta_keywords_count: number
        meta_score: number
      }
      insights: string[]
      recommendations: string[]
    }, {
      competitor_url: string
      target_keywords?: string[]
      analysis_depth?: string
    }>({
      query: (data) => ({
        url: '/pages/analyze_competitor/',
        method: 'POST',
        body: data,
      }),
    }),
    compareCompetitors: builder.mutation<{
      success: boolean
      competitor_count: number
      competitor_analyses: Record<string, unknown>[]
      comparison_insights: string[]
      recommendations: string[]
    }, {
      competitor_urls: string[]
      target_keywords?: string[]
    }>({
      query: (data) => ({
        url: '/pages/compare_competitors/',
        method: 'POST',
        body: data,
      }),
    }),
    generateSitemap: builder.mutation<{
      success: boolean
      site_id: number
      site_domain: string
      page_count: number
      image_count: number
      xml_content: string
      generated_at: string
      sitemap_size: number
    }, {
      site_id: number
      include_images?: boolean
      include_media?: boolean
      priority_boost?: Record<string, number>
    }>({
      query: (data) => ({
        url: '/pages/generate_sitemap/',
        method: 'POST',
        body: data,
      }),
    }),
    generateRobotsTxt: builder.mutation<{
      success: boolean
      site_id: number
      site_domain: string
      robots_content: string
      generated_at: string
      file_size: number
    }, {
      site_id: number
      custom_rules?: string[]
      sitemap_url?: string
    }>({
      query: (data) => ({
        url: '/pages/generate_robots_txt/',
        method: 'POST',
        body: data,
      }),
    }),
    generateSitemapIndex: builder.mutation<{
      success: boolean
      site_id: number
      site_domain: string
      sitemap_types: string[]
      xml_content: string
      generated_at: string
    }, {
      site_id: number
      sitemap_types?: string[]
    }>({
      query: (data) => ({
        url: '/pages/generate_sitemap_index/',
        method: 'POST',
        body: data,
      }),
    }),
    validateSitemap: builder.mutation<{
      success: boolean
      valid: boolean
      namespace_valid: boolean
      element_type: string
      element_count: number
      validation_errors: string[]
      file_size: number
    }, {
      xml_content: string
    }>({
      query: (data) => ({
        url: '/pages/validate_sitemap/',
        method: 'POST',
        body: data,
      }),
    }),
    getSitemapStats: builder.query<{
      success: boolean
      site_id: number
      site_domain: string
      published_pages: number
      total_pages: number
      media_files: number
      last_updated: string
      publish_percentage: number
    }, {
      site_id: number
    }>({
      query: (params) => ({
        url: '/pages/get_sitemap_stats/',
        params,
      }),
    }),
    generatePageSchema: builder.mutation<{
      success: boolean
      schema_type: string
      page_id: number
      page_slug: string
      structured_data: Record<string, unknown>
      json_ld: string
      generated_at: string
    }, {
      pageId: number
      schema_type?: string
      include_breadcrumbs?: boolean
      include_organization?: boolean
    }>({
      query: ({ pageId, ...data }) => ({
        url: `/pages/${pageId}/generate_schema/`,
        method: 'POST',
        body: data,
      }),
    }),
    getSchemaRecommendations: builder.query<{
      success: boolean
      page_id: number
      suggested_schema_types: string[]
      recommendations: string[]
      content_analysis: {
        has_faq_content: boolean
        has_image_content: boolean
        word_count: number
        has_meta_description: boolean
        has_h1_tag: boolean
        has_keywords: boolean
      }
    }, {
      pageId: number
    }>({
      query: ({ pageId }) => ({
        url: `/pages/${pageId}/get_schema_recommendations/`,
      }),
    }),
    generateWebsiteSchema: builder.mutation<{
      success: boolean
      schema_type: string
      site_id: number
      site_domain: string
      structured_data: Record<string, unknown>
      json_ld: string
      generated_at: string
    }, {
      site_id: number
    }>({
      query: (data) => ({
        url: '/pages/generate_website_schema/',
        method: 'POST',
        body: data,
      }),
    }),
    validateSchema: builder.mutation<{
      success: boolean
      valid: boolean
      validation_errors: string[]
      warnings: string[]
      schema_type: string
      field_count: number
    }, {
      schema_data: Record<string, unknown>
    }>({
      query: (data) => ({
        url: '/pages/validate_schema/',
        method: 'POST',
        body: data,
      }),
    }),
    
    // Page Blocks
    getBlocks: builder.query<PageBlock[], { page?: number }>({
      query: (params) => ({
        url: '/page-blocks/',
        params,
      }),
      transformResponse: (response: PaginatedResponse<PageBlock> | PageBlock[]): PageBlock[] => {
        if (Array.isArray(response)) return response
        if (response && 'results' in response) return response.results
        return []
      },
    }),
    createBlock: builder.mutation<PageBlock, Partial<PageBlock>>({
      query: (data) => ({
        url: '/page-blocks/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Page'],
    }),
    updateBlock: builder.mutation<PageBlock, { id: number; data: Partial<PageBlock> }>({
      query: ({ id, data }) => ({
        url: `/page-blocks/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Page'],
    }),
    deleteBlock: builder.mutation<void, number>({
      query: (id) => ({
        url: `/page-blocks/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Page'],
    }),
    reorderBlocks: builder.mutation<{ message: string }, Array<{ id: number; order: number }>>({
      query: (blocks) => ({
        url: '/page-blocks/reorder/',
        method: 'POST',
        body: { blocks },
      }),
      invalidatesTags: ['Page'],
    }),
    
    // Swiper Presets
    getSwiperPresets: builder.query<SwiperPreset[], void>({
      query: () => '/swiper-presets/',
      transformResponse: (response: PaginatedResponse<SwiperPreset> | SwiperPreset[]): SwiperPreset[] => {
        if (Array.isArray(response)) return response
        if (response && 'results' in response) return response.results
        return []
      },
      providesTags: ['Page'],
    }),

    getSwiperPreset: builder.query<SwiperPreset, number>({
      query: (id) => `/swiper-presets/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Page', id }],
    }),

    createSwiperPreset: builder.mutation<SwiperPreset, Partial<SwiperPreset>>({
      query: (data) => ({
        url: '/swiper-presets/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Page'],
    }),

    updateSwiperPreset: builder.mutation<SwiperPreset, { 
      id: number; 
      data: Partial<SwiperPreset> 
    }>({
      query: ({ id, data }) => ({
        url: `/swiper-presets/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Page'],
    }),

    deleteSwiperPreset: builder.mutation<void, number>({
      query: (id) => ({
        url: `/swiper-presets/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Page'],
    }),
    
    // Enhanced Content Generation
    generateEnhancedContent: builder.mutation<EnhancedContentResult, { page_id: number; block_types: string[]; prompts: Record<string, number> }>({
      query: ({ page_id, block_types, prompts }) => ({
        url: `/pages/${page_id}/generate_enhanced_content/`,
        method: 'POST',
        body: { block_types, prompts },
      }),
      invalidatesTags: ['Page', 'PageBlock'],
    }),
    
    getAvailablePrompts: builder.query<AvailablePromptsResult, { block_type: string }>({
      query: (params) => ({
        url: '/pages/get_available_prompts/',
        params,
      }),
      providesTags: ['Prompt'],
    }),
    
    getBlockTypes: builder.query<BlockTypesResult, void>({
      query: () => '/pages/get_block_types/',
      providesTags: ['Page'],
    }),
    
    regenerateBlockContent: builder.mutation<RegenerateBlockResult, { block_id: number; prompt_id: number }>({
      query: ({ block_id, prompt_id }) => ({
        url: `/page-blocks/${block_id}/regenerate_content/`,
        method: 'POST',
        body: { prompt_id },
      }),
      invalidatesTags: ['PageBlock'],
    }),
  }),
})

export const {
  useGetPagesQuery,
  useGetPageQuery,
  useCreatePageMutation,
  useUpdatePageMutation,
  useDeletePageMutation,
  useDuplicatePageMutation,
  usePublishPageMutation,
  useUnpublishPageMutation,
  useReorderPagesMutation,
  useCheckDuplicateMetaMutation,
  useGenerateMetaTagsMutation,
  useAnalyzeSEOMutation,
  useResearchLSIKeywordsMutation,
  useAnalyzeKeywordDensityMutation,
  useAnalyzeCompetitorMutation,
  useCompareCompetitorsMutation,
  useGenerateSitemapMutation,
  useGenerateRobotsTxtMutation,
  useGenerateSitemapIndexMutation,
  useValidateSitemapMutation,
  useGetSitemapStatsQuery,
  useGeneratePageSchemaMutation,
  useGetSchemaRecommendationsQuery,
  useGenerateWebsiteSchemaMutation,
  useValidateSchemaMutation,
  useGetBlocksQuery,
  useCreateBlockMutation,
  useUpdateBlockMutation,
  useDeleteBlockMutation,
  useReorderBlocksMutation,
  useGetSwiperPresetsQuery,
  useGetSwiperPresetQuery,
  useCreateSwiperPresetMutation,
  useUpdateSwiperPresetMutation,
  useDeleteSwiperPresetMutation,
  useGenerateEnhancedContentMutation,
  useGetAvailablePromptsQuery,
  useGetBlockTypesQuery,
  useRegenerateBlockContentMutation,
} = pagesApi
