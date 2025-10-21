import { apiSlice } from './apiSlice'
import type { Deployment } from '@/types'

export const deploymentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDeployments: builder.query<Deployment[], { site?: number }>({
      query: (params) => ({
        url: '/deployments/',
        params,
      }),
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
  }),
})

export const {
  useGetDeploymentsQuery,
  useGetDeploymentQuery,
  useCreateDeploymentMutation,
  useTriggerDeploymentMutation,
  useGetDeploymentLogsQuery,
} = deploymentsApi
