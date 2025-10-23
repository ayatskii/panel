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
  useGetLanguagesQuery,
  useGetAffiliateLinksQuery,
} = sitesApi
