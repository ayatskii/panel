import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../index'

export const performanceApi = createApi({
  reducerPath: 'performanceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/performance/',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['PerformanceOptimization'],
  endpoints: (builder) => ({
    // Cache Management
    getCacheStats: builder.query<{
      cache_hits: number
      cache_misses: number
      cache_hit_rate: number
      total_keys: number
      memory_usage: number
      evictions: number
    }, void>({
      query: () => ({
        url: 'get_cache_stats/',
      }),
    }),
    invalidateCache: builder.mutation<{
      success: boolean
      invalidated_count: number
      pattern: string
    }, {
      pattern: string
    }>({
      query: (data) => ({
        url: 'invalidate_cache/',
        method: 'POST',
        body: data,
      }),
    }),
    
    // Database Optimization
    optimizeDatabase: builder.mutation<{
      success: boolean
      site_id: number
      optimizations: {
        slow_queries: Array<{
          query: string
          execution_time: number
          frequency: number
          optimization_suggestion: string
        }>
        page_optimizations: {
          total_pages: number
          pages_with_blocks: number
          optimization_score: number
          suggestions: string[]
        }
        media_optimizations: {
          total_media: number
          large_files: number
          optimization_score: number
          suggestions: string[]
        }
        database_stats: {
          table_sizes: Array<{
            table: string
            size: string
          }>
          index_usage: Array<{
            table: string
            index: string
            scans: number
            tuples_read: number
            tuples_fetched: number
          }>
        }
      }
      optimized_at: string
    }, {
      site_id: number
    }>({
      query: (data) => ({
        url: 'optimize_database/',
        method: 'POST',
        body: data,
      }),
    }),
    
    // Image Optimization
    optimizeImages: builder.mutation<{
      success: boolean
      site_id: number
      image_stats: {
        total_images: number
        large_images: number
        unoptimized_images: number
        total_size_mb: number
        potential_savings_mb: number
        optimization_percentage: number
      }
      optimized_at: string
    }, {
      site_id: number
    }>({
      query: (data) => ({
        url: 'optimize_images/',
        method: 'POST',
        body: data,
      }),
    }),
    compressImage: builder.mutation<{
      success: boolean
      media_id: number
      original_size: number
      compressed_size: number
      savings: number
      compression_ratio: number
      compressed_at: string
    }, {
      media_id: number
      quality?: number
    }>({
      query: (data) => ({
        url: 'compress_image/',
        method: 'POST',
        body: data,
      }),
    }),
    
    // CDN Management
    getCdnPerformance: builder.query<{
      success: boolean
      site_id: number
      site_domain: string
      cdn_stats: {
        cache_hit_ratio: number
        bandwidth_saved_mb: number
        requests_served: number
        average_response_time: number
        edge_locations: number
        ssl_enabled: boolean
        compression_enabled: boolean
      }
      performance_score: number
      checked_at: string
    }, {
      site_id: number
    }>({
      query: (params) => ({
        url: 'get_cdn_performance/',
        params,
      }),
    }),
    optimizeCdn: builder.mutation<{
      success: boolean
      site_id: number
      site_domain: string
      applied_settings: any
      optimization_score: number
      estimated_improvement: {
        cache_hit_ratio: string
        response_time: string
        bandwidth_savings: string
      }
      optimized_at: string
    }, {
      site_id: number
      settings: any
    }>({
      query: (data) => ({
        url: 'optimize_cdn/',
        method: 'POST',
        body: data,
      }),
    }),
    
    // System Performance
    getSystemPerformance: builder.query<{
      success: boolean
      system_metrics: {
        cpu_usage_percent: number
        memory_usage_percent: number
        memory_available_gb: number
        disk_usage_percent: number
        disk_free_gb: number
        network_bytes_sent: number
        network_bytes_recv: number
      }
      performance_alerts: Array<{
        type: string
        severity: string
        message: string
        threshold: number
      }>
      checked_at: string
    }, void>({
      query: () => ({
        url: 'get_system_performance/',
      }),
    }),
    
    // Performance Recommendations
    getRecommendations: builder.query<{
      success: boolean
      site_id: number
      site_domain: string
      recommendations: Array<{
        category: string
        priority: string
        title: string
        description: string
        impact: string
        effort: string
      }>
      total_recommendations: number
      high_priority: number
      generated_at: string
    }, {
      site_id: number
    }>({
      query: (params) => ({
        url: 'get_recommendations/',
        params,
      }),
    }),
    
    // Performance Testing
    runPerformanceTest: builder.mutation<{
      success: boolean
      site_id: number
      site_domain: string
      test_type: string
      test_results: {
        database?: {
          query_time: number
          pages_queried: number
          media_queried: number
          performance_score: number
          status: string
        }
        cache?: {
          cache_time: number
          cache_working: boolean
          performance_score: number
          status: string
        }
        media?: {
          media_time: number
          files_processed: number
          total_size_mb: number
          performance_score: number
          status: string
        }
      }
      total_test_time: number
      overall_score: number
      tested_at: string
    }, {
      site_id: number
      test_type?: string
    }>({
      query: (data) => ({
        url: 'run_performance_test/',
        method: 'POST',
        body: data,
      }),
    }),
  }),
})

export const {
  useGetCacheStatsQuery,
  useInvalidateCacheMutation,
  useOptimizeDatabaseMutation,
  useOptimizeImagesMutation,
  useCompressImageMutation,
  useGetCdnPerformanceQuery,
  useOptimizeCdnMutation,
  useGetSystemPerformanceQuery,
  useGetRecommendationsQuery,
  useRunPerformanceTestMutation,
} = performanceApi
