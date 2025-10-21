from celery import shared_task
from django.utils import timezone
from .models import Deployment
from .services.template_processor import TemplateProcessor


@shared_task(bind=True, max_retries=3)
def deploy_site_async(self, site_id, user_id=None):
    """Deploy site in background"""
    from sites.models import Site
    
    try:
        site = Site.objects.get(id=site_id)

        deployment = Deployment.objects.create(
            site=site,
            cloudflare_token=site.cloudflare_token,
            status='building'
        )
        
        processor = TemplateProcessor(site)
        html = processor.generate_html()
        css = processor.generate_css()
        file_paths = processor.get_file_paths()
        
        # TODO: Generate files and deploy to Cloudflare
        # This would involve:
        # 1. Creating file structure
        # 2. Writing files
        # 3. Pushing to Git
        # 4. Deploying to Cloudflare Pages
        
        deployment.status = 'success'
        deployment.completed_at = timezone.now()
        deployment.deployed_url = f"https://{site.domain}"
        deployment.save()
        
        site.deployed_at = timezone.now()
        site.save()
        
        return {'deployment_id': deployment.id, 'status': 'success'}
        
    except Exception as e:
        deployment.status = 'failed'
        deployment.build_log = str(e)
        deployment.completed_at = timezone.now()
        deployment.save()
        raise self.retry(exc=e, countdown=60)


@shared_task
def generate_content_async(block_id, prompt_id):
    """Generate AI content for page block"""
    from pages.models import PageBlock
    from prompts.models import Prompt
    from prompts.services.ai_service import AIContentService
    
    block = PageBlock.objects.get(id=block_id)
    prompt = Prompt.objects.get(id=prompt_id)
    
    ai_service = AIContentService()
    context = {
        'brand_name': block.page.site.brand_name,
        'keywords': ', '.join(block.page.keywords_list),
        'title': block.page.title
    }
    
    content = ai_service.generate_content(prompt, context)
    block.content_data['text'] = content
    block.save()
    
    return content
