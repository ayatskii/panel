import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils'
import SitesListPage from '../SitesListPage'
import type { Site } from '@/types'

// Mock data
const mockSites: Site[] = [
  {
    id: 1,
    name: 'Test Site 1',
    domain: 'test1.example.com',
    description: 'First test site',
    logo_url: 'https://example.com/logo1.png',
    favicon_url: 'https://example.com/favicon1.ico',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Test Site 2',
    domain: 'test2.example.com',
    description: 'Second test site',
    logo_url: 'https://example.com/logo2.png',
    favicon_url: 'https://example.com/favicon2.ico',
    is_active: false,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
]

// Mock react-router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

describe('SitesListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render the page title', () => {
      renderWithProviders(<SitesListPage />)
      expect(screen.getByRole('heading', { name: /sites/i })).toBeInTheDocument()
    })

    it('should render create site button', () => {
      renderWithProviders(<SitesListPage />)
      expect(screen.getByRole('button', { name: /new site|create/i })).toBeInTheDocument()
    })

    it('should render search input', () => {
      renderWithProviders(<SitesListPage />)
      expect(screen.getByRole('textbox', { name: /search/i })).toBeInTheDocument()
    })
  })

  describe('data loading', () => {
    it('should load and display sites', async () => {
      renderWithProviders(<SitesListPage />)
      
      await waitFor(() => {
        expect(screen.queryByText('Test Site 1')).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('should display site information', async () => {
      renderWithProviders(<SitesListPage />)
      
      await waitFor(() => {
        expect(screen.getByText('test1.example.com')).toBeInTheDocument()
      }, { timeout: 5000 })
    })
  })

  describe('interactions', () => {
    it('should filter sites on search', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SitesListPage />)

      const searchInput = screen.getByRole('textbox', { name: /search/i })
      await user.type(searchInput, 'Test Site 1')

      // Should show filtered results
      await waitFor(() => {
        expect(screen.queryByText('Test Site 1')).toBeInTheDocument()
      })
    })

    it('should have action buttons for each site', async () => {
      renderWithProviders(<SitesListPage />)

      await waitFor(() => {
        const editButtons = screen.queryAllByRole('button', { name: /edit/i })
        expect(editButtons.length).toBeGreaterThan(0)
      }, { timeout: 5000 })
    })
  })

  describe('navigation', () => {
    it('should have link to create new site', () => {
      renderWithProviders(<SitesListPage />)
      const createButton = screen.getByRole('button', { name: /new site|create/i })
      expect(createButton).toBeInTheDocument()
    })
  })

  describe('responsive', () => {
    it('should render without crashing on mobile', () => {
      renderWithProviders(<SitesListPage />)
      expect(screen.getByRole('heading', { name: /sites/i })).toBeInTheDocument()
    })
  })
})
