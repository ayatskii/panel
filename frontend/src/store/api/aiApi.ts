import { apiSlice } from './apiSlice'
import type { AIPrompt, AIGenerationResult } from '@/types'


interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const aiApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPrompts: builder.query<AIPrompt[], { type?: string; block_type?: string; ai_model?: string; is_active?: boolean }>({
      query: (params) => ({
        url: '/prompts/',
        params,
      }),
      transformResponse: (response: PaginatedResponse<AIPrompt> | AIPrompt[]): AIPrompt[] => {
        if (Array.isArray(response)) return response
        if (response && 'results' in response) return response.results
        return []
      },
      providesTags: ['Prompt'],
    }),
    getPrompt: builder.query<AIPrompt, number>({
      query: (id) => `/prompts/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Prompt', id }],
    }),
    createPrompt: builder.mutation<AIPrompt, Partial<AIPrompt>>({
      query: (data) => ({
        url: '/prompts/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Prompt'],
    }),
    updatePrompt: builder.mutation<AIPrompt, { id: number; data: Partial<AIPrompt> }>({
      query: ({ id, data }) => ({
        url: `/prompts/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Prompt', id }, 'Prompt'],
    }),
    deletePrompt: builder.mutation<void, number>({
      query: (id) => ({
        url: `/prompts/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Prompt'],
    }),
    testPrompt: builder.mutation<AIGenerationResult, { id: number; input?: string }>({
      query: ({ id, input }) => ({
        url: `/prompts/${id}/test/`,
        method: 'POST',
        body: { input },
      }),
    }),
    generateContent: builder.mutation<AIGenerationResult, { prompt_id: number; input?: string }>({
      query: (data) => ({
        url: '/prompts/generate/',
        method: 'POST',
        body: data,
      }),
    }),
  }),
})

export const {
  useGetPromptsQuery,
  useGetPromptQuery,
  useCreatePromptMutation,
  useUpdatePromptMutation,
  useDeletePromptMutation,
  useTestPromptMutation,
  useGenerateContentMutation,
} = aiApi
