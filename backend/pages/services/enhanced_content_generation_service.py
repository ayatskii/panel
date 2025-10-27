import logging
from typing import Dict, Any, List, Optional, Tuple
from django.conf import settings
from django.utils import timezone
from ..models import Page, PageBlock
from prompts.models import Prompt
from prompts.services.ai_service import ai_service
from sites.models import Site

logger = logging.getLogger(__name__)


class EnhancedContentGenerationService:
    """Service for enhanced content generation with AI integration"""
    
    # Block type configurations
    BLOCK_TYPES = {
        'hero': {
            'name': 'Hero Block',
            'description': 'Main banner section with title, subtitle, and CTA',
            'required_fields': ['title', 'subtitle', 'cta_text'],
            'optional_fields': ['image', 'background_color', 'text_color'],
            'ai_prompts': ['hero_title', 'hero_subtitle', 'hero_cta']
        },
        'article': {
            'name': 'Article Block',
            'description': 'Text content block with article formatting',
            'required_fields': ['content'],
            'optional_fields': ['title', 'subtitle', 'image', 'author'],
            'ai_prompts': ['article_content', 'article_title', 'article_subtitle']
        },
        'image': {
            'name': 'Image Block',
            'description': 'Image display block with caption',
            'required_fields': ['image_url'],
            'optional_fields': ['caption', 'alt_text', 'alignment', 'size'],
            'ai_prompts': ['image_caption', 'image_alt_text']
        },
        'text_image': {
            'name': 'Text + Image Block',
            'description': 'Combined text and image block',
            'required_fields': ['content', 'image_url'],
            'optional_fields': ['title', 'image_position', 'text_alignment'],
            'ai_prompts': ['text_image_content', 'text_image_title']
        },
        'cta': {
            'name': 'Call-to-Action Block',
            'description': 'Call-to-action section with buttons',
            'required_fields': ['title', 'cta_text', 'cta_url'],
            'optional_fields': ['subtitle', 'button_style', 'background_color'],
            'ai_prompts': ['cta_title', 'cta_subtitle', 'cta_button_text']
        },
        'faq': {
            'name': 'FAQ Block',
            'description': 'Frequently asked questions section',
            'required_fields': ['questions'],
            'optional_fields': ['title', 'subtitle', 'style'],
            'ai_prompts': ['faq_questions', 'faq_answers', 'faq_title']
        },
        'swiper': {
            'name': 'Swiper Block',
            'description': 'Image carousel with navigation',
            'required_fields': ['images', 'title'],
            'optional_fields': ['subtitle', 'button_text', 'autoplay', 'navigation'],
            'ai_prompts': ['swiper_title', 'swiper_subtitle', 'swiper_button_text']
        }
    }
    
    def __init__(self):
        self.ai_service = ai_service
    
    def generate_content_for_page(self, page: Page, block_types: List[str], prompts: Dict[str, int]) -> Dict[str, Any]:
        """
        Generate content for a page with specified block types and prompts
        
        Args:
            page: Page object to generate content for
            block_types: List of block types to generate
            prompts: Dictionary mapping prompt types to prompt IDs
            
        Returns:
            Dict containing generation results
        """
        try:
            results = {
                'success': True,
                'page_id': page.id,
                'generated_blocks': [],
                'errors': [],
                'total_blocks': len(block_types)
            }
            
            for block_type in block_types:
                if block_type not in self.BLOCK_TYPES:
                    results['errors'].append(f"Unknown block type: {block_type}")
                    continue
                
                # Generate content for this block type
                block_result = self._generate_block_content(page, block_type, prompts)
                
                if block_result['success']:
                    results['generated_blocks'].append(block_result)
                else:
                    results['errors'].append(block_result['error'])
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to generate content for page {page.id}: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _generate_block_content(self, page: Page, block_type: str, prompts: Dict[str, int]) -> Dict[str, Any]:
        """Generate content for a specific block type"""
        try:
            block_config = self.BLOCK_TYPES[block_type]
            generated_data = {}
            
            # Generate content for each AI prompt
            for prompt_type in block_config['ai_prompts']:
                if prompt_type in prompts:
                    prompt_id = prompts[prompt_type]
                    prompt = Prompt.objects.get(id=prompt_id)
                    
                    # Generate content using AI
                    ai_result = self._generate_ai_content(prompt, page)
                    
                    if ai_result['success']:
                        generated_data[prompt_type] = ai_result['content']
                    else:
                        logger.warning(f"Failed to generate {prompt_type}: {ai_result['error']}")
            
            # Create the block
            block = self._create_page_block(page, block_type, generated_data)
            
            return {
                'success': True,
                'block_type': block_type,
                'block_id': block.id,
                'generated_data': generated_data
            }
            
        except Exception as e:
            logger.error(f"Failed to generate block content for {block_type}: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _generate_ai_content(self, prompt: Prompt, page: Page) -> Dict[str, Any]:
        """Generate content using AI service"""
        try:
            # Prepare context for AI generation
            context = self._prepare_ai_context(prompt, page)
            
            # Generate content based on prompt type
            if prompt.prompt_type == 'text':
                result = self.ai_service.generate_text(
                    prompt=prompt.content,
                    context=context,
                    model=prompt.ai_model,
                    temperature=prompt.temperature,
                    max_tokens=prompt.max_tokens
                )
            elif prompt.prompt_type == 'image':
                result = self.ai_service.generate_image(
                    prompt=prompt.content,
                    context=context,
                    model=prompt.ai_model,
                    size=prompt.image_size,
                    quality=prompt.image_quality
                )
            else:
                return {
                    'success': False,
                    'error': f"Unsupported prompt type: {prompt.prompt_type}"
                }
            
            if result['success']:
                return {
                    'success': True,
                    'content': result['content']
                }
            else:
                return {
                    'success': False,
                    'error': result['error']
                }
                
        except Exception as e:
            logger.error(f"Failed to generate AI content: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _prepare_ai_context(self, prompt: Prompt, page: Page) -> Dict[str, Any]:
        """Prepare context for AI generation"""
        context = {
            'page_title': page.title,
            'page_slug': page.slug,
            'site_domain': page.site.domain,
            'site_brand': page.site.brand_name,
            'language': page.site.language_code,
            'keywords': page.keywords.split('\n') if page.keywords else [],
            'lsi_keywords': page.lsi_keywords.split('\n') if page.lsi_keywords else [],
            'seo_title': page.seo_title,
            'seo_description': page.seo_description,
            'h1': page.h1,
        }
        
        # Add site-specific context
        if page.site.affiliate_link:
            context['affiliate_link'] = page.site.affiliate_link.url
        
        return context
    
    def _create_page_block(self, page: Page, block_type: str, generated_data: Dict[str, Any]) -> PageBlock:
        """Create a page block with generated content"""
        # Map generated data to block fields
        block_data = self._map_generated_data_to_block(block_type, generated_data)
        
        # Create the block
        block = PageBlock.objects.create(
            page=page,
            block_type=block_type,
            content=block_data,
            order=page.blocks.count() + 1,
            is_active=True
        )
        
        return block
    
    def _map_generated_data_to_block(self, block_type: str, generated_data: Dict[str, Any]) -> Dict[str, Any]:
        """Map generated AI data to block content structure"""
        block_config = self.BLOCK_TYPES[block_type]
        block_data = {}
        
        # Map AI-generated content to block fields
        if block_type == 'hero':
            block_data = {
                'title': generated_data.get('hero_title', ''),
                'subtitle': generated_data.get('hero_subtitle', ''),
                'cta_text': generated_data.get('hero_cta', ''),
                'cta_url': '#',
                'background_color': '#007bff',
                'text_color': '#ffffff'
            }
        elif block_type == 'article':
            block_data = {
                'title': generated_data.get('article_title', ''),
                'subtitle': generated_data.get('article_subtitle', ''),
                'content': generated_data.get('article_content', ''),
                'author': '',
                'publish_date': timezone.now().isoformat()
            }
        elif block_type == 'image':
            block_data = {
                'image_url': generated_data.get('image_url', ''),
                'caption': generated_data.get('image_caption', ''),
                'alt_text': generated_data.get('image_alt_text', ''),
                'alignment': 'center',
                'size': 'medium'
            }
        elif block_type == 'text_image':
            block_data = {
                'title': generated_data.get('text_image_title', ''),
                'content': generated_data.get('text_image_content', ''),
                'image_url': generated_data.get('image_url', ''),
                'image_position': 'right',
                'text_alignment': 'left'
            }
        elif block_type == 'cta':
            block_data = {
                'title': generated_data.get('cta_title', ''),
                'subtitle': generated_data.get('cta_subtitle', ''),
                'cta_text': generated_data.get('cta_button_text', ''),
                'cta_url': '#',
                'button_style': 'primary',
                'background_color': '#f8f9fa'
            }
        elif block_type == 'faq':
            block_data = {
                'title': generated_data.get('faq_title', 'Frequently Asked Questions'),
                'subtitle': generated_data.get('faq_subtitle', ''),
                'questions': generated_data.get('faq_questions', []),
                'answers': generated_data.get('faq_answers', []),
                'style': 'accordion'
            }
        elif block_type == 'swiper':
            block_data = {
                'title': generated_data.get('swiper_title', ''),
                'subtitle': generated_data.get('swiper_subtitle', ''),
                'button_text': generated_data.get('swiper_button_text', 'Learn More'),
                'images': generated_data.get('images', []),
                'autoplay': True,
                'navigation': True
            }
        
        return block_data
    
    def get_available_prompts(self, block_type: str) -> List[Dict[str, Any]]:
        """Get available prompts for a specific block type"""
        try:
            block_config = self.BLOCK_TYPES.get(block_type, {})
            prompt_types = block_config.get('ai_prompts', [])
            
            prompts = []
            for prompt_type in prompt_types:
                # Find prompts for this type
                type_prompts = Prompt.objects.filter(
                    prompt_type='text',  # For now, only text prompts
                    is_active=True
                ).filter(
                    name__icontains=prompt_type.replace('_', ' ')
                )
                
                for prompt in type_prompts:
                    prompts.append({
                        'id': prompt.id,
                        'name': prompt.name,
                        'type': prompt_type,
                        'description': prompt.description,
                        'ai_model': prompt.ai_model,
                        'temperature': prompt.temperature,
                        'max_tokens': prompt.max_tokens
                    })
            
            return prompts
            
        except Exception as e:
            logger.error(f"Failed to get available prompts: {e}")
            return []
    
    def regenerate_block_content(self, block: PageBlock, prompt_id: int) -> Dict[str, Any]:
        """Regenerate content for a specific block using a prompt"""
        try:
            prompt = Prompt.objects.get(id=prompt_id)
            
            # Generate new content
            ai_result = self._generate_ai_content(prompt, block.page)
            
            if not ai_result['success']:
                return {
                    'success': False,
                    'error': ai_result['error']
                }
            
            # Update block content
            block_data = block.content.copy()
            
            # Map the new content to the appropriate field
            prompt_type = self._get_prompt_type_for_block(block.block_type, prompt)
            if prompt_type:
                block_data[prompt_type] = ai_result['content']
                block.content = block_data
                block.save()
            
            return {
                'success': True,
                'block_id': block.id,
                'updated_content': ai_result['content'],
                'prompt_type': prompt_type
            }
            
        except Exception as e:
            logger.error(f"Failed to regenerate block content: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _get_prompt_type_for_block(self, block_type: str, prompt: Prompt) -> Optional[str]:
        """Get the prompt type for a block based on prompt name"""
        block_config = self.BLOCK_TYPES.get(block_type, {})
        prompt_types = block_config.get('ai_prompts', [])
        
        # Try to match prompt name with prompt types
        prompt_name_lower = prompt.name.lower()
        for prompt_type in prompt_types:
            if prompt_type.replace('_', ' ') in prompt_name_lower:
                return prompt_type
        
        return None


# Singleton instance
enhanced_content_generation_service = EnhancedContentGenerationService()
