import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import userEvent from '@testing-library/user-event'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import SitesListPage from '@/pages/sites/SitesListPage'
import SiteFormPage from '@/pages/sites/SiteFormPage'
import PagesListPage from '@/pages/pages/PagesListPage'
import PageBuilderPage from '@/pages/pages/PageBuilderPage'
import AnalyticsDashboardPage from '@/pages/analytics/AnalyticsDashboardPage'
import { apiSlice } from '@/store/api/apiSlice'
import { authSlice } from '@/store/slices/authSlice'

// Mock data
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'user'
}

const mockSite = {
  id: 1,
  domain: 'test.com',
  brand_name: 'Test Brand',
  status: 'active',
  template: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockPage = {
  id: 1,
  site: 1,
  title: 'Test Page',
  slug: 'test-page',
  status: 'published',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockTemplate = {
  id: 1,
  name: 'Gaming Template',
  description: 'Template for gaming websites',
  type: 'gaming',
  css_framework: 'bootstrap'
}

const mockCloudflareToken = {
  id: 1,
  name: 'Production Token',
  api_token: 'test_token_123',
  account_id: 'test_account_123'
}

// MSW server setup
const server = setupServer(
  // Auth endpoints
  rest.post('/api/auth/login/', (req, res, ctx) => {
    return res(
      ctx.json({
        access: 'mock_access_token',
        refresh: 'mock_refresh_token'
      })
    )
  }),

  // Sites endpoints
  rest.get('/api/sites/', (req, res, ctx) => {
    return res(
      ctx.json({
        count: 1,
        results: [mockSite]
      })
    )
  }),

  rest.post('/api/sites/', (req, res, ctx) => {
    return res(
      ctx.json({
        ...mockSite,
        id: 2,
        domain: 'newsite.com'
      }),
      ctx.status(201)
    )
  }),

  rest.get('/api/sites/1/', (req, res, ctx) => {
    return res(ctx.json(mockSite))
  }),

  // Templates endpoints
  rest.get('/api/templates/', (req, res, ctx) => {
    return res(
      ctx.json({
        count: 1,
        results: [mockTemplate]
      })
    )
  }),

  // Pages endpoints
  rest.get('/api/pages/', (req, res, ctx) => {
    return res(
      ctx.json({
        count: 1,
        results: [mockPage]
      })
    )
  }),

  rest.post('/api/pages/', (req, res, ctx) => {
    return res(
      ctx.json({
        ...mockPage,
        id: 2,
        title: 'New Page'
      }),
      ctx.status(201)
    )
  }),

  // Cloudflare endpoints
  rest.get('/api/integrations/cloudflare-tokens/', (req, res, ctx) => {
    return res(
      ctx.json({
        count: 1,
        results: [mockCloudflareToken]
      })
    )
  }),

  rest.post('/api/integrations/cloudflare-tokens/1/verify_domain/', (req, res, ctx) => {
    return res(
      ctx.json({
        verified: true,
        zone_id: 'zone_123',
        nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com']
      })
    )
  }),

  // Deployment endpoints
  rest.post('/api/sites/1/deploy/', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        deployment_id: 'deployment_123',
        message: 'Deployment started'
      })
    )
  }),

  // AI Content Generation endpoints
  rest.post('/api/pages/1/generate_content/', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        generated_content: {
          hero: {
            title: 'Generated Hero Title',
            subtitle: 'Generated Hero Subtitle'
          }
        }
      })
    )
  }),

  // Analytics endpoints
  rest.get('/api/page-views/analytics_overview/', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        site_id: 1,
        basic_metrics: {
          total_views: 1000,
          unique_visitors: 500,
          total_pages: 10
        }
      })
    )
  }),

  // Template uniqueness endpoints
  rest.post('/api/templates/1/generate_unique_css/', (req, res, ctx) => {
    return res(
      ctx.json({
        modified_css: '.unique-container { width: 100%; }',
        class_mappings: {
          'container': 'unique-container'
        },
        total_classes: 1
      })
    )
  })
)

// Test store setup
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
      [apiSlice.reducerPath]: apiSlice.reducer
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
    preloadedState: {
      auth: {
        user: mockUser,
        token: 'mock_token',
        isAuthenticated: true
      },
      ...initialState
    }
  })
}

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode; store?: ReturnType<typeof createTestStore> }> = ({ 
  children, 
  store = createTestStore() 
}) => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  )
}

describe('Full Workflow Integration Tests', () => {
  beforeAll(() => {
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  describe('Site Creation Workflow', () => {
    test('should create a new site with domain setup', async () => {
      const user = userEvent.setup()
      const store = createTestStore()

      render(
        <TestWrapper store={store}>
          <SiteFormPage />
        </TestWrapper>
      )

      // Fill in site form
      await user.type(screen.getByLabelText(/domain/i), 'newsite.com')
      await user.type(screen.getByLabelText(/brand name/i), 'New Site Brand')
      
      // Select template
      const templateSelect = screen.getByLabelText(/template/i)
      await user.click(templateSelect)
      await user.click(screen.getByText('Gaming Template'))

      // Setup domain
      const setupDomainButton = screen.getByText(/setup domain/i)
      await user.click(setupDomainButton)

      // Verify domain setup modal appears
      expect(screen.getByText(/setup domain: newsite.com/i)).toBeInTheDocument()

      // Select Cloudflare token
      const tokenSelect = screen.getByLabelText(/cloudflare api token/i)
      await user.click(tokenSelect)
      await user.click(screen.getByText('Production Token (Account: test_account_123)'))

      // Verify domain
      const verifyButton = screen.getByText(/verify domain with cloudflare/i)
      await user.click(verifyButton)

      // Wait for verification success
      await waitFor(() => {
        expect(screen.getByText(/domain verified!/i)).toBeInTheDocument()
      })

      // Continue with site creation
      const continueButton = screen.getByText(/continue creation/i)
      await user.click(continueButton)

      // Submit form
      const submitButton = screen.getByText(/create site/i)
      await user.click(submitButton)

      // Verify site creation
      await waitFor(() => {
        expect(screen.getByText(/site created successfully/i)).toBeInTheDocument()
      })
    })

    test('should deploy site to Cloudflare Pages', async () => {
      const user = userEvent.setup()
      const store = createTestStore()

      render(
        <TestWrapper store={store}>
          <SitesListPage />
        </TestWrapper>
      )

      // Wait for sites to load
      await waitFor(() => {
        expect(screen.getByText('test.com')).toBeInTheDocument()
      })

      // Click deploy button
      const deployButton = screen.getByText(/deploy/i)
      await user.click(deployButton)

      // Verify deployment started
      await waitFor(() => {
        expect(screen.getByText(/deployment started/i)).toBeInTheDocument()
      })
    })
  })

  describe('Page Creation and Content Generation Workflow', () => {
    test('should create page and generate AI content', async () => {
      const user = userEvent.setup()
      const store = createTestStore()

      render(
        <TestWrapper store={store}>
          <PagesListPage />
        </TestWrapper>
      )

      // Wait for pages to load
      await waitFor(() => {
        expect(screen.getByText('Test Page')).toBeInTheDocument()
      })

      // Click create new page
      const createButton = screen.getByText(/create new page/i)
      await user.click(createButton)

      // Fill in page form
      await user.type(screen.getByLabelText(/title/i), 'New Page')
      await user.type(screen.getByLabelText(/slug/i), 'new-page')

      // Submit form
      const submitButton = screen.getByText(/create page/i)
      await user.click(submitButton)

      // Wait for page creation
      await waitFor(() => {
        expect(screen.getByText(/page created successfully/i)).toBeInTheDocument()
      })

      // Navigate to page builder
      const editButton = screen.getByText(/edit/i)
      await user.click(editButton)

      // Wait for page builder to load
      await waitFor(() => {
        expect(screen.getByText(/page builder/i)).toBeInTheDocument()
      })

      // Generate AI content
      const generateButton = screen.getByText(/quick generate ai content/i)
      await user.click(generateButton)

      // Select content type
      const metaOption = screen.getByText(/meta tags/i)
      await user.click(metaOption)

      // Start generation
      const startButton = screen.getByText(/start generation workflow/i)
      await user.click(startButton)

      // Wait for content generation
      await waitFor(() => {
        expect(screen.getByText(/content generation workflow started/i)).toBeInTheDocument()
      })
    })

    test('should add and configure page blocks', async () => {
      const user = userEvent.setup()
      const store = createTestStore()

      render(
        <TestWrapper store={store}>
          <PageBuilderPage />
        </TestWrapper>
      )

      // Wait for page builder to load
      await waitFor(() => {
        expect(screen.getByText(/page builder/i)).toBeInTheDocument()
      })

      // Add hero block
      const addBlockButton = screen.getByText(/add block/i)
      await user.click(addBlockButton)

      const heroBlockOption = screen.getByText(/hero block/i)
      await user.click(heroBlockOption)

      // Configure hero block
      await waitFor(() => {
        expect(screen.getByText(/hero block configuration/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/title/i), 'Welcome to Our Site')
      await user.type(screen.getByLabelText(/subtitle/i), 'Discover amazing content')

      // Save block
      const saveButton = screen.getByText(/save/i)
      await user.click(saveButton)

      // Verify block was added
      await waitFor(() => {
        expect(screen.getByText('Welcome to Our Site')).toBeInTheDocument()
      })
    })
  })

  describe('Analytics and Monitoring Workflow', () => {
    test('should view analytics dashboard', async () => {
      const store = createTestStore()

      render(
        <TestWrapper store={store}>
          <AnalyticsDashboardPage />
        </TestWrapper>
      )

      // Wait for analytics to load
      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument()
      })

      // Verify metrics are displayed
      expect(screen.getByText('1000')).toBeInTheDocument() // Total views
      expect(screen.getByText('500')).toBeInTheDocument() // Unique visitors
      expect(screen.getByText('10')).toBeInTheDocument() // Total pages
    })

    test('should view real-time analytics', async () => {
      const store = createTestStore()

      render(
        <TestWrapper store={store}>
          <AnalyticsDashboardPage />
        </TestWrapper>
      )

      // Switch to real-time analytics
      const realtimeTab = screen.getByText(/real-time/i)
      fireEvent.click(realtimeTab)

      // Wait for real-time data
      await waitFor(() => {
        expect(screen.getByText(/real-time analytics/i)).toBeInTheDocument()
      })

      // Verify real-time metrics
      expect(screen.getByText(/online users/i)).toBeInTheDocument()
      expect(screen.getByText(/live visitors/i)).toBeInTheDocument()
    })
  })

  describe('Template Uniqueness Workflow', () => {
    test('should generate unique CSS classes for template', async () => {
      const user = userEvent.setup()
      const store = createTestStore()

      render(
        <TestWrapper store={store}>
          <SitesListPage />
        </TestWrapper>
      )

      // Wait for sites to load
      await waitFor(() => {
        expect(screen.getByText('test.com')).toBeInTheDocument()
      })

      // Click on site to view details
      const siteLink = screen.getByText('test.com')
      await user.click(siteLink)

      // Navigate to template settings
      const templateTab = screen.getByText(/template/i)
      await user.click(templateTab)

      // Generate unique CSS
      const generateCSSButton = screen.getByText(/generate unique css/i)
      await user.click(generateCSSButton)

      // Wait for CSS generation
      await waitFor(() => {
        expect(screen.getByText(/unique css generated/i)).toBeInTheDocument()
      })

      // Verify class mappings
      expect(screen.getByText('container')).toBeInTheDocument()
      expect(screen.getByText('unique-container')).toBeInTheDocument()
    })
  })

  describe('Settings Management Workflow', () => {
    test('should manage languages and affiliate links', async () => {
      const user = userEvent.setup()
      const store = createTestStore()

      // Mock settings endpoints
      server.use(
        rest.get('/api/settings/languages/', (req, res, ctx) => {
          return res(
            ctx.json({
              languages: [
                { id: 1, code: 'en-EN', name: 'English' },
                { id: 2, code: 'fr-FR', name: 'French' }
              ]
            })
          )
        }),

        rest.get('/api/settings/affiliate_links/', (req, res, ctx) => {
          return res(
            ctx.json({
              affiliate_links: [
                { id: 1, name: 'Amazon', url: 'https://amazon.com/ref=affiliate' }
              ]
            })
          )
        })
      )

      render(
        <TestWrapper store={store}>
          <div>Settings Page</div>
        </TestWrapper>
      )

      // Navigate to settings
      const settingsLink = screen.getByText(/settings/i)
      await user.click(settingsLink)

      // Wait for settings to load
      await waitFor(() => {
        expect(screen.getByText(/settings/i)).toBeInTheDocument()
      })

      // Add new language
      const addLanguageButton = screen.getByText(/add language/i)
      await user.click(addLanguageButton)

      await user.type(screen.getByLabelText(/code/i), 'de-DE')
      await user.type(screen.getByLabelText(/name/i), 'German')

      const saveLanguageButton = screen.getByText(/save/i)
      await user.click(saveLanguageButton)

      // Add affiliate link
      const addAffiliateButton = screen.getByText(/add affiliate link/i)
      await user.click(addAffiliateButton)

      await user.type(screen.getByLabelText(/name/i), 'New Affiliate')
      await user.type(screen.getByLabelText(/url/i), 'https://example.com/affiliate')

      const saveAffiliateButton = screen.getByText(/save/i)
      await user.click(saveAffiliateButton)

      // Verify additions
      await waitFor(() => {
        expect(screen.getByText('German')).toBeInTheDocument()
        expect(screen.getByText('New Affiliate')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling Workflow', () => {
    test('should handle API errors gracefully', async () => {
      const store = createTestStore()

      // Mock API error
      server.use(
        rest.get('/api/sites/', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ error: 'Internal server error' })
          )
        })
      )

      render(
        <TestWrapper store={store}>
          <SitesListPage />
        </TestWrapper>
      )

      // Wait for error to be displayed
      await waitFor(() => {
        expect(screen.getByText(/error loading sites/i)).toBeInTheDocument()
      })

      // Verify error message
      expect(screen.getByText(/internal server error/i)).toBeInTheDocument()
    })

    test('should handle network errors gracefully', async () => {
      const store = createTestStore()

      // Mock network error
      server.use(
        rest.get('/api/sites/', (req, res) => {
          return res.networkError('Network error')
        })
      )

      render(
        <TestWrapper store={store}>
          <SitesListPage />
        </TestWrapper>
      )

      // Wait for error to be displayed
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })
  })

  describe('Performance and Load Testing', () => {
    test('should handle large datasets efficiently', async () => {
      const store = createTestStore()

      // Mock large dataset
      const largeSitesList = Array.from({ length: 100 }, (_, i) => ({
        ...mockSite,
        id: i + 1,
        domain: `site${i + 1}.com`
      }))

      server.use(
        rest.get('/api/sites/', (req, res, ctx) => {
          return res(
            ctx.json({
              count: 100,
              results: largeSitesList
            })
          )
        })
      )

      const startTime = performance.now()

      render(
        <TestWrapper store={store}>
          <SitesListPage />
        </TestWrapper>
      )

      // Wait for all sites to load
      await waitFor(() => {
        expect(screen.getByText('site100.com')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const loadTime = endTime - startTime

      // Should load within reasonable time (less than 2 seconds)
      expect(loadTime).toBeLessThan(2000)
    })
  })
})
