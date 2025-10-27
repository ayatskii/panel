import logging
from typing import Dict, Any, List, Optional
from django.utils import timezone
from ..cloudflare import CloudflareService
from sites.models import Site

logger = logging.getLogger(__name__)


class PageRulesService:
    """Service for managing Cloudflare page rules and redirects"""
    
    def __init__(self):
        self.cf_service = None
    
    def _get_cloudflare_service(self, site: Site) -> Optional[CloudflareService]:
        """Get Cloudflare service instance for a site"""
        if not site.cloudflare_token:
            logger.error(f"No Cloudflare token configured for site {site.domain}")
            return None
        
        try:
            return CloudflareService(
                api_token=site.cloudflare_token.api_token.token_value,
                account_id=site.cloudflare_token.account_id
            )
        except Exception as e:
            logger.error(f"Failed to initialize Cloudflare service for site {site.domain}: {e}")
            return None
    
    def create_404_redirect_rule(self, site: Site) -> Dict[str, Any]:
        """Create a 404 redirect rule for a site"""
        try:
            cf_service = self._get_cloudflare_service(site)
            if not cf_service:
                return {
                    'success': False,
                    'error': 'Cloudflare service not available'
                }
            
            # Create the 404 redirect rule
            result = cf_service.create_404_redirect_rule(site.domain)
            
            if result.get('success'):
                # Update site model
                site.redirect_404_to_home = True
                site.save(update_fields=['redirect_404_to_home'])
                
                logger.info(f"Created 404 redirect rule for site {site.domain}")
                return {
                    'success': True,
                    'message': '404 redirect rule created successfully',
                    'rule_id': result.get('result', {}).get('id'),
                    'created_at': timezone.now().isoformat()
                }
            else:
                return {
                    'success': False,
                    'error': result.get('errors', [{}])[0].get('message', 'Failed to create 404 redirect rule')
                }
                
        except Exception as e:
            logger.error(f"Failed to create 404 redirect rule for site {site.domain}: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_www_redirect_rule(self, site: Site) -> Dict[str, Any]:
        """Create a www redirect rule for a site"""
        try:
            cf_service = self._get_cloudflare_service(site)
            if not cf_service:
                return {
                    'success': False,
                    'error': 'Cloudflare service not available'
                }
            
            # Create the www redirect rule
            result = cf_service.create_www_redirect_rule(site.domain)
            
            if result.get('success'):
                # Update site model
                site.use_www_version = True
                site.save(update_fields=['use_www_version'])
                
                logger.info(f"Created www redirect rule for site {site.domain}")
                return {
                    'success': True,
                    'message': 'WWW redirect rule created successfully',
                    'rule_id': result.get('result', {}).get('id'),
                    'created_at': timezone.now().isoformat()
                }
            else:
                return {
                    'success': False,
                    'error': result.get('errors', [{}])[0].get('message', 'Failed to create www redirect rule')
                }
                
        except Exception as e:
            logger.error(f"Failed to create www redirect rule for site {site.domain}: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_page_rules(self, site: Site) -> Dict[str, Any]:
        """Get all page rules for a site"""
        try:
            cf_service = self._get_cloudflare_service(site)
            if not cf_service:
                return {
                    'success': False,
                    'error': 'Cloudflare service not available'
                }
            
            zone_id = cf_service.get_zone_id(site.domain)
            if not zone_id:
                return {
                    'success': False,
                    'error': f'Zone not found for domain: {site.domain}'
                }
            
            result = cf_service.get_page_rules(zone_id)
            
            if result.get('success'):
                rules = result.get('result', [])
                return {
                    'success': True,
                    'rules': rules,
                    'count': len(rules)
                }
            else:
                return {
                    'success': False,
                    'error': result.get('errors', [{}])[0].get('message', 'Failed to get page rules')
                }
                
        except Exception as e:
            logger.error(f"Failed to get page rules for site {site.domain}: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_page_rule(self, site: Site, rule_id: str) -> Dict[str, Any]:
        """Delete a page rule for a site"""
        try:
            cf_service = self._get_cloudflare_service(site)
            if not cf_service:
                return {
                    'success': False,
                    'error': 'Cloudflare service not available'
                }
            
            zone_id = cf_service.get_zone_id(site.domain)
            if not zone_id:
                return {
                    'success': False,
                    'error': f'Zone not found for domain: {site.domain}'
                }
            
            result = cf_service.delete_page_rule(zone_id, rule_id)
            
            if result.get('success'):
                logger.info(f"Deleted page rule {rule_id} for site {site.domain}")
                return {
                    'success': True,
                    'message': 'Page rule deleted successfully'
                }
            else:
                return {
                    'success': False,
                    'error': result.get('errors', [{}])[0].get('message', 'Failed to delete page rule')
                }
                
        except Exception as e:
            logger.error(f"Failed to delete page rule {rule_id} for site {site.domain}: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def apply_site_redirect_rules(self, site: Site) -> Dict[str, Any]:
        """Apply all configured redirect rules for a site"""
        results = {
            'success': True,
            'rules_created': [],
            'errors': []
        }
        
        # Create 404 redirect rule if enabled
        if site.redirect_404_to_home:
            result = self.create_404_redirect_rule(site)
            if result['success']:
                results['rules_created'].append({
                    'type': '404_redirect',
                    'rule_id': result.get('rule_id'),
                    'message': result['message']
                })
            else:
                results['errors'].append({
                    'type': '404_redirect',
                    'error': result['error']
                })
                results['success'] = False
        
        # Create www redirect rule if enabled
        if site.use_www_version:
            result = self.create_www_redirect_rule(site)
            if result['success']:
                results['rules_created'].append({
                    'type': 'www_redirect',
                    'rule_id': result.get('rule_id'),
                    'message': result['message']
                })
            else:
                results['errors'].append({
                    'type': 'www_redirect',
                    'error': result['error']
                })
                results['success'] = False
        
        return results
    
    def get_rule_expressions(self, site: Site) -> Dict[str, str]:
        """Get Cloudflare rule expressions for display purposes"""
        return {
            '404_redirect': f"""(http.request.uri.path wildcard r"/*" and 
 http.request.uri.path ne "/" and 
 not http.request.uri.path contains "_assets" and 
 not http.request.uri.path contains "sitemap" and 
 not http.request.uri.path in {{"/robots.txt" "/static/index.js" "/static/e" "/go/login" "/go/register"}})""",
            'www_redirect': f"""(http.host eq "www.{site.domain}")
Dynamic concat("https://{site.domain}", http.request.uri.path) 301 first"""
        }


# Singleton instance
page_rules_service = PageRulesService()
