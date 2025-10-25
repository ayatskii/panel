import json
from typing import Dict, List, Optional, Any
from datetime import datetime
from django.conf import settings
from django.utils import timezone as django_timezone
from pages.models import Page, Site
from media.models import Media


class SchemaService:
    """
    Service for generating Schema.org structured data and microdata
    """
    
    def __init__(self):
        self.schema_context = "https://schema.org"
        self.supported_types = [
            'Article', 'BlogPosting', 'WebPage', 'WebSite', 'Organization',
            'Person', 'Product', 'Event', 'FAQPage', 'HowTo', 'Recipe',
            'Review', 'LocalBusiness', 'BreadcrumbList', 'ImageObject'
        ]
    
    def generate_page_schema(
        self,
        page: Page,
        schema_type: str = 'WebPage',
        include_breadcrumbs: bool = True,
        include_organization: bool = True
    ) -> Dict[str, Any]:
        """
        Generate Schema.org structured data for a page
        
        Args:
            page: Page instance
            schema_type: Type of schema to generate
            include_breadcrumbs: Whether to include breadcrumb schema
            include_organization: Whether to include organization schema
            
        Returns:
            Dict with structured data
        """
        
        try:
            base_schema = self._get_base_schema(page, schema_type)
            
            # Add specific schema based on type
            if schema_type == 'Article':
                schema = self._generate_article_schema(page, base_schema)
            elif schema_type == 'BlogPosting':
                schema = self._generate_blog_posting_schema(page, base_schema)
            elif schema_type == 'FAQPage':
                schema = self._generate_faq_schema(page, base_schema)
            elif schema_type == 'HowTo':
                schema = self._generate_howto_schema(page, base_schema)
            elif schema_type == 'Product':
                schema = self._generate_product_schema(page, base_schema)
            elif schema_type == 'Event':
                schema = self._generate_event_schema(page, base_schema)
            else:
                schema = base_schema
            
            # Add breadcrumbs if requested
            if include_breadcrumbs:
                breadcrumbs = self._generate_breadcrumb_schema(page)
                if breadcrumbs:
                    schema['breadcrumb'] = breadcrumbs
            
            # Add organization if requested
            if include_organization:
                organization = self._generate_organization_schema(page.site)
                if organization:
                    schema['publisher'] = organization
            
            return {
                'success': True,
                'schema_type': schema_type,
                'page_id': page.id,
                'page_slug': page.slug,
                'structured_data': schema,
                'json_ld': json.dumps(schema, indent=2),
                'generated_at': django_timezone.now().isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to generate schema: {str(e)}'
            }
    
    def _get_base_schema(self, page: Page, schema_type: str) -> Dict[str, Any]:
        """Get base schema structure for a page"""
        site = page.site
        
        schema = {
            "@context": self.schema_context,
            "@type": schema_type,
            "@id": f"https://{site.domain}/{page.slug}/#webpage",
            "url": f"https://{site.domain}/{page.slug}/",
            "name": page.title,
            "description": page.meta_description or page.title,
            "datePublished": page.created_at.isoformat(),
            "dateModified": page.updated_at.isoformat(),
            "inLanguage": "en-US",
            "isPartOf": {
                "@type": "WebSite",
                "@id": f"https://{site.domain}/#website",
                "name": site.name or site.domain,
                "url": f"https://{site.domain}/"
            }
        }
        
        # Add main entity if available
        if page.h1_tag:
            schema["mainEntity"] = {
                "@type": "Thing",
                "name": page.h1_tag
            }
        
        # Add keywords if available
        if page.keywords:
            keywords = [k.strip() for k in page.keywords.split('\n') if k.strip()]
            if keywords:
                schema["keywords"] = ", ".join(keywords)
        
        return schema
    
    def _generate_article_schema(self, page: Page, base_schema: Dict[str, Any]) -> Dict[str, Any]:
        """Generate Article schema"""
        schema = base_schema.copy()
        schema.update({
            "@type": "Article",
            "headline": page.title,
            "articleBody": self._extract_article_content(page),
            "wordCount": self._count_words(page),
            "articleSection": self._get_article_section(page),
            "author": self._get_author_info(page.site),
            "publisher": self._generate_organization_schema(page.site)
        })
        
        # Add images if available
        images = self._extract_images_from_page(page)
        if images:
            schema["image"] = images[0] if len(images) == 1 else images
        
        return schema
    
    def _generate_blog_posting_schema(self, page: Page, base_schema: Dict[str, Any]) -> Dict[str, Any]:
        """Generate BlogPosting schema"""
        schema = base_schema.copy()
        schema.update({
            "@type": "BlogPosting",
            "headline": page.title,
            "articleBody": self._extract_article_content(page),
            "wordCount": self._count_words(page),
            "author": self._get_author_info(page.site),
            "publisher": self._generate_organization_schema(page.site)
        })
        
        # Add blog-specific fields
        if 'blog' in page.slug.lower():
            schema["blog"] = {
                "@type": "Blog",
                "name": f"{page.site.name or page.site.domain} Blog",
                "url": f"https://{page.site.domain}/blog/"
            }
        
        return schema
    
    def _generate_faq_schema(self, page: Page, base_schema: Dict[str, Any]) -> Dict[str, Any]:
        """Generate FAQPage schema"""
        schema = base_schema.copy()
        schema.update({
            "@type": "FAQPage",
            "mainEntity": self._extract_faq_items(page)
        })
        
        return schema
    
    def _generate_howto_schema(self, page: Page, base_schema: Dict[str, Any]) -> Dict[str, Any]:
        """Generate HowTo schema"""
        schema = base_schema.copy()
        schema.update({
            "@type": "HowTo",
            "name": page.title,
            "description": page.meta_description or page.title,
            "step": self._extract_howto_steps(page)
        })
        
        # Add estimated cost and time if available
        schema["estimatedCost"] = {
            "@type": "MonetaryAmount",
            "currency": "USD",
            "value": "0"
        }
        
        return schema
    
    def _generate_product_schema(self, page: Page, base_schema: Dict[str, Any]) -> Dict[str, Any]:
        """Generate Product schema"""
        schema = base_schema.copy()
        schema.update({
            "@type": "Product",
            "name": page.title,
            "description": page.meta_description or page.title,
            "brand": {
                "@type": "Brand",
                "name": page.site.name or page.site.domain
            }
        })
        
        # Add images if available
        images = self._extract_images_from_page(page)
        if images:
            schema["image"] = images[0] if len(images) == 1 else images
        
        return schema
    
    def _generate_event_schema(self, page: Page, base_schema: Dict[str, Any]) -> Dict[str, Any]:
        """Generate Event schema"""
        schema = base_schema.copy()
        schema.update({
            "@type": "Event",
            "name": page.title,
            "description": page.meta_description or page.title,
            "startDate": page.created_at.isoformat(),
            "eventStatus": "https://schema.org/EventScheduled",
            "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
            "location": {
                "@type": "VirtualLocation",
                "url": f"https://{page.site.domain}/{page.slug}/"
            }
        })
        
        return schema
    
    def _generate_breadcrumb_schema(self, page: Page) -> Optional[Dict[str, Any]]:
        """Generate breadcrumb schema"""
        try:
            breadcrumbs = []
            position = 1
            
            # Add home breadcrumb
            breadcrumbs.append({
                "@type": "ListItem",
                "position": position,
                "name": "Home",
                "item": f"https://{page.site.domain}/"
            })
            position += 1
            
            # Add page breadcrumb if not home
            if page.slug != 'index':
                breadcrumbs.append({
                    "@type": "ListItem",
                    "position": position,
                    "name": page.title,
                    "item": f"https://{page.site.domain}/{page.slug}/"
                })
            
            if len(breadcrumbs) > 1:
                return {
                    "@type": "BreadcrumbList",
                    "itemListElement": breadcrumbs
                }
            
            return None
            
        except Exception as e:
            print(f"Error generating breadcrumb schema: {e}")
            return None
    
    def _generate_organization_schema(self, site: Site) -> Optional[Dict[str, Any]]:
        """Generate organization schema"""
        try:
            organization = {
                "@type": "Organization",
                "@id": f"https://{site.domain}/#organization",
                "name": site.name or site.domain,
                "url": f"https://{site.domain}/",
                "logo": {
                    "@type": "ImageObject",
                    "url": f"https://{site.domain}/logo.png"
                }
            }
            
            # Add social media if available
            social_links = []
            if hasattr(site, 'social_media') and site.social_media:
                social_data = site.social_media
                if isinstance(social_data, dict):
                    if social_data.get('facebook'):
                        social_links.append(social_data['facebook'])
                    if social_data.get('twitter'):
                        social_links.append(social_data['twitter'])
                    if social_data.get('linkedin'):
                        social_links.append(social_data['linkedin'])
            
            if social_links:
                organization["sameAs"] = social_links
            
            return organization
            
        except Exception as e:
            print(f"Error generating organization schema: {e}")
            return None
    
    def _extract_article_content(self, page: Page) -> str:
        """Extract article content from page blocks"""
        try:
            from pages.models import PageBlock
            
            blocks = PageBlock.objects.filter(page=page).order_by('order')
            content_parts = []
            
            for block in blocks:
                content_data = block.content_data or {}
                
                if block.block_type == 'text':
                    content_parts.append(content_data.get('text', ''))
                elif block.block_type == 'article':
                    content_parts.append(content_data.get('text', ''))
                elif block.block_type == 'text_image':
                    content_parts.append(content_data.get('text', ''))
                elif block.block_type == 'faq':
                    # Extract FAQ content
                    faq_items = content_data.get('items', [])
                    for item in faq_items:
                        content_parts.append(f"Q: {item.get('question', '')}")
                        content_parts.append(f"A: {item.get('answer', '')}")
            
            return ' '.join(content_parts).strip()
            
        except Exception as e:
            print(f"Error extracting article content: {e}")
            return page.title
    
    def _extract_faq_items(self, page: Page) -> List[Dict[str, Any]]:
        """Extract FAQ items from page blocks"""
        try:
            from pages.models import PageBlock
            
            faq_items = []
            blocks = PageBlock.objects.filter(page=page, block_type='faq')
            
            for block in blocks:
                content_data = block.content_data or {}
                items = content_data.get('items', [])
                
                for item in items:
                    faq_items.append({
                        "@type": "Question",
                        "name": item.get('question', ''),
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": item.get('answer', '')
                        }
                    })
            
            return faq_items
            
        except Exception as e:
            print(f"Error extracting FAQ items: {e}")
            return []
    
    def _extract_howto_steps(self, page: Page) -> List[Dict[str, Any]]:
        """Extract HowTo steps from page blocks"""
        try:
            from pages.models import PageBlock
            
            steps = []
            blocks = PageBlock.objects.filter(page=page).order_by('order')
            
            for i, block in enumerate(blocks, 1):
                content_data = block.content_data or {}
                
                if block.block_type in ['text', 'article']:
                    text = content_data.get('text', '')
                    if text:
                        steps.append({
                            "@type": "HowToStep",
                            "position": i,
                            "name": f"Step {i}",
                            "text": text[:500]  # Limit text length
                        })
            
            return steps
            
        except Exception as e:
            print(f"Error extracting HowTo steps: {e}")
            return []
    
    def _extract_images_from_page(self, page: Page) -> List[Dict[str, Any]]:
        """Extract images from page blocks"""
        try:
            from pages.models import PageBlock
            
            images = []
            blocks = PageBlock.objects.filter(page=page)
            
            for block in blocks:
                content_data = block.content_data or {}
                
                if block.block_type == 'image' and content_data.get('image_url'):
                    images.append({
                        "@type": "ImageObject",
                        "url": content_data['image_url'],
                        "caption": content_data.get('caption', ''),
                        "name": content_data.get('alt', '')
                    })
                elif block.block_type == 'text_image' and content_data.get('image_url'):
                    images.append({
                        "@type": "ImageObject",
                        "url": content_data['image_url'],
                        "caption": content_data.get('caption', ''),
                        "name": content_data.get('alt', '')
                    })
                elif block.block_type == 'gallery':
                    gallery_images = content_data.get('images', [])
                    for img_url in gallery_images:
                        if img_url:
                            images.append({
                                "@type": "ImageObject",
                                "url": img_url
                            })
            
            return images
            
        except Exception as e:
            print(f"Error extracting images: {e}")
            return []
    
    def _count_words(self, page: Page) -> int:
        """Count words in page content"""
        try:
            content = self._extract_article_content(page)
            return len(content.split())
        except Exception:
            return 0
    
    def _get_article_section(self, page: Page) -> str:
        """Get article section based on page slug"""
        if 'blog' in page.slug.lower():
            return 'Blog'
        elif 'news' in page.slug.lower():
            return 'News'
        elif 'about' in page.slug.lower():
            return 'About'
        elif 'contact' in page.slug.lower():
            return 'Contact'
        else:
            return 'General'
    
    def _get_author_info(self, site: Site) -> Dict[str, Any]:
        """Get author information"""
        return {
            "@type": "Organization",
            "name": site.name or site.domain,
            "url": f"https://{site.domain}/"
        }
    
    def generate_website_schema(self, site: Site) -> Dict[str, Any]:
        """Generate website-level schema"""
        try:
            schema = {
                "@context": self.schema_context,
                "@type": "WebSite",
                "@id": f"https://{site.domain}/#website",
                "url": f"https://{site.domain}/",
                "name": site.name or site.domain,
                "description": f"Official website of {site.name or site.domain}",
                "publisher": self._generate_organization_schema(site),
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": {
                        "@type": "EntryPoint",
                        "urlTemplate": f"https://{site.domain}/search?q={{search_term_string}}"
                    },
                    "query-input": "required name=search_term_string"
                }
            }
            
            return {
                'success': True,
                'schema_type': 'WebSite',
                'site_id': site.id,
                'site_domain': site.domain,
                'structured_data': schema,
                'json_ld': json.dumps(schema, indent=2),
                'generated_at': django_timezone.now().isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to generate website schema: {str(e)}'
            }
    
    def validate_schema(self, schema_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate Schema.org structured data"""
        try:
            validation_errors = []
            warnings = []
            
            # Check required fields
            if '@context' not in schema_data:
                validation_errors.append("Missing @context field")
            
            if '@type' not in schema_data:
                validation_errors.append("Missing @type field")
            
            # Check context URL
            if schema_data.get('@context') != self.schema_context:
                warnings.append(f"Unexpected @context: {schema_data.get('@context')}")
            
            # Check schema type
            schema_type = schema_data.get('@type')
            if schema_type not in self.supported_types:
                warnings.append(f"Unsupported schema type: {schema_type}")
            
            # Check required fields based on type
            if schema_type == 'Article':
                required_fields = ['headline', 'author', 'publisher']
                for field in required_fields:
                    if field not in schema_data:
                        validation_errors.append(f"Missing required field for Article: {field}")
            
            elif schema_type == 'FAQPage':
                if 'mainEntity' not in schema_data:
                    validation_errors.append("Missing mainEntity field for FAQPage")
            
            elif schema_type == 'HowTo':
                required_fields = ['name', 'step']
                for field in required_fields:
                    if field not in schema_data:
                        validation_errors.append(f"Missing required field for HowTo: {field}")
            
            # Check URL format
            if 'url' in schema_data:
                url = schema_data['url']
                if not url.startswith('http'):
                    validation_errors.append("URL must start with http:// or https://")
            
            return {
                'success': True,
                'valid': len(validation_errors) == 0,
                'validation_errors': validation_errors,
                'warnings': warnings,
                'schema_type': schema_type,
                'field_count': len(schema_data)
            }
            
        except Exception as e:
            return {
                'success': False,
                'valid': False,
                'error': f'Validation failed: {str(e)}'
            }
    
    def get_schema_recommendations(self, page: Page) -> Dict[str, Any]:
        """Get schema recommendations for a page"""
        try:
            recommendations = []
            
            # Analyze page content to suggest schema types
            suggested_types = []
            
            if 'blog' in page.slug.lower() or 'article' in page.slug.lower():
                suggested_types.append('BlogPosting')
            elif 'faq' in page.slug.lower():
                suggested_types.append('FAQPage')
            elif 'how' in page.slug.lower() or 'tutorial' in page.slug.lower():
                suggested_types.append('HowTo')
            elif 'product' in page.slug.lower():
                suggested_types.append('Product')
            elif 'event' in page.slug.lower():
                suggested_types.append('Event')
            else:
                suggested_types.append('WebPage')
            
            # Check for missing content
            if not page.meta_description:
                recommendations.append("Add meta description for better schema markup")
            
            if not page.h1_tag:
                recommendations.append("Add H1 tag for better content structure")
            
            if not page.keywords:
                recommendations.append("Add keywords for better categorization")
            
            # Check page blocks for schema opportunities
            from pages.models import PageBlock
            blocks = PageBlock.objects.filter(page=page)
            
            has_faq_blocks = blocks.filter(block_type='faq').exists()
            if has_faq_blocks and 'FAQPage' not in suggested_types:
                suggested_types.append('FAQPage')
            
            has_image_blocks = blocks.filter(block_type__in=['image', 'text_image', 'gallery']).exists()
            if has_image_blocks:
                recommendations.append("Consider adding ImageObject schema for images")
            
            return {
                'success': True,
                'page_id': page.id,
                'suggested_schema_types': suggested_types,
                'recommendations': recommendations,
                'content_analysis': {
                    'has_faq_content': has_faq_blocks,
                    'has_image_content': has_image_blocks,
                    'word_count': self._count_words(page),
                    'has_meta_description': bool(page.meta_description),
                    'has_h1_tag': bool(page.h1_tag),
                    'has_keywords': bool(page.keywords)
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to get recommendations: {str(e)}'
            }
