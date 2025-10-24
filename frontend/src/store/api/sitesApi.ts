import { apiSlice } from './apiSlice'
import type { Site, Language, AffiliateLink, SiteFormData } from '@/types'

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const sitesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSites: builder.query<Site[], void>({
      query: () => '/sites/',
      transformResponse: (response: PaginatedResponse<Site> | Site[] | unknown): Site[] => {
        if (response && typeof response === 'object') {
          if ('results' in response && Array.isArray((response as PaginatedResponse<Site>).results)) {
            return (response as PaginatedResponse<Site>).results
          }
          if (Array.isArray(response)) {
            return response
          }
        }
        console.warn('Unexpected sites response format:', response)
        return []
      },
      providesTags: ['Site'],
    }),
    
    getSite: builder.query<Site, number>({
      query: (id) => `/sites/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Site', id }],
    }),
    
    createSite: builder.mutation<Site, SiteFormData>({
      query: (data) => ({
        url: '/sites/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Site'],
    }),
    
    updateSite: builder.mutation<Site, { id: number; data: Partial<SiteFormData> }>({
      query: ({ id, data }) => ({
        url: `/sites/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Site', id }, 'Site'],
    }),
    
    deleteSite: builder.mutation<void, number>({
      query: (id) => ({
        url: `/sites/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Site'],
    }),
    
    deploySite: builder.mutation<{ message: string; deployment_id: number }, number>({
      query: (siteId) => ({
        url: `/sites/${siteId}/deploy/`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, siteId) => [
        { type: 'Site', id: siteId },
        'Site',
        'Deployment'
      ],
    }),

    duplicateSite: builder.mutation<Site, { id: number; domain: string }>({
      query: ({ id, domain }) => ({
        url: `/sites/${id}/duplicate/`,
        method: 'POST',
        body: { domain },
      }),
      invalidatesTags: ['Site'],
    }),

    getSiteAnalyticsSummary: builder.query<any, { 
      id: number; 
      days?: number 
    }>({
      query: ({ id, days = 30 }) => ({
        url: `/sites/${id}/analytics_summary/`,
        params: { days },
      }),
      providesTags: (_result, _error, { id }) => [{ type: 'Site', id }],
    }),

    getAvailableTemplates: builder.query<any[], void>({
      query: () => '/sites/templates_available/',
      providesTags: ['Template'],
    }),
    
    // Languages
    getLanguages: builder.query<Language[], void>({
      query: () => '/languages/',
      transformResponse: (response: PaginatedResponse<Language> | Language[] | unknown): Language[] => {
        if (Array.isArray(response)) return response
        if (response && typeof response === 'object' && 'results' in response) {
          return (response as PaginatedResponse<Language>).results
        }
        return []
      },
    }),
    
    // Affiliate Links
    getAffiliateLinks: builder.query<AffiliateLink[], void>({
      query: () => '/affiliate-links/',
      transformResponse: (response: PaginatedResponse<AffiliateLink> | AffiliateLink[] | unknown): AffiliateLink[] => {
        if (Array.isArray(response)) return response
        if (response && typeof response === 'object' && 'results' in response) {
          return (response as PaginatedResponse<AffiliateLink>).results
        }
        return []
      },
      providesTags: ['AffiliateLink'],
    }),

    getAffiliateLink: builder.query<AffiliateLink, number>({
      query: (id) => `/affiliate-links/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'AffiliateLink', id }],
    }),

    createAffiliateLink: builder.mutation<AffiliateLink, Partial<AffiliateLink>>({
      query: (data) => ({
        url: '/affiliate-links/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AffiliateLink'],
    }),

    updateAffiliateLink: builder.mutation<AffiliateLink, { 
      id: number; 
      data: Partial<AffiliateLink> 
    }>({
      query: ({ id, data }) => ({
        url: `/affiliate-links/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'AffiliateLink', id },
        'AffiliateLink'
      ],
    }),

    deleteAffiliateLink: builder.mutation<void, number>({
      query: (id) => ({
        url: `/affiliate-links/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AffiliateLink'],
    }),

    getAffiliateLinkUsage: builder.query<any, number>({
      query: (id) => `/affiliate-links/${id}/usage/`,
      providesTags: (_result, _error, id) => [{ type: 'AffiliateLink', id }],
    }),

    duplicateAffiliateLink: builder.mutation<AffiliateLink, number>({
      query: (id) => ({
        url: `/affiliate-links/${id}/duplicate/`,
        method: 'POST',
      }),
      invalidatesTags: ['AffiliateLink'],
    }),

    toggleAffiliateLinkTracking: builder.mutation<{
      id: number
      name: string
      click_tracking: boolean
      message: string
    }, number>({
      query: (id) => ({
        url: `/affiliate-links/${id}/toggle_tracking/`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'AffiliateLink', id },
        'AffiliateLink'
      ],
    }),

    getMostUsedAffiliateLinks: builder.query<AffiliateLink[], void>({
      query: () => '/affiliate-links/most_used/',
      providesTags: ['AffiliateLink'],
    }),
  }),
})

export const {
  useGetSitesQuery,
  useGetSiteQuery,
  useCreateSiteMutation,
  useUpdateSiteMutation,
  useDeleteSiteMutation,
  useDeploySiteMutation,
  useDuplicateSiteMutation,
  useGetSiteAnalyticsSummaryQuery,
  useGetAvailableTemplatesQuery,
  useGetLanguagesQuery,
  useGetAffiliateLinksQuery,
  useGetAffiliateLinkQuery,
  useCreateAffiliateLinkMutation,
  useUpdateAffiliateLinkMutation,
  useDeleteAffiliateLinkMutation,
  useGetAffiliateLinkUsageQuery,
  useDuplicateAffiliateLinkMutation,
  useToggleAffiliateLinkTrackingMutation,
  useGetMostUsedAffiliateLinksQuery,
} = sitesApi
