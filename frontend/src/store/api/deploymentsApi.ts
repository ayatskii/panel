import { apiSlice } from './apiSlice'
import type { Deployment } from '@/types'

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const deploymentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDeployments: builder.query<Deployment[], { site?: number }>({
      query: (params) => ({
        url: '/deployments/',
        params,
      }),
      transformResponse: (response: PaginatedResponse<Deployment> | Deployment[]): Deployment[] => {
        if (Array.isArray(response)) return response
        if (response && 'results' in response) return response.results
        return []
      },
      providesTags: ['Deployment'],
    }),
    getDeployment: builder.query<Deployment, number>({
      query: (id) => `/deployments/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Deployment', id }],
    }),
    createDeployment: builder.mutation<Deployment, { site: number }>({
      query: (data) => ({
        url: '/deployments/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Deployment', 'Site'],
    }),
    triggerDeployment: builder.mutation<Deployment, number>({
      query: (id) => ({
        url: `/deployments/${id}/trigger/`,
        method: 'POST',
      }),
      invalidatesTags: ['Deployment'],
    }),
    getDeploymentLogs: builder.query<{ logs: string[] }, number>({
      query: (id) => `/deployments/${id}/logs/`,
    }),
    
    cancelDeployment: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/deployments/${id}/cancel/`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Deployment', id }, 
        'Deployment'
      ],
    }),

    downloadDeploymentZip: builder.query<Blob, number>({
      query: (id) => ({
        url: `/deployments/${id}/download_zip/`,
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
})

export const {
  useGetDeploymentsQuery,
  useGetDeploymentQuery,
  useCreateDeploymentMutation,
  useTriggerDeploymentMutation,
  useGetDeploymentLogsQuery,
  useCancelDeploymentMutation,
  useLazyDownloadDeploymentZipQuery,
} = deploymentsApi
