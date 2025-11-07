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
    getAvailableCloudflareTokens: builder.query<CloudflareTokenWithSites[], void>({
      query: () => '/integrations/cloudflare-tokens/available_for_site_creation/',
      providesTags: ['CloudflareToken'],
    }),
    
    // Page Rules
    getPageRules: builder.query<PageRulesResponse, { site_id: number }>({
      query: (params) => ({
        url: '/integrations/cloudflare-tokens/page_rules/',
        params,
      }),
      providesTags: ['PageRules'],
    }),
    
    create404Redirect: builder.mutation<PageRuleResult, { site_id: number }>({
      query: (data) => ({
        url: '/integrations/cloudflare-tokens/create_404_redirect/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PageRules'],
    }),
    
    createWwwRedirect: builder.mutation<PageRuleResult, { site_id: number }>({
      query: (data) => ({
        url: '/integrations/cloudflare-tokens/create_www_redirect/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PageRules'],
    }),
    
    applyRedirectRules: builder.mutation<RedirectRulesResult, { site_id: number }>({
      query: (data) => ({
        url: '/integrations/cloudflare-tokens/apply_redirect_rules/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PageRules'],
    }),
    
    getRuleExpressions: builder.query<RuleExpressions, { site_id: number }>({
      query: (params) => ({
        url: '/integrations/cloudflare-tokens/rule_expressions/',
        params,
      }),
      providesTags: ['PageRules'],
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

    // Get nameservers for a domain
    getNameservers: builder.query<{ success: boolean; domain: string; nameservers: string[]; error?: string }, { domain: string; token_id: number }>({
      query: ({ domain, token_id }) => ({
        url: '/integrations/cloudflare-tokens/get_nameservers/',
        params: { domain, token_id },
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
  useGetAvailableCloudflareTokensQuery,
  useGetPageRulesQuery,
  useCreate404RedirectMutation,
  useCreateWwwRedirectMutation,
  useApplyRedirectRulesMutation,
  useGetRuleExpressionsQuery,
  useGetNameserversQuery,
} = integrationsApi

