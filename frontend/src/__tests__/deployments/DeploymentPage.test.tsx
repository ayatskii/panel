import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils'
import DeploymentsPage from '@/pages/deployments/DeploymentPage'

// Mock the API hooks
const mockUseGetDeploymentsQuery = vi.fn()
const mockUseTriggerDeploymentMutation = vi.fn()
const mockUseGetDeploymentLogsQuery = vi.fn()

vi.mock('@/store/api/deploymentsApi', () => ({
  useGetDeploymentsQuery: () => mockUseGetDeploymentsQuery(),
  useTriggerDeploymentMutation: () => mockUseTriggerDeploymentMutation(),
  useGetDeploymentLogsQuery: () => mockUseGetDeploymentLogsQuery()
}))

describe('DeploymentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementations
    mockUseGetDeploymentsQuery.mockReturnValue({
      data: [
        {
          id: 1,
          site_brand_name: 'Test Site',
          status: 'success',
          url: 'https://test.example.com',
          created_at: '2024-01-01T00:00:00Z'
        }
      ],
      isLoading: false
    })
    
    mockUseTriggerDeploymentMutation.mockReturnValue([vi.fn()])
    
    mockUseGetDeploymentLogsQuery.mockReturnValue({
      data: { logs: ['Line 1', 'Line 2', 'Line 3'] },
      isLoading: false,
      error: null
    })
  })

  it('renders deployment logs without crashing', () => {
    renderWithProviders(<DeploymentsPage />)
    
    // Should render the deployments page
    expect(screen.getByText('Deployments')).toBeInTheDocument()
  })

  it('handles logs with undefined data gracefully', () => {
    mockUseGetDeploymentLogsQuery.mockReturnValue({
      data: { logs: undefined },
      isLoading: false,
      error: null
    })

    renderWithProviders(<DeploymentsPage />)
    
    // Should not crash and show "No logs available"
    expect(screen.getByText('No logs available')).toBeInTheDocument()
  })

  it('handles logs with null data gracefully', () => {
    mockUseGetDeploymentLogsQuery.mockReturnValue({
      data: { logs: null },
      isLoading: false,
      error: null
    })

    renderWithProviders(<DeploymentsPage />)
    
    // Should not crash and show "No logs available"
    expect(screen.getByText('No logs available')).toBeInTheDocument()
  })

  it('handles logs with empty array', () => {
    mockUseGetDeploymentLogsQuery.mockReturnValue({
      data: { logs: [] },
      isLoading: false,
      error: null
    })

    renderWithProviders(<DeploymentsPage />)
    
    // Should show "No logs available"
    expect(screen.getByText('No logs available')).toBeInTheDocument()
  })

  it('displays logs correctly when data is available', () => {
    mockUseGetDeploymentLogsQuery.mockReturnValue({
      data: { logs: ['Build started', 'Compiling assets', 'Deployment complete'] },
      isLoading: false,
      error: null
    })

    renderWithProviders(<DeploymentsPage />)
    
    // Should display the logs
    expect(screen.getByText('Build started\nCompiling assets\nDeployment complete')).toBeInTheDocument()
  })
})
