from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Page
import logging
import re

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=Page)
def update_site_template_variables_on_slug_change(sender, instance, **kwargs):
    """Update site template_variables when page slug changes"""
    if instance.pk:  # Only for existing pages
        try:
            old_page = Page.objects.get(pk=instance.pk)
            if old_page.slug != instance.slug:
                # Slug changed, update site template_variables
                site = instance.site
                if site and site.template_variables:
                    # Update any references to the old slug in template_variables
                    # This is a placeholder - actual implementation depends on how
                    # template_variables stores header/footer data
                    logger.info(f"Page slug changed from {old_page.slug} to {instance.slug} for site {site.id}")
        except Page.DoesNotExist:
            pass  # New page, nothing to update


@receiver(post_save, sender=Page)
def update_site_navigation_on_page_change(sender, instance, created, **kwargs):
    """Update site navigation (header/footer) when page slug or order changes"""
    site = instance.site
    if not site or not site.template_variables:
        return
    
    # Get all published pages for navigation
    pages = site.pages.filter(is_published=True).order_by('order', 'slug')
    
    # Update template_variables with current page slugs
    # This assumes template_variables contains navigation data
    # Format: {'header_menu': [...], 'footer_menu': [...]}
    if 'header_menu' not in site.template_variables:
        site.template_variables['header_menu'] = []
    if 'footer_menu' not in site.template_variables:
        site.template_variables['footer_menu'] = []
    
    # Rebuild navigation from pages
    header_menu = []
    footer_menu = []
    
    for page in pages:
        menu_item = {
            'slug': page.slug,
            'title': page.title or page.slug,
            'url': f"/{page.slug}" if page.slug != 'home' else '/'
        }
        
        # Add to header if page should be in header (check page settings)
        # For now, add all pages to both menus
        header_menu.append(menu_item)
        footer_menu.append(menu_item)
    
    site.template_variables['header_menu'] = header_menu
    site.template_variables['footer_menu'] = footer_menu
    site.save(update_fields=['template_variables'])
    
    logger.info(f"Updated navigation menus for site {site.id} after page {instance.id} change")

