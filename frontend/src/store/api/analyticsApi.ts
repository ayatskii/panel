import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../store'

export interface PageView {
  id: number
  site: number
  page: number
  ip_address: string
  user_agent: string
  referrer: string
  timestamp: string
  load_time?: number
  page_title?: string
  page_slug?: string
  site_domain?: string
}

export interface SiteAnalytics {
  id: number
  site: number
  date: string
  page_views: number
  unique_visitors: number
  bounce_rate: number
  avg_session_duration: number
  site_domain?: string
}

export interface RealtimeMetrics {
  online_users: number
  hourly_views: number
  top_pages: Array<{
    page__title: string
    page__slug: string
    views: number
  }>
  traffic_sources: Array<{
    referrer: string
    visits: number
  }>
  device_breakdown: Array<{
    device_type: string
    count: number
  }>
  country_breakdown: Array<{
    country: string
    visits: number
  }>
  minute_data: Array<{
    minute: string
    views: number
  }>
  last_updated: string
  site_id: number
}

export interface LiveVisitor {
  ip_address: string
  country: string
  city: string
  device_type: string
  browser: string
  os: string
  last_activity: string
  page_count: number
  current_page?: {
    title: string
    url: string
  }
}

export interface RealtimeAlert {
  type: string
  severity: 'low' | 'medium' | 'high'
  message: string
  timestamp: string
}

export interface AnalyticsOverview {
  success: boolean
  site_id: number
  site_domain: string
  period_days: number
  date_range: {
    start_date: string
    end_date: string
  }
  basic_metrics: {
    total_views: number
    unique_visitors: number
    total_pages: number
    published_pages: number
    total_media: number
    avg_session_duration: number
    publish_percentage: number
  }
  traffic_analytics: {
    daily_traffic: Array<{
      date: string
      views: number
      unique_visitors: number
    }>
    hourly_traffic: Array<{
      hour: string
      views: number
    }>
    top_pages: Array<{
      page__title: string
      page__slug: string
      views: number
    }>
    traffic_sources: Array<{
      referrer: string
      visits: number
    }>
    browsers: Array<{
      user_agent: string
      visits: number
    }>
  }
  content_analytics: {
    most_viewed: Array<{
      page__id: number
      page__title: string
      page__slug: string
      page__created_at: string
      views: number
    }>
    content_performance: Array<{
      page__title: string
      views: number
    }>
    recent_content: Array<{
      id: number
      title: string
      slug: string
      created_at: string
      views: number
    }>
    engagement_metrics: {
      engagement_score: number
      total_interactions: number
      avg_time_on_site: number
    }
  }
  user_analytics: {
    user_activity: Array<{
      ip_address: string
      page_views: number
      unique_pages: number
      first_visit: string
      last_visit: string
    }>
    geographic_distribution: Array<{
      country: string
      visits: number
      percentage: number
    }>
    device_types: {
      mobile: number
      desktop: number
      tablet: number
    }
  }
  performance_metrics: {
    load_times: {
      avg_load_time?: number
      max_load_time?: number
      min_load_time?: number
    }
    bounce_rate: number
    conversion_metrics: {
      conversion_rate: number
      total_conversions: number
      conversion_goals: Record<string, unknown>[]
    }
  }
  seo_metrics: {
    seo_completeness: {
      total_pages: number
      pages_with_title: number
      pages_with_meta_description: number
      pages_with_h1: number
      pages_with_keywords: number
      published_pages: number
      title_percentage: number
      meta_percentage: number
      h1_percentage: number
      keywords_percentage: number
      publish_percentage: number
    }
    content_analysis: {
      avg_word_count: number
      pages_with_images: number
      pages_with_faq: number
    }
  }
  generated_at: string
}

export interface RealTimeAnalytics {
  success: boolean
  site_id: number
  active_users: number
  hourly_views: number
  top_pages_hourly: Array<{
    page__title: string
    page__slug: string
    views: number
  }>
  recent_visitors: Array<{
    ip_address: string
    page_title: string
    timestamp: string
    user_agent: string
  }>
  generated_at: string
}

export interface TrafficSummary {
  success: boolean
  site_id: number
  period_days: number
  current_period: {
    total_views: number
    unique_visitors: number
  }
  previous_period: {
    total_views: number
    unique_visitors: number
  }
  growth: {
    views_growth: number
    visitors_growth: number
  }
}

export interface TopPages {
  success: boolean
  site_id: number
  period_days: number
  top_pages: Array<{
    page__id: number
    page__title: string
    page__slug: string
    page__created_at: string
    views: number
    unique_visitors: number
  }>
}

export interface PerformanceMetrics {
  success: boolean
  site_id: number
  period_days: number
  performance_metrics: {
    load_times: {
      avg_load_time?: number
      max_load_time?: number
      min_load_time?: number
    }
    bounce_rate: number
    total_sessions: number
    single_page_sessions: number
  }
}

export interface ExportAnalytics {
  success: boolean
  site_id: number
  format: string
  data: string
  exported_at: string
  date_range: {
    start_date: string
    end_date: string
  }
}

export const analyticsApi = createApi({
  reducerPath: 'analyticsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['PageView', 'SiteAnalytics', 'AnalyticsOverview', 'RealTimeAnalytics', 'RealtimeMetrics', 'LiveVisitors', 'RealtimeAlerts'],
  endpoints: (builder) => ({
    // Page Views
    getPageViews: builder.query<PageView[], { site_id?: number }>({
      query: (params) => ({
        url: 'page-views/',
        params,
      }),
      providesTags: ['PageView'],
    }),
    
    createPageView: builder.mutation<PageView, Partial<PageView>>({
      query: (data) => ({
        url: 'page-views/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PageView', 'AnalyticsOverview', 'RealTimeAnalytics'],
    }),
    
    // Site Analytics
    getSiteAnalytics: builder.query<SiteAnalytics[], { site_id?: number }>({
      query: (params) => ({
        url: 'site-analytics/',
        params,
      }),
      providesTags: ['SiteAnalytics'],
    }),
    
    // Analytics Overview
    getAnalyticsOverview: builder.query<AnalyticsOverview, { site_id: number; period_days?: number }>({
      query: (params) => ({
        url: 'page-views/analytics_overview/',
        params,
      }),
      providesTags: ['AnalyticsOverview'],
    }),
    
    // Real-time Analytics
    getRealTimeAnalytics: builder.query<RealTimeAnalytics, { site_id: number }>({
      query: (params) => ({
        url: 'page-views/real_time_analytics/',
        params,
      }),
      providesTags: ['RealTimeAnalytics'],
    }),
    
    // Traffic Summary
    getTrafficSummary: builder.query<TrafficSummary, { site_id: number; period_days?: number }>({
      query: (params) => ({
        url: 'page-views/traffic_summary/',
        params,
      }),
    }),
    
    // Top Pages
    getTopPages: builder.query<TopPages, { site_id: number; period_days?: number; limit?: number }>({
      query: (params) => ({
        url: 'page-views/top_pages/',
        params,
      }),
    }),
    
    // Performance Metrics
    getPerformanceMetrics: builder.query<PerformanceMetrics, { site_id: number; period_days?: number }>({
      query: (params) => ({
        url: 'site-analytics/performance_metrics/',
        params,
      }),
    }),
    
    // Export Analytics
    exportAnalytics: builder.mutation<ExportAnalytics, {
      site_id: number
      start_date?: string
      end_date?: string
      format?: string
    }>({
      query: (data) => ({
        url: 'page-views/export_analytics/',
        method: 'POST',
        body: data,
      }),
    }),

    // Real-time Analytics
    getRealtimeMetrics: builder.query<RealtimeMetrics, number>({
      query: (siteId) => ({
        url: `page-views/realtime_metrics/?site_id=${siteId}`,
      }),
      providesTags: ['RealtimeMetrics'],
    }),

    getLiveVisitors: builder.query<{ visitors: LiveVisitor[] }, number>({
      query: (siteId) => ({
        url: `page-views/live_visitors/?site_id=${siteId}`,
      }),
      providesTags: ['LiveVisitors'],
    }),

    getRealtimeAlerts: builder.query<{ alerts: RealtimeAlert[] }, number>({
      query: (siteId) => ({
        url: `page-views/realtime_alerts/?site_id=${siteId}`,
      }),
      providesTags: ['RealtimeAlerts'],
    }),

    trackRealtimeView: builder.mutation<{ success: boolean; page_view_id: number; timestamp: string }, {
      site_id: number
      page_id: number
      user_data: Record<string, unknown>
    }>({
      query: (data) => ({
        url: 'page-views/track_realtime_view/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['RealtimeMetrics', 'LiveVisitors', 'RealtimeAlerts'],
    }),

    getWebsocketUrl: builder.query<{ websocket_url: string }, number>({
      query: (siteId) => ({
        url: `page-views/websocket_url/?site_id=${siteId}`,
      }),
    }),
  }),
})

export const {
  useGetPageViewsQuery,
  useCreatePageViewMutation,
  useGetSiteAnalyticsQuery,
  useGetAnalyticsOverviewQuery,
  useGetRealTimeAnalyticsQuery,
  useGetTrafficSummaryQuery,
  useGetTopPagesQuery,
  useGetPerformanceMetricsQuery,
  useExportAnalyticsMutation,
  useGetRealtimeMetricsQuery,
  useGetLiveVisitorsQuery,
  useGetRealtimeAlertsQuery,
  useTrackRealtimeViewMutation,
  useGetWebsocketUrlQuery,
} = analyticsApi