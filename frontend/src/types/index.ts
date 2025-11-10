export interface User {
    id: number
    username: string
    email: string
    role: 'admin' | 'user'
    is_admin: boolean
    created_at: string
}

export interface Site {
  id: number
  
  // Basic info
  domain: string
  brand_name: string
  
  // Template configuration
  template: number | null
  template_name?: string
  template_type?: string
  template_type_display?: string
  template_footprint?: number | null
  footprint_details?: {
    id: number
    name: string
    description?: string
    header_html: string
    footer_html: string
    navigation_html?: string
    custom_css?: string;
    custom_js?: string;
  };
  template_variables?: Record<string, string | number | boolean>;
  custom_colors?: Record<string, string>
  unique_class_prefix?: string
  enable_page_speed?: boolean
  supports_color_customization?: boolean
  supports_page_speed?: boolean
  
  // Language & Links
  language_code: string
  affiliate_link?: number
  affiliate_link_name?: string
  
  // Integrations
  cloudflare_token?: number
  favicon_media?: number
  logo_media?: number
  
  // Settings
  allow_indexing: boolean
  redirect_404_to_home: boolean
  use_www_version: boolean
  custom_css_class?: string
  
  // Metadata
  user: number
  user_username: string
  created_at: string
  updated_at: string
  deployed_at?: string
  is_deployed?: boolean
  page_count?: number
}
export interface Delpoyment {
    id: number
    site: number
    status: 'pending' | 'building' | 'success' | 'failed'
    delpoyed_url?: string
    created_at: string
}

export interface LoginRequest {
    username: string
    password: string
}

export interface LoginResponse {
    access: string
    refresh: string
    user: User
}

export interface RegisterResponse {
    user: User
    tokens: {
        access: string
        refresh: string
    }
}

  export interface RegisterRequest {
    username: string
    email: string
    password: string
    password_confirm: string
  }

  export interface ChangePasswordRequest {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
  }

  export interface Language {
    id: number
    name: string
    code: string
    created_at: string
  }  
export interface AffiliateLink {
  id: number
    name: string
    url: string
    description: string
    click_tracking: boolean
    site_count?: number
    swiper_preset_count?: number
    total_usage?: number
    created_at: string
    updated_at: string
  }

  export interface ApiToken {
    id: number
    name: string
    service: 'chatgpt' | 'grok' | 'claude' | 'openrouter' | 'cloudflare' | 'elevenlabs' | 'dalle' | 'midjourney'
    service_display: string
    token_value?: string
    token_masked: string
    is_active: boolean
    last_used: string | null
    usage_count: number
    created_at: string
    updated_at: string
  }

  export interface CloudflareToken {
    id: number
    api_token: number
    api_token_name?: string
    api_token_service?: string
    name: string
    account_id: string
    zone_id: string
    pages_project_name: string
    created_at: string
  }

  export interface CloudflareTokenWithSites {
    id: number
    name: string
    account_id: string
    zone_id: string
    site_count: number
    sites: Array<{
      id: number
      domain: string
      brand_name: string
      deployed_at: string | null
    }>
    is_available: boolean
  }

  export interface PageRule {
    id: string
    targets: Array<{
      target: string
      constraint: {
        operator: string
        value: string
      }
    }>
    actions: Array<{
      id: string
      value: {
        url?: string
        status_code?: number
      }
    }>
    priority: number
    status: string
    created_on: string
    modified_on: string
  }

  export interface PageRulesResponse {
    success: boolean
    rules?: PageRule[]
    count?: number
    error?: string
  }

  export interface PageRuleResult {
    success: boolean
    message?: string
    rule_id?: string
    created_at?: string
    error?: string
  }

  export interface RedirectRulesResult {
    success: boolean
    rules_created: Array<{
      type: string
      rule_id?: string
      message: string
    }>
    errors: Array<{
      type: string
      error: string
    }>
  }

  export interface RuleExpressions {
    '404_redirect': string
    'www_redirect': string
  }

  export interface FaviconFile {
    filename: string
    path: string
    url: string
    size?: number
    format?: string
    monochrome?: boolean
    sizes?: number[]
  }

  export interface FaviconGenerationResult {
    success: boolean
    generated_files?: {
      ico?: FaviconFile
      png_16?: FaviconFile
      png_32?: FaviconFile
      png_48?: FaviconFile
      png_180?: FaviconFile
      svg?: FaviconFile
      apple_touch_icon?: FaviconFile
      safari_pinned_tab?: FaviconFile
    }
    html_links?: string[]
    total_files?: number
    error?: string
  }

  export interface UniqueTemplateResult {
    success: boolean
    template_id?: number
    site_id?: number
    unique_classes?: Record<string, string>
    unique_styles?: Record<string, Record<string, string>>
    processed_content?: string
    custom_css?: string
    total_classes?: number
    total_styles?: number
    error?: string
  }

  export interface CssClassListResult {
    success: boolean
    list_name?: string
    classes?: string[]
    count?: number
    error?: string
  }

  export interface EnhancedContentResult {
    success: boolean
    page_id?: number
    generated_blocks?: Array<{
      success: boolean
      block_type: string
      block_id?: number
      generated_data?: Record<string, unknown>
      error?: string
    }>
    errors?: string[]
    total_blocks?: number
    error?: string
  }

  export interface AvailablePromptsResult {
    success: boolean
    block_type?: string
    prompts?: Array<{
      id: number
      name: string
      type: string
      description: string
      ai_model: string
      temperature: number
      max_tokens: number
    }>
    error?: string
  }

  export interface BlockTypesResult {
    success: boolean
    block_types?: Record<string, {
      name: string
      description: string
      required_fields: string[]
      optional_fields: string[]
      ai_prompts: string[]
    }>
    error?: string
  }

  export interface RegenerateBlockResult {
    success: boolean
    block_id?: number
    updated_content?: string
    prompt_type?: string
    error?: string
  }

  export interface SiteFormData {
    domain: string
    brand_name: string
    language_code: string
    template: number | null
    template_footprint?: number | null
    template_variables?: Record<string, string | number | boolean>;
    custom_colors?: Record<string, string>
    enable_page_speed?: boolean
    cloudflare_token?: number | null
    affiliate_link?: number | null
    allow_indexing: boolean
    redirect_404_to_home: boolean
    use_www_version: boolean
  }

  export interface TemplateVariable {
    id: number
    name: string
    display_name: string
    variable_type: 'text' | 'textarea' | 'color' | 'number' | 'boolean'
    default_value?: string
    is_required: boolean
    description?: string
  }
  
  export interface TemplateFootprint {
    id: number
    template: number
    template_name: string
    name: string
    description?: string
    header_html: string
    footer_html: string
    navigation_html?: string
    custom_css?: string
    custom_js?: string
    is_active: boolean
    created_at: string
    updated_at: string
  }
  
  export interface Template {
    id: number
    name: string
    type: 'monolithic' | 'sectional'
    type_display?: string
    description: string
    version: string
    html_content: string
    css_content: string
    js_content?: string
    css_output_type?: 'inline' | 'external' | 'async' | 'path_only'
    css_output_type_display?: string
    js_output_type?: 'inline' | 'external' | 'defer' | 'async' | 'path_only'
    js_output_type_display?: string
    menu_html?: string
    footer_menu_html?: string
    faq_block_html?: string
    available_blocks?: string[]
    css_framework?: 'tailwind' | 'bootstrap' | 'custom'
    supports_color_customization: boolean
    color_variables?: Record<string, string>
    supports_page_speed: boolean
    logo_svg?: string
    variables?: TemplateVariable[]
    sections?: unknown[]
    footprints?: TemplateFootprint[]
    assets?: unknown[]
    site_count?: number
    is_monolithic?: boolean
    is_sectional?: boolean
    created_at: string
    updated_at: string
    thumbnail_url?: string
    footprints_count?: number
    sites_count?: number
  }
  
  export interface SwiperPreset {
    id: number
    name: string
    slides_per_view: number
    space_between: number
    autoplay: boolean
    autoplay_delay: number
    loop: boolean
    pagination: boolean
    navigation: boolean
    effect: 'slide' | 'fade' | 'cube' | 'coverflow' | 'flip'
    speed: number
    created_at: string
  }
  
  export interface PageBlock {
    id: number
    page: number
    block_type: 'hero' | 'text' | 'image' | 'gallery' | 'swiper'
    order: number
    content: Record<string, unknown>;
    swiper_preset?: number
    swiper_preset_name?: string
    created_at: string
    updated_at: string
  }
  
  export interface Page {
    id: number
    site: number
    site_domain: string
    title: string
    slug: string
    meta_description: string
    h1_tag?: string
    use_h1_in_hero?: boolean
    canonical_url?: string
    custom_head_html?: string
    keywords?: string
    lsi_phrases?: string
    order: number
    is_published: boolean
    blocks?: PageBlock[]
    blocks_count?: number
    created_at: string
    updated_at: string
    published_at?: string
  }
  
  export interface PageFormData {
    site: number
    title: string
    slug: string
    meta_description: string
    h1_tag?: string
    use_h1_in_hero?: boolean
    keywords?: string
    lsi_phrases?: string
    order: number
  }
  
  export interface MediaTag {
    id: number
    name: string
    color: string
    media_count: number
    created_at: string
  }

  export interface Media {
    id: number
    folder?: number
    folder_name?: string
    folder_path?: string
    filename: string
    original_name: string
    file: string
    file_url: string
    file_path: string
    file_size: number
    file_size_mb: number
    mime_type: string
    alt_text?: string
    caption?: string
    width?: number
    height?: number
    tags: MediaTag[]
    tag_ids?: number[]
    uploaded_by: number
    user?: number  // Alias
    uploaded_by_username: string
    user_username: string  // Alias
    is_image: boolean
    is_svg: boolean
    size_kb: number
    size_mb: number
    file_type: 'image' | 'document' | 'video'
    thumbnail_url?: string
    medium_url?: string
    large_url?: string
    webp_url?: string
    is_optimized: boolean
    created_at: string
    updated_at: string
  }
  
  export interface MediaFolder {
    id: number
    name: string
    parent_folder?: number
    parent_name?: string
    full_path?: string
    subfolder_count?: number
    file_count?: number
    media_count?: number  // Alias
    created_at: string
    updated_at: string
  }
  
  export interface AIPrompt {
    id: number
    name: string
    description: string
    type: 'text' | 'image'
    type_display?: string
    block_type: string
    ai_model: string
    temperature: number
    max_tokens: number | null
    prompt_text: string
    system_prompt?: string
    is_active: boolean
    is_text_prompt?: boolean
    is_image_prompt?: boolean
    usage_count?: number
    created_at: string
    updated_at: string
  }
  
  export interface AIGenerationResult {
    success: boolean
    content?: string
    tokens_used?: number
    model?: string
    error?: string
  }
  
  export interface Deployment {
    id: number
    site: number
    site_domain: string
    site_brand_name: string
    status: 'pending' | 'building' | 'deployed' | 'failed'
    url?: string
    cloudflare_deployment_id?: string
    logs: string[]
    triggered_by: number
    triggered_by_username: string
    created_at: string
    deployed_at?: string
    updated_at: string
  }
  
  export interface DeploymentLog {
    timestamp: string
    message: string
  }
  
  export interface AnalyticsData {
    date: string
    views: number
  }

  export interface AnalyticsSummary {
    total_visitors: number | null
    total_pageviews: number | null
    avg_bounce_rate: number | null
    total_conversions: number | null
    total_revenue: number | null
    date_range: {
      start: string | null
      end: string | null
    }
  }

  export interface TrafficSource {
    traffic_source: string
    visitors_total: number
    pageviews_total: number
  }

  export interface PageViewTrackingRequest {
    site_id: number
    page_slug: string
  }

  export interface AffiliateLinkUsage {
    affiliate_link: {
      id: number
      name: string
      url: string
    }
    usage_summary: {
      total_sites: number
      total_presets: number
      total_usage: number
    }
    sites: Array<{
      id: number
      domain: string
      brand_name: string
      user__username: string
      created_at: string
    }>
    swiper_presets: Array<{
      id: number
      name: string
      created_at: string
    }>
  }