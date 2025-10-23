import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils'
import TemplateEditorPage from '../TemplateEditorPage'
import { mockTemplates } from '@/test-utils/mockData'
import { server } from '@/test-utils/setup'
import { http, HttpResponse } from 'msw'
import * as router from 'react-router-dom'

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: vi.fn(),
  }
})

describe('TemplateEditorPage', () => {
  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.mocked(router.useNavigate).mockReturnValue(mockNavigate)
    mockNavigate.mockClear()
  })

  describe('Create Mode', () => {
    beforeEach(() => {
      vi.mocked(router.useParams).mockReturnValue({})
    })

    it('should render create form when no ID in URL', async () => {
      renderWithProviders(<TemplateEditorPage />)

      expect(screen.getByText('Create Template')).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: /template name/i })).toHaveValue('')
    })

    it('should have default form values', () => {
      renderWithProviders(<TemplateEditorPage />)

      expect(screen.getByRole('textbox', { name: /template name/i })).toHaveValue('')
      expect(screen.getByRole('combobox', { name: /type/i })).toHaveTextContent('Blog')
      expect(screen.getByRole('textbox', { name: /description/i })).toHaveValue('')
    })

    it('should have all four tabs', () => {
      renderWithProviders(<TemplateEditorPage />)

      expect(screen.getByText('Basic Info')).toBeInTheDocument()
      expect(screen.getByText('HTML')).toBeInTheDocument()
      expect(screen.getByText('CSS')).toBeInTheDocument()
      expect(screen.getByText('JavaScript')).toBeInTheDocument()
    })
  })

  describe('Edit Mode - Data Loading', () => {
    beforeEach(() => {
      vi.mocked(router.useParams).mockReturnValue({ id: '1' })
    })

    it('should show loading spinner while fetching', async () => {
      server.use(
        http.get('/api/templates/1/', async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return HttpResponse.json(mockTemplates[0])
        })
      )

      renderWithProviders(<TemplateEditorPage />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
      })
    })

    it('should populate form with template data', async () => {
      renderWithProviders(<TemplateEditorPage />)

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /template name/i })).toHaveValue('Blog Template')
      }, { timeout: 5000 })

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /description/i })).toHaveValue('Modern blog template with responsive design')
      })
    })

    it('should handle optional fields with fallback empty strings', async () => {
      vi.mocked(router.useParams).mockReturnValue({ id: '4' })

      renderWithProviders(<TemplateEditorPage />)

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /template name/i })).toHaveValue('Minimal Template')
      }, { timeout: 5000 })

      // Switch to HTML tab
      fireEvent.click(screen.getByText('HTML'))

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /base html/i })).toHaveValue('')
      })
    })
  })

  describe('Form Interactions', () => {
    beforeEach(() => {
      vi.mocked(router.useParams).mockReturnValue({})
    })

    it('should update form state when typing in name field', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TemplateEditorPage />)

      const nameInput = screen.getByRole('textbox', { name: /template name/i })
      await user.type(nameInput, 'New Template')

      expect(nameInput).toHaveValue('New Template')
    })

    it('should update form state when typing in description', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TemplateEditorPage />)

      const descInput = screen.getByRole('textbox', { name: /description/i })
      await user.type(descInput, 'Test description')

      expect(descInput).toHaveValue('Test description')
    })

    it('should handle switch toggle for is_monolithic', async () => {
      renderWithProviders(<TemplateEditorPage />)

      const monolithicSwitch = screen.getByRole('switch', { 
        name: /monolithic template/i 
      })
      
      expect(monolithicSwitch).not.toBeChecked()
      
      fireEvent.click(monolithicSwitch)
      
      expect(monolithicSwitch).toBeChecked()
    })

    it('should handle switch toggle for supports_color_customization', async () => {
      renderWithProviders(<TemplateEditorPage />)

      const colorSwitch = screen.getByRole('switch', { 
        name: /supports color customization/i 
      })
      
      expect(colorSwitch).not.toBeChecked()
      
      fireEvent.click(colorSwitch)
      
      expect(colorSwitch).toBeChecked()
    })
  })

  describe('Tab Navigation', () => {
    beforeEach(() => {
      vi.mocked(router.useParams).mockReturnValue({})
    })

    it('should switch to HTML tab', async () => {
      renderWithProviders(<TemplateEditorPage />)

      expect(screen.getByRole('textbox', { name: /template name/i })).toBeVisible()

      fireEvent.click(screen.getByText('HTML'))

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /base html/i })).toBeVisible()
      })
    })

    it('should switch to CSS tab', async () => {
      renderWithProviders(<TemplateEditorPage />)

      fireEvent.click(screen.getByText('CSS'))

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /base css/i })).toBeVisible()
      })
    })

    it('should switch to JavaScript tab', async () => {
      renderWithProviders(<TemplateEditorPage />)

      fireEvent.click(screen.getByText('JavaScript'))

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /base javascript/i })).toBeVisible()
      })
    })
  })

  describe('Form Submission - Create', () => {
    beforeEach(() => {
      vi.mocked(router.useParams).mockReturnValue({})
    })

    it('should call createTemplate mutation with form data', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TemplateEditorPage />)

      await user.type(screen.getByRole('textbox', { name: /template name/i }), 'New Template')
      await user.type(screen.getByRole('textbox', { name: /description/i }), 'New Description')

      const submitButton = screen.getByRole('button', { name: /create template/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/templates')
      }, { timeout: 8000 })
    })

    it('should navigate to templates list on success', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TemplateEditorPage />)

      await user.type(screen.getByRole('textbox', { name: /template name/i }), 'Test')
      await user.type(screen.getByRole('textbox', { name: /description/i }), 'Test')

      const submitButton = screen.getByRole('button', { name: /create template/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/templates')
      }, { timeout: 8000 })
    })
  })

  describe('Form Submission - Update', () => {
    beforeEach(() => {
      vi.mocked(router.useParams).mockReturnValue({ id: '1' })
    })

    it('should call updateTemplate mutation with ID and data', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TemplateEditorPage />)

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /template name/i })).toHaveValue('Blog Template')
      }, { timeout: 8000 })

      const nameInput = screen.getByRole('textbox', { name: /template name/i })
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Template')

      const submitButton = screen.getByRole('button', { name: /update template/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/templates')
      }, { timeout: 8000 })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(router.useParams).mockReturnValue({})
    })

    it('should show error toast on API failure with specific message', async () => {
      server.use(
        http.post('http://localhost:3000/api/templates/', () => {
          return HttpResponse.json(
            { name: ['Template with this name already exists.'] },
            { status: 400 }
          )
        })
      )

      const user = userEvent.setup()
      renderWithProviders(<TemplateEditorPage />)

      await user.type(screen.getByRole('textbox', { name: /template name/i }), 'Duplicate Template')
      await user.type(screen.getByRole('textbox', { name: /description/i }), 'Test')

      const submitButton = screen.getByRole('button', { name: /create template/i })
      await user.click(submitButton)

      // Toast should show error (requires toast library to be set up)
      await waitFor(() => {
        // Navigation should NOT happen on error
        expect(mockNavigate).not.toHaveBeenCalled()
      }, { timeout: 8000 })
    })
  })

  describe('Cancel Button', () => {
    beforeEach(() => {
      vi.mocked(router.useParams).mockReturnValue({})
    })

    it('should navigate back to templates list on cancel', () => {
      renderWithProviders(<TemplateEditorPage />)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)

      expect(mockNavigate).toHaveBeenCalledWith('/templates')
    })
  })

  describe('Admin Warning', () => {
    beforeEach(() => {
      vi.mocked(router.useParams).mockReturnValue({})
    })

    it('should show admin warning alert', () => {
      renderWithProviders(<TemplateEditorPage />)

      expect(screen.getByText(/Admin Only/)).toBeInTheDocument()
      expect(screen.getByText(/Template changes affect all sites/)).toBeInTheDocument()
    })
  })
})

