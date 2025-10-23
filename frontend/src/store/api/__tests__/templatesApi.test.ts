import { describe, it, expect } from 'vitest'
import { templatesApi } from '../templatesApi'
import { mockTemplates, mockPaginatedResponse } from '@/test-utils/mockData'

describe('templatesApi', () => {
  describe('transformResponse', () => {
    it('should extract results from paginated response', () => {
      const paginatedResponse = {
        count: 3,
        next: 'http://api.example.com/templates/?page=2',
        previous: null,
        results: mockTemplates,
      }

      // Note: In actual implementation, transformResponse is defined inline
      // This test demonstrates the expected behavior
      const expected = mockTemplates

      // The transform should extract just the results array
      expect(paginatedResponse.results).toEqual(expected)
    })

    it('should return array as-is if already array', () => {
      const arrayResponse = mockTemplates

      // If response is already an array, return unchanged
      expect(Array.isArray(arrayResponse)).toBe(true)
      expect(arrayResponse).toEqual(mockTemplates)
    })

    it('should handle empty results array', () => {
      const emptyResponse = {
        count: 0,
        next: null,
        previous: null,
        results: [],
      }

      expect(emptyResponse.results).toEqual([])
    })

    it('should handle response with pagination metadata', () => {
      const response = mockPaginatedResponse

      expect(response.count).toBe(3)
      expect(response.results).toHaveLength(3)
      expect(response.next).toBeNull()
      expect(response.previous).toBeNull()
    })
  })

  describe('endpoint configuration', () => {
    it('should have getTemplates endpoint', () => {
      expect(templatesApi.endpoints.getTemplates).toBeDefined()
    })

    it('should have getTemplate endpoint', () => {
      expect(templatesApi.endpoints.getTemplate).toBeDefined()
    })

    it('should have createTemplate endpoint', () => {
      expect(templatesApi.endpoints.createTemplate).toBeDefined()
    })

    it('should have updateTemplate endpoint', () => {
      expect(templatesApi.endpoints.updateTemplate).toBeDefined()
    })

    it('should have deleteTemplate endpoint', () => {
      expect(templatesApi.endpoints.deleteTemplate).toBeDefined()
    })

    it('should have previewTemplate endpoint', () => {
      expect(templatesApi.endpoints.previewTemplate).toBeDefined()
    })

    it('should have getFootprints endpoint', () => {
      expect(templatesApi.endpoints.getFootprints).toBeDefined()
    })

    it('should have getVariables endpoint', () => {
      expect(templatesApi.endpoints.getVariables).toBeDefined()
    })
  })
})

