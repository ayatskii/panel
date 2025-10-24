import { apiSlice } from './apiSlice'
import type { ApiToken, CloudflareToken } from '@/types'

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const integrationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // API Tokens
    getApiTokens: builder.query<ApiToken[], void>({
      query: () => '/integrations/api-tokens/',
      transformResponse: (response: PaginatedResponse<ApiToken> | ApiToken[]): ApiToken[] => {
        if (Array.isArray(response)) return response
        if (response && 'results' in response) return response.results
        return []
      },
      providesTags: ['ApiToken'],
    }),
    getApiToken: builder.query<ApiToken, number>({
      query: (id) => `/integrations/api-tokens/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'ApiToken', id }],
    }),
    createApiToken: builder.mutation<ApiToken, Partial<ApiToken>>({
      query: (data) => ({
        url: '/integrations/api-tokens/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ApiToken'],
    }),
    updateApiToken: builder.mutation<ApiToken, { id: number; data: Partial<ApiToken> }>({
      query: ({ id, data }) => ({
        url: `/integrations/api-tokens/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'ApiToken', id }, 'ApiToken'],
    }),
    deleteApiToken: builder.mutation<void, number>({
      query: (id) => ({
        url: `/integrations/api-tokens/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ApiToken'],
    }),

    // Cloudflare Tokens
    getCloudflareTokens: builder.query<CloudflareToken[], void>({
      query: () => '/integrations/cloudflare-tokens/',
      transformResponse: (response: PaginatedResponse<CloudflareToken> | CloudflareToken[]): CloudflareToken[] => {
        if (Array.isArray(response)) return response
        if (response && 'results' in response) return response.results
        return []
      },
      providesTags: ['CloudflareToken'],
    }),
    getCloudflareToken: builder.query<CloudflareToken, number>({
      query: (id) => `/integrations/cloudflare-tokens/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'CloudflareToken', id }],
    }),
    createCloudflareToken: builder.mutation<CloudflareToken, Partial<CloudflareToken>>({
      query: (data) => ({
        url: '/integrations/cloudflare-tokens/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['CloudflareToken'],
    }),
    updateCloudflareToken: builder.mutation<CloudflareToken, { id: number; data: Partial<CloudflareToken> }>({
      query: ({ id, data }) => ({
        url: `/integrations/cloudflare-tokens/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'CloudflareToken', id }, 'CloudflareToken'],
    }),
    deleteCloudflareToken: builder.mutation<void, number>({
      query: (id) => ({
        url: `/integrations/cloudflare-tokens/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CloudflareToken'],
    }),

    // Test connection endpoints
    testApiToken: builder.mutation<{ valid: boolean; info?: string }, number>({
      query: (id) => ({
        url: `/integrations/api-tokens/${id}/test_connection/`,
        method: 'POST',
      }),
    }),

    validateCloudflareToken: builder.mutation<{ valid: boolean; error?: string }, number>({
      query: (id) => ({
        url: `/integrations/cloudflare-tokens/${id}/validate/`,
        method: 'POST',
      }),
    }),
  }),
})

export const {
  useGetApiTokensQuery,
  useGetApiTokenQuery,
  useCreateApiTokenMutation,
  useUpdateApiTokenMutation,
  useDeleteApiTokenMutation,
  useTestApiTokenMutation,
  useGetCloudflareTokensQuery,
  useGetCloudflareTokenQuery,
  useCreateCloudflareTokenMutation,
  useUpdateCloudflareTokenMutation,
  useDeleteCloudflareTokenMutation,
  useValidateCloudflareTokenMutation,
} = integrationsApi

