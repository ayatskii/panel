import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from './theme'

// Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import UsersListPage from './pages/users/UsersListPage'
import UserDetailPage from './pages/users/UserDetailPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import SitesListPage from './pages/sites/SitesListPage'
import SiteDetailPage from './pages/sites/SiteDetailPage'
import SiteFormPage from './pages/sites/SiteFormPage'
import TemplatesPage from './pages/templates/TemplatesPage'
import TemplateCreatePage from './pages/templates/TemplateCreatePage'
import TemplateEditorPage from './pages/templates/TemplateEditorPage'
import PagesListPage from './pages/pages/PagesListPage'
import PageFormPage from './pages/pages/PageFormPage'
import PageBuilderPage from './pages/pages/PageBuilderPage'
import DashboardLayout from './components/layouts/DashboardLayout'
import PrivateRoute from './components/auth/PrivateRoute'
import PromptsPage from './pages/prompts/PromptsPage'
import PromptFormPage from './pages/prompts/PromptFormPage'
import DeploymentsPage from './pages/deployments/DeploymentPage'
import AnalyticsDashboardPage from './pages/analytics/AnalyticsDashboardPage'
import MediaLibraryPage from './pages/media/MediaLibraryPage'
import SettingsPage from './pages/settings/SettingsPage'
import ApiTokensPage from './pages/integrations/ApiTokensPage'
import CloudflareTokensPage from './pages/integrations/CloudflareTokensPage'

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/users" element={<UsersListPage />} />
              <Route path="/users/:id" element={<UserDetailPage />} />

              <Route path="/sites/:id" element={<SiteDetailPage />} />
              <Route path="/sites" element={<SitesListPage />} />
              <Route path="/sites/create" element={<SiteFormPage />} />
              <Route path="/sites/:id/edit" element={<SiteFormPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/templates/create" element={<TemplateCreatePage />} />
              <Route path="/templates/:id/edit" element={<TemplateEditorPage />} />
              <Route path="/pages" element={<PagesListPage />} />
              <Route path="/pages/create" element={<PageFormPage />} />
              <Route path="/pages/:id/edit" element={<PageFormPage />} />
              <Route path="/pages/:id/build" element={<PageBuilderPage />} />
              <Route path="/prompts" element={<PromptsPage />} />
              <Route path="/prompts/create" element={<PromptFormPage />} />
              <Route path="/prompts/:id/edit" element={<PromptFormPage />} />
              <Route path="/deployments" element={<DeploymentsPage />} />
              <Route path="/analytics" element={<AnalyticsDashboardPage />} />
              <Route path="/media" element={<MediaLibraryPage/>}></Route>
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/integrations/api-tokens" element={<ApiTokensPage />} />
              <Route path="/integrations/cloudflare-tokens" element={<CloudflareTokensPage />} />
            </Route>
          </Route>

          {/* Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  )
}

export default App