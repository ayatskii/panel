from celery import shared_task
from django.utils import timezone
from django.conf import settings
import logging
import os
import tempfile
import shutil
from .models import Deployment
from .services.template_processor import TemplateProcessor
from .services.git_service import git_service
from integrations.cloudflare import CloudflareService

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def deploy_site_async(self, deployment_id, user_id=None):
    """Deploy site in background"""
    from sites.models import Site
    
    try:
        deployment = Deployment.objects.get(id=deployment_id)
        site = deployment.site
        
        # Update deployment status to building
        deployment.status = 'building'
        deployment.build_log = 'Starting deployment...\n'
        deployment.save()
        
        # Generate site content
        processor = TemplateProcessor(site)
        html = processor.generate_html()
        css = processor.generate_css()
        file_paths = processor.get_file_paths()
        
        # Update build log
        deployment.build_log += 'Generated HTML and CSS files\n'
        deployment.save()
        
        # Create Git repository
        deployment.build_log += 'Creating Git repository...\n'
        deployment.save()
        
        git_result = git_service.create_repository(site.domain, site.id)
        if not git_result.get('success'):
            raise Exception(f"Failed to create Git repository: {git_result.get('error')}")
        
        repo_path = git_result['repo_path']
        temp_dir = git_result['temp_dir']
        
        deployment.build_log += 'Git repository created\n'
        deployment.save()
        
        # Initialize Cloudflare service
        if not deployment.cloudflare_token:
            raise ValueError("No Cloudflare token configured for deployment")
        
        cf_service = CloudflareService(
            api_token=deployment.cloudflare_token.token,
            account_id=deployment.cloudflare_token.account_id
        )
        
        # Test credentials
        deployment.build_log += 'Testing Cloudflare credentials...\n'
        deployment.save()
        
        if not cf_service.test_credentials():
            raise ValueError("Invalid Cloudflare credentials")
        
        deployment.build_log += 'Cloudflare credentials validated\n'
        deployment.save()
        
        # Create project if it doesn't exist
        project_name = f"{site.domain.replace('.', '-')}-{site.id}"
        deployment.build_log += f'Creating/updating Cloudflare project: {project_name}\n'
        deployment.save()
        
        try:
            # Try to get existing project
            project = cf_service.get_project(project_name)
            deployment.build_log += 'Using existing project\n'
        except:
            # Create new project if it doesn't exist
            project = cf_service.create_project(project_name)
            deployment.build_log += 'Created new project\n'
        
        deployment.save()
        
        # Generate all site files
        deployment.build_log += 'Generating site files...\n'
        deployment.save()
        
        files = {}
        
        # Generate pages
        for page in site.pages.filter(is_published=True):
            page_processor = TemplateProcessor(site, page)
            page_html = page_processor.generate_html()
            
            # Determine filename
            if page.slug == 'home' or page.slug == '':
                filename = 'index.html'
            else:
                filename = f"{page.slug}.html"
            
            files[filename] = page_html
        
        # Generate global CSS
        global_css = processor.generate_css()
        files['styles.css'] = global_css
        
        # Generate global JS if exists
        if site.template and site.template.js_content:
            files['scripts.js'] = site.template.js_content
        
        # Generate favicon files if favicon is set
        if site.favicon_media:
            favicon_files = _generate_favicon_files(site, site.favicon_media)
            # Convert binary content to base64 for Cloudflare Pages deployment
            for file_path, file_content in favicon_files.items():
                if isinstance(file_content, bytes):
                    import base64
                    files[file_path] = base64.b64encode(file_content).decode('utf-8')
                else:
                    files[file_path] = file_content
        
        deployment.build_log += f'Generated {len(files)} files\n'
        deployment.save()
        
        # Add files to Git repository
        deployment.build_log += 'Adding files to Git repository...\n'
        deployment.save()
        
        git_add_result = git_service.add_files_to_repository(repo_path, files)
        if not git_add_result.get('success'):
            raise Exception(f"Failed to add files to Git: {git_add_result.get('error')}")
        
        # Get commit hash
        commit_hash = git_service.get_commit_hash(repo_path)
        if commit_hash:
            deployment.git_commit_hash = commit_hash
            deployment.save()
        
        deployment.build_log += f'Added {git_add_result.get("files_added", 0)} files to Git\n'
        deployment.save()
        
        # Deploy to Cloudflare Pages
        deployment.build_log += 'Deploying to Cloudflare Pages...\n'
        deployment.save()
        
        deployment_result = cf_service.create_deployment(project_name, files)
        
        if deployment_result.get('success'):
            deployment_id = deployment_result['result']['id']
            deployment_url = deployment_result['result']['url']
            
            deployment.status = 'success'
            deployment.completed_at = timezone.now()
            deployment.deployed_url = deployment_url
            deployment.build_log += f'Deployment successful! URL: {deployment_url}\n'
            deployment.save()
            
            # Update site deployment info
            site.deployed_at = timezone.now()
            site.save()
            
            # Apply page rules if configured
            _apply_page_rules(site, cf_service, deployment)
            
            # Cleanup temporary Git repository
            git_service.cleanup_repository(temp_dir)
            
            logger.info(f"Successfully deployed site {site.domain} to {deployment_url}")
            return {'deployment_id': deployment.id, 'status': 'success', 'url': deployment_url}
        else:
            error_msg = deployment_result.get('errors', [{}])[0].get('message', 'Unknown error')
            raise Exception(f"Cloudflare deployment failed: {error_msg}")
        
    except Exception as e:
        if 'deployment' in locals():
            deployment.status = 'failed'
            deployment.build_log += f'Deployment failed: {str(e)}\n'
            deployment.completed_at = timezone.now()
            deployment.save()
        
        # Cleanup temporary directory if it exists
        if 'temp_dir' in locals():
            git_service.cleanup_repository(temp_dir)
        
        raise self.retry(exc=e, countdown=60)


def _generate_favicon_files(site, favicon_media):
    """Generate favicon files in multiple formats using favicon generation service"""
    from media.services.favicon_generation_service import favicon_generation_service
    
    if not favicon_media:
        return {}
    
    try:
        result = favicon_generation_service.generate_favicons(favicon_media, site.domain)
        
        if not result.get('success'):
            logger.warning(f"Failed to generate favicons: {result.get('error')}")
            return {}
        
        files = {}
        generated = result.get('generated_files', {})
        
        # Map generated files to deployment file paths
        if 'ico' in generated:
            files['_assets/favicon.ico'] = _read_favicon_file(generated['ico']['path'])
        
        if 'png_16' in generated:
            files['_assets/favicon-16x16.png'] = _read_favicon_file(generated['png_16']['path'])
        
        if 'png_32' in generated:
            files['_assets/favicon-32x32.png'] = _read_favicon_file(generated['png_32']['path'])
        
        if 'png_48' in generated:
            files['_assets/favicon-48x48.png'] = _read_favicon_file(generated['png_48']['path'])
        
        if 'svg' in generated:
            files['_assets/favicon.svg'] = _read_favicon_file(generated['svg']['path'])
        
        if 'apple_touch_icon' in generated:
            files['_assets/apple-touch-icon.png'] = _read_favicon_file(generated['apple_touch_icon']['path'])
        
        if 'safari_pinned_tab' in generated:
            files['_assets/safari-pinned-tab.svg'] = _read_favicon_file(generated['safari_pinned_tab']['path'])
        
        return files
        
    except Exception as e:
        logger.error(f"Error generating favicon files: {e}")
        return {}


def _read_favicon_file(file_path):
    """Read favicon file content from storage"""
    from django.core.files.storage import default_storage
    try:
        with default_storage.open(file_path, 'rb') as f:
            return f.read()
    except Exception as e:
        logger.error(f"Failed to read favicon file {file_path}: {e}")
        return b''


def _apply_page_rules(site, cf_service, deployment):
    """Apply page rules based on site configuration"""
    try:
        deployment.build_log += 'Applying page rules...\n'
        deployment.save()
        
        # Apply 404 redirect rule if enabled
        if site.redirect_404_to_home:
            result = cf_service.create_404_redirect_rule(site.domain)
            if result.get('success'):
                deployment.build_log += 'Applied 404 redirect rule\n'
            else:
                deployment.build_log += f'Failed to apply 404 redirect rule: {result.get("error")}\n'
        
        # Apply www redirect rule if enabled
        if site.use_www_version:
            result = cf_service.create_www_redirect_rule(site.domain)
            if result.get('success'):
                deployment.build_log += 'Applied www redirect rule\n'
            else:
                deployment.build_log += f'Failed to apply www redirect rule: {result.get("error")}\n'
        
        deployment.save()
        
    except Exception as e:
        deployment.build_log += f'Error applying page rules: {str(e)}\n'
        deployment.save()
        logger.error(f"Failed to apply page rules for {site.domain}: {e}")


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


@shared_task
def setup_domain_async(site_id, cloudflare_token_id):
    """Setup domain with Cloudflare (DNS, SSL, etc.)"""
    from sites.models import Site
    from integrations.models import CloudflareToken
    
    try:
        site = Site.objects.get(id=site_id)
        cloudflare_token = CloudflareToken.objects.get(id=cloudflare_token_id)
        
        cf_service = CloudflareService(
            api_token=cloudflare_token.token,
            account_id=cloudflare_token.account_id
        )
        
        # Verify domain ownership
        verification = cf_service.verify_domain_ownership(site.domain)
        
        if not verification.get('verified'):
            raise Exception(f"Domain verification failed: {verification.get('error')}")
        
        # Get nameservers
        nameservers = cf_service.get_nameservers(site.domain)
        
        return {
            'success': True,
            'nameservers': nameservers
        }
        
    except Exception as e:
        logger.error(f"Domain setup failed for site {site_id}: {e}")
        return {'success': False, 'error': str(e)}
