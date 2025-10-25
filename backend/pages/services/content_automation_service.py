import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from django.utils import timezone as django_timezone
from django.db.models import Q, F
from django.conf import settings
from pages.models import Page, PageBlock
from sites.models import Site
from users.models import User


class ContentAutomationService:
    """
    Service for content automation and scheduling
    """
    
    def __init__(self):
        self.timezone = django_timezone.get_current_timezone()
    
    def schedule_page_publication(
        self,
        page_id: int,
        scheduled_date: datetime,
        user_id: int
    ) -> Dict[str, Any]:
        """
        Schedule a page for future publication
        
        Args:
            page_id: ID of the page to schedule
            scheduled_date: When to publish the page
            user_id: ID of the user scheduling the page
            
        Returns:
            Dict with scheduling result
        """
        
        try:
            page = Page.objects.get(id=page_id)
            user = User.objects.get(id=user_id)
            
            # Validate scheduled date is in the future
            if scheduled_date <= django_timezone.now():
                return {
                    'success': False,
                    'error': 'Scheduled date must be in the future'
                }
            
            # Store scheduling information in page metadata
            if not page.metadata:
                page.metadata = {}
            
            page.metadata.update({
                'scheduled_publication': {
                    'scheduled_date': scheduled_date.isoformat(),
                    'scheduled_by': user_id,
                    'scheduled_at': django_timezone.now().isoformat(),
                    'status': 'scheduled'
                }
            })
            
            # Ensure page is not published yet
            page.is_published = False
            page.save()
            
            return {
                'success': True,
                'page_id': page_id,
                'scheduled_date': scheduled_date.isoformat(),
                'scheduled_by': user_id,
                'status': 'scheduled'
            }
            
        except Page.DoesNotExist:
            return {
                'success': False,
                'error': f'Page with ID {page_id} not found'
            }
        except User.DoesNotExist:
            return {
                'success': False,
                'error': f'User with ID {user_id} not found'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to schedule page: {str(e)}'
            }
    
    def cancel_scheduled_publication(self, page_id: int) -> Dict[str, Any]:
        """
        Cancel a scheduled page publication
        
        Args:
            page_id: ID of the page to cancel scheduling
            
        Returns:
            Dict with cancellation result
        """
        
        try:
            page = Page.objects.get(id=page_id)
            
            if not page.metadata or 'scheduled_publication' not in page.metadata:
                return {
                    'success': False,
                    'error': 'No scheduled publication found for this page'
                }
            
            # Update metadata to mark as cancelled
            page.metadata['scheduled_publication']['status'] = 'cancelled'
            page.metadata['scheduled_publication']['cancelled_at'] = django_timezone.now().isoformat()
            page.save()
            
            return {
                'success': True,
                'page_id': page_id,
                'status': 'cancelled'
            }
            
        except Page.DoesNotExist:
            return {
                'success': False,
                'error': f'Page with ID {page_id} not found'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to cancel scheduled publication: {str(e)}'
            }
    
    def get_scheduled_pages(
        self,
        site_id: Optional[int] = None,
        user_id: Optional[int] = None,
        status: str = 'scheduled'
    ) -> Dict[str, Any]:
        """
        Get all scheduled pages
        
        Args:
            site_id: Filter by site ID
            user_id: Filter by user ID
            status: Filter by status (scheduled, cancelled, published)
            
        Returns:
            Dict with scheduled pages
        """
        
        try:
            queryset = Page.objects.all()
            
            if site_id:
                queryset = queryset.filter(site_id=site_id)
            
            if user_id:
                queryset = queryset.filter(created_by_id=user_id)
            
            # Filter pages with scheduled publication metadata
            scheduled_pages = []
            for page in queryset:
                if (page.metadata and 
                    'scheduled_publication' in page.metadata and
                    page.metadata['scheduled_publication'].get('status') == status):
                    
                    scheduled_pages.append({
                        'id': page.id,
                        'title': page.title,
                        'slug': page.slug,
                        'site_id': page.site_id,
                        'site_domain': page.site.domain,
                        'created_by': page.created_by_id,
                        'scheduled_date': page.metadata['scheduled_publication']['scheduled_date'],
                        'scheduled_by': page.metadata['scheduled_publication']['scheduled_by'],
                        'scheduled_at': page.metadata['scheduled_publication']['scheduled_at'],
                        'status': page.metadata['scheduled_publication']['status']
                    })
            
            return {
                'success': True,
                'scheduled_pages': scheduled_pages,
                'count': len(scheduled_pages)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to get scheduled pages: {str(e)}'
            }
    
    def process_scheduled_publications(self) -> Dict[str, Any]:
        """
        Process all scheduled publications that are due
        
        Returns:
            Dict with processing results
        """
        
        try:
            now = django_timezone.now()
            processed_pages = []
            errors = []
            
            # Get all pages with scheduled publications
            pages = Page.objects.filter(
                metadata__isnull=False,
                is_published=False
            )
            
            for page in pages:
                if (page.metadata and 
                    'scheduled_publication' in page.metadata and
                    page.metadata['scheduled_publication'].get('status') == 'scheduled'):
                    
                    scheduled_date = datetime.fromisoformat(
                        page.metadata['scheduled_publication']['scheduled_date']
                    )
                    
                    # Check if it's time to publish
                    if scheduled_date <= now:
                        try:
                            # Publish the page
                            page.is_published = True
                            page.published_at = now
                            
                            # Update metadata
                            page.metadata['scheduled_publication']['status'] = 'published'
                            page.metadata['scheduled_publication']['published_at'] = now.isoformat()
                            
                            page.save()
                            
                            processed_pages.append({
                                'page_id': page.id,
                                'title': page.title,
                                'slug': page.slug,
                                'published_at': now.isoformat()
                            })
                            
                        except Exception as e:
                            errors.append({
                                'page_id': page.id,
                                'error': str(e)
                            })
            
            return {
                'success': True,
                'processed_pages': processed_pages,
                'errors': errors,
                'processed_count': len(processed_pages),
                'error_count': len(errors)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to process scheduled publications: {str(e)}'
            }
    
    def create_content_template(
        self,
        name: str,
        description: str,
        blocks: List[Dict[str, Any]],
        user_id: int,
        site_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Create a content template
        
        Args:
            name: Template name
            description: Template description
            blocks: List of block configurations
            user_id: ID of the user creating the template
            site_id: Optional site ID for site-specific templates
            
        Returns:
            Dict with template creation result
        """
        
        try:
            user = User.objects.get(id=user_id)
            
            template_data = {
                'name': name,
                'description': description,
                'blocks': blocks,
                'created_by': user_id,
                'created_at': django_timezone.now().isoformat(),
                'site_id': site_id
            }
            
            # Store template in a dedicated storage (could be database, file, etc.)
            # For now, we'll store it in a simple format
            template_id = f"template_{user_id}_{int(django_timezone.now().timestamp())}"
            
            return {
                'success': True,
                'template_id': template_id,
                'template_data': template_data
            }
            
        except User.DoesNotExist:
            return {
                'success': False,
                'error': f'User with ID {user_id} not found'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to create content template: {str(e)}'
            }
    
    def apply_content_template(
        self,
        template_id: str,
        page_id: int,
        user_id: int
    ) -> Dict[str, Any]:
        """
        Apply a content template to a page
        
        Args:
            template_id: ID of the template to apply
            page_id: ID of the page to apply template to
            user_id: ID of the user applying the template
            
        Returns:
            Dict with template application result
        """
        
        try:
            page = Page.objects.get(id=page_id)
            user = User.objects.get(id=user_id)
            
            # Get template data (in a real implementation, this would come from storage)
            template_data = self._get_template_data(template_id)
            
            if not template_data:
                return {
                    'success': False,
                    'error': f'Template with ID {template_id} not found'
                }
            
            # Clear existing blocks
            PageBlock.objects.filter(page=page).delete()
            
            # Create new blocks from template
            created_blocks = []
            for i, block_config in enumerate(template_data['blocks']):
                block = PageBlock.objects.create(
                    page=page,
                    block_type=block_config['block_type'],
                    content_data=block_config.get('content_data', {}),
                    order=i
                )
                created_blocks.append({
                    'id': block.id,
                    'block_type': block.block_type,
                    'order': block.order
                })
            
            return {
                'success': True,
                'page_id': page_id,
                'template_id': template_id,
                'created_blocks': created_blocks,
                'blocks_count': len(created_blocks)
            }
            
        except Page.DoesNotExist:
            return {
                'success': False,
                'error': f'Page with ID {page_id} not found'
            }
        except User.DoesNotExist:
            return {
                'success': False,
                'error': f'User with ID {user_id} not found'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to apply content template: {str(e)}'
            }
    
    def bulk_update_pages(
        self,
        page_ids: List[int],
        updates: Dict[str, Any],
        user_id: int
    ) -> Dict[str, Any]:
        """
        Bulk update multiple pages
        
        Args:
            page_ids: List of page IDs to update
            updates: Dictionary of fields to update
            user_id: ID of the user performing the update
            
        Returns:
            Dict with bulk update result
        """
        
        try:
            user = User.objects.get(id=user_id)
            
            # Validate pages exist and user has permission
            pages = Page.objects.filter(id__in=page_ids)
            if len(pages) != len(page_ids):
                return {
                    'success': False,
                    'error': 'Some pages not found or access denied'
                }
            
            # Prepare update data
            update_data = {}
            allowed_fields = ['title', 'meta_description', 'h1_tag', 'keywords', 'is_published']
            
            for field, value in updates.items():
                if field in allowed_fields:
                    update_data[field] = value
            
            if not update_data:
                return {
                    'success': False,
                    'error': 'No valid fields to update'
                }
            
            # Perform bulk update
            updated_count = Page.objects.filter(id__in=page_ids).update(**update_data)
            
            return {
                'success': True,
                'updated_count': updated_count,
                'updated_pages': page_ids,
                'updates_applied': update_data
            }
            
        except User.DoesNotExist:
            return {
                'success': False,
                'error': f'User with ID {user_id} not found'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to bulk update pages: {str(e)}'
            }
    
    def create_automated_workflow(
        self,
        name: str,
        description: str,
        triggers: List[Dict[str, Any]],
        actions: List[Dict[str, Any]],
        user_id: int,
        site_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Create an automated workflow
        
        Args:
            name: Workflow name
            description: Workflow description
            triggers: List of trigger conditions
            actions: List of actions to perform
            user_id: ID of the user creating the workflow
            site_id: Optional site ID for site-specific workflows
            
        Returns:
            Dict with workflow creation result
        """
        
        try:
            user = User.objects.get(id=user_id)
            
            workflow_data = {
                'name': name,
                'description': description,
                'triggers': triggers,
                'actions': actions,
                'created_by': user_id,
                'created_at': django_timezone.now().isoformat(),
                'site_id': site_id,
                'status': 'active'
            }
            
            # Store workflow (in a real implementation, this would be in a database)
            workflow_id = f"workflow_{user_id}_{int(django_timezone.now().timestamp())}"
            
            return {
                'success': True,
                'workflow_id': workflow_id,
                'workflow_data': workflow_data
            }
            
        except User.DoesNotExist:
            return {
                'success': False,
                'error': f'User with ID {user_id} not found'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to create automated workflow: {str(e)}'
            }
    
    def get_automation_analytics(
        self,
        site_id: Optional[int] = None,
        period_days: int = 30
    ) -> Dict[str, Any]:
        """
        Get automation analytics
        
        Args:
            site_id: Filter by site ID
            period_days: Number of days to analyze
            
        Returns:
            Dict with automation analytics
        """
        
        try:
            end_date = django_timezone.now()
            start_date = end_date - timedelta(days=period_days)
            
            # Get scheduled pages
            scheduled_pages = self.get_scheduled_pages(site_id=site_id)
            
            # Get published pages in period
            queryset = Page.objects.filter(
                published_at__range=[start_date, end_date],
                is_published=True
            )
            
            if site_id:
                queryset = queryset.filter(site_id=site_id)
            
            published_pages = queryset.count()
            
            # Get pages with automation metadata
            automated_pages = 0
            for page in queryset:
                if (page.metadata and 
                    ('scheduled_publication' in page.metadata or 
                     'automated_workflow' in page.metadata)):
                    automated_pages += 1
            
            return {
                'success': True,
                'site_id': site_id,
                'period_days': period_days,
                'analytics': {
                    'scheduled_pages': scheduled_pages.get('count', 0),
                    'published_pages': published_pages,
                    'automated_pages': automated_pages,
                    'automation_rate': (automated_pages / published_pages * 100) if published_pages > 0 else 0
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to get automation analytics: {str(e)}'
            }
    
    def _get_template_data(self, template_id: str) -> Optional[Dict[str, Any]]:
        """
        Get template data by ID (placeholder implementation)
        
        Args:
            template_id: Template ID
            
        Returns:
            Template data or None
        """
        
        # In a real implementation, this would fetch from a database or file storage
        # For now, return a sample template
        if template_id.startswith('template_'):
            return {
                'name': 'Sample Template',
                'description': 'A sample content template',
                'blocks': [
                    {
                        'block_type': 'text',
                        'content_data': {
                            'text': 'This is a sample text block from the template.'
                        }
                    },
                    {
                        'block_type': 'image',
                        'content_data': {
                            'image_url': '',
                            'caption': 'Sample image caption'
                        }
                    }
                ]
            }
        
        return None
