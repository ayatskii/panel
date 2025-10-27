import openai
from anthropic import Anthropic
from django.conf import settings
from typing import Dict, Any, List, Optional
import json
import logging

logger = logging.getLogger(__name__)


class AdvancedAIService:
    """Advanced AI service for block-specific content generation"""
    
    def __init__(self):
        self.openai_api_key = getattr(settings, 'OPENAI_API_KEY', None)
        self.anthropic_api_key = getattr(settings, 'ANTHROPIC_API_KEY', None)
        self.default_model = getattr(settings, 'DEFAULT_AI_MODEL', 'gpt-3.5-turbo')
    
    def generate_block_content(
        self, 
        block_type: str, 
        context: Dict[str, Any], 
        prompt_id: Optional[int] = None,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate content for specific block types
        
        Args:
            block_type: Type of block (hero, article, faq, swiper, etc.)
            context: Context information (keywords, brand, page info, etc.)
            prompt_id: Optional prompt ID to use
            model: AI model to use
            
        Returns:
            Dict with generated content
        """
        try:
            # Get block-specific prompt
            prompt = self._get_block_prompt(block_type, context, prompt_id)
            
            # Generate content based on block type
            if block_type == 'hero':
                return self._generate_hero_content(prompt, context, model)
            elif block_type == 'article':
                return self._generate_article_content(prompt, context, model)
            elif block_type == 'faq':
                return self._generate_faq_content(prompt, context, model)
            elif block_type == 'swiper':
                return self._generate_swiper_content(prompt, context, model)
            elif block_type == 'cta':
                return self._generate_cta_content(prompt, context, model)
            elif block_type == 'image_alt':
                return self._generate_image_alt_content(prompt, context, model)
            else:
                return self._generate_generic_content(prompt, context, model)
                
        except Exception as e:
            logger.error(f"Failed to generate {block_type} content: {e}")
            return self._get_fallback_content(block_type, context)
    
    def _get_block_prompt(self, block_type: str, context: Dict[str, Any], prompt_id: Optional[int] = None) -> str:
        """Get or generate prompt for specific block type"""
        
        # If prompt_id is provided, fetch from database
        if prompt_id:
            try:
                from prompts.models import Prompt
                prompt_obj = Prompt.objects.get(id=prompt_id)
                return self._process_prompt_template(prompt_obj.prompt_text, context)
            except Exception as e:
                logger.error(f"Failed to fetch prompt {prompt_id}: {e}")
        
        # Generate default prompts based on block type
        default_prompts = {
            'hero': self._get_hero_prompt(context),
            'article': self._get_article_prompt(context),
            'faq': self._get_faq_prompt(context),
            'swiper': self._get_swiper_prompt(context),
            'cta': self._get_cta_prompt(context),
            'image_alt': self._get_image_alt_prompt(context),
        }
        
        return default_prompts.get(block_type, self._get_generic_prompt(context))
    
    def _generate_hero_content(self, prompt: str, context: Dict[str, Any], model: Optional[str] = None) -> Dict[str, Any]:
        """Generate hero block content"""
        try:
            content = self._call_ai_api(prompt, model, max_tokens=300)
            
            # Parse the response to extract title, subtitle, and CTA
            lines = content.strip().split('\n')
            title = lines[0] if lines else "Welcome to Our Site"
            subtitle = lines[1] if len(lines) > 1 else "Discover amazing content and services"
            cta_text = lines[2] if len(lines) > 2 else "Get Started"
            
            return {
                'title': title,
                'subtitle': subtitle,
                'cta_text': cta_text,
                'background_image': context.get('background_image', ''),
                'buttons': [
                    {
                        'text': cta_text,
                        'url': context.get('affiliate_link', '#'),
                        'style': 'primary'
                    }
                ]
            }
        except Exception as e:
            logger.error(f"Failed to generate hero content: {e}")
            return self._get_fallback_hero_content(context)
    
    def _generate_article_content(self, prompt: str, context: Dict[str, Any], model: Optional[str] = None) -> Dict[str, Any]:
        """Generate article block content"""
        try:
            content = self._call_ai_api(prompt, model, max_tokens=800)
            
            return {
                'title': context.get('title', 'Article Title'),
                'text': content,
                'alignment': 'left'
            }
        except Exception as e:
            logger.error(f"Failed to generate article content: {e}")
            return self._get_fallback_article_content(context)
    
    def _generate_faq_content(self, prompt: str, context: Dict[str, Any], model: Optional[str] = None) -> Dict[str, Any]:
        """Generate FAQ block content"""
        try:
            content = self._call_ai_api(prompt, model, max_tokens=1000)
            
            # Parse FAQ content (assuming format: Q: Question\nA: Answer)
            faqs = []
            lines = content.strip().split('\n')
            current_q = None
            current_a = None
            
            for line in lines:
                line = line.strip()
                if line.startswith('Q:') or line.startswith('Question:'):
                    if current_q and current_a:
                        faqs.append({'question': current_q, 'answer': current_a})
                    current_q = line.replace('Q:', '').replace('Question:', '').strip()
                    current_a = None
                elif line.startswith('A:') or line.startswith('Answer:'):
                    current_a = line.replace('A:', '').replace('Answer:', '').strip()
                elif current_a is not None:
                    current_a += ' ' + line
            
            # Add the last FAQ
            if current_q and current_a:
                faqs.append({'question': current_q, 'answer': current_a})
            
            # Ensure we have at least 3 FAQs
            if len(faqs) < 3:
                faqs.extend(self._get_default_faqs(context))
            
            return {
                'title': f"Frequently Asked Questions about {context.get('brand_name', 'Our Service')}",
                'faqs': faqs[:6]  # Limit to 6 FAQs
            }
        except Exception as e:
            logger.error(f"Failed to generate FAQ content: {e}")
            return self._get_fallback_faq_content(context)
    
    def _generate_swiper_content(self, prompt: str, context: Dict[str, Any], model: Optional[str] = None) -> Dict[str, Any]:
        """Generate swiper block content"""
        try:
            content = self._call_ai_api(prompt, model, max_tokens=600)
            
            # Parse swiper content (assuming format: Title: Description)
            slides = []
            lines = content.strip().split('\n')
            
            for line in lines:
                line = line.strip()
                if ':' in line:
                    parts = line.split(':', 1)
                    if len(parts) == 2:
                        title = parts[0].strip()
                        description = parts[1].strip()
                        slides.append({
                            'title': title,
                            'description': description,
                            'image': context.get('default_image', ''),
                            'button_text': context.get('button_text', 'Play Now')
                        })
            
            # Ensure we have at least 3 slides
            if len(slides) < 3:
                slides.extend(self._get_default_swiper_slides(context))
            
            return {
                'title': f"Popular {context.get('brand_name', 'Games')}",
                'slides': slides[:8],  # Limit to 8 slides
                'button_text': context.get('button_text', 'Play Now')
            }
        except Exception as e:
            logger.error(f"Failed to generate swiper content: {e}")
            return self._get_fallback_swiper_content(context)
    
    def _generate_cta_content(self, prompt: str, context: Dict[str, Any], model: Optional[str] = None) -> Dict[str, Any]:
        """Generate CTA block content"""
        try:
            content = self._call_ai_api(prompt, model, max_tokens=200)
            
            lines = content.strip().split('\n')
            title = lines[0] if lines else "Ready to Get Started?"
            description = lines[1] if len(lines) > 1 else "Join thousands of satisfied customers"
            
            return {
                'title': title,
                'description': description,
                'buttons': [
                    {
                        'text': context.get('cta_text', 'Get Started'),
                        'url': context.get('affiliate_link', '#'),
                        'style': 'primary'
                    }
                ]
            }
        except Exception as e:
            logger.error(f"Failed to generate CTA content: {e}")
            return self._get_fallback_cta_content(context)
    
    def _generate_image_alt_content(self, prompt: str, context: Dict[str, Any], model: Optional[str] = None) -> Dict[str, Any]:
        """Generate image alt text"""
        try:
            alt_text = self._call_ai_api(prompt, model, max_tokens=50)
            return {'alt_text': alt_text.strip()}
        except Exception as e:
            logger.error(f"Failed to generate image alt text: {e}")
            return {'alt_text': f"Image related to {context.get('keywords', 'content')}"}
    
    def _generate_generic_content(self, prompt: str, context: Dict[str, Any], model: Optional[str] = None) -> Dict[str, Any]:
        """Generate generic content"""
        try:
            content = self._call_ai_api(prompt, model, max_tokens=400)
            return {'text': content}
        except Exception as e:
            logger.error(f"Failed to generate generic content: {e}")
            return {'text': 'AI-generated content'}
    
    def _call_ai_api(self, prompt: str, model: Optional[str] = None, max_tokens: int = 500) -> str:
        """Call AI API with the given prompt"""
        model = model or self.default_model
        
        try:
            if 'gpt' in model.lower():
                return self._generate_with_openai(prompt, max_tokens, model)
            elif 'claude' in model.lower():
                return self._generate_with_anthropic(prompt, max_tokens, model)
            else:
                return self._generate_with_openai(prompt, max_tokens, 'gpt-3.5-turbo')
        except Exception as e:
            logger.error(f"AI API call failed: {e}")
            raise
    
    def _generate_with_openai(self, prompt: str, max_tokens: int, model: str) -> str:
        """Generate content using OpenAI"""
        if not self.openai_api_key:
            raise ValueError("OpenAI API key not configured")
        
        client = openai.OpenAI(api_key=self.openai_api_key)
        
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are an expert content writer specializing in SEO-optimized web content. Generate engaging, informative content that is optimized for search engines."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=max_tokens
        )
        
        return response.choices[0].message.content
    
    def _generate_with_anthropic(self, prompt: str, max_tokens: int, model: str) -> str:
        """Generate content using Anthropic Claude"""
        if not self.anthropic_api_key:
            raise ValueError("Anthropic API key not configured")
        
        client = Anthropic(api_key=self.anthropic_api_key)
        
        response = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            temperature=0.7,
            system="You are an expert content writer specializing in SEO-optimized web content. Generate engaging, informative content that is optimized for search engines.",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        return response.content[0].text
    
    def _process_prompt_template(self, prompt_template: str, context: Dict[str, Any]) -> str:
        """Process prompt template with context variables"""
        processed_prompt = prompt_template
        
        # Replace common variables
        replacements = {
            '{brand_name}': context.get('brand_name', ''),
            '{keywords}': ', '.join(context.get('keywords', [])),
            '{lsi_phrases}': ', '.join(context.get('lsi_phrases', [])),
            '{page_title}': context.get('page_title', ''),
            '{domain}': context.get('domain', ''),
            '{language}': context.get('language', 'English'),
        }
        
        for placeholder, value in replacements.items():
            processed_prompt = processed_prompt.replace(placeholder, str(value))
        
        return processed_prompt
    
    # Default prompt generators
    def _get_hero_prompt(self, context: Dict[str, Any]) -> str:
        keywords = ', '.join(context.get('keywords', []))
        brand = context.get('brand_name', 'Our Service')
        return f"Create a compelling hero section for {brand}. Include: 1) A catchy headline that includes these keywords: {keywords}, 2) A compelling subtitle, 3) A call-to-action button text. Format each on a new line."
    
    def _get_article_prompt(self, context: Dict[str, Any]) -> str:
        keywords = ', '.join(context.get('keywords', []))
        lsi_phrases = ', '.join(context.get('lsi_phrases', []))
        brand = context.get('brand_name', 'Our Service')
        return f"Write an informative article about {brand} that naturally incorporates these keywords: {keywords} and these LSI phrases: {lsi_phrases}. Make it engaging and SEO-friendly, around 300-400 words."
    
    def _get_faq_prompt(self, context: Dict[str, Any]) -> str:
        keywords = ', '.join(context.get('keywords', []))
        brand = context.get('brand_name', 'Our Service')
        return f"Create 5-6 frequently asked questions about {brand} related to these topics: {keywords}. Format as 'Q: Question' followed by 'A: Answer' on separate lines."
    
    def _get_swiper_prompt(self, context: Dict[str, Any]) -> str:
        keywords = ', '.join(context.get('keywords', []))
        brand = context.get('brand_name', 'Our Service')
        return f"Create 5-6 items for a {brand} showcase carousel related to: {keywords}. Format as 'Title: Description' on separate lines."
    
    def _get_cta_prompt(self, context: Dict[str, Any]) -> str:
        brand = context.get('brand_name', 'Our Service')
        return f"Create a compelling call-to-action section for {brand}. Include: 1) An engaging title, 2) A persuasive description. Format each on a new line."
    
    def _get_image_alt_prompt(self, context: Dict[str, Any]) -> str:
        keywords = ', '.join(context.get('keywords', []))
        return f"Generate SEO-friendly alt text for an image related to: {keywords}. Keep it under 125 characters and descriptive."
    
    def _get_generic_prompt(self, context: Dict[str, Any]) -> str:
        keywords = ', '.join(context.get('keywords', []))
        return f"Create engaging content about: {keywords}. Make it informative and SEO-friendly."
    
    # Fallback content generators
    def _get_fallback_content(self, block_type: str, context: Dict[str, Any]) -> Dict[str, Any]:
        fallback_generators = {
            'hero': self._get_fallback_hero_content,
            'article': self._get_fallback_article_content,
            'faq': self._get_fallback_faq_content,
            'swiper': self._get_fallback_swiper_content,
            'cta': self._get_fallback_cta_content,
        }
        
        generator = fallback_generators.get(block_type, lambda ctx: {'text': 'Content placeholder'})
        return generator(context)
    
    def _get_fallback_hero_content(self, context: Dict[str, Any]) -> Dict[str, Any]:
        brand = context.get('brand_name', 'Our Service')
        return {
            'title': f"Welcome to {brand}",
            'subtitle': "Discover amazing content and services",
            'cta_text': "Get Started",
            'buttons': [{'text': 'Get Started', 'url': '#', 'style': 'primary'}]
        }
    
    def _get_fallback_article_content(self, context: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'title': 'Article Title',
            'text': 'This is a placeholder article content. Please generate new content using AI.',
            'alignment': 'left'
        }
    
    def _get_fallback_faq_content(self, context: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'title': 'Frequently Asked Questions',
            'faqs': self._get_default_faqs(context)
        }
    
    def _get_fallback_swiper_content(self, context: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'title': 'Featured Items',
            'slides': self._get_default_swiper_slides(context),
            'button_text': 'Learn More'
        }
    
    def _get_fallback_cta_content(self, context: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'title': 'Ready to Get Started?',
            'description': 'Join thousands of satisfied customers',
            'buttons': [{'text': 'Get Started', 'url': '#', 'style': 'primary'}]
        }
    
    def _get_default_faqs(self, context: Dict[str, Any]) -> List[Dict[str, str]]:
        brand = context.get('brand_name', 'Our Service')
        return [
            {'question': f'What is {brand}?', 'answer': f'{brand} is a comprehensive service designed to meet your needs.'},
            {'question': 'How do I get started?', 'answer': 'Getting started is easy! Simply follow our step-by-step guide.'},
            {'question': 'Is there customer support?', 'answer': 'Yes, we provide 24/7 customer support to help you with any questions.'}
        ]
    
    def _get_default_swiper_slides(self, context: Dict[str, Any]) -> List[Dict[str, str]]:
        return [
            {'title': 'Featured Item 1', 'description': 'Description for featured item 1', 'image': '', 'button_text': 'Learn More'},
            {'title': 'Featured Item 2', 'description': 'Description for featured item 2', 'image': '', 'button_text': 'Learn More'},
            {'title': 'Featured Item 3', 'description': 'Description for featured item 3', 'image': '', 'button_text': 'Learn More'}
        ]


# Singleton instance
advanced_ai_service = AdvancedAIService()
