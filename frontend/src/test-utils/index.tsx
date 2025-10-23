import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore, PreloadedState } from '@reduxjs/toolkit'
import { apiSlice } from '@/store/api/apiSlice'
import authReducer from '@/store/slices/authSlice'
import type { RootState } from '@/store'

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: PreloadedState<RootState>
  store?: ReturnType<typeof configureStore>
}

/**
 * Custom render function that wraps component with Redux Provider and Router
 * 
 * Usage:
 * ```typescript
 * import { renderWithProviders } from '@/test-utils'
 * 
 * renderWithProviders(<MyComponent />, {
 *   preloadedState: {
 *     auth: { user: { is_admin: true } }
 *   }
 * })
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        [apiSlice.reducerPath]: apiSlice.reducer,
        auth: authReducer,
      },
      preloadedState,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(apiSlice.middleware),
    }),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </Provider>
    )
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}

// Re-export testing utilities
export { screen, waitFor, fireEvent, within } from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

// Override render with our custom version
export { renderWithProviders as render }

