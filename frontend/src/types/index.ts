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
  template: number
  template_name?: string
  template_type?: string
  template_type_display?: string
  template_footprint?: number
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
    created_at: string
  }

  export interface SiteFormData {
    domain: string
    brand_name: string
    language_code: string
    template: number
    template_footprint?: number
    template_variables?: Record<string, string | number | boolean>;
    custom_colors?: Record<string, string>
    enable_page_speed?: boolean
    cloudflare_token?: number
    affiliate_link?: number
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
    type: string
    description: string
    base_html?: string
    base_css?: string
    base_js?: string
    is_monolithic: boolean
    supports_color_customization: boolean
    supports_page_speed: boolean
    thumbnail_url?: string
    footprints?: TemplateFootprint[]
    variables?: TemplateVariable[]
    footprints_count?: number
    variables_count?: number
    sites_count?: number
    is_active: boolean
    created_at: string
    updated_at: string
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
    page_type: 'home' | 'about' | 'contact' | 'custom'
    meta_title: string
    meta_description: string
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
    page_type: string
    meta_title: string
    meta_description: string
    order: number
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
    user: number
    user_username: string
    name: string
    description: string
    category: 'hero' | 'text' | 'image' | 'custom'
    prompt_text: string
    provider: 'openai' | 'anthropic'
    model: string
    max_tokens: number
    temperature: number
    is_active: boolean
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