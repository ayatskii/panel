import requests
import json
import logging
from django.conf import settings
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class CloudflareService:
    """Service for Cloudflare Pages API integration"""
    
    BASE_URL = "https://api.cloudflare.com/client/v4"
    
    def __init__(self):
        self.api_token = settings.CLOUDFLARE_API_TOKEN
        self.account_id = settings.CLOUDFLARE_ACCOUNT_ID
        self.headers = {
            'Authorization': f'Bearer {self.api_token}',
            'Content-Type': 'application/json'
        }
    
    def _request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make API request to Cloudflare"""
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


# Singleton instance
cloudflare_service = CloudflareService()
