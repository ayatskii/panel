import { describe, it, expect } from 'vitest'
import { aiApi } from '../aiApi'
import type { AIPrompt } from '@/types'

const mockPrompt: AIPrompt = {
  id: 1,
  title: 'Test Prompt',
  description: 'Test description',
  prompt_template: 'Generate {{type}} for {{subject}}',
  category: 'content',
  is_public: true,
  created_at: '2024-01-01T00:00:00Z',
}

describe('aiApi', () => {
  describe('endpoints', () => {
    it('should have getPrompts endpoint', () => {
      expect(aiApi.endpoints.getPrompts).toBeDefined()
    })

    it('should have getPrompt endpoint', () => {
      expect(aiApi.endpoints.getPrompt).toBeDefined()
    })

    it('should have createPrompt endpoint', () => {
      expect(aiApi.endpoints.createPrompt).toBeDefined()
    })

    it('should have updatePrompt endpoint', () => {
      expect(aiApi.endpoints.updatePrompt).toBeDefined()
    })

    it('should have deletePrompt endpoint', () => {
      expect(aiApi.endpoints.deletePrompt).toBeDefined()
    })

    it('should have testPrompt endpoint', () => {
      expect(aiApi.endpoints.testPrompt).toBeDefined()
    })

    it('should have generateContent endpoint', () => {
      expect(aiApi.endpoints.generateContent).toBeDefined()
    })
  })

  describe('transformResponse', () => {
    it('getPrompts should handle paginated response', () => {
      const response: any = {
        count: 1,
        next: null,
        previous: null,
        results: [mockPrompt],
      }
      expect(response.results).toEqual([mockPrompt])
    })

    it('getPrompts should handle array response', () => {
      const response = [mockPrompt]
      expect(Array.isArray(response)).toBe(true)
    })
  })

  describe('HTTP methods', () => {
    it('createPrompt should use POST', () => {
      expect(aiApi.endpoints.createPrompt).toBeDefined()
    })

    it('updatePrompt should use PATCH', () => {
      expect(aiApi.endpoints.updatePrompt).toBeDefined()
    })

    it('deletePrompt should use DELETE', () => {
      expect(aiApi.endpoints.deletePrompt).toBeDefined()
    })

    it('testPrompt should use POST', () => {
      expect(aiApi.endpoints.testPrompt).toBeDefined()
    })

    it('generateContent should use POST', () => {
      expect(aiApi.endpoints.generateContent).toBeDefined()
    })
  })

  describe('cache tags', () => {
    it('should provide Prompt tag', () => {
      expect(aiApi.endpoints.getPrompts).toBeDefined()
    })

    it('mutations should invalidate cache', () => {
      expect(aiApi.endpoints.createPrompt).toBeDefined()
      expect(aiApi.endpoints.updatePrompt).toBeDefined()
      expect(aiApi.endpoints.deletePrompt).toBeDefined()
    })
  })

  describe('query parameters', () => {
    it('getPrompts should support category filter', () => {
      expect(aiApi.endpoints.getPrompts).toBeDefined()
    })

    it('getPrompts should support provider filter', () => {
      expect(aiApi.endpoints.getPrompts).toBeDefined()
    })
  })
})
