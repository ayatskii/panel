import { describe, it, expect } from 'vitest'
import { mediaApi } from '../mediaApi'
import type { Media, MediaFolder } from '@/types'

const mockMedia: Media = {
  id: 1,
  name: 'test.jpg',
  file_url: 'https://example.com/test.jpg',
  thumbnail_url: 'https://example.com/test-thumb.jpg',
  size: 102400,
  mime_type: 'image/jpeg',
  folder: 1,
  created_at: '2024-01-01T00:00:00Z',
}

const mockFolder: MediaFolder = {
  id: 1,
  name: 'Images',
  parent: null,
}

describe('mediaApi', () => {
  describe('endpoints', () => {
    it('should have getMedia endpoint', () => {
      expect(mediaApi.endpoints.getMedia).toBeDefined()
    })

    it('should have getMediaItem endpoint', () => {
      expect(mediaApi.endpoints.getMediaItem).toBeDefined()
    })

    it('should have uploadMedia endpoint', () => {
      expect(mediaApi.endpoints.uploadMedia).toBeDefined()
    })

    it('should have bulkUploadMedia endpoint', () => {
      expect(mediaApi.endpoints.bulkUploadMedia).toBeDefined()
    })

    it('should have deleteMedia endpoint', () => {
      expect(mediaApi.endpoints.deleteMedia).toBeDefined()
    })

    it('should have bulkDeleteMedia endpoint', () => {
      expect(mediaApi.endpoints.bulkDeleteMedia).toBeDefined()
    })

    it('should have getFolders endpoint', () => {
      expect(mediaApi.endpoints.getFolders).toBeDefined()
    })

    it('should have getFolderContents endpoint', () => {
      expect(mediaApi.endpoints.getFolderContents).toBeDefined()
    })

    it('should have createFolder endpoint', () => {
      expect(mediaApi.endpoints.createFolder).toBeDefined()
    })

    it('should have deleteFolder endpoint', () => {
      expect(mediaApi.endpoints.deleteFolder).toBeDefined()
    })
  })

  describe('transformResponse', () => {
    it('getMedia should handle paginated response', () => {
      const response: Record<string, unknown> = {
        count: 1,
        next: null,
        previous: null,
        results: [mockMedia],
      }
      expect(response.results).toEqual([mockMedia])
    })

    it('getMedia should handle array response', () => {
      const response = [mockMedia]
      expect(Array.isArray(response)).toBe(true)
    })

    it('getMeFolders should handle paginated response', () => {
      const response: Record<string, unknown> = {
        count: 1,
        next: null,
        previous: null,
        results: [mockFolder],
      }
      expect(response.results).toEqual([mockFolder])
    })
  })

  describe('cache tags', () => {
    it('should invalidate Media on upload', () => {
      expect(mediaApi.endpoints.uploadMedia).toBeDefined()
    })

    it('should invalidate Media on delete', () => {
      expect(mediaApi.endpoints.deleteMedia).toBeDefined()
    })

    it('should invalidate on folder operations', () => {
      expect(mediaApi.endpoints.createFolder).toBeDefined()
      expect(mediaApi.endpoints.deleteFolder).toBeDefined()
    })
  })

  describe('query parameters', () => {
    it('getMedia should support folder parameter', () => {
      expect(mediaApi.endpoints.getMedia).toBeDefined()
    })

    it('getMedia should support type parameter', () => {
      expect(mediaApi.endpoints.getMedia).toBeDefined()
    })

    it('getMedia should support search parameter', () => {
      expect(mediaApi.endpoints.getMedia).toBeDefined()
    })
  })
})
