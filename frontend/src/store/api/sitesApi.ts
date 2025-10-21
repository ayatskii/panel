import { apiSlice } from './apiSlice'
import type { Site, Language, AffiliateLink, SiteFormData } from '@/types'

export const sitesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSites: builder.query<Site[], void>({
      query: () => '/sites/',
      transformResponse: (response: any) => {
        if (response && typeof response === 'object') {
          if ('results' in response && Array.isArray(response.results)) {
            return response.results
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
      transformResponse: (response: any) => {
        if (Array.isArray(response)) return response
        if (response?.results) return response.results
        return []
      },
    }),
    
    // Affiliate Links
    getAffiliateLinks: builder.query<AffiliateLink[], void>({
      query: () => '/affiliate-links/',
      transformResponse: (response: any) => {
        if (Array.isArray(response)) return response
        if (response?.results) return response.results
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
