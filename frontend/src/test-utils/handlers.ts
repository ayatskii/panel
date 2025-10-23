import { http, HttpResponse } from 'msw'
import {
  mockTemplates,
  mockPaginatedResponse,
  mockPreviewData,
  mockFootprints,
  mockVariables,
  mockMinimalTemplate,
} from './mockData'

/**
 * MSW handlers for mocking API requests in tests
 * 
 * Usage in tests:
 * ```typescript
 * import { server } from '@/test-utils/setup'
 * import { http, HttpResponse } from 'msw'
 * 
 * // Override handler for specific test
 * server.use(
 *   http.get('/api/templates/', () => {
 *     return HttpResponse.json({ results: [] })
 *   })
 * )
 * ```
 */
const BASE_URL = 'http://localhost:3000'

export const handlers = [
  // Templates - List all
  http.get(`${BASE_URL}/api/templates/`, () => {
    return HttpResponse.json(mockPaginatedResponse)
  }),

  // Templates - Get single
  http.get(`${BASE_URL}/api/templates/:id/`, ({ params }) => {
    const id = Number(params.id)
    const template = [...mockTemplates, mockMinimalTemplate].find(t => t.id === id)
    
    if (!template) {
      return HttpResponse.json(
        { detail: 'Template not found' },
        { status: 404 }
      )
    }
    
    return HttpResponse.json(template)
  }),

  // Templates - Create
  http.post(`${BASE_URL}/api/templates/`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    
    // Simulate validation error
    if (!body.name || typeof body.name !== 'string') {
      return HttpResponse.json(
        { name: ['This field is required.'] },
        { status: 400 }
      )
    }

    // Simulate duplicate name error
    if (body.name === 'Duplicate Template') {
      return HttpResponse.json(
        { name: ['Template with this name already exists.'] },
        { status: 400 }
      )
    }
    
    const newTemplate = {
      id: 999,
      ...body,
      footprints_count: 0,
      variables_count: 0,
      sites_count: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    return HttpResponse.json(newTemplate, { status: 201 })
  }),

  // Templates - Update
  http.patch(`${BASE_URL}/api/templates/:id/`, async ({ params, request }) => {
    const id = Number(params.id)
    const body = await request.json() as Record<string, unknown>
    
    const template = mockTemplates.find(t => t.id === id)
    
    if (!template) {
      return HttpResponse.json(
        { detail: 'Template not found' },
        { status: 404 }
      )
    }
    
    const updatedTemplate = {
      ...template,
      ...body,
      updated_at: new Date().toISOString(),
    }
    
    return HttpResponse.json(updatedTemplate)
  }),

  // Templates - Delete
  http.delete(`${BASE_URL}/api/templates/:id/`, ({ params }) => {
    const id = Number(params.id)
    const template = mockTemplates.find(t => t.id === id)
    
    if (!template) {
      return HttpResponse.json(
        { detail: 'Template not found' },
        { status: 404 }
      )
    }
    
    return new HttpResponse(null, { status: 204 })
  }),

  // Templates - Preview
  http.get(`${BASE_URL}/api/templates/:id/preview/`, ({ params }) => {
    const id = Number(params.id)
    const template = mockTemplates.find(t => t.id === id)
    
    if (!template) {
      return HttpResponse.json(
        { detail: 'Template not found' },
        { status: 404 }
      )
    }
    
    return HttpResponse.json({
      ...mockPreviewData,
      name: template.name,
    })
  }),

  // Template Footprints - List
  http.get(`${BASE_URL}/api/template-footprints/`, ({ request }) => {
    const url = new URL(request.url)
    const templateId = url.searchParams.get('template')
    
    const filteredFootprints = templateId
      ? mockFootprints.filter(f => f.template === Number(templateId))
      : mockFootprints
    
    return HttpResponse.json({
      count: filteredFootprints.length,
      next: null,
      previous: null,
      results: filteredFootprints,
    })
  }),

  // Template Footprints - Create
  http.post(`${BASE_URL}/api/template-footprints/`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    
    const newFootprint = {
      id: 999,
      ...body,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    return HttpResponse.json(newFootprint, { status: 201 })
  }),

  // Template Variables - List
  http.get(`${BASE_URL}/api/template-variables/`, () => {
    // For simplicity, return all variables
    // In real API, would filter by template
    const filteredVariables = mockVariables
    
    return HttpResponse.json({
      count: filteredVariables.length,
      next: null,
      previous: null,
      results: filteredVariables,
    })
  }),
]

/**
 * Handler for simulating network errors
 */
export const errorHandlers = [
  http.get(`${BASE_URL}/api/templates/`, () => {
    return HttpResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    )
  }),
  
  http.post(`${BASE_URL}/api/templates/`, () => {
    return HttpResponse.json(
      { detail: 'Service unavailable' },
      { status: 503 }
    )
  }),
]

/**
 * Handler for simulating loading delays
 */
export const delayedHandlers = [
  http.get(`${BASE_URL}/api/templates/`, async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return HttpResponse.json(mockPaginatedResponse)
  }),
]

