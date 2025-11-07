# Panel - Website Management Platform

A full-stack web application for managing multiple websites, templates, pages, and content with AI-powered features, analytics, and deployment capabilities.

## Table of Contents

- [Project Structure](#project-structure)
- [Backend (Django)](#backend-django)
  - [Apps Overview](#apps-overview)
  - [App Descriptions](#app-descriptions)
- [Frontend (React + TypeScript)](#frontend-react--typescript)
  - [Components](#components)
  - [Pages](#pages)
  - [Store (Redux)](#store-redux)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)

## Project Structure

```
panel/
├── backend/          # Django REST API
│   ├── analytics/    # Analytics tracking and reporting # Page View have a lot of not impelemented fields, some logic also simplified
│   ├── backup/       # Backup and recovery services
│   ├── deployment/   # Site deployment management
│   ├── integrations/ # Third-party API integrations
│   ├── media/        # Media library management
│   ├── pages/        # Page and content block management
│   ├── performance/  # Performance optimization services
│   ├── prompts/      # AI prompt templates
│   ├── security/     # Security and access control
│   ├── sites/        # Site management
│   ├── templates/    # Template management
│   └── users/        # User authentication and management
│
└── frontend/         # React + TypeScript application
    └── src/
        ├── components/  # Reusable React components
        ├── pages/      # Page components (routes)
        ├── store/      # Redux store and API slices
        └── utils/      # Utility functions
```

## Backend (Django)

### Apps Overview

The backend is built with Django REST Framework and consists of the following apps:

1. **users** - User authentication and management
2. **sites** - Site configuration and management
3. **templates** - Template system with footprints and variables
4. **pages** - Page and content block management
5. **media** - Media library with folders and tags
6. **prompts** - AI prompt templates for content generation
7. **analytics** - Analytics tracking and reporting
8. **deployment** - Site deployment to Cloudflare Pages
9. **integrations** - Third-party API token management
10. **backup** - Backup and recovery services
11. **performance** - Performance optimization services
12. **security** - Security and access control services

### App Descriptions

#### 1. users

**Purpose:** User authentication, authorization, and account management.

**Key Models:**
- `User` - Custom user model extending AbstractUser with role-based access (admin/user)

**Features:**
- JWT-based authentication
- Role-based access control (admin/user)
- User registration and profile management

#### 2. sites

**Purpose:** Core site management - domain configuration, branding, template assignment, and site settings.

**Key Models:**
- `Site` - Main site entity with domain, brand name, template configuration
- `Language` - Supported languages for multi-language sites
- `AffiliateLink` - Affiliate marketing links

**Features:**
- Site creation wizard
- Template assignment with footprint configuration
- Custom color schemes
- Domain setup and DNS configuration
- Media asset assignment (logo, favicon)
- SEO settings (indexing, canonical URLs)
- Affiliate link management

#### 3. templates

**Purpose:** Template system for generating websites - supports monolithic and sectional templates.

**Key Models:**
- `Template` - HTML/CSS/JS templates with variable placeholders
- `TemplateFootprint` - CMS-specific footprint configurations (WordPress, Joomla, etc.)
- `TemplateVariable` - Variable definitions for template customization
- `TemplateSection` - Modular sections for sectional templates
- `TemplateAsset` - Template assets (logos, favicons, images)

**Features:**
- Monolithic and sectional template types
- CSS framework support (Tailwind, Bootstrap, Custom)
- Color customization
- CMS footprint support (WordPress, Joomla, Drupal, Static)
- Template versioning
- Asset management

#### 4. pages

**Purpose:** Page and content block management - building pages with various content blocks.

**Key Models:**
- `Page` - Individual pages with SEO metadata
- `PageBlock` - Content blocks (hero, article, image, CTA, FAQ, swiper)
- `SwiperPreset` - Predefined game carousels for swiper blocks

**Features:**
- Page builder with drag-and-drop blocks
- Multiple block types (hero, article, image, text-image, CTA, FAQ, swiper)
- SEO optimization (meta tags, canonical URLs, keywords, LSI phrases)
- Block ordering and content management
- AI-powered content generation
- Swiper presets for game carousels

#### 5. media

**Purpose:** Media library for managing images, videos, and files with organization features.

**Key Models:**
- `Media` - Media files with metadata (images, videos, documents)
- `MediaFolder` - Hierarchical folder structure
- `MediaTag` - Tagging system for media organization

**Features:**
- File upload and management
- Image optimization (thumbnail, medium, large, WebP variants)
- Folder hierarchy
- Tag-based organization
- Media analytics (usage tracking)
- Favicon generation
- Image compression and optimization

#### 6. prompts

**Purpose:** AI prompt templates for automated content and image generation.

**Key Models:**
- `Prompt` - AI prompt templates with model configuration

**Features:**
- Text and image generation prompts
- Multiple AI model support (GPT-4, Claude, DALL-E, etc.)
- Block-type specific prompts
- Temperature and token configuration
- System prompt support
- Prompt versioning

#### 7. analytics

**Purpose:** Site analytics tracking, reporting, and real-time analytics.

**Key Models:**
- `Analytics` - Daily analytics data (visitors, pageviews, conversions, revenue)
- `PageView` - Individual page view tracking

**Features:**
- Visitor and pageview tracking
- Traffic source analysis (organic, direct, referral, social, paid)
- Conversion tracking
- Revenue tracking (affiliate commissions)
- Bounce rate and session duration
- Real-time analytics dashboard
- Advanced analytics reports

#### 8. deployment

**Purpose:** Site deployment to Cloudflare Pages with Git integration.

**Key Models:**
- `Deployment` - Deployment history with status and build logs

**Features:**
- Cloudflare Pages deployment
- Git repository integration
- Build status tracking
- Deployment history
- Template snapshot preservation
- Build logs and metrics
- File generation tracking
- Unique identifier management

#### 9. integrations

**Purpose:** Third-party API token management and integrations.

**Key Models:**
- `ApiToken` - API tokens for various services (ChatGPT, Claude, Cloudflare, etc.)
- `CloudflareToken` - Cloudflare-specific configuration

**Features:**
- API token management for multiple services
- Service support: ChatGPT, Grok, Claude, Cloudflare, ElevenLabs, DALL-E, Midjourney
- Token usage tracking
- Cloudflare token configuration (account ID, zone ID, Pages project)
- Third-party integrations management

#### 10. backup

**Purpose:** Database and filesystem backup and recovery services.

**Features:**
- Database backup creation and restoration
- Filesystem backup (with optional media inclusion)
- Complete backup (database + filesystem)
- Backup scheduling
- Cloud storage upload/download (S3 support)
- Backup listing and deletion
- Automatic cleanup of old backups
- Backup analytics

#### 11. performance

**Purpose:** Performance optimization services for sites and media.

**Features:**
- Cache statistics and management
- Cache invalidation by pattern
- Database query optimization
- Image compression and optimization
- CDN performance monitoring
- CDN optimization settings
- System performance metrics
- Performance recommendations
- Performance testing tools

#### 12. security

**Purpose:** Security and access control services.

**Features:**
- Password strength validation
- User account creation and management
- Email verification
- Secure authentication with IP tracking
- Role assignment
- Permission checking
- Security event logging
- Threat detection
- Data encryption/decryption
- Compliance status checking

## Frontend (React + TypeScript)

### Components

The frontend is organized into component directories by feature:

#### analytics/
- `AdvancedAnalyticsDashboard.tsx` - Advanced analytics visualization and reports
- `RealtimeAnalyticsDashboard.tsx` - Real-time analytics dashboard

#### auth/
- `LoginPage.tsx` - User login form
- `PrivateRoute.tsx` - Route protection component
- `RegisterPage.tsx` - User registration form

#### automation/
- `ContentAutomationManager.tsx` - AI-powered content automation management

#### backup/
- `BackupRecoveryManager.tsx` - Backup and recovery interface

#### blocks/
- `ArticleBlock.tsx` - Article/text content block editor
- `CTABlock.tsx` - Call-to-action block editor
- `FAQBlock.tsx` - FAQ section block editor
- `GalleryBlock.tsx` - Image gallery block editor
- `HeroBlock.tsx` - Hero banner block editor
- `ImageBlock.tsx` - Image block editor
- `SwiperBlock.tsx` - Game carousel/swiper block editor
- `TextBlock.tsx` - Text block editor
- `TextImageBlock.tsx` - Text + image combination block editor

#### common/
- `AIMetaGenerator.tsx` - AI-powered meta tag generation
- `CompetitorAnalysis.tsx` - Competitor analysis tools
- `DuplicateMetaWarning.tsx` - Warning for duplicate meta tags
- `GoogleSearchPreview.tsx` - Google search result preview
- `LanguageSwitcher.tsx` - Multi-language switcher
- `LSIKeywordResearch.tsx` - LSI keyword research tool
- `MetaFieldWithCounter.tsx` - Meta field input with character counter
- `RichTextEditor.tsx` - Rich text editor (TipTap)
- `SchemaManager.tsx` - JSON-LD schema markup manager
- `SEOScoreCard.tsx` - SEO score visualization
- `SitemapManager.tsx` - XML sitemap management

#### deployments/
- Deployment-related components

#### integrations/
- `ThirdPartyIntegrationsManager.tsx` - Third-party integrations management interface

#### layouts/
- `DashboardLayout.tsx` - Main dashboard layout wrapper
- `Sidebar.tsx` - Navigation sidebar
- `TopBar.tsx` - Top navigation bar

#### media/
- `AdvancedFilters.tsx` - Advanced media filtering
- `FaviconGenerator.tsx` - Favicon generation tool
- `FaviconGeneratorModal.tsx` - Favicon generator modal
- `FolderMoveDialog.tsx` - Move media between folders dialog
- `MediaAnalyticsDashboard.tsx` - Media usage analytics
- `MediaSelector.tsx` - Media file selector component
- `MediaTagSelector.tsx` - Media tag selection component
- `MediaUsageDialog.tsx` - Show where media is used
- `TagManager.tsx` - Media tag management

#### pages/
- `BlockRegenerationModal.tsx` - Regenerate block content with AI
- `ContentGenerationModal.tsx` - AI content generation modal
- `EnhancedContentGenerationModal.tsx` - Enhanced AI content generation
- `QuickGenerationButton.tsx` - Quick content generation button
- `SwiperPresetManager.tsx` - Swiper preset management

#### performance/
- `PerformanceOptimizationManager.tsx` - Performance optimization interface

#### security/
- `SecurityAccessControlManager.tsx` - Security and access control interface

#### sites/
- `BasicConfigStep.tsx` - Basic site configuration step (wizard)
- `DomainSetupModal.tsx` - Domain configuration modal
- `DomainSetupStep.tsx` - Domain setup step (wizard)
- `MediaAssetsStep.tsx` - Media assets assignment step (wizard)
- `PageRulesManager.tsx` - Page rules management
- `PageStructureStep.tsx` - Page structure configuration step (wizard)
- `SEOSettingsStep.tsx` - SEO settings step (wizard)
- `SiteCreationWizard.tsx` - Multi-step site creation wizard
- `TokenSelectionModal.tsx` - API token selection modal

#### templates/
- `TemplateUniquenessManager.tsx` - Template uniqueness management

### Pages

The pages directory contains route-level components:

#### analytics/
- `AnalyticsDashboardPage.tsx` - Main analytics dashboard page

#### auth/
- `LoginPage.tsx` - Login page
- `RegisterPage.tsx` - Registration page

#### dashboard/
- `DashboardPage.tsx` - Main dashboard overview

#### deployments/
- `DeploymentPage.tsx` - Deployment management page

#### integrations/
- `ApiTokensPage.tsx` - API tokens management page
- `CloudflareTokensPage.tsx` - Cloudflare tokens page

#### media/
- `MediaLibraryPage.tsx` - Media library main page

#### pages/
- `PageBuilderPage.tsx` - Visual page builder
- `PageFormPage.tsx` - Page create/edit form
- `PagesListPage.tsx` - Pages list view

#### prompts/
- `PromptFormPage.tsx` - Prompt create/edit form
- `PromptsPage.tsx` - Prompts list view

#### settings/
- `SettingsPage.tsx` - Application settings

#### sites/
- `SiteDetailPage.tsx` - Site detail view
- `SiteFormPage.tsx` - Site create/edit form
- `SitesListPage.tsx` - Sites list view

#### templates/
- `TemplateCreatePage.tsx` - Template creation page
- `TemplateEditorPage.tsx` - Template editor interface
- `TemplatesPage.tsx` - Templates list view

#### users/
- `UserDetailPage.tsx` - User detail view
- `UsersListPage.tsx` - Users list view

### Store (Redux)

Redux Toolkit with RTK Query for API management:

#### api/
- `aiApi.ts` - AI service API endpoints
- `analyticsApi.ts` - Analytics API endpoints
- `authApi.ts` - Authentication API endpoints
- `backupApi.ts` - Backup API endpoints
- `deploymentsApi.ts` - Deployment API endpoints
- `integrationsApi.ts` - Integrations API endpoints
- `mediaApi.ts` - Media API endpoints
- `pagesApi.ts` - Pages API endpoints
- `performanceApi.ts` - Performance API endpoints
- `securityApi.ts` - Security API endpoints
- `sitesApi.ts` - Sites API endpoints
- `templatesApi.ts` - Templates API endpoints
- `usersApi.ts` - Users API endpoints
- `apiSlice.ts` - Base API slice configuration

#### slices/
- `authSlice.ts` - Authentication state management

## Technology Stack

### Backend

- **Framework:** Django 4.2.7
- **API:** Django REST Framework 3.14.0
- **Authentication:** JWT (djangorestframework-simplejwt)
- **Database:** PostgreSQL
- **Task Queue:** Celery 5.3.4 with Redis
- **File Storage:** django-storages (S3 support), Pillow for image processing
- **AI Integration:** OpenAI, Anthropic (Claude)
- **External Services:** Cloudflare API, GitPython
- **Code Quality:** Black, isort, flake8
- **Testing:** pytest, pytest-django

### Frontend

- **Framework:** React 18.2.0
- **Language:** TypeScript 5.9.3
- **Build Tool:** Vite 7.7
- **UI Library:** Material-UI (MUI) 7.3.4
- **State Management:** Redux Toolkit 2.9.1 with RTK Query
- **Routing:** React Router DOM 7.9.4
- **Forms:** React Hook Form 7.65.0 with Zod validation
- **Rich Text Editor:** TipTap 3.8.0
- **Charts:** Chart.js 4.4.1, Recharts 3.3.0
- **Internationalization:** i18next 25.6.0
- **Testing:** Vitest 1.0.4, React Testing Library

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL 12+
- Redis (for Celery)

### Backend Setup

1. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Set up environment variables (`.env` file):
```
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=panel
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

3. Run migrations:
```bash
python manage.py migrate
```

4. Create superuser:
```bash
python manage.py createsuperuser
```

5. Run development server:
```bash
python manage.py runserver
```

6. Run Celery worker (in separate terminal):
```bash
celery -A panel worker -l info
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000` (frontend) and `http://localhost:8000` (backend API).

### Docker Setup

Use docker-compose to run the entire stack:

```bash
docker-compose up -d
```

## License

[Specify your license here]

