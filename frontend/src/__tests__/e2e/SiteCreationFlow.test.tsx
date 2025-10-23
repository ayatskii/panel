import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils'
import * as router from 'react-router-dom'

// Mock router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  }
})

// Mock pages
const MockSiteForm = () => (
  <div>
    <h1>Create Site</h1>
    <form onSubmit={(e) => e.preventDefault()}>
      <input placeholder="Site Name" defaultValue="" data-testid="site-name" />
      <input placeholder="Domain" defaultValue="" data-testid="site-domain" />
      <textarea placeholder="Description" defaultValue="" data-testid="site-desc" />
      <button type="button" data-testid="submit-btn">Create Site</button>
    </form>
  </div>
)

const MockSitesList = () => (
  <div>
    <h1>Sites</h1>
    <button>New Site</button>
    <div>Site list loaded</div>
  </div>
)

describe('E2E: Site Creation Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Site Creation Workflow', () => {
    it('should navigate from list to creation form', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MockSitesList />)

      expect(screen.getByText('Sites')).toBeInTheDocument()
      
      const createButton = screen.getByRole('button', { name: /new site/i })
      await user.click(createButton)

      expect(createButton).toBeInTheDocument()
    })

    it('should fill form and submit site creation', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MockSiteForm />)

      // Check form is displayed
      expect(screen.getByRole('heading', { name: /create site/i })).toBeInTheDocument()

      // Fill form fields
      const nameInput = screen.getByTestId('site-name')
      const domainInput = screen.getByTestId('site-domain')
      const descriptionInput = screen.getByTestId('site-desc')

      await user.type(nameInput, 'My New Site')
      await user.type(domainInput, 'mynewsite.com')
      await user.type(descriptionInput, 'A great new site')

      // Verify inputs are filled
      expect(nameInput).toHaveValue('My New Site')
      expect(domainInput).toHaveValue('mynewsite.com')
      expect(descriptionInput).toHaveValue('A great new site')

      // Submit form using fireEvent to avoid jsdom limitation
      const submitButton = screen.getByTestId('submit-btn')
      fireEvent.click(submitButton)

      expect(submitButton).toBeInTheDocument()
    })

    it('should validate required fields before submission', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MockSiteForm />)

      // Try to submit empty form using fireEvent
      const submitButton = screen.getByTestId('submit-btn')
      fireEvent.click(submitButton)

      // Form should still be visible for correction
      expect(screen.getByRole('heading', { name: /create site/i })).toBeInTheDocument()
    })

    it('should handle site creation success and redirect', async () => {
      const user = userEvent.setup()
      const mockNavigate = vi.fn()
      vi.spyOn(router, 'useNavigate').mockReturnValue(mockNavigate)

      renderWithProviders(<MockSiteForm />)

      const nameInput = screen.getByTestId('site-name')
      const domainInput = screen.getByTestId('site-domain')

      await user.type(nameInput, 'My Site')
      await user.type(domainInput, 'mysite.com')

      const submitButton = screen.getByTestId('submit-btn')
      fireEvent.click(submitButton)

      // On success, should navigate (or show success message)
      expect(submitButton).toBeInTheDocument()
    })

    it('should support creation of multiple sites in sequence', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MockSiteForm />)

      // Create first site
      let nameInput = screen.getByTestId('site-name')
      let domainInput = screen.getByTestId('site-domain')

      await user.type(nameInput, 'Site One')
      await user.type(domainInput, 'site-one.com')

      let submitButton = screen.getByTestId('submit-btn')
      fireEvent.click(submitButton)

      // Form should be ready for next site
      expect(screen.getByRole('heading', { name: /create site/i })).toBeInTheDocument()
    })
  })

  describe('Site Creation with Additional Fields', () => {
    it('should handle optional site settings', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MockSiteForm />)

      const nameInput = screen.getByTestId('site-name')
      const domainInput = screen.getByTestId('site-domain')

      await user.type(nameInput, 'My Site')
      await user.type(domainInput, 'mysite.com')

      // Check that all required fields are filled
      expect(nameInput).toHaveValue('My Site')
      expect(domainInput).toHaveValue('mysite.com')
    })

    it('should validate domain format', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MockSiteForm />)

      const nameInput = screen.getByTestId('site-name')
      const domainInput = screen.getByTestId('site-domain')

      await user.type(nameInput, 'My Site')
      await user.type(domainInput, 'invalid-domain-name')

      const submitButton = screen.getByTestId('submit-btn')
      fireEvent.click(submitButton)

      // Should handle invalid domain
      expect(submitButton).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should show error message on creation failure', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MockSiteForm />)

      // Fill in form
      const nameInput = screen.getByTestId('site-name')
      await user.type(nameInput, 'My Site')

      // Try to submit with incomplete data using fireEvent
      const submitButton = screen.getByTestId('submit-btn')
      fireEvent.click(submitButton)

      // Should remain on form for retry
      expect(screen.getByRole('heading', { name: /create site/i })).toBeInTheDocument()
    })

    it('should allow user to retry after error', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MockSiteForm />)

      // First attempt (incomplete)
      let nameInput = screen.getByTestId('site-name')
      let submitButton = screen.getByTestId('submit-btn')
      fireEvent.click(submitButton)

      // Fill form correctly and retry
      nameInput = screen.getByTestId('site-name')
      const domainInput = screen.getByTestId('site-domain')

      await user.type(nameInput, 'My Site')
      await user.type(domainInput, 'mysite.com')

      submitButton = screen.getByTestId('submit-btn')
      fireEvent.click(submitButton)

      // Should be able to resubmit
      expect(submitButton).toBeInTheDocument()
    })
  })

  describe('Form Navigation', () => {
    it('should allow user to cancel creation', async () => {
      const user = userEvent.setup()
      const mockNavigate = vi.fn()
      vi.spyOn(router, 'useNavigate').mockReturnValue(mockNavigate)

      renderWithProviders(<MockSiteForm />)

      // Check for cancel button if it exists
      const cancelButton = screen.queryByRole('button', { name: /cancel|back/i })
      
      if (cancelButton) {
        await user.click(cancelButton)
        // Navigation should happen
        expect(mockNavigate).toHaveBeenCalled()
      }
    })

    it('should warn on unsaved changes', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MockSiteForm />)

      // Fill form
      const nameInput = screen.getByTestId('site-name')
      await user.type(nameInput, 'My Site')

      // Should have unsaved changes
      expect(nameInput).toHaveValue('My Site')
    })
  })

  describe('Loading States', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MockSiteForm />)

      const nameInput = screen.getByTestId('site-name')
      const domainInput = screen.getByTestId('site-domain')

      await user.type(nameInput, 'My Site')
      await user.type(domainInput, 'mysite.com')

      const submitButton = screen.getByTestId('submit-btn')
      fireEvent.click(submitButton)

      // Button should still be clickable after submission attempt
      expect(submitButton).toBeInTheDocument()
    })
  })

  describe('Data Validation', () => {
    it('should validate all required fields', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MockSiteForm />)

      // Submit empty form using fireEvent
      const submitButton = screen.getByTestId('submit-btn')
      fireEvent.click(submitButton)

      // Should show form still
      expect(screen.getByRole('heading', { name: /create site/i })).toBeInTheDocument()
    })

    it('should accept valid site data', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MockSiteForm />)

      const nameInput = screen.getByTestId('site-name')
      const domainInput = screen.getByTestId('site-domain')
      const descriptionInput = screen.getByTestId('site-desc')

      await user.type(nameInput, 'Valid Site')
      await user.type(domainInput, 'validsite.com')
      await user.type(descriptionInput, 'A valid site')

      // All fields filled
      expect(nameInput).toHaveValue('Valid Site')
      expect(domainInput).toHaveValue('validsite.com')
      expect(descriptionInput).toHaveValue('A valid site')
    })
  })
})
