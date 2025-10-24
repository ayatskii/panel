import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../index'

// Use absolute URL in test environment for MSW to intercept
const getBaseUrl = () => {
  if (import.meta.env.MODE === 'test') {
    return 'http://localhost:3000/api'
  }
  return '/api'
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: getBaseUrl(),
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['User', 'Site', 'Page', 'Template', 'Deployment', 'Media', 'Prompt', 'ApiToken', 'CloudflareToken', 'Analytics', 'AffiliateLink'],
  endpoints: () => ({}),
})
