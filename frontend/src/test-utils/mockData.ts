import type { Template, TemplateFootprint, TemplateVariable, User } from '@/types'

/**
 * Mock user data for testing
 */
export const mockAdminUser: User = {
  id: 1,
  username: 'admin',
  email: 'admin@example.com',
  role: 'admin',
  is_admin: true,
  created_at: '2024-01-01T00:00:00Z',
}

export const mockRegularUser: User = {
  id: 2,
  username: 'user',
  email: 'user@example.com',
  role: 'user',
  is_admin: false,
  created_at: '2024-01-01T00:00:00Z',
}

/**
 * Mock template data for testing
 */
export const mockTemplates: Template[] = [
  {
    id: 1,
    name: 'Blog Template',
    type: 'blog',
    description: 'Modern blog template with responsive design',
    base_html: '<html><body>{{ content }}</body></html>',
    base_css: 'body { margin: 0; padding: 0; }',
    base_js: 'console.log("Blog template loaded");',
    is_monolithic: false,
    supports_color_customization: true,
    supports_page_speed: true,
    thumbnail_url: 'https://example.com/thumbnails/blog.jpg',
    footprints_count: 2,
    variables_count: 5,
    sites_count: 10,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 2,
    name: 'Landing Page Template',
    type: 'landing',
    description: 'Simple landing page template for marketing campaigns',
    base_html: '<html><body><h1>{{ title }}</h1></body></html>',
    base_css: 'h1 { color: blue; }',
    is_monolithic: true,
    supports_color_customization: false,
    supports_page_speed: false,
    footprints_count: 0,
    variables_count: 3,
    sites_count: 5,
    is_active: true,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
  },
  {
    id: 3,
    name: 'Portfolio Template',
    type: 'portfolio',
    description: 'Showcase your work with this portfolio template',
    base_html: '<html><body><div class="portfolio">{{ content }}</div></body></html>',
    is_monolithic: false,
    supports_color_customization: true,
    supports_page_speed: true,
    thumbnail_url: 'https://example.com/thumbnails/portfolio.jpg',
    footprints_count: 1,
    variables_count: 8,
    sites_count: 3,
    is_active: true,
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z',
  },
]

/**
 * Mock template with minimal data (optional fields missing)
 */
export const mockMinimalTemplate: Template = {
  id: 4,
  name: 'Minimal Template',
  type: 'business',
  description: 'A minimal template with no optional fields',
  is_monolithic: false,
  supports_color_customization: false,
  supports_page_speed: false,
  footprints_count: 0,
  variables_count: 0,
  sites_count: 0,
  is_active: true,
  created_at: '2024-01-10T00:00:00Z',
  updated_at: '2024-01-10T00:00:00Z',
}

/**
 * Mock paginated response
 */
export const mockPaginatedResponse = {
  count: 3,
  next: null,
  previous: null,
  results: mockTemplates,
}

/**
 * Mock preview data
 */
export const mockPreviewData = {
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Template Preview</title>
        <style>body { margin: 0; padding: 20px; }</style>
      </head>
      <body>
        <h1>Blog Template Preview</h1>
        <p>This is a preview of the blog template.</p>
      </body>
    </html>
  `,
  name: 'Blog Template',
}

/**
 * Mock template footprints
 */
export const mockFootprints: TemplateFootprint[] = [
  {
    id: 1,
    template: 1,
    template_name: 'Blog Template',
    name: 'Standard Blog Layout',
    description: 'Standard header and footer for blog',
    header_html: '<header><h1>My Blog</h1></header>',
    footer_html: '<footer><p>&copy; 2024</p></footer>',
    navigation_html: '<nav><a href="/">Home</a></nav>',
    custom_css: 'header { background: #333; }',
    custom_js: 'console.log("Footprint loaded");',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    template: 1,
    template_name: 'Blog Template',
    name: 'Alternative Blog Layout',
    description: 'Alternative header and footer',
    header_html: '<header><h1>Alternative Header</h1></header>',
    footer_html: '<footer><p>Alternative Footer</p></footer>',
    is_active: true,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
]

/**
 * Mock template variables
 */
export const mockVariables: TemplateVariable[] = [
  {
    id: 1,
    name: 'brand_name',
    display_name: 'Brand Name',
    variable_type: 'text',
    default_value: 'My Company',
    is_required: true,
    description: 'The name of your brand',
  },
  {
    id: 2,
    name: 'primary_color',
    display_name: 'Primary Color',
    variable_type: 'color',
    default_value: '#007bff',
    is_required: false,
    description: 'Main brand color',
  },
  {
    id: 3,
    name: 'show_sidebar',
    display_name: 'Show Sidebar',
    variable_type: 'boolean',
    default_value: 'true',
    is_required: false,
    description: 'Display sidebar on pages',
  },
]

/**
 * Helper function to create a template with custom data
 */
export function createMockTemplate(overrides: Partial<Template> = {}): Template {
  return {
    id: Math.floor(Math.random() * 10000),
    name: 'Test Template',
    type: 'blog',
    description: 'Test description',
    is_monolithic: false,
    supports_color_customization: false,
    supports_page_speed: false,
    footprints_count: 0,
    variables_count: 0,
    sites_count: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

