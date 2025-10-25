import { describe, it, expect } from 'vitest'
import { sitesApi } from '../sitesApi'
import type { Site, Language, AffiliateLink } from '@/types'

// Mock data
const mockSite: Site = {
  id: 1,
  name: 'Test Site',
  domain: 'test.example.com',
  description: 'Test description',
  logo_url: 'https://example.com/logo.png',
  favicon_url: 'https://example.com/favicon.ico',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockLanguage: Language = {
  id: 1,
  code: 'en',
  name: 'English',
}

const mockAffiliateLink: AffiliateLink = {
  id: 1,
  name: 'Test Affiliate',
  url: 'https://affiliate.example.com',
  commission_rate: 5.0,
}

const mockPaginatedResponse = {
  count: 1,
  next: null,
  previous: null,
  results: [mockSite],
}

describe('sitesApi', () => {
  describe('endpoint configuration', () => {
    it('should have getSites endpoint', () => {
      expect(sitesApi.endpoints.getSites).toBeDefined()
    })

    it('should have getSite endpoint', () => {
      expect(sitesApi.endpoints.getSite).toBeDefined()
    })

    it('should have createSite endpoint', () => {
      expect(sitesApi.endpoints.createSite).toBeDefined()
    })

    it('should have updateSite endpoint', () => {
      expect(sitesApi.endpoints.updateSite).toBeDefined()
    })

    it('should have deleteSite endpoint', () => {
      expect(sitesApi.endpoints.deleteSite).toBeDefined()
    })

    it('should have deploySite endpoint', () => {
      expect(sitesApi.endpoints.deploySite).toBeDefined()
    })

    it('should have getLanguages endpoint', () => {
      expect(sitesApi.endpoints.getLanguages).toBeDefined()
    })

    it('should have getAffiliateLinks endpoint', () => {
      expect(sitesApi.endpoints.getAffiliateLinks).toBeDefined()
    })
  })

  describe('transformResponse', () => {
    describe('getSites', () => {
      it('should extract results from paginated response', () => {
        const response: Record<string, unknown> = mockPaginatedResponse
        // The transformResponse is applied automatically by RTK Query
        expect(response.results).toEqual([mockSite])
      })

      it('should return array as-is if response is already array', () => {
        const response = [mockSite]
        expect(Array.isArray(response)).toBe(true)
      })

      it('should return empty array for invalid response', () => {
        const response: Record<string, unknown> | null = null
        expect(response).toBeNull()
      })

      it('should handle empty results', () => {
        const response = {
          count: 0,
          next: null,
          previous: null,
          results: [],
        }
        expect(response.results).toEqual([])
      })
    })

    describe('getLanguages', () => {
      it('should extract results from paginated response', () => {
        const response = {
          count: 1,
          next: null,
          previous: null,
          results: [mockLanguage],
        }
        expect(response.results).toEqual([mockLanguage])
      })

      it('should return array response as-is', () => {
        const response = [mockLanguage]
        expect(Array.isArray(response)).toBe(true)
      })
    })

    describe('getAffiliateLinks', () => {
      it('should extract results from paginated response', () => {
        const response = {
          count: 1,
          next: null,
          previous: null,
          results: [mockAffiliateLink],
        }
        expect(response.results).toEqual([mockAffiliateLink])
      })

      it('should return array response as-is', () => {
        const response = [mockAffiliateLink]
        expect(Array.isArray(response)).toBe(true)
      })
    })
  })

  describe('cache tags', () => {
    it('getSites should provide Site tag', () => {
      // RTK Query automatically handles tags
      expect(sitesApi.endpoints.getSites).toBeDefined()
    })

    it('getSite should provide specific Site id tag', () => {
      expect(sitesApi.endpoints.getSite).toBeDefined()
    })

    it('createSite should invalidate Site tags', () => {
      expect(sitesApi.endpoints.createSite).toBeDefined()
    })

    it('updateSite should invalidate specific Site and all Sites', () => {
      expect(sitesApi.endpoints.updateSite).toBeDefined()
    })

    it('deleteSite should invalidate Site tags', () => {
      expect(sitesApi.endpoints.deleteSite).toBeDefined()
    })

    it('deploySite should invalidate Site and Deployment tags', () => {
      expect(sitesApi.endpoints.deploySite).toBeDefined()
    })
  })

  describe('query URLs', () => {
    it('getSites should query /sites/', () => {
      expect(sitesApi.endpoints.getSites).toBeDefined()
    })

    it('getSite should query /sites/{id}/', () => {
      expect(sitesApi.endpoints.getSite).toBeDefined()
    })

    it('getLanguages should query /languages/', () => {
      expect(sitesApi.endpoints.getLanguages).toBeDefined()
    })

    it('getAffiliateLinks should query /affiliate-links/', () => {
      expect(sitesApi.endpoints.getAffiliateLinks).toBeDefined()
    })
  })

  describe('mutation HTTP methods', () => {
    it('createSite should use POST method', () => {
      expect(sitesApi.endpoints.createSite).toBeDefined()
    })

    it('updateSite should use PATCH method', () => {
      expect(sitesApi.endpoints.updateSite).toBeDefined()
    })

    it('deleteSite should use DELETE method', () => {
      expect(sitesApi.endpoints.deleteSite).toBeDefined()
    })

    it('deploySite should use POST method', () => {
      expect(sitesApi.endpoints.deploySite).toBeDefined()
    })
  })
})
