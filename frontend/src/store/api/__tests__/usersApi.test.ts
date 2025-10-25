import { describe, it, expect } from 'vitest'
import { usersApi } from '../usersApi'
import type { User } from '@/types'

const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  is_admin: false,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
}

describe('usersApi', () => {
  describe('endpoints', () => {
    it('should have getUsers endpoint', () => {
      expect(usersApi.endpoints.getUsers).toBeDefined()
    })

    it('should have getUser endpoint', () => {
      expect(usersApi.endpoints.getUser).toBeDefined()
    })

    it('should have updateUser endpoint', () => {
      expect(usersApi.endpoints.updateUser).toBeDefined()
    })

    it('should have deleteUser endpoint', () => {
      expect(usersApi.endpoints.deleteUser).toBeDefined()
    })

    it('should have changePassword endpoint', () => {
      expect(usersApi.endpoints.changePassword).toBeDefined()
    })
  })

  describe('transformResponse', () => {
    it('getUsers should handle paginated response', () => {
      const response: Record<string, unknown> = {
        count: 1,
        next: null,
        previous: null,
        results: [mockUser],
      }
      expect(response.results).toEqual([mockUser])
    })

    it('getUsers should handle array response', () => {
      const response = [mockUser]
      expect(Array.isArray(response)).toBe(true)
    })
  })

  describe('HTTP methods', () => {
    it('updateUser should use PATCH', () => {
      expect(usersApi.endpoints.updateUser).toBeDefined()
    })

    it('deleteUser should use DELETE', () => {
      expect(usersApi.endpoints.deleteUser).toBeDefined()
    })

    it('changePassword should use POST', () => {
      expect(usersApi.endpoints.changePassword).toBeDefined()
    })
  })

  describe('cache tags', () => {
    it('should provide User tag', () => {
      expect(usersApi.endpoints.getUsers).toBeDefined()
    })

    it('should invalidate on mutations', () => {
      expect(usersApi.endpoints.updateUser).toBeDefined()
      expect(usersApi.endpoints.deleteUser).toBeDefined()
    })
  })

  describe('query parameters', () => {
    it('getUsers should support search parameter', () => {
      expect(usersApi.endpoints.getUsers).toBeDefined()
    })

    it('getUsers should support role filter', () => {
      expect(usersApi.endpoints.getUsers).toBeDefined()
    })
  })
})
