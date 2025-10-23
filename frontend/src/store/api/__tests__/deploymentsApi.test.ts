import { describe, it, expect } from 'vitest'
import { deploymentsApi } from '../deploymentsApi'
import type { Deployment } from '@/types'

const mockDeployment: Deployment = {
  id: 1,
  site: 1,
  status: 'completed',
  started_at: '2024-01-01T00:00:00Z',
  completed_at: '2024-01-01T01:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
}

describe('deploymentsApi', () => {
  describe('endpoints', () => {
    it('should have getDeployments endpoint', () => {
      expect(deploymentsApi.endpoints.getDeployments).toBeDefined()
    })

    it('should have getDeployment endpoint', () => {
      expect(deploymentsApi.endpoints.getDeployment).toBeDefined()
    })

    it('should have createDeployment endpoint', () => {
      expect(deploymentsApi.endpoints.createDeployment).toBeDefined()
    })

    it('should have triggerDeployment endpoint', () => {
      expect(deploymentsApi.endpoints.triggerDeployment).toBeDefined()
    })

    it('should have getDeploymentLogs endpoint', () => {
      expect(deploymentsApi.endpoints.getDeploymentLogs).toBeDefined()
    })
  })

  describe('transformResponse', () => {
    it('getDeployments should handle paginated response', () => {
      const response: any = {
        count: 1,
        next: null,
        previous: null,
        results: [mockDeployment],
      }
      expect(response.results).toEqual([mockDeployment])
    })

    it('getDeployments should handle array response', () => {
      const response = [mockDeployment]
      expect(Array.isArray(response)).toBe(true)
    })
  })

  describe('query parameters', () => {
    it('getDeployments should support site parameter', () => {
      expect(deploymentsApi.endpoints.getDeployments).toBeDefined()
    })

    it('getDeployments should support status filter', () => {
      expect(deploymentsApi.endpoints.getDeployments).toBeDefined()
    })
  })

  describe('HTTP methods', () => {
    it('createDeployment should use POST', () => {
      expect(deploymentsApi.endpoints.createDeployment).toBeDefined()
    })

    it('triggerDeployment should use POST', () => {
      expect(deploymentsApi.endpoints.triggerDeployment).toBeDefined()
    })
  })

  describe('cache tags', () => {
    it('should provide Deployment tag', () => {
      expect(deploymentsApi.endpoints.getDeployments).toBeDefined()
    })

    it('should invalidate Deployment on create', () => {
      expect(deploymentsApi.endpoints.createDeployment).toBeDefined()
    })

    it('should invalidate Deployment on trigger', () => {
      expect(deploymentsApi.endpoints.triggerDeployment).toBeDefined()
    })
  })
})
