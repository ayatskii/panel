import { apiSlice } from './apiSlice'
import type { Template, TemplateFootprint, TemplateVariable } from '@/types'

export const templatesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Templates
    getTemplates: builder.query<Template[], void>({
      query: () => '/templates/',
      providesTags: ['Template'],
    }),
    getTemplate: builder.query<Template, number>({
      query: (id) => `/templates/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Template', id }],
    }),
    createTemplate: builder.mutation<Template, Partial<Template>>({
      query: (data) => ({
        url: '/templates/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Template'],
    }),
    updateTemplate: builder.mutation<Template, { id: number; data: Partial<Template> }>({
      query: ({ id, data }) => ({
        url: `/templates/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Template', id }, 'Template'],
    }),
    deleteTemplate: builder.mutation<void, number>({
      query: (id) => ({
        url: `/templates/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Template'],
    }),
    previewTemplate: builder.query<{ html: string; name: string }, number>({
      query: (id) => `/templates/${id}/preview/`,
    }),
    
    // Template Footprints
    getFootprints: builder.query<TemplateFootprint[], { template?: number } | void>({
      query: (params) => ({
        url: '/template-footprints/',
        params: params || {},
      }),
    }),
    createFootprint: builder.mutation<TemplateFootprint, Partial<TemplateFootprint>>({
      query: (data) => ({
        url: '/template-footprints/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Template'],
    }),
    
    // Template Variables
    getVariables: builder.query<TemplateVariable[], { template?: number } | void>({
      query: (params) => ({
        url: '/template-variables/',
        params: params || {},
      }),
    }),
  }),
})

export const {
  useGetTemplatesQuery,
  useGetTemplateQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
  usePreviewTemplateQuery,
  useLazyPreviewTemplateQuery,
  useGetFootprintsQuery,
  useCreateFootprintMutation,
  useGetVariablesQuery,
} = templatesApi
