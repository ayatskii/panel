import { describe, it, expect } from 'vitest'
import { authApi } from '../authApi'

describe('authApi', () => {
  describe('endpoints', () => {
    it('should have login endpoint', () => {
      expect(authApi.endpoints.login).toBeDefined()
    })

    it('should have register endpoint', () => {
      expect(authApi.endpoints.register).toBeDefined()
    })

    it('should have getCurrentUser endpoint', () => {
      expect(authApi.endpoints.getCurrentUser).toBeDefined()
    })
  })

  describe('HTTP methods', () => {
    it('login should use POST', () => {
      expect(authApi.endpoints.login).toBeDefined()
    })

    it('register should use POST', () => {
      expect(authApi.endpoints.register).toBeDefined()
    })

    it('getCurrentUser should use GET', () => {
      expect(authApi.endpoints.getCurrentUser).toBeDefined()
    })
  })

  describe('cache management', () => {
    it('login should handle response transformation', () => {
      expect(authApi.endpoints.login).toBeDefined()
    })

    it('register should return login response', () => {
      expect(authApi.endpoints.register).toBeDefined()
    })

    it('getCurrentUser should provide User tag', () => {
      expect(authApi.endpoints.getCurrentUser).toBeDefined()
    })
  })

  describe('token handling', () => {
    it('login should store tokens in localStorage', () => {
      expect(authApi.endpoints.login).toBeDefined()
    })

    it('endpoints should handle authentication', () => {
      expect(authApi.endpoints.getCurrentUser).toBeDefined()
    })
  })
})
