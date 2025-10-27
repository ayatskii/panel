import logging
from typing import Dict, Any, List, Optional
from django.utils import timezone
from celery import shared_task
from .advanced_ai_service import advanced_ai_service

logger = logging.getLogger(__name__)


class ContentWorkflowService:
    """Service for managing content generation workflows"""
    
    def __init__(self):
        self.ai_service = advanced_ai_service
    
    def create_generation_workflow(
        self, 
        page_id: int, 
        workflow_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create a content generation workflow for a page
        
        Args:
            page_id: ID of the page to generate content for
            workflow_config: Configuration for the workflow
            
        Returns:
            Workflow information
        """
        try:
            from .models import Page
            
            page = Page.objects.get(id=page_id)
            
            workflow = {
                'page_id': page_id,
                'page_title': page.title,
                'site_domain': page.site.domain,
                'brand_name': page.site.brand_name,
                'workflow_id': f"workflow_{page_id}_{int(timezone.now().timestamp())}",
                'status': 'pending',
                'created_at': timezone.now().isoformat(),
                'config': workflow_config,
                'steps': self._create_workflow_steps(workflow_config),
                'results': {}
            }
            
            # Start the workflow asynchronously
            self._start_workflow_async.delay(workflow)
            
            return {
                'success': True,
                'workflow': workflow
            }
            
        except Exception as e:
            logger.error(f"Failed to create workflow: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _create_workflow_steps(self, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Create workflow steps based on configuration"""
        steps = []
        
        # Meta generation step
        if config.get('generate_meta', True):
            steps.append({
                'id': 'meta_generation',
                'name': 'Generate Meta Content',
                'type': 'meta',
                'status': 'pending',
                'dependencies': []
            })
        
        # Block generation steps
        block_types = config.get('block_types', [])
        for i, block_type in enumerate(block_types):
            steps.append({
                'id': f'block_{block_type}_{i}',
                'name': f'Generate {block_type.title()} Content',
                'type': 'block',
                'block_type': block_type,
                'status': 'pending',
                'dependencies': ['meta_generation'] if config.get('generate_meta', True) else []
            })
        
        # Image generation step
        if config.get('generate_images', False):
            steps.append({
                'id': 'image_generation',
                'name': 'Generate Images',
                'type': 'image',
                'status': 'pending',
                'dependencies': [f'block_{bt}_{i}' for i, bt in enumerate(block_types)]
            })
        
        return steps
    
    @shared_task(bind=True)
    def _start_workflow_async(self, workflow: Dict[str, Any]):
        """Start the content generation workflow asynchronously"""
        try:
            workflow_id = workflow['workflow_id']
            page_id = workflow['page_id']
            config = workflow['config']
            
            logger.info(f"Starting workflow {workflow_id} for page {page_id}")
            
            # Update workflow status
            workflow['status'] = 'running'
            workflow['started_at'] = timezone.now().isoformat()
            
            # Execute workflow steps
            results = self._execute_workflow_steps(workflow)
            
            # Update workflow with results
            workflow['status'] = 'completed'
            workflow['completed_at'] = timezone.now().isoformat()
            workflow['results'] = results
            
            logger.info(f"Workflow {workflow_id} completed successfully")
            
            return {
                'workflow_id': workflow_id,
                'status': 'completed',
                'results': results
            }
            
        except Exception as e:
            logger.error(f"Workflow {workflow.get('workflow_id', 'unknown')} failed: {e}")
            workflow['status'] = 'failed'
            workflow['error'] = str(e)
            workflow['failed_at'] = timezone.now().isoformat()
            
            return {
                'workflow_id': workflow.get('workflow_id', 'unknown'),
                'status': 'failed',
                'error': str(e)
            }
    
    def _execute_workflow_steps(self, workflow: Dict[str, Any]) -> Dict[str, Any]:
        """Execute all workflow steps"""
        results = {}
        page_id = workflow['page_id']
        config = workflow['config']
        
        try:
            from .models import Page
            page = Page.objects.get(id=page_id)
            
            # Prepare context
            context = {
                'brand_name': page.site.brand_name,
                'keywords': page.keywords_list,
                'lsi_phrases': page.lsi_phrases_list,
                'page_title': page.title,
                'domain': page.site.domain,
                'language': page.site.language_code,
                'affiliate_link': page.site.affiliate_link.url if page.site.affiliate_link else '#',
                'background_image': '',
                'default_image': '',
                'button_text': 'Learn More',
                'cta_text': 'Get Started'
            }
            
            # Step 1: Generate meta content
            if config.get('generate_meta', True):
                logger.info(f"Generating meta content for page {page_id}")
                meta_result = self._generate_meta_content(context, config.get('model'))
                results['meta'] = meta_result
                
                # Update page with generated meta
                if meta_result.get('success'):
                    page.title = meta_result['content'].get('title', page.title)
                    page.meta_description = meta_result['content'].get('meta_description', page.meta_description)
                    page.h1_tag = meta_result['content'].get('h1_tag', page.h1_tag)
                    page.save()
            
            # Step 2: Generate block content
            block_types = config.get('block_types', [])
            for block_type in block_types:
                logger.info(f"Generating {block_type} content for page {page_id}")
                block_result = self._generate_block_content(
                    block_type, 
                    context, 
                    config.get('model'),
                    config.get('prompt_ids', {}).get(block_type)
                )
                results[f'block_{block_type}'] = block_result
            
            # Step 3: Generate images (if requested)
            if config.get('generate_images', False):
                logger.info(f"Generating images for page {page_id}")
                image_result = self._generate_images(context, config.get('image_model'))
                results['images'] = image_result
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to execute workflow steps: {e}")
            raise
    
    def _generate_meta_content(self, context: Dict[str, Any], model: Optional[str] = None) -> Dict[str, Any]:
        """Generate meta content (title, description, H1)"""
        try:
            # Generate meta title
            title_prompt = f"Generate an SEO-optimized meta title (max 60 characters) for a page about {', '.join(context['keywords'])} for {context['brand_name']}. Include primary keywords naturally."
            meta_title = self.ai_service._call_ai_api(title_prompt, model, max_tokens=50)
            
            # Generate meta description
            desc_prompt = f"Generate an SEO-optimized meta description (max 160 characters) for a page about {', '.join(context['keywords'])} for {context['brand_name']}. Make it compelling and include a call-to-action."
            meta_description = self.ai_service._call_ai_api(desc_prompt, model, max_tokens=80)
            
            # Generate H1
            h1_prompt = f"Generate an SEO-optimized H1 heading for a page about {', '.join(context['keywords'])} for {context['brand_name']}. Make it engaging and include primary keywords."
            h1_tag = self.ai_service._call_ai_api(h1_prompt, model, max_tokens=50)
            
            return {
                'success': True,
                'content': {
                    'title': meta_title.strip(),
                    'meta_description': meta_description.strip(),
                    'h1_tag': h1_tag.strip()
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to generate meta content: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _generate_block_content(
        self, 
        block_type: str, 
        context: Dict[str, Any], 
        model: Optional[str] = None,
        prompt_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Generate content for a specific block type"""
        try:
            result = self.ai_service.generate_block_content(
                block_type=block_type,
                context=context,
                prompt_id=prompt_id,
                model=model
            )
            
            return {
                'success': True,
                'content': result
            }
            
        except Exception as e:
            logger.error(f"Failed to generate {block_type} content: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _generate_images(self, context: Dict[str, Any], model: Optional[str] = None) -> Dict[str, Any]:
        """Generate images for the page"""
        try:
            # This would integrate with image generation APIs like DALL-E, Midjourney, etc.
            # For now, return placeholder images
            
            image_prompts = [
                f"Hero image for {context['brand_name']} website about {', '.join(context['keywords'])}",
                f"Background image for {context['brand_name']} content",
                f"Featured image for {context['brand_name']} services"
            ]
            
            generated_images = []
            for i, prompt in enumerate(image_prompts):
                # In a real implementation, this would call an image generation API
                generated_images.append({
                    'id': f'generated_image_{i}',
                    'prompt': prompt,
                    'url': f'/placeholder/image_{i}.jpg',  # Placeholder
                    'alt_text': f"Generated image for {context['brand_name']}"
                })
            
            return {
                'success': True,
                'images': generated_images
            }
            
        except Exception as e:
            logger.error(f"Failed to generate images: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_workflow_status(self, workflow_id: str) -> Dict[str, Any]:
        """Get the status of a workflow"""
        # In a real implementation, this would check the workflow status from a database or cache
        # For now, return a placeholder response
        return {
            'workflow_id': workflow_id,
            'status': 'completed',
            'message': 'Workflow status not implemented yet'
        }
    
    def cancel_workflow(self, workflow_id: str) -> Dict[str, Any]:
        """Cancel a running workflow"""
        # In a real implementation, this would cancel the Celery task
        return {
            'workflow_id': workflow_id,
            'status': 'cancelled',
            'message': 'Workflow cancellation not implemented yet'
        }


# Singleton instance
content_workflow_service = ContentWorkflowService()
