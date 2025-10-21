# Panel - AI-Powered Website Management System

## 📋 Table of Contents
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Database Models](#database-models)
- [API Endpoints](#api-endpoints)
- [Key Features](#key-features)
- [Environment Configuration](#environment-configuration)
- [Deployment](#deployment)

---

## 🛠 Technology Stack

### Backend Stack
- **Framework**: Django 4.2.7 with Django REST Framework 3.14.0
- **Database**: PostgreSQL 15 (via psycopg2-binary)
- **Authentication**: JWT (djangorestframework-simplejwt 5.3.0)
- **Task Queue**: Celery 5.3.4 with Redis 5.0.1
- **Scheduler**: django-celery-beat 2.5.0
- **AI Integration**:
  - OpenAI 1.3.8 (GPT-4, GPT-3.5-turbo, DALL-E)
  - Anthropic 0.8.0 (Claude 3)
- **External Services**:
  - Cloudflare 2.11.7 (Pages deployment)
  - AWS S3 (boto3 1.29.7 via django-storages)
- **Web Server**: Gunicorn 21.2.0
- **Static Files**: WhiteNoise 6.6.0
- **Monitoring**: Sentry SDK 1.38.0
- **Image Processing**: Pillow 10.1.0

### Frontend Stack
- **Framework**: React 18.2.0 with TypeScript 5.9.3
- **Build Tool**: Vite 7.1.7
- **UI Framework**: Material-UI (MUI) 7.3.4
- **State Management**: Redux Toolkit 2.9.1 with RTK Query
- **Routing**: React Router DOM 7.9.4
- **Forms**: React Hook Form 7.65.0 with Zod 4.1.12 validation
- **Charts**: Chart.js 4.4.1 + Recharts 3.3.0
- **Drag & Drop**: React Beautiful DnD 13.1.1
- **File Upload**: React Dropzone 14.3.8
- **HTTP Client**: Axios 1.12.2
- **Notifications**: React Hot Toast 2.6.0
- **Date Handling**: date-fns 4.1.0

### Infrastructure
- **Containerization**: Docker with Docker Compose
- **Services**:
  - PostgreSQL 15-alpine
  - Redis 7-alpine
  - Backend (Django + Gunicorn)
  - Celery Worker
  - Celery Beat
  - Frontend (Nginx)

### Development Tools
- **Backend**:
  - pytest 7.4.3, pytest-django 4.7.0
  - Black 23.12.0, isort 5.13.2, flake8 6.1.0
  - django-extensions 3.2.3
  - IPython 8.18.1
- **Frontend**:
  - ESLint 9.36.0
  - TypeScript ESLint 8.45.0

---

## 🏗 System Architecture

The Panel system is a full-stack application designed for AI-powered website management and deployment. It follows a microservices architecture with the following components:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
│         Material-UI, Redux Toolkit, TypeScript               │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API (JWT Auth)
┌────────────────────────┴────────────────────────────────────┐
│                 Backend API (Django REST)                    │
│    Users, Sites, Pages, Templates, Media, Analytics         │
└─────┬────────────┬──────────────┬────────────┬──────────────┘
      │            │              │            │
┌─────▼────┐ ┌────▼─────┐  ┌─────▼─────┐ ┌───▼──────────────┐
│PostgreSQL│ │  Redis   │  │ Celery    │ │ External Services│
│          │ │          │  │ Workers   │ │ - Cloudflare     │
│          │ │          │  │           │ │ - OpenAI         │
│          │ │          │  │           │ │ - Anthropic      │
└──────────┘ └──────────┘  └───────────┘ └──────────────────┘
```

### Key Architectural Patterns

1. **API-First Design**: RESTful API with ViewSets and Serializers
2. **Task Queue**: Background processing for deployments and AI generation
3. **Service Layer**: Dedicated services for AI, Cloudflare, and template processing
4. **Repository Pattern**: Django ORM with custom managers
5. **State Management**: Redux Toolkit with RTK Query for API caching

---

## 📁 Project Structure

```
panel/
├── backend/                    # Django backend application
│   ├── analytics/             # Analytics and tracking module
│   ├── deployment/            # Deployment management and builder
│   ├── integrations/          # External service integrations
│   ├── media/                 # Media library management
│   ├── pages/                 # Page and content block management
│   ├── panel/                 # Django project configuration
│   ├── prompts/               # AI prompt management
│   ├── sites/                 # Site configuration and management
│   ├── templates/             # Template engine and assets
│   ├── users/                 # User authentication and management
│   ├── staticfiles/           # Collected static files
│   ├── Dockerfile             # Backend Docker configuration
│   ├── manage.py              # Django management script
│   └── requirements.txt       # Python dependencies
├── frontend/                  # React frontend application
│   ├── dist/                  # Production build output
│   ├── public/                # Static assets
│   ├── src/                   # Source code
│   │   ├── assets/            # Images, fonts, etc.
│   │   ├── components/        # React components
│   │   │   ├── analytics/     # Analytics components
│   │   │   ├── auth/          # Authentication components
│   │   │   ├── blocks/        # Page block components
│   │   │   ├── common/        # Shared components
│   │   │   ├── deployments/   # Deployment components
│   │   │   ├── forms/         # Form components
│   │   │   ├── layouts/       # Layout components
│   │   │   ├── media/         # Media library components
│   │   │   ├── pages/         # Page management components
│   │   │   └── sites/         # Site management components
│   │   ├── constants/         # Application constants
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Page-level components
│   │   │   ├── analytics/     # Analytics dashboard
│   │   │   ├── auth/          # Login/Register pages
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── deployments/   # Deployment pages
│   │   │   ├── media/         # Media library pages
│   │   │   ├── pages/         # Page builder pages
│   │   │   ├── prompts/       # AI prompt pages
│   │   │   ├── settings/      # Settings pages
│   │   │   ├── sites/         # Site management pages
│   │   │   ├── templates/     # Template management pages
│   │   │   └── users/         # User management pages
│   │   ├── store/             # Redux state management
│   │   │   ├── api/           # RTK Query API definitions
│   │   │   │   ├── aiApi.ts           # AI service endpoints
│   │   │   │   ├── analyticsApi.ts    # Analytics endpoints
│   │   │   │   ├── apiSlice.ts        # Base API configuration
│   │   │   │   ├── authApi.ts         # Authentication endpoints
│   │   │   │   ├── deploymentsApi.ts  # Deployment endpoints
│   │   │   │   ├── mediaApi.ts        # Media endpoints
│   │   │   │   ├── pagesApi.ts        # Page endpoints
│   │   │   │   ├── sitesApi.ts        # Site endpoints
│   │   │   │   ├── templatesApi.ts    # Template endpoints
│   │   │   │   └── usersApi.ts        # User endpoints
│   │   │   └── slices/        # Redux slices
│   │   │       └── authSlice.ts       # Authentication state
│   │   ├── types/             # TypeScript type definitions
│   │   ├── utils/             # Utility functions
│   │   ├── App.tsx            # Root component
│   │   ├── main.tsx           # Application entry point
│   │   └── theme.ts           # MUI theme configuration
│   ├── Dockerfile             # Frontend Docker configuration
│   ├── nginx.conf             # Nginx configuration
│   ├── package.json           # Node dependencies
│   ├── tsconfig.json          # TypeScript configuration
│   └── vite.config.ts         # Vite build configuration
└── docker-compose.yml         # Multi-container orchestration
```

---

## 🔧 Backend Architecture

### Directory Structure & Functions

#### `backend/analytics/`
**Purpose**: Track and analyze website traffic and performance metrics.

**Key Models**:
- `Analytics`: Site analytics data (visitors, pageviews, bounce rate, conversions, revenue)
- `PageView`: Individual page view tracking

**Key Functions**:
- `track_view()`: API endpoint for tracking page views
- `conversion_rate` property: Calculate conversion percentage
- Aggregates traffic by source (organic, direct, referral, social, paid)

**API Endpoints**:
- `/api/analytics/` - Analytics CRUD operations
- `/api/analytics/track/` - Track page views

---

#### `backend/deployment/`
**Purpose**: Handle site deployment process, build management, and template processing.

**Key Components**:

**Models**:
- `Deployment`: Deployment history with status tracking (pending, building, success, failed)
  - Stores template snapshots for reproducibility
  - Tracks build metrics (time, file count, size)
  - Git commit hashing for version control

**Services**:

1. **`builder.py` - `SiteBuilder` class**:
   - `build()`: Generate all site files as dict of paths → content
   - `_build_page()`: Compile single page HTML with template variables
   - `_build_blocks()`: Render all page blocks in order
   - `_render_block()`: Convert block JSON to HTML (hero, text, image, gallery)
   - `_build_navigation()`: Generate menu from pages
   - `_build_global_css()`: Compile CSS with custom colors

2. **`services/template_processor.py` - `TemplateProcessor` class**:
   - `replace_variables()`: Substitute template placeholders ({{brand_name}}, {{domain}})
   - `apply_custom_colors()`: Override CSS color variables
   - `add_unique_classes()`: Prefix classes to avoid conflicts
   - `optimize_images()`: Convert `<img>` to `<picture>` tags with WebP
   - `generate_unique_class_prefix()`: Create timestamp-based unique identifiers
   - `get_file_paths()`: Determine output structure from footprint configuration

**Tasks**:
- `deploy_site_async()`: Celery task for background deployment
- `generate_content_async()`: AI content generation for page blocks

**Features**:
- Template variable replacement
- Unique CSS class prefixing (anti-fingerprinting)
- Image optimization (WebP conversion, lazy loading)
- Custom color scheme application
- File structure generation based on CMS footprint

---

#### `backend/integrations/`
**Purpose**: Manage external service integrations (AI, Cloudflare, etc.).

**Models**:
- `ApiToken`: Generic API token storage for multiple services (ChatGPT, Claude, Cloudflare, DALL-E, ElevenLabs, Midjourney)
- `CloudflareToken`: Cloudflare-specific configuration (account_id, zone_id, project_name)

**Services**:

1. **`ai.py` - `AIService` class**:
   - `generate_content()`: Unified AI content generation interface
   - `_generate_openai()`: OpenAI GPT integration (chat completions)
   - `_generate_anthropic()`: Anthropic Claude integration
   - Returns: content, provider, model, tokens_used

2. **`cloudflare.py` - `CloudflareService` class**:
   - `create_project()`: Initialize Cloudflare Pages project
   - `get_project()`: Retrieve project details
   - `create_deployment()`: Deploy files to Cloudflare Pages
   - `upload_file()`: Single file upload
   - `get_deployment()`: Deployment status check
   - `list_deployments()`: All deployments for a project
   - `delete_deployment()`: Remove deployment
   - `get_deployment_logs()`: Fetch build logs

**Features**:
- Multi-provider AI support (OpenAI, Anthropic)
- Token usage tracking
- Cloudflare Pages API integration
- Automatic API credential management

---

#### `backend/media/`
**Purpose**: Media library for images, documents, and video files.

**Models**:
- `MediaFolder`: Hierarchical folder structure with `full_path` property
- `Media`: File storage with metadata
  - Image dimensions (width, height)
  - File size tracking (bytes, KB, MB)
  - MIME type validation
  - Alt text for accessibility
  - User upload tracking

**Key Properties**:
- `is_image`, `is_svg`: File type detection
- `size_kb`, `size_mb`: Human-readable file sizes
- `full_path`: Complete folder hierarchy

**Permissions**:
- Custom permissions for upload, delete, view operations
- User-based access control

**Settings**:
- `ALLOWED_IMAGE_TYPES`: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
- `ALLOWED_DOCUMENT_TYPES`: PDF, Word documents
- `ALLOWED_VIDEO_TYPES`: MP4, WebM, OGG
- `FILE_UPLOAD_MAX_MEMORY_SIZE`: 30MB

---

#### `backend/pages/`
**Purpose**: Page content management with flexible block system.

**Models**:

1. **`Page`**:
   - SEO fields: title, meta_description, h1_tag, canonical_url
   - Custom head HTML for tracking scripts
   - Keywords and LSI phrases for AI generation
   - Unique slug per site
   - Order index for navigation
   - Properties: `full_url`, `keywords_list`, `lsi_phrases_list`

2. **`PageBlock`**:
   - Block types: hero, article, image, text_image, cta, faq, swiper
   - JSON content storage for flexibility
   - Drag-and-drop ordering (order_index)
   - AI prompt association
   - Properties: `is_hero`, `is_article`, `is_cta`

3. **`SwiperPreset`**:
   - Predefined game carousels
   - Games data as JSON array
   - Affiliate link integration
   - Button text customization
   - `game_count` property

**Permissions**:
- Site-based access control
- Custom permission classes

**Features**:
- Flexible content blocks with JSON storage
- AI-powered content generation
- SEO optimization fields
- Reusable swiper presets

---

#### `backend/panel/`
**Purpose**: Django project configuration and settings.

**Key Files**:

1. **`settings.py`**:
   - Custom User model: `users.User`
   - PostgreSQL database configuration
   - JWT authentication with 60-minute access tokens
   - CORS configuration for localhost:3000
   - Celery with Redis broker
   - REST Framework pagination (50 items per page)
   - WhiteNoise for static files
   - Media file handling (30MB upload limit)

2. **`urls.py`**:
   - RESTful API routing with DefaultRouter
   - JWT endpoints: `/api/auth/login/`, `/api/auth/refresh/`
   - ViewSet registration for all resources
   - Admin interface: `/admin/`
   - Current user endpoint: `/api/users/me/`
   - Analytics tracking: `/api/analytics/track/`

3. **`celery.py`**:
   - Celery app initialization
   - Auto-discovery of tasks in installed apps
   - Django settings integration

4. **`wsgi.py`** & **`asgi.py`**: WSGI/ASGI application entry points

**Installed Apps**:
- Core: users, analytics, deployment, integrations, media, pages, prompts, templates, sites
- Third-party: rest_framework, corsheaders, django_celery_beat, nested_admin, django_filters

---

#### `backend/prompts/`
**Purpose**: AI prompt management for content generation.

**Models**:
- `Prompt`: AI prompt templates
  - Types: text, image
  - Block type association (article, title, description, faq, hero)
  - AI model selection (gpt-4, claude-3, dall-e-3)
  - Temperature and max_tokens control
  - System prompts for ChatGPT/Claude
  - Variable placeholders: {keywords}, {brand_name}, etc.

**Services**:

**`services/ai_service.py` - `AIContentService` class**:
- `generate_content()`: Generate content from prompt with context
- `_generate_with_openai()`: OpenAI GPT integration
- `_generate_with_anthropic()`: Anthropic Claude integration
- Variable replacement in prompts
- Context injection (brand_name, keywords, title)

**Features**:
- Template-based prompts with variables
- Multi-provider support (OpenAI, Anthropic)
- Temperature and token control
- System prompt configuration
- Prompt versioning and activation

---

#### `backend/sites/`
**Purpose**: Core site management and configuration.

**Models**:

1. **`Site`**:
   - Basic: domain, brand_name, language_code
   - Template configuration:
     - `template`: ForeignKey to Template
     - `template_footprint`: CMS footprint (WordPress, Joomla, etc.)
     - `template_variables`: JSON custom values
     - `custom_colors`: JSON color overrides
     - `unique_class_prefix`: Unique CSS identifier
     - `enable_page_speed`: WebP optimization toggle
   - External services: cloudflare_token, affiliate_link
   - Media: favicon_media, logo_media
   - SEO: allow_indexing, redirect_404_to_home, use_www_version
   - Properties: `is_deployed`

2. **`Language`**:
   - Supported languages (code, name, is_active)

3. **`AffiliateLink`**:
   - Marketing links with click tracking
   - URL validation

**Features**:
- Multi-template support
- Custom color schemes
- CMS footprint simulation
- Cloudflare integration
- Affiliate marketing

---

#### `backend/templates/`
**Purpose**: Template engine with customizable HTML/CSS/JS.

**Models**:

1. **`Template`**:
   - Types: monolithic (fixed), sectional (modular)
   - CSS output: inline, external, async, path_only
   - JS output: inline, external, defer, async, path_only
   - Content: html_content, css_content, js_content
   - Menu structures: menu_html, footer_menu_html, faq_block_html
   - CSS framework: Tailwind, Bootstrap, custom
   - Color customization support with color_variables JSON
   - Page speed optimization support
   - Available blocks JSON array

2. **`TemplateFootprint`**:
   - CMS simulation (WordPress, Joomla, Drupal, custom, none)
   - Path structure: theme_path, assets_path, images_path, css_path, js_path
   - PHP file generation config
   - Path variables for customization

3. **`TemplateVariable`**:
   - Variable types: meta, brand, content, style, script
   - Default values and descriptions
   - Required flag
   - Placeholder property: `{{variable_name}}`

4. **`TemplateSection`**:
   - Section types: header, menu, hero, content, sidebar, footer, footer_menu, custom
   - HTML and CSS per section
   - Order index for arrangement
   - Required and customizable flags

5. **`TemplateAsset`**:
   - Asset types: logo, favicon, image, font, icon
   - File upload with path variables
   - Auto-format generation (SVG → PNG, ICO)

**Features**:
- Modular template system
- CMS footprint simulation
- Variable replacement engine
- Custom color schemes
- Asset management
- Multiple output strategies (inline, external, async)

---

#### `backend/users/`
**Purpose**: User authentication and role-based access control.

**Models**:
- `User` (extends AbstractUser):
  - Roles: admin, user
  - Custom UserManager with email validation
  - Properties: `is_admin`, `has_site_access()`
  - Database indexes on role and email

**Permissions**:
- Custom permission classes
- Site-based access control

**Features**:
- JWT authentication
- Role-based permissions
- Email-based user creation
- Site access validation

---

## 🎨 Frontend Architecture

### Directory Structure & Functions

#### `frontend/src/components/`

1. **`analytics/`**: Analytics visualization components
   - Charts and metrics display
   - Traffic source breakdowns

2. **`auth/`**:
   - `LoginPage.tsx`: User login form
   - `RegisterPage.tsx`: User registration form
   - `PrivateRoute.tsx`: Protected route wrapper with auth check

3. **`blocks/`**: Page content block components
   - `HeroBlock.tsx`: Hero banner editor
   - `TextBlock.tsx`: Rich text content
   - `ImageBlock.tsx`: Image block with caption
   - `GalleryBlock.tsx`: Image gallery grid
   - `SwiperBlock.tsx`: Game carousel

4. **`common/`**: Shared components
   - Buttons, inputs, modals, etc.

5. **`deployments/`**: Deployment management UI
   - Deployment status tracking
   - Build logs display

6. **`forms/`**: Reusable form components
   - Form fields with validation
   - React Hook Form integration

7. **`layouts/`**:
   - `DashboardLayout.tsx`: Main application layout
   - `Sidebar.tsx`: Navigation sidebar
   - `TopBar.tsx`: Header with user menu

8. **`media/`**:
   - `MediaSelector.tsx`: File picker modal
   - Media library browser

9. **`pages/`**, **`sites/`**: Feature-specific components

---

#### `frontend/src/pages/`

Each page directory contains feature-specific page components:

1. **`analytics/`**:
   - `AnalyticsDashboardPage.tsx`: Traffic analytics, charts, metrics

2. **`auth/`**:
   - `LoginPage.tsx`: Login form
   - `RegisterPage.tsx`: User registration

3. **`dashboard/`**:
   - `DashboardPage.tsx`: Overview dashboard with site statistics

4. **`deployments/`**:
   - `DeploymentPage.tsx`: Deployment history and management

5. **`media/`**:
   - `MediaLibraryPage.tsx`: Media file manager with upload

6. **`pages/`**:
   - `PagesListPage.tsx`: Site pages list
   - `PageFormPage.tsx`: Page creation/editing form
   - `PageBuilderPage.tsx`: Drag-and-drop page builder with blocks

7. **`prompts/`**:
   - `PromptsPage.tsx`: AI prompt management

8. **`settings/`**:
   - `SettingsPage.tsx`: User settings and preferences

9. **`sites/`**:
   - `SitesListPage.tsx`: User's sites list
   - `SiteDetailPage.tsx`: Site overview and stats
   - `SiteFormPage.tsx`: Site creation/editing
   - `SiteCreatePage.tsx`: New site wizard

10. **`templates/`**:
    - `TemplatesPage.tsx`: Template library
    - `TemplateEditorPage.tsx`: Template HTML/CSS/JS editor

11. **`users/`**:
    - `UsersListPage.tsx`: User management (admin)
    - `UserDetailPage.tsx`: User profile and permissions

---

#### `frontend/src/store/`

**Redux Toolkit state management with RTK Query**

**`api/` directory - API endpoint definitions**:

1. **`apiSlice.ts`**: Base API configuration
   - Base URL setup
   - JWT token injection
   - Tag invalidation for cache management

2. **`authApi.ts`**: Authentication
   - `login()`: User login with JWT
   - `register()`: User registration
   - `getCurrentUser()`: Fetch current user data

3. **`sitesApi.ts`**: Site management
   - CRUD operations for sites
   - Language and affiliate link endpoints

4. **`templatesApi.ts`**: Template management
   - Template and footprint CRUD
   - Variable and section management

5. **`pagesApi.ts`**: Page and block management
   - Page CRUD with blocks
   - Block ordering and content updates

6. **`mediaApi.ts`**: Media library
   - File upload with progress
   - Folder management
   - Media search and filtering

7. **`deploymentsApi.ts`**: Deployment operations
   - Deploy site
   - Deployment history
   - Build logs

8. **`analyticsApi.ts`**: Analytics data
   - Traffic metrics
   - Page views tracking

9. **`aiApi.ts`**: AI services
   - Content generation
   - Prompt management

10. **`usersApi.ts`**: User management
    - User CRUD (admin)
    - Profile updates

**`slices/` directory**:
- `authSlice.ts`: Authentication state (user, tokens, isAuthenticated)

---

#### `frontend/src/types/`

**TypeScript type definitions** (`index.ts`):

- `User`, `Site`, `Page`, `PageBlock`
- `Template`, `TemplateVariable`, `TemplateFootprint`
- `Media`, `MediaFolder`
- `Deployment`, `Analytics`
- `AIPrompt`, `AIGenerationResult`
- Form data interfaces: `SiteFormData`, `PageFormData`, etc.

---

## 📊 Database Models

### Entity Relationship Diagram

```
User ──┬──< Site ──┬──< Page ──< PageBlock
       │           │
       │           ├──< Deployment
       │           │
       └──< Media  └──> Template ──┬──< TemplateVariable
                                    ├──< TemplateSection
                                    ├──< TemplateAsset
                                    └──< TemplateFootprint

Site ──> CloudflareToken ──> ApiToken
     ──> AffiliateLink
     ──> Language

PageBlock ──> Prompt
          ──> SwiperPreset ──> AffiliateLink

Site ──< Analytics
     ──< PageView
```

### Core Models

1. **User**
   - Custom Django user with role field (admin/user)
   - Email required
   - Site access control

2. **Site**
   - Domain, brand name, language
   - Template configuration with variables and colors
   - External service integration
   - SEO settings

3. **Template**
   - HTML/CSS/JS content
   - Variable system
   - Footprint configurations
   - Asset management

4. **Page**
   - SEO metadata
   - Block-based content
   - AI keyword integration

5. **PageBlock**
   - JSON content storage
   - Multiple block types
   - Ordering system

6. **Media**
   - File storage with metadata
   - Folder organization
   - Image dimensions

7. **Deployment**
   - Status tracking
   - Template snapshots
   - Build metrics

8. **Analytics**
   - Traffic metrics
   - Conversion tracking
   - Revenue estimation

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login/` - JWT login
- `POST /api/auth/refresh/` - Refresh token
- `GET /api/users/me/` - Current user

### Sites
- `GET /api/sites/` - List sites
- `POST /api/sites/` - Create site
- `GET /api/sites/{id}/` - Site details
- `PUT /api/sites/{id}/` - Update site
- `DELETE /api/sites/{id}/` - Delete site

### Pages
- `GET /api/pages/` - List pages (filtered by site)
- `POST /api/pages/` - Create page
- `GET /api/pages/{id}/` - Page details
- `PUT /api/pages/{id}/` - Update page
- `DELETE /api/pages/{id}/` - Delete page

### Page Blocks
- `GET /api/page-blocks/` - List blocks
- `POST /api/page-blocks/` - Create block
- `PUT /api/page-blocks/{id}/` - Update block
- `DELETE /api/page-blocks/{id}/` - Delete block

### Templates
- `GET /api/templates/` - List templates
- `POST /api/templates/` - Create template
- `GET /api/templates/{id}/` - Template details
- `PUT /api/templates/{id}/` - Update template

### Template Footprints
- `GET /api/template-footprints/` - List footprints
- `POST /api/template-footprints/` - Create footprint
- `GET /api/template-footprints/{id}/` - Footprint details

### Media
- `GET /api/media/` - List media files
- `POST /api/media/` - Upload file
- `GET /api/media/{id}/` - File details
- `DELETE /api/media/{id}/` - Delete file

### Media Folders
- `GET /api/media-folders/` - List folders
- `POST /api/media-folders/` - Create folder
- `DELETE /api/media-folders/{id}/` - Delete folder

### Deployments
- `GET /api/deployments/` - List deployments
- `POST /api/deployments/` - Create deployment
- `GET /api/deployments/{id}/` - Deployment details

### Analytics
- `GET /api/analytics/` - Analytics data
- `POST /api/analytics/track/` - Track page view

### Prompts
- `GET /api/prompts/` - List AI prompts
- `POST /api/prompts/` - Create prompt
- `PUT /api/prompts/{id}/` - Update prompt

### Languages & Affiliate Links
- `GET /api/languages/` - Supported languages
- `GET /api/affiliate-links/` - Affiliate links

### Integrations
- `GET /api/api-tokens/` - List API tokens
- `POST /api/api-tokens/` - Create token
- `GET /api/cloudflare-tokens/` - Cloudflare configs

---

## ✨ Key Features

### 1. AI-Powered Content Generation
- OpenAI GPT-4/GPT-3.5 integration
- Anthropic Claude support
- Custom prompt templates with variable replacement
- Content generation for page blocks
- Temperature and token control

### 2. Template System
- Monolithic and sectional templates
- Variable replacement engine
- Custom color schemes
- CMS footprint simulation (WordPress, Joomla, Drupal)
- Asset management with auto-format generation

### 3. Page Builder
- Drag-and-drop block arrangement
- Multiple block types: hero, text, image, gallery, swiper
- JSON-based content storage
- SEO optimization fields
- AI content generation integration

### 4. Deployment Engine
- Automated site building
- Template processing with unique identifiers
- Image optimization (WebP conversion)
- Cloudflare Pages integration
- Git-based versioning
- Background task processing with Celery

### 5. Media Library
- Folder organization
- Multi-format support (images, documents, videos)
- File size validation (30MB limit)
- Image dimension tracking
- User upload tracking

### 6. Analytics Dashboard
- Traffic metrics (visitors, pageviews)
- Traffic source tracking
- Conversion rate calculation
- Revenue estimation
- Date-range filtering

### 7. Multi-Site Management
- Domain-based site separation
- Template inheritance
- Custom branding per site
- Language support
- Affiliate link integration

### 8. Role-Based Access Control
- Admin and user roles
- Site-based permissions
- JWT authentication
- Protected API endpoints

---

## 🔐 Environment Configuration

### Backend Environment Variables

Create a `.env` file in the project root:

```bash
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=panel
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432

# Redis & Celery
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# AI Services
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Cloudflare
CLOUDFLARE_API_KEY=your-cloudflare-api-key
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token

# Optional
BACKEND_PORT=8000
FRONTEND_PORT=3000
REDIS_PORT=6379
```

### Frontend Environment Variables

Create `frontend/.env`:

```bash
VITE_API_URL=http://localhost:8000
```

---

## 🚀 Deployment

### Docker Compose (Development)

```bash
# Build and start all services
docker-compose up -d

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput
```

### Service Endpoints (Development)

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Django Admin**: http://localhost:8000/admin/
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Production Deployment

1. **Backend**:
   - Set `DEBUG=False`
   - Configure proper `ALLOWED_HOSTS`
   - Use environment variables for secrets
   - Run with Gunicorn: `gunicorn --bind 0.0.0.0:8000 panel.wsgi:application`
   - Set up HTTPS with reverse proxy (Nginx/Caddy)

2. **Frontend**:
   - Build: `npm run build`
   - Serve with Nginx
   - Configure API URL in environment

3. **Database**:
   - Use managed PostgreSQL (AWS RDS, DigitalOcean)
   - Regular backups
   - Connection pooling

4. **Celery**:
   - Run worker: `celery -A panel worker -l info`
   - Run beat: `celery -A panel beat -l info`
   - Use supervisor/systemd for process management

5. **Monitoring**:
   - Sentry for error tracking
   - Custom analytics dashboard
   - Server monitoring (CPU, memory, disk)

---

## 📝 Additional Notes

### Database Indexes
- Optimized queries with indexes on frequently filtered fields
- Site-based filtering
- User access patterns
- Analytics date ranges

### Caching Strategy
- Redis for Celery broker and results
- RTK Query automatic caching on frontend
- Static file caching with WhiteNoise

### Security Features
- JWT authentication with token rotation
- CORS configuration for API access
- File upload validation
- SQL injection protection (Django ORM)
- XSS protection (React)
- CSRF protection (Django middleware)

### Performance Optimizations
- Database query optimization with `select_related` and `prefetch_related`
- Background task processing (Celery)
- Image optimization (WebP, lazy loading)
- Frontend code splitting (Vite)
- Static asset compression (WhiteNoise)

### Testing
- Backend: pytest with Django integration
- Test coverage tracking with pytest-cov
- Factory Boy for test data generation

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🤝 Contributing

This is a private project. Contact the project maintainer for contribution guidelines.

---

**Last Updated**: October 21, 2025

