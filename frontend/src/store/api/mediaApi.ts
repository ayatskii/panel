import { apiSlice } from './apiSlice'
import type { Media, MediaFolder, MediaTag } from '@/types'

// Paginated response type
interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const mediaApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Media
    getMedia: builder.query<Media[], { folder?: number | string; type?: string; search?: string }>({
      query: (params) => ({
        url: '/media/',
        params,
      }),
      transformResponse: (response: PaginatedResponse<Media> | Media[]): Media[] => {
        if (Array.isArray(response)) return response
        if (response && 'results' in response) return response.results
        return []
      },
      providesTags: ['Media'],
    }),
    
    getMediaItem: builder.query<Media, number>({
      query: (id) => `/media/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Media', id }],
    }),
    
    uploadMedia: builder.mutation<Media, FormData>({
      query: (formData) => ({
        url: '/media/upload/',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Media'],
    }),
    
    bulkUploadMedia: builder.mutation<Media[], FormData>({
      query: (formData) => ({
        url: '/media/bulk_upload/',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Media'],
    }),

    importFromUrl: builder.mutation<Media, { url: string; folder?: number; name?: string }>({
      query: (data) => ({
        url: '/media/import_from_url/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Media'],
    }),
    
    updateMedia: builder.mutation<Media, { id: number; data: Partial<Media> }>({
      query: ({ id, data }) => ({
        url: `/media/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Media', id }, 'Media'],
    }),
    
    deleteMedia: builder.mutation<void, number>({
      query: (id) => ({
        url: `/media/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Media'],
    }),
    
    bulkDeleteMedia: builder.mutation<{ message: string }, number[]>({
      query: (ids) => ({
        url: '/media/bulk_delete/',
        method: 'POST',
        body: { ids },
      }),
      invalidatesTags: ['Media'],
    }),
    
    bulkMoveMedia: builder.mutation<{ message: string; count: number }, { ids: number[]; folderId: number | null }>({
      query: ({ ids, folderId }) => ({
        url: '/media/bulk_move/',
        method: 'POST',
        body: { ids, folder_id: folderId },
      }),
      invalidatesTags: ['Media'],
    }),
    
    getMediaUsage: builder.query<{
      media_id: number
      media_name: string
      media_url: string
      usage_count: number
      usage: Array<{
        page_id: number
        page_title: string
        page_slug: string
        site_domain: string
        block_id: number
        block_type: string
        block_order: number
      }>
    }, number>({
      query: (mediaId) => `/media/${mediaId}/usage/`,
    }),
    
    getMediaAnalytics: builder.query<{
      total_files: number
      total_size_bytes: number
      total_size_mb: number
      total_size_gb: number
      average_size_bytes: number
      average_size_mb: number
      storage_by_type: Array<{
        type: string
        count: number
        size_bytes: number
        size_mb: number
        percentage: number
      }>
      storage_by_folder: Array<{
        folder_id: number | null
        folder_name: string
        folder_path: string
        count: number
        size_bytes: number
        size_mb: number
        percentage: number
      }>
      largest_files: Array<{
        id: number
        original_name: string
        file_size: number
        mime_type: string
        created_at: string
      }>
      recent_files: Array<{
        id: number
        original_name: string
        file_size: number
        mime_type: string
        created_at: string
      }>
      optimized_images: number
      optimization_percentage: number
    }, void>({
      query: () => '/media/analytics/',
    }),
    
    // Media Folders
    getFolders: builder.query<MediaFolder[], { parent?: number | string }>({
      query: (params) => ({
        url: '/media-folders/',
        params,
      }),
      transformResponse: (response: PaginatedResponse<MediaFolder> | MediaFolder[]): MediaFolder[] => {
        if (Array.isArray(response)) return response
        if (response && 'results' in response) return response.results
        return []
      },
      providesTags: ['Media'],
    }),
    
    getFolderContents: builder.query<{ subfolders: MediaFolder[]; files: Media[] }, number>({
      query: (id) => `/media-folders/${id}/contents/`,
      providesTags: ['Media'],
    }),
    
    createFolder: builder.mutation<MediaFolder, Partial<MediaFolder>>({
      query: (data) => ({
        url: '/media-folders/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Media'],
    }),
    
    updateFolder: builder.mutation<MediaFolder, { id: number; data: Partial<MediaFolder> }>({
      query: ({ id, data }) => ({
        url: `/media-folders/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Media'],
    }),
    
    deleteFolder: builder.mutation<void, number>({
      query: (id) => ({
        url: `/media-folders/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Media'],
    }),
    
    // Media Tags
    getTags: builder.query<MediaTag[], void>({
      query: () => '/media-tags/',
      transformResponse: (response: PaginatedResponse<MediaTag> | MediaTag[]): MediaTag[] => {
        if (Array.isArray(response)) return response
        if (response && 'results' in response) return response.results
        return []
      },
      providesTags: ['MediaTag'],
    }),
    
    createTag: builder.mutation<MediaTag, Partial<MediaTag>>({
      query: (data) => ({
        url: '/media-tags/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['MediaTag'],
    }),
    
    updateTag: builder.mutation<MediaTag, { id: number; data: Partial<MediaTag> }>({
      query: ({ id, data }) => ({
        url: `/media-tags/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'MediaTag', id }, 'MediaTag'],
    }),
    
    deleteTag: builder.mutation<void, number>({
      query: (id) => ({
        url: `/media-tags/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MediaTag'],
    }),
    
    // Favicon Generation
    generateFavicons: builder.mutation<FaviconGenerationResult, { media_id: number; site_domain: string }>({
      query: ({ media_id, site_domain }) => ({
        url: `/media/${media_id}/generate_favicons/`,
        method: 'POST',
        body: { site_domain },
      }),
      invalidatesTags: ['Media'],
    }),
  }),
})

export const {
  useGetMediaQuery,
  useGetMediaItemQuery,
  useUploadMediaMutation,
  useBulkUploadMediaMutation,
  useImportFromUrlMutation,
  useUpdateMediaMutation,
  useDeleteMediaMutation,
  useBulkDeleteMediaMutation,
  useBulkMoveMediaMutation,
  useGetMediaUsageQuery,
  useGetMediaAnalyticsQuery,
  useGetFoldersQuery,
  useGetFolderContentsQuery,
  useCreateFolderMutation,
  useUpdateFolderMutation,
  useDeleteFolderMutation,
  useGetTagsQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
  useGenerateFaviconsMutation,
} = mediaApi
