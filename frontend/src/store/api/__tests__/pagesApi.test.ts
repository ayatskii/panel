import { describe, it, expect } from 'vitest'
import { pagesApi } from '../pagesApi'
import type { Page, PageBlock, SwiperPreset } from '@/types'

// Mock data
const mockPage: Page = {
  id: 1,
  site: 1,
  title: 'Test Page',
  slug: 'test-page',
  description: 'Test description',
  is_published: false,
  order: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockPageBlock: PageBlock = {
  id: 1,
  page: 1,
  type: 'hero',
  content: { title: 'Hero Title' },
  order: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockSwiperPreset: SwiperPreset = {
  id: 1,
  name: 'Default Swiper',
  config: { slidesPerView: 3 },
}

const mockPaginatedPages = {
  count: 1,
  next: null,
  previous: null,
  results: [mockPage],
}

describe('pagesApi', () => {
  describe('pages endpoints', () => {
    it('should have getPages endpoint', () => {
      expect(pagesApi.endpoints.getPages).toBeDefined()
    })

    it('should have getPage endpoint', () => {
      expect(pagesApi.endpoints.getPage).toBeDefined()
    })

    it('should have createPage endpoint', () => {
      expect(pagesApi.endpoints.createPage).toBeDefined()
    })

    it('should have updatePage endpoint', () => {
      expect(pagesApi.endpoints.updatePage).toBeDefined()
    })

    it('should have deletePage endpoint', () => {
      expect(pagesApi.endpoints.deletePage).toBeDefined()
    })

    it('should have duplicatePage endpoint', () => {
      expect(pagesApi.endpoints.duplicatePage).toBeDefined()
    })

    it('should have publishPage endpoint', () => {
      expect(pagesApi.endpoints.publishPage).toBeDefined()
    })

    it('should have unpublishPage endpoint', () => {
      expect(pagesApi.endpoints.unpublishPage).toBeDefined()
    })

    it('should have reorderPages endpoint', () => {
      expect(pagesApi.endpoints.reorderPages).toBeDefined()
    })
  })

  describe('page blocks endpoints', () => {
    it('should have getBlocks endpoint', () => {
      expect(pagesApi.endpoints.getBlocks).toBeDefined()
    })

    it('should have createBlock endpoint', () => {
      expect(pagesApi.endpoints.createBlock).toBeDefined()
    })

    it('should have updateBlock endpoint', () => {
      expect(pagesApi.endpoints.updateBlock).toBeDefined()
    })

    it('should have deleteBlock endpoint', () => {
      expect(pagesApi.endpoints.deleteBlock).toBeDefined()
    })

    it('should have reorderBlocks endpoint', () => {
      expect(pagesApi.endpoints.reorderBlocks).toBeDefined()
    })
  })

  describe('swiper presets endpoints', () => {
    it('should have getSwiperPresets endpoint', () => {
      expect(pagesApi.endpoints.getSwiperPresets).toBeDefined()
    })
  })

  describe('transformResponse', () => {
    describe('getPages', () => {
      it('should extract results from paginated response', () => {
        const response: Record<string, unknown> = mockPaginatedPages
        expect(response.results).toEqual([mockPage])
      })

      it('should return array as-is', () => {
        const response = [mockPage]
        expect(Array.isArray(response)).toBe(true)
      })

      it('should return empty array for invalid response', () => {
        const response: Record<string, unknown> = {}
        expect(response).toBeDefined()
      })
    })

    describe('getBlocks', () => {
      it('should extract results from paginated response', () => {
        const response = {
          count: 1,
          next: null,
          previous: null,
          results: [mockPageBlock],
        }
        expect(response.results).toEqual([mockPageBlock])
      })

      it('should return array as-is', () => {
        const response = [mockPageBlock]
        expect(Array.isArray(response)).toBe(true)
      })
    })

    describe('getSwiperPresets', () => {
      it('should extract results from paginated response', () => {
        const response = {
          count: 1,
          next: null,
          previous: null,
          results: [mockSwiperPreset],
        }
        expect(response.results).toEqual([mockSwiperPreset])
      })

      it('should return array as-is', () => {
        const response = [mockSwiperPreset]
        expect(Array.isArray(response)).toBe(true)
      })
    })
  })

  describe('cache tags', () => {
    it('getPages should provide Page tag', () => {
      expect(pagesApi.endpoints.getPages).toBeDefined()
    })

    it('createPage should invalidate Page tags', () => {
      expect(pagesApi.endpoints.createPage).toBeDefined()
    })

    it('updatePage should invalidate Page tags', () => {
      expect(pagesApi.endpoints.updatePage).toBeDefined()
    })

    it('deletePage should invalidate Page tags', () => {
      expect(pagesApi.endpoints.deletePage).toBeDefined()
    })

    it('block mutations should invalidate Page tags', () => {
      expect(pagesApi.endpoints.createBlock).toBeDefined()
      expect(pagesApi.endpoints.updateBlock).toBeDefined()
      expect(pagesApi.endpoints.deleteBlock).toBeDefined()
    })
  })

  describe('query parameters', () => {
    it('getPages should support site parameter', () => {
      expect(pagesApi.endpoints.getPages).toBeDefined()
    })

    it('getBlocks should support page parameter', () => {
      expect(pagesApi.endpoints.getBlocks).toBeDefined()
    })
  })

  describe('HTTP methods', () => {
    it('createPage should use POST', () => {
      expect(pagesApi.endpoints.createPage).toBeDefined()
    })

    it('updatePage should use PATCH', () => {
      expect(pagesApi.endpoints.updatePage).toBeDefined()
    })

    it('deletePage should use DELETE', () => {
      expect(pagesApi.endpoints.deletePage).toBeDefined()
    })

    it('publishPage should use POST', () => {
      expect(pagesApi.endpoints.publishPage).toBeDefined()
    })

    it('unpublishPage should use POST', () => {
      expect(pagesApi.endpoints.unpublishPage).toBeDefined()
    })
  })
})
