import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Setup MSW server
export const server = setupServer(...handlers)

// Start server before all tests
beforeAll(() => {
  server.listen({ 
    onUnhandledRequest: 'warn'  // Changed from 'error' to 'warn' for better debugging
  })
})

// Reset handlers after each test
afterEach(() => {
  cleanup()
  server.resetHandlers()
})

// Clean up after all tests
afterAll(() => server.close())

