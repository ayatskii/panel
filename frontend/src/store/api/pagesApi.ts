import { apiSlice } from './apiSlice'
import type { Page, PageBlock, SwiperPreset, PageFormData } from '@/types'

export const pagesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Pages
    getPages: builder.query<Page[], { site?: number }>({
      query: (params) => ({
        url: '/pages/',
        params,
      }),
      providesTags: ['Page'],
    }),
    getPage: builder.query<Page, number>({
      query: (id) => `/pages/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Page', id }],
    }),
    createPage: builder.mutation<Page, PageFormData>({
      query: (data) => ({
        url: '/pages/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Page'],
    }),
    updatePage: builder.mutation<Page, { id: number; data: Partial<PageFormData> }>({
      query: ({ id, data }) => ({
        url: `/pages/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Page', id }, 'Page'],
    }),
    deletePage: builder.mutation<void, number>({
      query: (id) => ({
        url: `/pages/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Page'],
    }),
    duplicatePage: builder.mutation<Page, number>({
      query: (id) => ({
        url: `/pages/${id}/duplicate/`,
        method: 'POST',
      }),
      invalidatesTags: ['Page'],
    }),
    publishPage: builder.mutation<{ message: string; is_published: boolean }, number>({
      query: (id) => ({
        url: `/pages/${id}/publish/`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Page', id }, 'Page'],
    }),
    unpublishPage: builder.mutation<{ message: string; is_published: boolean }, number>({
      query: (id) => ({
        url: `/pages/${id}/unpublish/`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Page', id }, 'Page'],
    }),
    reorderPages: builder.mutation<{ message: string }, Array<{ id: number; order: number }>>({
      query: (pages) => ({
        url: '/pages/reorder/',
        method: 'POST',
        body: { pages },
      }),
      invalidatesTags: ['Page'],
    }),
    
    // Page Blocks
    getBlocks: builder.query<PageBlock[], { page?: number }>({
      query: (params) => ({
        url: '/page-blocks/',
        params,
      }),
    }),
    createBlock: builder.mutation<PageBlock, Partial<PageBlock>>({
      query: (data) => ({
        url: '/page-blocks/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Page'],
    }),
    updateBlock: builder.mutation<PageBlock, { id: number; data: Partial<PageBlock> }>({
      query: ({ id, data }) => ({
        url: `/page-blocks/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Page'],
    }),
    deleteBlock: builder.mutation<void, number>({
      query: (id) => ({
        url: `/page-blocks/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Page'],
    }),
    reorderBlocks: builder.mutation<{ message: string }, Array<{ id: number; order: number }>>({
      query: (blocks) => ({
        url: '/page-blocks/reorder/',
        method: 'POST',
        body: { blocks },
      }),
      invalidatesTags: ['Page'],
    }),
    
    // Swiper Presets
    getSwiperPresets: builder.query<SwiperPreset[], void>({
      query: () => '/swiper-presets/',
    }),
  }),
})

export const {
  useGetPagesQuery,
  useGetPageQuery,
  useCreatePageMutation,
  useUpdatePageMutation,
  useDeletePageMutation,
  useDuplicatePageMutation,
  usePublishPageMutation,
  useUnpublishPageMutation,
  useReorderPagesMutation,
  useGetBlocksQuery,
  useCreateBlockMutation,
  useUpdateBlockMutation,
  useDeleteBlockMutation,
  useReorderBlocksMutation,
  useGetSwiperPresetsQuery,
} = pagesApi
