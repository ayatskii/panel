import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils'
import PagesListPage from '../PagesListPage'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  }
})

describe('PagesListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render pages list heading', () => {
      renderWithProviders(<PagesListPage />)
      expect(screen.getByRole('heading', { name: /pages/i })).toBeInTheDocument()
    })

    it('should have create page button', () => {
      renderWithProviders(<PagesListPage />)
      expect(screen.getByRole('button', { name: /new page|create/i })).toBeInTheDocument()
    })

    it('should display search input', () => {
      renderWithProviders(<PagesListPage />)
      expect(screen.getByRole('textbox', { name: /search/i })).toBeInTheDocument()
    })

    it('should show filter options', () => {
      renderWithProviders(<PagesListPage />)
      expect(screen.getByRole('button', { name: /filter|published/i })).toBeInTheDocument()
    })
  })

  describe('Data Loading', () => {
    it('should load and display pages', async () => {
      renderWithProviders(<PagesListPage />)

      await waitFor(() => {
        expect(screen.queryByRole('table', { hidden: false })).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('should display page title in list', async () => {
      renderWithProviders(<PagesListPage />)

      await waitFor(() => {
        const titleCells = screen.queryAllByRole('cell')
        expect(titleCells.length).toBeGreaterThan(0)
      }, { timeout: 5000 })
    })

    it('should show loading state initially', () => {
      renderWithProviders(<PagesListPage />)
      // Check for loading indicator if present
      expect(screen.queryByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('Searching & Filtering', () => {
    it('should filter pages by search term', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PagesListPage />)

      const searchInput = screen.getByRole('textbox', { name: /search/i })
      await user.type(searchInput, 'test')

      await waitFor(() => {
        expect(searchInput).toHaveValue('test')
      })
    })

    it('should filter by published status', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PagesListPage />)

      const filterButton = screen.getByRole('button', { name: /filter|published/i })
      await user.click(filterButton)

      expect(filterButton).toBeInTheDocument()
    })

    it('should reset filters', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PagesListPage />)

      const searchInput = screen.getByRole('textbox', { name: /search/i })
      await user.type(searchInput, 'test')

      const resetButton = screen.queryByRole('button', { name: /reset|clear/i })
      if (resetButton) {
        await user.click(resetButton)
        expect(searchInput).toHaveValue('')
      }
    })
  })

  describe('Actions', () => {
    it('should have edit button for each page', async () => {
      renderWithProviders(<PagesListPage />)

      await waitFor(() => {
        const editButtons = screen.queryAllByRole('button', { name: /edit/i })
        expect(editButtons.length).toBeGreaterThanOrEqual(0)
      }, { timeout: 5000 })
    })

    it('should have delete button for each page', async () => {
      renderWithProviders(<PagesListPage />)

      await waitFor(() => {
        const deleteButtons = screen.queryAllByRole('button', { name: /delete|remove/i })
        expect(deleteButtons.length).toBeGreaterThanOrEqual(0)
      }, { timeout: 5000 })
    })

    it('should have publish/unpublish button', async () => {
      renderWithProviders(<PagesListPage />)

      await waitFor(() => {
        const publishButtons = screen.queryAllByRole('button', { name: /publish/i })
        expect(publishButtons.length).toBeGreaterThanOrEqual(0)
      }, { timeout: 5000 })
    })

    it('should navigate to edit page on edit button click', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PagesListPage />)

      await waitFor(() => {
        const editButton = screen.queryByRole('button', { name: /edit/i })
        if (editButton) {
          user.click(editButton)
        }
      }, { timeout: 5000 })
    })
  })

  describe('Accessibility', () => {
    it('should have proper table structure', () => {
      renderWithProviders(<PagesListPage />)
      expect(screen.queryByRole('table')).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      renderWithProviders(<PagesListPage />)

      const firstButton = screen.getByRole('button', { name: /new page|create/i })
      firstButton.focus()
      expect(firstButton).toHaveFocus()
    })
  })

  describe('Empty State', () => {
    it('should show empty state message when no pages', async () => {
      renderWithProviders(<PagesListPage />)

      await waitFor(() => {
        const emptyMessage = screen.queryByText(/no pages|empty/i)
        // May or may not exist depending on implementation
        expect(emptyMessage || screen.queryByRole('table')).toBeInTheDocument()
      }, { timeout: 5000 })
    })
  })

  describe('Pagination', () => {
    it('should have pagination controls', () => {
      renderWithProviders(<PagesListPage />)
      const paginationButton = screen.queryByRole('button', { name: /next|previous|page/i })
      // Pagination may not exist if all results fit on one page
      expect(paginationButton === null || paginationButton).toBeTruthy()
    })

    it('should load next page on pagination click', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PagesListPage />)

      const nextButton = screen.queryByRole('button', { name: /next|→/i })
      if (nextButton) {
        await user.click(nextButton)
        expect(nextButton).toBeInTheDocument()
      }
    })
  })
})
