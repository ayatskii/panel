import requests
import json
import logging
import time
from django.conf import settings
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)


class CloudflareService:
    """Service for Cloudflare Pages API integration"""
    
    BASE_URL = "https://api.cloudflare.com/client/v4"
    
    def __init__(self, api_token: str = None, account_id: str = None):
        self.api_token = api_token or getattr(settings, 'CLOUDFLARE_API_TOKEN', None)
        self.account_id = account_id or getattr(settings, 'CLOUDFLARE_ACCOUNT_ID', None)
        self.headers = {
            'Authorization': f'Bearer {self.api_token}',
            'Content-Type': 'application/json'
        }
    
    def _request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make API request to Cloudflare"""
        if not self.api_token:
            return {
                'success': False,
                'errors': [{'message': 'Cloudflare API token not configured'}],
                'result': None
            }
        
        url = f"{self.BASE_URL}{endpoint}"
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=self.headers)
            elif method == 'POST':
                response = requests.post(url, headers=self.headers, json=data)
            elif method == 'PUT':
                response = requests.put(url, headers=self.headers, json=data)
            elif method == 'DELETE':
                response = requests.delete(url, headers=self.headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            response.raise_for_status()
            return response.json()
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Cloudflare API error: {e}")
            raise
    
    def create_project(self, project_name: str, production_branch: str = 'main') -> Dict[str, Any]:
        """Create a new Cloudflare Pages project"""
        endpoint = f"/accounts/{self.account_id}/pages/projects"
        
        data = {
            'name': project_name,
            'production_branch': production_branch
        }
        
        result = self._request('POST', endpoint, data)
        logger.info(f"Created Cloudflare project: {project_name}")
        return result
    
    def get_project(self, project_name: str) -> Dict[str, Any]:
        """Get project details"""
        endpoint = f"/accounts/{self.account_id}/pages/projects/{project_name}"
        return self._request('GET', endpoint)
    
    def create_deployment(self, project_name: str, files: Dict[str, str]) -> Dict[str, Any]:
        """
        Create a deployment
        
        Args:
            project_name: Name of the Cloudflare project
            files: Dict of file paths to content (e.g., {'index.html': '<html>...</html>'})
        
        Returns:
            Deployment details
        """
        endpoint = f"/accounts/{self.account_id}/pages/projects/{project_name}/deployments"
        
        # Cloudflare expects files as manifest
        manifest = {}
        for path, content in files.items():
            manifest[path] = content
        
        data = {
            'manifest': manifest,
            'branch': 'main'
        }
        
        result = self._request('POST', endpoint, data)
        logger.info(f"Created deployment for project: {project_name}")
        return result
    
    def upload_file(self, project_name: str, file_path: str, content: str) -> Dict[str, Any]:
        """Upload a single file"""
        endpoint = f"/accounts/{self.account_id}/pages/projects/{project_name}/upload"
        
        data = {
            'files': {
                file_path: content
            }
        }
        
        return self._request('POST', endpoint, data)
    
    def get_deployment(self, project_name: str, deployment_id: str) -> Dict[str, Any]:
        """Get deployment details"""
        endpoint = f"/accounts/{self.account_id}/pages/projects/{project_name}/deployments/{deployment_id}"
        return self._request('GET', endpoint)
    
    def list_deployments(self, project_name: str) -> Dict[str, Any]:
        """List all deployments for a project"""
        endpoint = f"/accounts/{self.account_id}/pages/projects/{project_name}/deployments"
        return self._request('GET', endpoint)
    
    def delete_deployment(self, project_name: str, deployment_id: str) -> Dict[str, Any]:
        """Delete a deployment"""
        endpoint = f"/accounts/{self.account_id}/pages/projects/{project_name}/deployments/{deployment_id}"
        return self._request('DELETE', endpoint)
    
    def get_deployment_logs(self, project_name: str, deployment_id: str) -> Dict[str, Any]:
        """Get deployment logs"""
        endpoint = f"/accounts/{self.account_id}/pages/projects/{project_name}/deployments/{deployment_id}/logs"
        return self._request('GET', endpoint)
    
    def test_credentials(self) -> bool:
        """Test if the API credentials are valid"""
        try:
            endpoint = f"/accounts/{self.account_id}"
            result = self._request('GET', endpoint)
            return result.get('success', False)
        except Exception as e:
            logger.error(f"Credential test failed: {e}")
            return False
    
    # Page Rules Management Methods
    
    def create_page_rule(self, zone_id: str, rule_config: Dict[str, Any]) -> Dict[str, Any]:
        """Create a page rule for a zone"""
        endpoint = f"/zones/{zone_id}/pagerules"
        
        data = {
            'targets': rule_config.get('targets', []),
            'actions': rule_config.get('actions', []),
            'priority': rule_config.get('priority', 1),
            'status': rule_config.get('status', 'active')
        }
        
        result = self._request('POST', endpoint, data)
        logger.info(f"Created page rule for zone {zone_id}")
        return result
    
    def get_page_rules(self, zone_id: str) -> Dict[str, Any]:
        """Get all page rules for a zone"""
        endpoint = f"/zones/{zone_id}/pagerules"
        return self._request('GET', endpoint)
    
    def get_page_rule(self, zone_id: str, rule_id: str) -> Dict[str, Any]:
        """Get a specific page rule"""
        endpoint = f"/zones/{zone_id}/pagerules/{rule_id}"
        return self._request('GET', endpoint)
    
    def update_page_rule(self, zone_id: str, rule_id: str, rule_config: Dict[str, Any]) -> Dict[str, Any]:
        """Update a page rule"""
        endpoint = f"/zones/{zone_id}/pagerules/{rule_id}"
        
        data = {
            'targets': rule_config.get('targets', []),
            'actions': rule_config.get('actions', []),
            'priority': rule_config.get('priority', 1),
            'status': rule_config.get('status', 'active')
        }
        
        result = self._request('PATCH', endpoint, data)
        logger.info(f"Updated page rule {rule_id} for zone {zone_id}")
        return result
    
    def delete_page_rule(self, zone_id: str, rule_id: str) -> Dict[str, Any]:
        """Delete a page rule"""
        endpoint = f"/zones/{zone_id}/pagerules/{rule_id}"
        result = self._request('DELETE', endpoint)
        logger.info(f"Deleted page rule {rule_id} for zone {zone_id}")
        return result
    
    def create_404_redirect_rule(self, domain: str) -> Dict[str, Any]:
        """Create a 404 redirect rule for a domain"""
        zone_id = self.get_zone_id(domain)
        if not zone_id:
            return {
                'success': False,
                'errors': [{'message': f'Zone not found for domain: {domain}'}]
            }
        
        rule_config = {
            'targets': [
                {
                    'target': 'url',
                    'constraint': {
                        'operator': 'matches',
                        'value': f"{domain}/*"
                    }
                }
            ],
            'actions': [
                {
                    'id': 'forwarding_url',
                    'value': {
                        'url': f"https://{domain}",
                        'status_code': 301
                    }
                }
            ],
            'priority': 1,
            'status': 'active'
        }
        
        return self.create_page_rule(zone_id, rule_config)
    
    def create_www_redirect_rule(self, domain: str) -> Dict[str, Any]:
        """Create a www redirect rule for a domain"""
        zone_id = self.get_zone_id(domain)
        if not zone_id:
            return {
                'success': False,
                'errors': [{'message': f'Zone not found for domain: {domain}'}]
            }
        
        rule_config = {
            'targets': [
                {
                    'target': 'url',
                    'constraint': {
                        'operator': 'matches',
                        'value': f"www.{domain}/*"
                    }
                }
            ],
            'actions': [
                {
                    'id': 'forwarding_url',
                    'value': {
                        'url': f"https://{domain}",
                        'status_code': 301
                    }
                }
            ],
            'priority': 1,
            'status': 'active'
        }
        
        return self.create_page_rule(zone_id, rule_config)
    
    # DNS Management Methods
    
    def get_zone_id(self, domain: str) -> Optional[str]:
        """Get zone ID for a domain"""
        try:
            endpoint = f"/zones"
            params = {'name': domain}
            response = requests.get(f"{self.BASE_URL}{endpoint}", headers=self.headers, params=params)
            response.raise_for_status()
            result = response.json()
            
            if result.get('success') and result.get('result'):
                return result['result'][0]['id']
            return None
        except Exception as e:
            logger.error(f"Failed to get zone ID for {domain}: {e}")
            return None
    
    def get_nameservers(self, domain: str) -> List[str]:
        """Get nameservers for a domain"""
        try:
            zone_id = self.get_zone_id(domain)
            if not zone_id:
                return []
            
            endpoint = f"/zones/{zone_id}"
            result = self._request('GET', endpoint)
            
            if result.get('success'):
                return result['result']['name_servers']
            return []
        except Exception as e:
            logger.error(f"Failed to get nameservers for {domain}: {e}")
            return []
    
    def verify_domain_ownership(self, domain: str) -> Dict[str, Any]:
        """Verify domain ownership and get verification status"""
        try:
            zone_id = self.get_zone_id(domain)
            if not zone_id:
                return {
                    'verified': False,
                    'error': 'Domain not found in Cloudflare account'
                }
            
            # Check if domain is active
            endpoint = f"/zones/{zone_id}"
            result = self._request('GET', endpoint)
            
            if result.get('success'):
                zone_data = result['result']
                return {
                    'verified': zone_data.get('status') == 'active',
                    'status': zone_data.get('status'),
                    'zone_id': zone_id,
                    'nameservers': zone_data.get('name_servers', [])
                }
            
            return {'verified': False, 'error': 'Failed to verify domain'}
        except Exception as e:
            logger.error(f"Domain verification failed for {domain}: {e}")
            return {'verified': False, 'error': str(e)}
    
    def create_dns_record(self, domain: str, record_type: str, name: str, content: str, ttl: int = 1) -> Dict[str, Any]:
        """Create a DNS record"""
        try:
            zone_id = self.get_zone_id(domain)
            if not zone_id:
                return {'success': False, 'error': 'Domain not found'}
            
            endpoint = f"/zones/{zone_id}/dns_records"
            data = {
                'type': record_type,
                'name': name,
                'content': content,
                'ttl': ttl
            }
            
            result = self._request('POST', endpoint, data)
            logger.info(f"Created DNS record: {record_type} {name} -> {content}")
            return result
        except Exception as e:
            logger.error(f"Failed to create DNS record: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_dns_records(self, domain: str) -> List[Dict[str, Any]]:
        """Get all DNS records for a domain"""
        try:
            zone_id = self.get_zone_id(domain)
            if not zone_id:
                return []
            
            endpoint = f"/zones/{zone_id}/dns_records"
            result = self._request('GET', endpoint)
            
            if result.get('success'):
                return result['result']
            return []
        except Exception as e:
            logger.error(f"Failed to get DNS records for {domain}: {e}")
            return []
    
    # Page Rules Management
    
    def create_page_rule(self, domain: str, rule_config: Dict[str, Any]) -> Dict[str, Any]:
        """Create a page rule for redirects or other actions"""
        try:
            zone_id = self.get_zone_id(domain)
            if not zone_id:
                return {'success': False, 'error': 'Domain not found'}
            
            endpoint = f"/zones/{zone_id}/pagerules"
            result = self._request('POST', endpoint, rule_config)
            logger.info(f"Created page rule for {domain}")
            return result
        except Exception as e:
            logger.error(f"Failed to create page rule: {e}")
            return {'success': False, 'error': str(e)}
    
    def create_redirect_rule(self, domain: str, from_pattern: str, to_url: str) -> Dict[str, Any]:
        """Create a redirect page rule (301 redirect only)"""
        rule_config = {
            'targets': [
                {
                    'target': 'url',
                    'constraint': {
                        'operator': 'matches',
                        'value': from_pattern
                    }
                }
            ],
            'actions': [
                {
                    'id': 'forwarding_url',
                    'value': {
                        'url': to_url,
                        'status_code': 301  # Only 301 redirects are allowed
                    }
                }
            ],
            'status': 'active',
            'priority': 1
        }
        
        return self.create_page_rule(domain, rule_config)
    
    def create_404_redirect_rule(self, domain: str, redirect_to: str = '/') -> Dict[str, Any]:
        """Create a 404 redirect rule as specified in requirements"""
        # This matches the specification: redirect all non-home, non-asset URLs to home
        pattern = f"*{domain}/*"
        rule_config = {
            'targets': [
                {
                    'target': 'url',
                    'constraint': {
                        'operator': 'matches',
                        'value': pattern
                    }
                }
            ],
            'actions': [
                {
                    'id': 'forwarding_url',
                    'value': {
                        'url': f"https://{domain}{redirect_to}",
                        'status_code': 301
                    }
                }
            ],
            'status': 'active',
            'priority': 1
        }
        
        return self.create_page_rule(domain, rule_config)
    
    def create_www_redirect_rule(self, domain: str) -> Dict[str, Any]:
        """Create a www redirect rule as specified in requirements"""
        # Redirect www.domain.com to domain.com
        pattern = f"www.{domain}/*"
        rule_config = {
            'targets': [
                {
                    'target': 'url',
                    'constraint': {
                        'operator': 'matches',
                        'value': pattern
                    }
                }
            ],
            'actions': [
                {
                    'id': 'forwarding_url',
                    'value': {
                        'url': f"https://{domain}/$1",
                        'status_code': 301
                    }
                }
            ],
            'status': 'active',
            'priority': 1
        }
        
        return self.create_page_rule(domain, rule_config)
    
    def get_page_rules(self, domain: str) -> List[Dict[str, Any]]:
        """Get all page rules for a domain"""
        try:
            zone_id = self.get_zone_id(domain)
            if not zone_id:
                return []
            
            endpoint = f"/zones/{zone_id}/pagerules"
            result = self._request('GET', endpoint)
            
            if result.get('success'):
                return result['result']
            return []
        except Exception as e:
            logger.error(f"Failed to get page rules for {domain}: {e}")
            return []
    
    def delete_page_rule(self, domain: str, rule_id: str) -> Dict[str, Any]:
        """Delete a page rule"""
        try:
            zone_id = self.get_zone_id(domain)
            if not zone_id:
                return {'success': False, 'error': 'Domain not found'}
            
            endpoint = f"/zones/{zone_id}/pagerules/{rule_id}"
            result = self._request('DELETE', endpoint)
            logger.info(f"Deleted page rule {rule_id} for {domain}")
            return result
        except Exception as e:
            logger.error(f"Failed to delete page rule: {e}")
            return {'success': False, 'error': str(e)}
    


# Singleton instance
cloudflare_service = CloudflareService()
