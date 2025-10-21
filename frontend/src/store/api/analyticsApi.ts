import { apiSlice } from './apiSlice'
import type { AnalyticsData } from '@/types'

export const analyticsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAnalytics: builder.query<AnalyticsData[], { site?: number; start?: string; end?: string }>({
      query: (params) => ({
        url: '/analytics/',
        params,
      }),
    }),
  }),
})

export const { useGetAnalyticsQuery } = analyticsApi
