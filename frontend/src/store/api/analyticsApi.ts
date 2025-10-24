import { apiSlice } from './apiSlice'
import type { AnalyticsData, AnalyticsSummary, TrafficSource, PageViewTrackingRequest } from '@/types'

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
      providesTags: ['Analytics'],
    }),
    
    getAnalyticsSummary: builder.query<AnalyticsSummary, { 
      site?: number; 
      start?: string; 
      end?: string 
    }>({
      query: (params) => ({
        url: '/analytics/summary/',
        params,
      }),
      providesTags: ['Analytics'],
    }),
    
    getTrafficSources: builder.query<TrafficSource[], { site?: number }>({
      query: (params) => ({
        url: '/analytics/traffic_sources/',
        params,
      }),
      providesTags: ['Analytics'],
    }),
    
    trackPageView: builder.mutation<{ success: boolean }, PageViewTrackingRequest>({
      query: (data) => ({
        url: '/analytics/track/',
        method: 'POST',
        body: data,
      }),
    }),
  }),
})

export const { 
  useGetAnalyticsQuery,
  useGetAnalyticsSummaryQuery,
  useGetTrafficSourcesQuery,
  useTrackPageViewMutation,
} = analyticsApi
