import { describe, it, expect, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils'
import TemplatesPage from '../TemplatesPage'
import { mockTemplates, mockAdminUser, mockRegularUser } from '@/test-utils/mockData'
import { server } from '@/test-utils/setup'
import { http, HttpResponse } from 'msw'

describe('TemplatesPage', () => {
  describe('Loading State', () => {
    it('should show loading spinner initially', async () => {
      // Setup delayed response
      server.use(
        http.get('/api/templates/', async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return HttpResponse.json({ results: mockTemplates })
        })
      )

      renderWithProviders(<TemplatesPage />)

      // Should show loading spinner
      expect(screen.getByRole('progressbar')).toBeInTheDocument()

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
      })
    })
  })

  describe('Data Rendering', () => {
    it('should render template cards with correct data', async () => {
      renderWithProviders(<TemplatesPage />)

      await waitFor(() => {
        expect(screen.getByText('Blog Template')).toBeInTheDocument()
      })

      expect(screen.getByText('Modern blog template with responsive design')).toBeInTheDocument()
      expect(screen.getByText('blog')).toBeInTheDocument()
      expect(screen.getByText('10 sites')).toBeInTheDocument()
      expect(screen.getByText('2 footprints')).toBeInTheDocument()
    })

    it('should render multiple templates', async () => {
      renderWithProviders(<TemplatesPage />)

      await waitFor(() => {
        expect(screen.getByText('Blog Template')).toBeInTheDocument()
        expect(screen.getByText('Landing Page Template')).toBeInTheDocument()
        expect(screen.getByText('Portfolio Template')).toBeInTheDocument()
      })
    })

    it('should show thumbnails when available', async () => {
      renderWithProviders(<TemplatesPage />)

      await waitFor(() => {
        const image = screen.getByAltText('Blog Template')
        expect(image).toBeInTheDocument()
        expect(image).toHaveAttribute('src', 'https://example.com/thumbnails/blog.jpg')
      })
    })

    it('should show placeholder when thumbnail missing', async () => {
      renderWithProviders(<TemplatesPage />)

      await waitFor(() => {
        expect(screen.getByText('No Preview')).toBeInTheDocument()
      })
    })
  })

  describe('Search Functionality', () => {
    beforeEach(async () => {
      renderWithProviders(<TemplatesPage />)
      await waitFor(() => {
        expect(screen.getByText('Blog Template')).toBeInTheDocument()
      })
    })

    it('should filter templates by name', async () => {
      const searchInput = screen.getByPlaceholderText('Search templates...')
      fireEvent.change(searchInput, { target: { value: 'Blog' } })

      expect(screen.getByText('Blog Template')).toBeInTheDocument()
      expect(screen.queryByText('Landing Page Template')).not.toBeInTheDocument()
    })

    it('should filter templates by description', async () => {
      const searchInput = screen.getByPlaceholderText('Search templates...')
      fireEvent.change(searchInput, { target: { value: 'marketing' } })

      expect(screen.getByText('Landing Page Template')).toBeInTheDocument()
      expect(screen.queryByText('Blog Template')).not.toBeInTheDocument()
    })

    it('should be case-insensitive', async () => {
      const searchInput = screen.getByPlaceholderText('Search templates...')
      fireEvent.change(searchInput, { target: { value: 'BLOG' } })

      expect(screen.getByText('Blog Template')).toBeInTheDocument()
    })

    it('should show empty state when no matches', async () => {
      const searchInput = screen.getByPlaceholderText('Search templates...')
      fireEvent.change(searchInput, { target: { value: 'NonExistentTemplate' } })

      expect(screen.getByText('No templates found')).toBeInTheDocument()
    })

    it('should show all templates when search cleared', async () => {
      const searchInput = screen.getByPlaceholderText('Search templates...')
      
      fireEvent.change(searchInput, { target: { value: 'Blog' } })
      expect(screen.queryByText('Landing Page Template')).not.toBeInTheDocument()
      
      fireEvent.change(searchInput, { target: { value: '' } })
      expect(screen.getByText('Blog Template')).toBeInTheDocument()
      expect(screen.getByText('Landing Page Template')).toBeInTheDocument()
    })
  })

  describe('Feature Chips', () => {
    it('should show customizable chip when supports_color_customization is true', async () => {
      renderWithProviders(<TemplatesPage />)

      await waitFor(() => {
        const customizableChips = screen.getAllByText('Customizable')
        expect(customizableChips.length).toBeGreaterThan(0)
      })
    })

    it('should show fast chip when supports_page_speed is true', async () => {
      renderWithProviders(<TemplatesPage />)

      await waitFor(() => {
        const fastChips = screen.getAllByText('Fast')
        expect(fastChips.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Preview Functionality', () => {
    it('should open preview dialog when preview button clicked', async () => {
      renderWithProviders(<TemplatesPage />)

      await waitFor(() => {
        expect(screen.getByText('Blog Template')).toBeInTheDocument()
      })

      const previewButtons = screen.getAllByText('Preview')
      fireEvent.click(previewButtons[0])

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/Template Preview:/)).toBeInTheDocument()
      })
    })

    it('should render iframe with preview HTML', async () => {
      renderWithProviders(<TemplatesPage />)

      await waitFor(() => {
        expect(screen.getByText('Blog Template')).toBeInTheDocument()
      })

      const previewButtons = screen.getAllByText('Preview')
      fireEvent.click(previewButtons[0])

      await waitFor(() => {
        const iframe = screen.getByTitle('Template Preview')
        expect(iframe).toBeInTheDocument()
        expect(iframe).toHaveAttribute('srcDoc')
      })
    })

    it('should close preview dialog when close button clicked', async () => {
      renderWithProviders(<TemplatesPage />)

      await waitFor(() => {
        expect(screen.getByText('Blog Template')).toBeInTheDocument()
      })

      const previewButtons = screen.getAllByText('Preview')
      fireEvent.click(previewButtons[0])

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Permission-Based Rendering', () => {
    it('should show create button for admin users', async () => {
      renderWithProviders(<TemplatesPage />, {
        preloadedState: {
          auth: {
            user: mockAdminUser,
            access: 'token',
            refresh: 'token',
          },
        },
      })

      await waitFor(() => {
        expect(screen.getAllByText('Create Template').length).toBeGreaterThan(0)
      })
    })

    it('should hide create button for non-admin users', async () => {
      renderWithProviders(<TemplatesPage />, {
        preloadedState: {
          auth: {
            user: mockRegularUser,
            access: 'token',
            refresh: 'token',
          },
        },
      })

      await waitFor(() => {
        expect(screen.getByText('Blog Template')).toBeInTheDocument()
      })

      expect(screen.queryByText('Create Template')).not.toBeInTheDocument()
    })

    it('should show edit buttons for admin users', async () => {
      renderWithProviders(<TemplatesPage />, {
        preloadedState: {
          auth: {
            user: mockAdminUser,
            access: 'token',
            refresh: 'token',
          },
        },
      })

      await waitFor(() => {
        const editButtons = screen.getAllByText('Edit')
        expect(editButtons.length).toBeGreaterThan(0)
      })
    })

    it('should hide edit buttons for non-admin users', async () => {
      renderWithProviders(<TemplatesPage />, {
        preloadedState: {
          auth: {
            user: mockRegularUser,
            access: 'token',
            refresh: 'token',
          },
        },
      })

      await waitFor(() => {
        expect(screen.getByText('Blog Template')).toBeInTheDocument()
      })

      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no templates', async () => {
      server.use(
        http.get('/api/templates/', () => {
          return HttpResponse.json({ results: [] })
        })
      )

      renderWithProviders(<TemplatesPage />)

      await waitFor(() => {
        expect(screen.getByText('No templates found')).toBeInTheDocument()
      })
    })

    it('should show create button in empty state for admin', async () => {
      server.use(
        http.get('/api/templates/', () => {
          return HttpResponse.json({ results: [] })
        })
      )

      renderWithProviders(<TemplatesPage />, {
        preloadedState: {
          auth: {
            user: mockAdminUser,
            access: 'token',
            refresh: 'token',
          },
        },
      })

      await waitFor(() => {
        expect(screen.getByText('Create First Template')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      server.use(
        http.get('/api/templates/', () => {
          return HttpResponse.json(
            { detail: 'Internal server error' },
            { status: 500 }
          )
        })
      )

      renderWithProviders(<TemplatesPage />)

      // RTK Query will handle the error internally
      // Component should not crash
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
      })
    })
  })
})

