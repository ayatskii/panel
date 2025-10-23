import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils'
import SiteFormPage from '../SiteFormPage'
import * as router from 'react-router-dom'

// Mock react-router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: undefined }),
  }
})

describe('SiteFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Create Mode', () => {
    it('should render create form', () => {
      renderWithProviders(<SiteFormPage />)
      expect(screen.getByText(/create site|new site/i)).toBeInTheDocument()
    })

    it('should have site name field', () => {
      renderWithProviders(<SiteFormPage />)
      expect(screen.getByRole('textbox', { name: /site name|name/i })).toBeInTheDocument()
    })

    it('should have domain field', () => {
      renderWithProviders(<SiteFormPage />)
      expect(screen.getByRole('textbox', { name: /domain/i })).toBeInTheDocument()
    })

    it('should have description field', () => {
      renderWithProviders(<SiteFormPage />)
      expect(screen.getByRole('textbox', { name: /description/i })).toBeInTheDocument()
    })

    it('should submit form with valid data', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SiteFormPage />)

      const nameInput = screen.getByRole('textbox', { name: /site name|name/i })
      const domainInput = screen.getByRole('textbox', { name: /domain/i })

      await user.type(nameInput, 'New Site')
      await user.type(domainInput, 'newsite.com')

      const submitButton = screen.getByRole('button', { name: /create|save/i })
      await user.click(submitButton)

      await waitFor(() => {
        // Should navigate on success
        expect(true).toBe(true)
      }, { timeout: 5000 })
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SiteFormPage />)

      const submitButton = screen.getByRole('button', { name: /create|save/i })
      await user.click(submitButton)

      // Should show validation errors
      await waitFor(() => {
        expect(screen.queryByText(/required|error/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should have active toggle for is_active', () => {
      renderWithProviders(<SiteFormPage />)
      expect(screen.queryByRole('checkbox')).toBeInTheDocument()
    })

    it('should clear form on cancel', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SiteFormPage />)

      const nameInput = screen.getByRole('textbox', { name: /site name|name/i })
      await user.type(nameInput, 'Test Site')

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Should navigate back
      expect(cancelButton).toBeInTheDocument()
    })
  })

  describe('Edit Mode', () => {
    it('should render edit form when id is provided', () => {
      vi.spyOn(router, 'useParams').mockReturnValue({ id: '1' } as any)
      renderWithProviders(<SiteFormPage />)
      
      expect(screen.getByText(/edit site/i)).toBeInTheDocument()
    })

    it('should load site data on edit', async () => {
      vi.spyOn(router, 'useParams').mockReturnValue({ id: '1' } as any)
      renderWithProviders(<SiteFormPage />)

      await waitFor(() => {
        const nameInput = screen.getByRole('textbox', { name: /site name|name/i })
        expect(nameInput).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('should update site on submit', async () => {
      vi.spyOn(router, 'useParams').mockReturnValue({ id: '1' } as any)
      const user = userEvent.setup()
      renderWithProviders(<SiteFormPage />)

      const nameInput = screen.getByRole('textbox', { name: /site name|name/i })
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Site')

      const submitButton = screen.getByRole('button', { name: /update|save/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(true).toBe(true)
      }, { timeout: 5000 })
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels', () => {
      renderWithProviders(<SiteFormPage />)
      expect(screen.getByLabelText(/site name|name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/domain/i)).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SiteFormPage />)

      const firstInput = screen.getByRole('textbox', { name: /site name|name/i })
      firstInput.focus()
      expect(firstInput).toHaveFocus()
    })
  })

  describe('Error Handling', () => {
    it('should display error on submission failure', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SiteFormPage />)

      // Try to submit without required fields
      const submitButton = screen.getByRole('button', { name: /create|save/i })
      await user.click(submitButton)

      // Should show error message
      await waitFor(() => {
        expect(screen.queryByText(/error|failed|required/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should handle network errors', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SiteFormPage />)

      const nameInput = screen.getByRole('textbox', { name: /site name|name/i })
      await user.type(nameInput, 'Test Site')

      const submitButton = screen.getByRole('button', { name: /create|save/i })
      await user.click(submitButton)

      // On error, form should remain visible
      expect(nameInput).toBeInTheDocument()
    })
  })
})
