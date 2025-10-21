import { apiSlice } from './apiSlice'
import type { AnalyticsData } from '@/types'

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const analyticsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAnalytics: builder.query<AnalyticsData[], { site?: number; start?: string; end?: string }>({
      query: (params) => ({
        url: '/analytics/',
        params,
      }),
      transformResponse: (response: PaginatedResponse<AnalyticsData> | AnalyticsData[]): AnalyticsData[] => {
        if (Array.isArray(response)) return response
        if (response && 'results' in response) return response.results
        return []
      },
    }),
  }),
})

export const { useGetAnalyticsQuery } = analyticsApi
