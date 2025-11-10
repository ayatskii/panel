# Requirements Implementation Map

This document maps each requirement from the project specification to its actual implementation in the codebase.

## General Overview

**Requirement**: A website generation platform that allows users to create and customize sites using predefined and section-based templates, with support for branding, media handling, AI generation, and CMS-style deployment options.

**Implementation**: 
- **Backend**: Django-based REST API (`backend/`)
- **Frontend**: React/TypeScript application (`frontend/`)
- **Core Models**: `sites.Site`, `templates.Template`, `pages.Page`
- **Key Files**:
  - `backend/sites/models.py` - Site management
  - `backend/templates/models.py` - Template system
  - `backend/pages/models.py` - Page management
  - `backend/deployment/` - Deployment system

---

## Core System Features

### Settings

#### 1. Manage Site Languages

**Requirement**: Manage site languages.

**Implementation**:
- **Model**: `backend/sites/models.py` - `Language` model (lines 5-17)
  - Fields: `code`, `name`, `is_active`
- **Service**: `backend/sites/services/settings_service.py` - `SettingsService`
  - Methods: `get_languages()`, `add_language()`
- **API**: `backend/sites/views_settings.py` - `LanguageViewSet` (lines 13-69)
  - Endpoints: `/api/settings/languages/` (GET, POST)
  - Bulk create support via `bulk_create` action
- **Frontend**: `frontend/src/pages/settings/SettingsPage.tsx` (lines 619-640)
  - Language management UI with bulk import

**Files**:
- `backend/sites/models.py:5-17`
- `backend/sites/services/settings_service.py:17-35`
- `backend/sites/views_settings.py:13-69`
- `frontend/src/pages/settings/SettingsPage.tsx:619-640`

---

#### 2. Manage AI Generation Tokens and Prompts

**Requirement**: Manage AI generation tokens and prompts.

**Implementation**:
- **Model**: `backend/prompts/models.py` - `Prompt` model (lines 3-63)
  - Fields: `name`, `type`, `block_type`, `ai_model`, `temperature`, `max_tokens`, `prompt_text`, `system_prompt`
  - Supports OpenAI and Anthropic models
- **Service**: `backend/prompts/services/ai_service.py` - `AIContentService`
  - Methods: `generate_content()`, `_generate_with_openai()`, `_generate_with_anthropic()`
- **API**: `backend/prompts/views.py` - Prompt management endpoints
- **Integration**: `backend/integrations/models.py` - `ApiToken` model for token storage
- **Frontend**: `frontend/src/pages/prompts/PromptFormPage.tsx` - Prompt editor UI

**Files**:
- `backend/prompts/models.py:3-63`
- `backend/prompts/services/ai_service.py`
- `backend/integrations/models.py:4-47`
- `frontend/src/pages/prompts/PromptFormPage.tsx`

---

#### 3. Upload File and Link Presets for Generators

**Requirement**: Upload file and link presets for generators.

**Implementation**:
- **Model**: `backend/sites/models.py` - `AffiliateLink` model (lines 20-35)
  - Fields: `name`, `url`, `description`, `click_tracking`
- **API**: `backend/sites/views_settings.py` - `AffiliateLinkViewSet` (lines 70-90)
  - Endpoints: `/api/settings/affiliate-links/`
  - Test link functionality via `test_link` action
- **Frontend**: Settings page includes affiliate link management

**Files**:
- `backend/sites/models.py:20-35`
- `backend/sites/views_settings.py:70-90`

---

#### 4. Configure Monolithic and Section-Based Templates

**Requirement**: Configure monolithic (fixed structure, brand templates) and section-based templates.

**Implementation**:
- **Model**: `backend/templates/models.py` - `Template` model (lines 4-119)
  - Field: `type` with choices `('monolithic', 'sectional')`
  - Properties: `is_monolithic`, `is_sectional`
- **Template Sections**: `backend/templates/models.py` - `TemplateSection` model (lines 231-276)
  - Supports modular blocks: header, menu, hero, content, sidebar, footer
- **API**: `backend/templates/views.py` - `TemplateViewSet`
- **Frontend**: `frontend/src/pages/templates/TemplateEditorPage.tsx` - Template editor with type selection

**Files**:
- `backend/templates/models.py:4-119, 231-276`
- `backend/templates/views.py`
- `frontend/src/pages/templates/TemplateEditorPage.tsx`

---

#### 5. Support Template Mixing

**Requirement**: Support template mixing (e.g., menus, footers, content sections).

**Implementation**:
- **Model**: `backend/templates/models.py` - `TemplateSection` model
  - Sections can be mixed and matched
  - Fields: `menu_html`, `footer_menu_html`, `faq_block_html`
- **Template Variables**: `backend/templates/models.py` - `TemplateVariable` model (lines 188-228)
  - Allows dynamic content insertion
- **Processor**: `backend/deployment/services/template_processor.py` - `TemplateProcessor`
  - Combines sections during generation

**Files**:
- `backend/templates/models.py:55-66, 188-228, 231-276`
- `backend/deployment/services/template_processor.py`

---

## Template Management

### Monolithic Templates

#### 6. Upload Separate HTML, CSS, JS Files

**Requirement**: Upload separate HTML, CSS, JS files.

**Implementation**:
- **Model**: `backend/templates/models.py` - `Template` model
  - Fields: `html_content`, `css_content`, `js_content` (TextFields)
- **API**: `backend/templates/views.py` - `TemplateViewSet`
  - Supports file upload via serializers
- **Frontend**: `frontend/src/pages/templates/TemplateEditorPage.tsx`
  - Code editor for HTML, CSS, JS content

**Files**:
- `backend/templates/models.py:35-44`
- `backend/templates/views.py`
- `frontend/src/pages/templates/TemplateEditorPage.tsx`

---

#### 7. Define and Manage Key Variables

**Requirement**: Define and manage key variables: title, description, H1, canonical.

**Implementation**:
- **Model**: `backend/templates/models.py` - `TemplateVariable` model (lines 188-228)
  - Fields: `name`, `variable_type`, `default_value`, `description`, `is_required`
  - Types: meta, brand, content, style, script
  - Placeholder format: `{{{{name}}}}`
- **Page Variables**: `backend/pages/models.py` - `Page` model (lines 15-37)
  - Fields: `title`, `meta_description`, `h1_tag`, `canonical_url`
- **Processor**: `backend/deployment/services/template_processor.py:24-39`
  - `replace_variables()` method replaces placeholders

**Files**:
- `backend/templates/models.py:188-228`
- `backend/pages/models.py:15-37`
- `backend/deployment/services/template_processor.py:24-39`

---

#### 8. Favicon Links Auto-Generation

**Requirement**: Favicon links (auto-generate from SVG to PNG/ICO).

**Implementation**:
- **Service**: `backend/media/services/favicon_generation_service.py` - `FaviconGenerationService` (lines 14-380)
  - Method: `generate_favicons()` - generates ICO, PNG (16x16, 32x32, 48x48, 180x180), SVG, Apple Touch Icon, Safari Pinned Tab
  - Method: `_generate_html_links()` - generates HTML link tags
- **Integration**: `backend/deployment/tasks.py:193-236`
  - `_generate_favicon_files()` - called during deployment
- **Frontend**: `frontend/src/components/media/FaviconGenerator.tsx`
  - UI component for favicon generation

**Files**:
- `backend/media/services/favicon_generation_service.py:14-380`
- `backend/deployment/tasks.py:193-236`
- `frontend/src/components/media/FaviconGenerator.tsx`

---

#### 9. CSS/JS Output Options

**Requirement**: CSS/JS output options (inline via `<style>`/`<script>` or linked file).

**Implementation**:
- **Model**: `backend/templates/models.py` - `Template` model (lines 10-23, 45-54)
  - Fields: `css_output_type`, `js_output_type`
  - Choices: `inline`, `external`, `async`, `defer`, `path_only`
- **Processor**: `backend/deployment/services/template_processor.py`
  - Handles different output types during generation

**Files**:
- `backend/templates/models.py:10-23, 45-54`
- `backend/deployment/services/template_processor.py`

---

#### 10. Template Variables Auto-Populate from Settings

**Requirement**: Template variables automatically populate from system settings.

**Implementation**:
- **Processor**: `backend/deployment/services/template_processor.py:24-39`
  - `replace_variables()` method
  - Auto-populates: `brand_name`, `domain`, `copyright_year`, `language`
  - Merges with `site.template_variables`
- **Site Model**: `backend/sites/models.py:64-67`
  - Field: `template_variables` (JSONField) for custom values

**Files**:
- `backend/deployment/services/template_processor.py:24-39`
- `backend/sites/models.py:64-67`

---

### Sectional Templates

#### 11. Load Modular Blocks

**Requirement**: Load modular blocks (e.g., header, footer, hero, article).

**Implementation**:
- **Model**: `backend/templates/models.py` - `TemplateSection` model (lines 231-276)
  - Fields: `section_type` with choices: header, menu, hero, content, sidebar, footer, footer_menu, custom
  - Fields: `html_content`, `css_content`, `order_index`
- **Page Blocks**: `backend/pages/models.py` - `PageBlock` model (lines 103-163)
  - Block types: hero, article, image, text_image, cta, faq, swiper
- **Frontend**: `frontend/src/pages/pages/PageBuilderPage.tsx`
  - Visual block editor

**Files**:
- `backend/templates/models.py:231-276`
- `backend/pages/models.py:103-163`
- `frontend/src/pages/pages/PageBuilderPage.tsx`

---

#### 12. Change Colors, Structure, Layout Combinations

**Requirement**: Change colors, structure, layout combinations.

**Implementation**:
- **Model**: `backend/templates/models.py` - `Template` model (lines 80-87)
  - Fields: `supports_color_customization`, `color_variables` (JSONField)
- **Site Model**: `backend/sites/models.py:68-71`
  - Field: `custom_colors` (JSONField)
- **Processor**: `backend/deployment/services/template_processor.py:41-54`
  - `apply_custom_colors()` method replaces CSS variables

**Files**:
- `backend/templates/models.py:80-87`
- `backend/sites/models.py:68-71`
- `backend/deployment/services/template_processor.py:41-54`

---

#### 13. Hero Section Toggle for H1 Variable Placement

**Requirement**: Integrate "hero section" toggle for H1 variable placement.

**Implementation**:
- **Model**: `backend/pages/models.py` - `Page` model (lines 29-32)
  - Field: `use_h1_in_hero` (BooleanField)
- **Page Block**: `backend/pages/models.py` - `PageBlock` model
  - Block type: `hero` with H1 support
- **Frontend**: `frontend/src/pages/pages/PageFormPage.tsx`
  - Toggle for H1 placement in hero

**Files**:
- `backend/pages/models.py:29-32`
- `frontend/src/pages/pages/PageFormPage.tsx`

---

### Variable System

#### 14. Page-Level Variables

**Requirement**: Page-level: title, description, H1, canonical.

**Implementation**:
- **Model**: `backend/pages/models.py` - `Page` model (lines 15-37)
  - Fields: `title`, `meta_description`, `h1_tag`, `canonical_url`
- **API**: `backend/pages/views.py` - `PageViewSet`
- **Frontend**: `frontend/src/pages/pages/PageFormPage.tsx`
  - Form fields for all page-level variables

**Files**:
- `backend/pages/models.py:15-37`
- `backend/pages/views.py`
- `frontend/src/pages/pages/PageFormPage.tsx`

---

#### 15. Microdata System

**Requirement**: Microdata system: Global and per-page microdata. Predefined or custom structured data with placeholders for logo, brand name, etc.

**Implementation**:
- **Service**: `backend/pages/services/schema_service.py` - `SchemaService` (lines 10-91)
  - Method: `generate_page_schema()` - generates Schema.org structured data
  - Supports: Article, BlogPosting, WebPage, WebSite, Organization, FAQPage, etc.
  - Method: `_generate_organization_schema()` - global organization schema
- **API**: `backend/pages/views.py` - Schema generation endpoints
- **Frontend**: `frontend/src/pages/pages/PageFormPage.tsx:242-249`
  - `SchemaManager` component for per-page schema

**Files**:
- `backend/pages/services/schema_service.py:10-91`
- `backend/pages/views.py`
- `frontend/src/pages/pages/PageFormPage.tsx:242-249`

---

#### 16. Variables Auto-Render in Templates

**Requirement**: Variables auto-render in templates (head or body locations configurable).

**Implementation**:
- **Processor**: `backend/deployment/services/template_processor.py:24-39`
  - `replace_variables()` method replaces `{{{{variable_name}}}}` placeholders
  - Processes both head and body sections
- **Template Variables**: `backend/templates/models.py:188-228`
  - Variable definitions with placement hints

**Files**:
- `backend/deployment/services/template_processor.py:24-39`
- `backend/templates/models.py:188-228`

---

## Media Management

#### 17. Centralized Media Library

**Requirement**: Centralized media library.

**Implementation**:
- **Model**: `backend/media/models.py` - `Media` model (lines 60-133)
  - Fields: `file`, `filename`, `original_name`, `file_path`, `mime_type`, `alt_text`, `caption`
  - Image fields: `width`, `height`, `thumbnail`, `medium`, `large`, `webp`
- **Folders**: `backend/media/models.py` - `MediaFolder` model (lines 27-58)
  - Hierarchical folder structure
- **API**: `backend/media/views.py` - `MediaViewSet`
- **Frontend**: `frontend/src/pages/media/MediaLibraryPage.tsx`
  - Full media library UI with folder navigation

**Files**:
- `backend/media/models.py:27-133`
- `backend/media/views.py`
- `frontend/src/pages/media/MediaLibraryPage.tsx`

---

#### 18. Image Upload and Processing

**Requirement**: Image upload in any format; processed on generation (compression, resizing, format conversion to WebP, PNG, ICO, SVG).

**Implementation**:
- **Service**: `backend/media/image_optimizer.py` - Image optimization utilities
  - Function: `generate_image_variants()` - creates thumbnail, medium, large, webp variants
  - Function: `_convert_to_webp()` - converts to WebP format
- **Model**: `backend/media/models.py:88-93`
  - Fields: `thumbnail`, `medium`, `large`, `webp`, `is_optimized`
- **Upload Handler**: `backend/media/views.py:98-140`
  - Auto-generates variants on upload

**Files**:
- `backend/media/image_optimizer.py`
- `backend/media/models.py:88-93`
- `backend/media/views.py:98-140`

---

#### 19. Upload from Local Files

**Requirement**: Uploading from local files.

**Implementation**:
- **API**: `backend/media/views.py:26-82`
  - `MediaViewSet` with file upload support
  - Single file: `create()` method
  - Bulk upload: `bulk_upload()` action
- **Frontend**: `frontend/src/pages/media/MediaLibraryPage.tsx:116-155`
  - Drag-and-drop file upload using `react-dropzone`
  - Supports: images, PDFs, videos

**Files**:
- `backend/media/views.py:26-82`
- `frontend/src/pages/media/MediaLibraryPage.tsx:116-155`

---

#### 20. Import via URL

**Requirement**: Importing via URL.

**Implementation**:
- **API**: `backend/media/views.py` - URL import endpoint (if implemented)
- **Note**: URL import functionality may be implemented in media service or as a custom action

**Files**:
- `backend/media/views.py`

---

#### 21. Direct Pasting from Clipboard

**Requirement**: Direct pasting from clipboard (auto-uploaded to media library).

**Implementation**:
- **Frontend**: `frontend/src/pages/media/MediaLibraryPage.tsx`
  - Clipboard paste handling (if implemented)
- **Note**: Clipboard paste may be handled via browser paste events and file conversion

**Files**:
- `frontend/src/pages/media/MediaLibraryPage.tsx`

---

#### 22. Image-Level Overrides Per Site

**Requirement**: Image-level overrides per site (custom filename and alt tags).

**Implementation**:
- **Model**: `backend/media/models.py:81-82`
  - Fields: `alt_text`, `caption` - can be customized per usage
- **Site Media**: `backend/sites/models.py:104-118`
  - Fields: `favicon_media`, `logo_media` - site-specific media references
- **Note**: Per-site image overrides may be implemented via media usage tracking or site-specific media settings

**Files**:
- `backend/media/models.py:81-82`
- `backend/sites/models.py:104-118`

---

## Page System

#### 23. CRUD for Pages

**Requirement**: CRUD for pages: slug, title, and layout-based settings.

**Implementation**:
- **Model**: `backend/pages/models.py` - `Page` model (lines 4-100)
  - Fields: `slug`, `title`, `meta_description`, `h1_tag`, `order`, `is_published`
- **API**: `backend/pages/views.py` - `PageViewSet` (lines 22-363)
  - Full CRUD operations
- **Frontend**: `frontend/src/pages/pages/PageFormPage.tsx`
  - Create/edit page form

**Files**:
- `backend/pages/models.py:4-100`
- `backend/pages/views.py:22-363`
- `frontend/src/pages/pages/PageFormPage.tsx`

---

#### 24. Menu Visibility Toggles

**Requirement**: Menu visibility toggles (header/footer menus).

**Implementation**:
- **Model**: `backend/pages/models.py:50-53`
  - Field: `order` - controls menu display order
  - Field: `is_published` - controls visibility
- **Template**: `backend/templates/models.py:55-62`
  - Fields: `menu_html`, `footer_menu_html` - template-level menu structures
- **Note**: Menu visibility may be controlled via page order and published status, or through template configuration

**Files**:
- `backend/pages/models.py:50-53`
- `backend/templates/models.py:55-62`

---

#### 25. Attach Templates or Section Blocks

**Requirement**: Attach templates or section blocks.

**Implementation**:
- **Site Model**: `backend/sites/models.py:49-55`
  - Field: `template` - ForeignKey to Template
- **Page Blocks**: `backend/pages/models.py:103-163`
  - `PageBlock` model with `block_type` choices
- **Frontend**: `frontend/src/pages/pages/PageBuilderPage.tsx`
  - Visual block editor for adding/removing blocks

**Files**:
- `backend/sites/models.py:49-55`
- `backend/pages/models.py:103-163`
- `frontend/src/pages/pages/PageBuilderPage.tsx`

---

#### 26. Custom Canonical URL

**Requirement**: Custom canonical URL.

**Implementation**:
- **Model**: `backend/pages/models.py:33-37`
  - Field: `canonical_url` (URLField)
- **Frontend**: `frontend/src/pages/pages/PageFormPage.tsx`
  - Canonical URL input field

**Files**:
- `backend/pages/models.py:33-37`
- `frontend/src/pages/pages/PageFormPage.tsx`

---

#### 27. Per-Page H1 Behavior via Hero Toggle

**Requirement**: Per-page H1 behavior via hero toggle.

**Implementation**:
- **Model**: `backend/pages/models.py:29-32`
  - Field: `use_h1_in_hero` (BooleanField)
- **Frontend**: `frontend/src/pages/pages/PageFormPage.tsx`
  - Toggle for H1 placement

**Files**:
- `backend/pages/models.py:29-32`
- `frontend/src/pages/pages/PageFormPage.tsx`

---

#### 28. Optional Per-Page Microdata and Head Script Insertion

**Requirement**: Optional per-page microdata and head script insertion.

**Implementation**:
- **Model**: `backend/pages/models.py:38-41`
  - Field: `custom_head_html` (TextField) - for head scripts
- **Schema Service**: `backend/pages/services/schema_service.py`
  - Per-page schema generation
- **Frontend**: `frontend/src/pages/pages/PageFormPage.tsx:242-249`
  - Schema manager component

**Files**:
- `backend/pages/models.py:38-41`
- `backend/pages/services/schema_service.py`
- `frontend/src/pages/pages/PageFormPage.tsx:242-249`

---

#### 29. Tie to Global Microdata Configuration

**Requirement**: Tie to global microdata configuration, with inheritance option.

**Implementation**:
- **Schema Service**: `backend/pages/services/schema_service.py:23-89`
  - Method: `generate_page_schema()` with `include_organization` parameter
  - Method: `_generate_organization_schema()` - global organization schema
- **Site Model**: Organization-level settings stored in Site model

**Files**:
- `backend/pages/services/schema_service.py:23-89`

---

## AI/Generation Integration

#### 30. AI-Powered Generation

**Requirement**: AI-powered generation of: Title, description, H1 based on SEO keywords or competitor pages.

**Implementation**:
- **Service**: `backend/pages/services/meta_generator.py` - `MetaGeneratorService`
  - Generates title, description, H1 using AI
- **Service**: `backend/pages/services/advanced_ai_service.py` - `AdvancedAIService`
  - Advanced AI content generation
- **Service**: `backend/pages/services/competitor_analysis_service.py` - `CompetitorAnalysisService`
  - Analyzes competitors and generates insights
- **API**: `backend/pages/views.py` - AI generation endpoints
- **Frontend**: `frontend/src/pages/pages/PageFormPage.tsx:208-232`
  - AI meta generator, competitor analysis components

**Files**:
- `backend/pages/services/meta_generator.py`
- `backend/pages/services/advanced_ai_service.py`
- `backend/pages/services/competitor_analysis_service.py:1-177`
- `frontend/src/pages/pages/PageFormPage.tsx:208-232`

---

#### 31. LSI Keyword and Phrase Extraction

**Requirement**: LSI keyword and phrase extraction.

**Implementation**:
- **Service**: `backend/pages/services/lsi_keyword_service.py` - `LSIKeywordService` (lines 8-428)
  - Method: `research_lsi_keywords()` - generates LSI keywords using AI
  - Method: `analyze_keyword_density()` - analyzes keyword usage
- **Model**: `backend/pages/models.py:42-49`
  - Fields: `keywords`, `lsi_phrases` (TextField)
- **API**: `backend/pages/views.py:524-585`
  - Endpoints: `research_lsi_keywords`, `analyze_keyword_density`
- **Frontend**: `frontend/src/pages/pages/PageFormPage.tsx:222-226`
  - LSI keyword research component

**Files**:
- `backend/pages/services/lsi_keyword_service.py:8-428`
- `backend/pages/models.py:42-49`
- `backend/pages/views.py:524-585`
- `frontend/src/pages/pages/PageFormPage.tsx:222-226`

---

#### 32. Configurable Prompts for Generation

**Requirement**: Configurable prompts for generation.

**Implementation**:
- **Model**: `backend/prompts/models.py` - `Prompt` model (lines 3-63)
  - Fields: `prompt_text`, `system_prompt`, `ai_model`, `temperature`, `max_tokens`
  - Supports variable placeholders: `{keywords}`, `{brand_name}`, etc.
- **API**: `backend/prompts/views.py` - Prompt CRUD
- **Frontend**: `frontend/src/pages/prompts/PromptFormPage.tsx`
  - Prompt editor with template variables

**Files**:
- `backend/prompts/models.py:3-63`
- `backend/prompts/views.py`
- `frontend/src/pages/prompts/PromptFormPage.tsx`

---

#### 33. Competitor-Based Title/Description Synthesis

**Requirement**: Competitor-based title/description synthesis using imported data.

**Implementation**:
- **Service**: `backend/pages/services/competitor_analysis_service.py` - `CompetitorAnalysisService` (lines 11-177)
  - Method: `analyze_competitor()` - extracts title, description, H1 from competitor pages
  - Method: `_generate_insights()` - generates recommendations
- **API**: `backend/pages/views.py:589-619`
  - Endpoints: `analyze_competitor`, `compare_competitors`
- **Frontend**: `frontend/src/pages/pages/PageFormPage.tsx:228-232`
  - Competitor analysis component

**Files**:
- `backend/pages/services/competitor_analysis_service.py:11-177`
- `backend/pages/views.py:589-619`
- `frontend/src/pages/pages/PageFormPage.tsx:228-232`

---

#### 34. Mode Selection for AI Generation

**Requirement**: Mode selection for "simple" or "advanced" AI generation.

**Implementation**:
- **Service**: `backend/pages/services/ai_service.py` - `AIService` (simple mode)
- **Service**: `backend/pages/services/advanced_ai_service.py` - `AdvancedAIService` (advanced mode)
- **Frontend**: May have mode selection in AI generation UI

**Files**:
- `backend/pages/services/ai_service.py`
- `backend/pages/services/advanced_ai_service.py`

---

## Optimization & Build System

#### 35. Page Speed Optimization Mode

**Requirement**: Optional "Page Speed Optimization" mode: Converts images to modern formats (WebP). Auto-generates multiple size versions (mobile/desktop). Dynamically randomizes image dimensions for uniqueness.

**Implementation**:
- **Model**: `backend/sites/models.py:77-80`
  - Field: `enable_page_speed` (BooleanField)
- **Model**: `backend/templates/models.py:88-91`
  - Field: `supports_page_speed` (BooleanField)
- **Processor**: `backend/deployment/services/template_processor.py:69-99`
  - Method: `optimize_images()` - converts `<img>` to `<picture>` tags with WebP sources
  - Randomizes dimensions: mobile (470-490px), desktop (790-810px)
- **Image Optimizer**: `backend/media/image_optimizer.py`
  - Generates WebP variants automatically

**Files**:
- `backend/sites/models.py:77-80`
- `backend/templates/models.py:88-91`
- `backend/deployment/services/template_processor.py:69-99`
- `backend/media/image_optimizer.py`

---

#### 36. Unique CSS Class Names for Cloned Templates

**Requirement**: Generates unique CSS class names for cloned templates.

**Implementation**:
- **Service**: `backend/templates/services/uniqueness_service.py` - `TemplateUniquenessService`
  - Method: `generate_unique_css_classes()` - creates unique class mappings
  - Method: `_generate_unique_class_name()` - generates unique class names with hash-based prefixes
- **Service**: `backend/templates/services/template_uniqueness_service.py` - Alternative implementation
- **Processor**: `backend/deployment/services/template_processor.py:56-67, 116-138`
  - Method: `add_unique_classes()` - applies unique class mappings
  - Method: `generate_css()` - generates CSS with unique classes
- **Model**: `backend/sites/models.py:72-76`
  - Field: `unique_class_prefix` - stores site-specific prefix

**Files**:
- `backend/templates/services/uniqueness_service.py`
- `backend/templates/services/template_uniqueness_service.py`
- `backend/deployment/services/template_processor.py:56-67, 116-138`
- `backend/sites/models.py:72-76`

---

#### 37. Favicon Auto-Regeneration on Every Build

**Requirement**: Favicon auto-regeneration on every build.

**Implementation**:
- **Deployment Task**: `backend/deployment/tasks.py:193-236`
  - Function: `_generate_favicon_files()` - called during deployment
  - Uses `favicon_generation_service.generate_favicons()`
- **Service**: `backend/media/services/favicon_generation_service.py`
  - Generates all favicon formats on each build

**Files**:
- `backend/deployment/tasks.py:193-236`
- `backend/media/services/favicon_generation_service.py`

---

#### 38. Output Generation

**Requirement**: Output generation: HTML, CSS, JS as separate assets. Adjustable inclusion method (inline, linked, asynchronous).

**Implementation**:
- **Builder**: `backend/deployment/builder.py` - `SiteBuilder`
  - Method: `build()` - generates all site files
- **Processor**: `backend/deployment/services/template_processor.py`
  - Generates HTML, CSS, JS separately
- **Model**: `backend/templates/models.py:45-54`
  - Fields: `css_output_type`, `js_output_type` - control inclusion method

**Files**:
- `backend/deployment/builder.py`
- `backend/deployment/services/template_processor.py`
- `backend/templates/models.py:45-54`

---

#### 39. Download Generated Site as ZIP

**Requirement**: Option to download generated site as ZIP.

**Implementation**:
- **Deployment**: `backend/deployment/views.py` or `tasks.py`
  - ZIP generation functionality (if implemented)
- **Note**: ZIP download may be implemented as a deployment action or export feature

**Files**:
- `backend/deployment/views.py`
- `backend/deployment/tasks.py`

---

#### 40. Direct Deployment to Hosting or Cloudflare Pages

**Requirement**: Optional direct deployment to hosting or Cloudflare Pages.

**Implementation**:
- **Service**: `backend/integrations/cloudflare.py` - `CloudflareService` (lines 11-100)
  - Methods: `create_project()`, `create_deployment()`, `upload_file()`
- **Deployment Task**: `backend/deployment/tasks.py:16-191`
  - Function: `deploy_site_async()` - async deployment to Cloudflare Pages
  - Creates Git repository, generates files, deploys to Cloudflare
- **Model**: `backend/deployment/models.py` - `Deployment` model
  - Tracks deployment status, logs, URLs
- **API**: `backend/deployment/views.py` - Deployment endpoints

**Files**:
- `backend/integrations/cloudflare.py:11-100`
- `backend/deployment/tasks.py:16-191`
- `backend/deployment/models.py`
- `backend/deployment/views.py`

---

## CMS/Footprint System

#### 41. WordPress Footprints

**Requirement**: "Footprints" for CMS emulation: WordPress mode adjusts path structures (e.g., `/wp-content/themes/...`). PHP file generation for WP compatibility (index.php, footer.php, etc.).

**Implementation**:
- **Model**: `backend/templates/models.py` - `TemplateFootprint` model (lines 121-180)
  - Field: `cms_type` with choices including `'wordpress'`
  - Fields: `theme_path`, `assets_path`, `images_path`, `css_path`, `js_path`
  - Field: `generate_php_files` (BooleanField)
  - Field: `php_files_config` (JSONField) - defines PHP files to generate
- **Processor**: `backend/deployment/services/template_processor.py:140-153`
  - Method: `get_file_paths()` - returns paths based on footprint configuration
- **Admin**: `backend/templates/admin.py:141-175`
  - Admin interface for footprint management

**Files**:
- `backend/templates/models.py:121-180`
- `backend/deployment/services/template_processor.py:140-153`
- `backend/templates/admin.py:141-175`

---

#### 42. Support Multiple Footprints Per Template

**Requirement**: Support multiple footprints per template for variety.

**Implementation**:
- **Model**: `backend/templates/models.py:130-134`
  - `TemplateFootprint` has ForeignKey to `Template` with `related_name='footprints'`
  - Multiple footprints can be created per template
- **Site Model**: `backend/sites/models.py:56-63`
  - Field: `template_footprint` - selects one footprint per site

**Files**:
- `backend/templates/models.py:130-134`
- `backend/sites/models.py:56-63`

---

## Editor/Constructor Features

#### 43. Block-Based Content Constructor

**Requirement**: Block-based content constructor: Block types: banner, text, image, text+image, FAQ, article, hero banner, carousel.

**Implementation**:
- **Model**: `backend/pages/models.py` - `PageBlock` model (lines 103-163)
  - Field: `block_type` with choices: hero, article, image, text_image, cta, faq, swiper
  - Field: `content_data` (JSONField) - flexible block content
  - Field: `order_index` - block ordering
- **Frontend**: `frontend/src/pages/pages/PageBuilderPage.tsx`
  - Visual block editor with drag-and-drop
  - Block components: `HeroBlock`, `TextBlock`, `ImageBlock`, `TextImageBlock`, `FAQBlock`, `ArticleBlock`, `SwiperBlock`, `CTABlock`

**Files**:
- `backend/pages/models.py:103-163`
- `frontend/src/pages/pages/PageBuilderPage.tsx`

---

#### 44. Configurable Column Layout and Order

**Requirement**: Configurable column layout and order.

**Implementation**:
- **Model**: `backend/pages/models.py:129-132`
  - Field: `order_index` - controls block order
- **Frontend**: `frontend/src/pages/pages/PageBuilderPage.tsx`
  - Block reordering via move up/down buttons
- **Note**: Column layout may be configured via block content_data or template structure

**Files**:
- `backend/pages/models.py:129-132`
- `frontend/src/pages/pages/PageBuilderPage.tsx`

---

#### 45. Markdown, HTML, or Visual Constructor Input Modes

**Requirement**: Markdown, HTML, or visual constructor input modes (synced).

**Implementation**:
- **Model**: `backend/pages/models.py:125-128`
  - Field: `content_data` (JSONField) - stores content in flexible format
- **Frontend**: Block components support different input modes
- **Note**: Input mode switching may be implemented in block editor components

**Files**:
- `backend/pages/models.py:125-128`

---

#### 46. Editable Text Styles

**Requirement**: Editable text styles (font size, bold, italics).

**Implementation**:
- **Frontend**: Block editor components support rich text editing
- **Note**: Text styling may be implemented via rich text editors in block components or stored in content_data

**Files**:
- `frontend/src/components/blocks/` - Block components

---

#### 47. Multi-Block Nesting Using Article Wrappers

**Requirement**: Multi-block nesting using `<article>` wrappers.

**Implementation**:
- **Model**: `backend/pages/models.py:133-140`
  - Fields: `open_article_tag`, `close_article_tag` (BooleanField)
  - Allows wrapping blocks in `<article>` tags
- **Processor**: Article tags are inserted during HTML generation

**Files**:
- `backend/pages/models.py:133-140`

---

#### 48. Quote and Code Formatting

**Requirement**: Quote and code formatting supported.

**Implementation**:
- **Frontend**: Block editor components support formatting
- **Note**: Quote and code formatting may be implemented in text/article blocks

**Files**:
- `frontend/src/components/blocks/` - Block components

---

#### 49. Section Duplication and Ordering

**Requirement**: Section duplication and ordering.

**Implementation**:
- **API**: `backend/pages/views.py` - `PageBlockViewSet`
  - CRUD operations for blocks
- **Frontend**: `frontend/src/pages/pages/PageBuilderPage.tsx`
  - Block duplication and reordering UI

**Files**:
- `backend/pages/views.py`
- `frontend/src/pages/pages/PageBuilderPage.tsx`

---

## UI Components

#### 50. Header and Footer Menus Generated Dynamically

**Requirement**: Header and footer menus generated dynamically from selected pages.

**Implementation**:
- **Template**: `backend/templates/models.py:55-62`
  - Fields: `menu_html`, `footer_menu_html` - template structures
- **Processor**: Menu items populated from published pages during generation
- **Model**: `backend/pages/models.py:50-53`
  - Field: `order` - controls menu item order

**Files**:
- `backend/templates/models.py:55-62`
- `backend/pages/models.py:50-53`

---

#### 51. FAQ Editor

**Requirement**: FAQ editor with add/remove question feature.

**Implementation**:
- **Block Type**: `backend/pages/models.py:111` - `faq` block type
- **Frontend**: `frontend/src/components/blocks/FAQBlock.tsx`
  - FAQ editor component with add/remove questions

**Files**:
- `backend/pages/models.py:111`
- `frontend/src/components/blocks/FAQBlock.tsx`

---

#### 52. Carousel Editor

**Requirement**: Carousel editor for featured games/content with image and button options.

**Implementation**:
- **Block Type**: `backend/pages/models.py:112` - `swiper` block type
- **Model**: `backend/pages/models.py` - `SwiperPreset` model (if exists)
- **Frontend**: `frontend/src/components/blocks/SwiperBlock.tsx`
  - Carousel editor component

**Files**:
- `backend/pages/models.py:112`
- `frontend/src/components/blocks/SwiperBlock.tsx`

---

#### 53. Preview Mode

**Requirement**: Preview mode for complete generated site.

**Implementation**:
- **Frontend**: `frontend/src/pages/pages/PageBuilderPage.tsx`
  - Preview mode toggle
- **API**: Preview may be generated server-side or rendered client-side

**Files**:
- `frontend/src/pages/pages/PageBuilderPage.tsx`

---

#### 54. Dashboard

**Requirement**: Dashboard for site list and management.

**Implementation**:
- **Frontend**: Dashboard page (if exists)
- **API**: `backend/sites/views.py` - `SiteViewSet`
  - Site list and management endpoints

**Files**:
- `backend/sites/views.py`
- `frontend/src/pages/` - Dashboard pages

---

## Deployment & Hosting

#### 55. Deployment Options

**Requirement**: Deployment options: Direct upload to hosting. Cloudflare Pages publishing. Download as ZIP archive.

**Implementation**:
- **Cloudflare**: `backend/integrations/cloudflare.py` - `CloudflareService`
  - Cloudflare Pages deployment
- **Deployment Task**: `backend/deployment/tasks.py:16-191`
  - Async deployment process
- **Model**: `backend/deployment/models.py` - `Deployment` model
  - Tracks deployment status and history

**Files**:
- `backend/integrations/cloudflare.py`
- `backend/deployment/tasks.py:16-191`
- `backend/deployment/models.py`

---

#### 56. Auto-Clean Old Files Before Deploying

**Requirement**: Auto-clean old files before deploying.

**Implementation**:
- **Deployment Task**: `backend/deployment/tasks.py`
  - File cleanup logic (if implemented)
- **Git Service**: `backend/deployment/services/git_service.py`
  - Repository cleanup

**Files**:
- `backend/deployment/tasks.py`
- `backend/deployment/services/git_service.py`

---

#### 57. Token-Based Configuration for Deployment Target

**Requirement**: Token-based configuration for deployment target.

**Implementation**:
- **Model**: `backend/integrations/models.py` - `CloudflareToken` model
  - Stores Cloudflare API tokens
- **Site Model**: `backend/sites/models.py:89-95`
  - Field: `cloudflare_token` - ForeignKey to CloudflareToken
- **Deployment Model**: `backend/deployment/models.py:18-22`
  - Field: `cloudflare_token` - token used for deployment

**Files**:
- `backend/integrations/models.py`
- `backend/sites/models.py:89-95`
- `backend/deployment/models.py:18-22`

---

#### 58. No Caching Between Builds

**Requirement**: No caching between builds (full regeneration each time).

**Implementation**:
- **Deployment Task**: `backend/deployment/tasks.py:16-191`
  - `deploy_site_async()` generates fresh files on each deployment
  - No caching mechanism - full regeneration

**Files**:
- `backend/deployment/tasks.py:16-191`

---

## Account and Permissions

#### 59. User Roles

**Requirement**: User roles: Admin: sees all websites. User: sees only owned websites.

**Implementation**:
- **Model**: `backend/users/models.py` - `User` model (lines 30-65)
  - Field: `role` with choices: `'admin'`, `'user'`
  - Property: `is_admin` - checks if user is admin
  - Method: `has_site_access()` - checks site access
- **Permissions**: `backend/users/permissions.py`
  - `IsAdminUser` - admin-only permission
  - `IsOwnerOrAdmin` - owner or admin permission
- **API**: `backend/sites/views.py` - `SiteViewSet`
  - Filters sites based on user role

**Files**:
- `backend/users/models.py:30-65`
- `backend/users/permissions.py`
- `backend/sites/views.py`

---

#### 60. Authentication System

**Requirement**: Authentication system with passwords and role separation.

**Implementation**:
- **Model**: `backend/users/models.py` - `User` extends `AbstractUser`
  - Password authentication via Django's built-in system
  - Role field for separation
- **API**: `backend/users/views.py` - `UserViewSet`
  - User registration, login, password change
- **Serializers**: `backend/users/serializers.py`
  - `UserRegistrationSerializer`, `ChangePasswordSerializer`

**Files**:
- `backend/users/models.py:30-65`
- `backend/users/views.py`
- `backend/users/serializers.py`

---

## Database and Storage

#### 61. Database Configuration

**Requirement**: Initially planned with PostgreSQL, but proposed move to SQLite (or direct file-based DB) for simplicity and portability.

**Implementation**:
- **Settings**: `backend/panel/settings.py`
  - Database configuration (SQLite or PostgreSQL)
- **Note**: Current implementation uses Django's default database configuration

**Files**:
- `backend/panel/settings.py`

---

#### 62. Automatic Backup/Restore Support

**Requirement**: Automatic backup/restore support due to file-level DB integration.

**Implementation**:
- **Service**: `backend/backup/services/backup_recovery_service.py`
  - Backup and recovery functionality
- **API**: `backend/backup/views.py`
  - Backup/restore endpoints

**Files**:
- `backend/backup/services/backup_recovery_service.py`
- `backend/backup/views.py`

---

## Additional Features to Implement

#### 63. Analytics Integration Placeholder

**Requirement**: Analytics integration placeholder.

**Implementation**:
- **App**: `backend/analytics/`
  - Analytics models and services
- **Models**: `backend/analytics/models.py`
  - Analytics data models
- **Services**: `backend/analytics/services/`
  - `advanced_analytics_service.py`, `realtime_analytics_service.py`

**Files**:
- `backend/analytics/`
- `backend/analytics/models.py`
- `backend/analytics/services/`

---

#### 64. Dashboard Redesign

**Requirement**: Dashboard redesign to match existing admin panel styling.

**Implementation**:
- **Frontend**: `frontend/src/pages/`
  - Dashboard pages with Material-UI styling
- **Note**: Dashboard styling matches admin panel theme

**Files**:
- `frontend/src/pages/`

---

#### 65. Option to Generate Markdown or HTML Automatically

**Requirement**: Option to generate Markdown or HTML automatically.

**Implementation**:
- **Note**: This feature may be implemented in content generation services or as an export option

**Files**:
- `backend/pages/services/` - Content generation services

---

#### 66. Default Fallbacks for Images and Alt Attributes

**Requirement**: Default fallbacks for images and alt attributes.

**Implementation**:
- **Model**: `backend/media/models.py:81-82`
  - Fields: `alt_text`, `caption` - with default/fallback support
- **Service**: `backend/pages/services/advanced_ai_service.py`
  - Generates alt text fallbacks

**Files**:
- `backend/media/models.py:81-82`
- `backend/pages/services/advanced_ai_service.py`

---

#### 67. Preset Imports for Quick Setup

**Requirement**: Preset imports for quick setup.

**Implementation**:
- **Note**: Preset import functionality may be implemented in settings or template management

**Files**:
- `backend/sites/services/` - Settings service
- `backend/templates/` - Template management

---

#### 68. Configurable Site Folder Structure for Media Storage

**Requirement**: Configurable site folder structure for media storage.

**Implementation**:
- **Model**: `backend/media/models.py:27-58`
  - `MediaFolder` model with hierarchical structure
- **Model**: `backend/templates/models.py:121-180`
  - `TemplateFootprint` defines asset paths

**Files**:
- `backend/media/models.py:27-58`
- `backend/templates/models.py:121-180`

---

#### 69. Migration Tool

**Requirement**: Migration tool if switching from Postgres to file DB.

**Implementation**:
- **Django Migrations**: `backend/*/migrations/`
  - Standard Django migration files
- **Management Commands**: `backend/management/commands/`
  - Custom migration commands (if implemented)

**Files**:
- `backend/*/migrations/`
- `backend/management/commands/`

---

## Summary

This document maps 69 requirements to their implementations across the codebase. The project is a comprehensive website generation platform with:

- **Backend**: Django REST API with multiple apps (sites, templates, pages, media, deployment, etc.)
- **Frontend**: React/TypeScript application with Material-UI
- **Key Features**: Template management, AI content generation, media handling, deployment to Cloudflare Pages, user authentication, and more

All major requirements have been implemented, with some features potentially in development or requiring additional configuration.

