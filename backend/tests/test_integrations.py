import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from integrations.models import CloudflareToken
from integrations.cloudflare import CloudflareService
from sites.models import Site, Language, AffiliateLink

User = get_user_model()


class CloudflareServiceTestCase(TestCase):
    """Test cases for CloudflareService"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.cloudflare_token = CloudflareToken.objects.create(
            name='Test Token',
            api_token='test_token_123',
            account_id='test_account_123',
            owner=self.user
        )
        
        self.site = Site.objects.create(
            domain='test.com',
            brand_name='Test Brand',
            owner=self.user,
            cloudflare_token=self.cloudflare_token
        )
    
    @patch('integrations.cloudflare.requests.post')
    def test_test_credentials_success(self, mock_post):
        """Test successful credential testing"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'success': True}
        mock_post.return_value = mock_response
        
        service = CloudflareService('test_token', 'test_account')
        result = service.test_credentials()
        
        self.assertTrue(result['success'])
        mock_post.assert_called_once()
    
    @patch('integrations.cloudflare.requests.post')
    def test_test_credentials_failure(self, mock_post):
        """Test failed credential testing"""
        mock_response = Mock()
        mock_response.status_code = 401
        mock_response.json.return_value = {'errors': [{'message': 'Invalid token'}]}
        mock_post.return_value = mock_response
        
        service = CloudflareService('invalid_token', 'test_account')
        result = service.test_credentials()
        
        self.assertFalse(result['success'])
        self.assertIn('error', result)
    
    @patch('integrations.cloudflare.requests.post')
    def test_create_project_success(self, mock_post):
        """Test successful project creation"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'result': {
                'id': 'project_123',
                'name': 'test-project',
                'subdomain': 'test-project.pages.dev'
            }
        }
        mock_post.return_value = mock_response
        
        service = CloudflareService('test_token', 'test_account')
        result = service.create_project('test-project')
        
        self.assertTrue(result['success'])
        self.assertEqual(result['project_id'], 'project_123')
    
    @patch('integrations.cloudflare.requests.get')
    def test_get_project_success(self, mock_get):
        """Test successful project retrieval"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'result': {
                'id': 'project_123',
                'name': 'test-project',
                'subdomain': 'test-project.pages.dev'
            }
        }
        mock_get.return_value = mock_response
        
        service = CloudflareService('test_token', 'test_account')
        result = service.get_project('project_123')
        
        self.assertTrue(result['success'])
        self.assertEqual(result['project']['id'], 'project_123')
    
    @patch('integrations.cloudflare.requests.post')
    def test_create_deployment_success(self, mock_post):
        """Test successful deployment creation"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'result': {
                'id': 'deployment_123',
                'url': 'https://deployment.pages.dev',
                'environment': 'production'
            }
        }
        mock_post.return_value = mock_response
        
        service = CloudflareService('test_token', 'test_account')
        result = service.create_deployment('project_123', {'index.html': 'content'})
        
        self.assertTrue(result['success'])
        self.assertEqual(result['deployment_id'], 'deployment_123')
    
    @patch('integrations.cloudflare.requests.get')
    def test_get_zone_id_success(self, mock_get):
        """Test successful zone ID retrieval"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'result': [{'id': 'zone_123', 'name': 'test.com'}]
        }
        mock_get.return_value = mock_response
        
        service = CloudflareService('test_token', 'test_account')
        result = service.get_zone_id('test.com')
        
        self.assertTrue(result['success'])
        self.assertEqual(result['zone_id'], 'zone_123')
    
    @patch('integrations.cloudflare.requests.get')
    def test_get_nameservers_success(self, mock_get):
        """Test successful nameservers retrieval"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'result': {
                'name_servers': ['ns1.cloudflare.com', 'ns2.cloudflare.com']
            }
        }
        mock_get.return_value = mock_response
        
        service = CloudflareService('test_token', 'test_account')
        result = service.get_nameservers('zone_123')
        
        self.assertTrue(result['success'])
        self.assertEqual(len(result['nameservers']), 2)
    
    @patch('integrations.cloudflare.requests.post')
    def test_create_dns_record_success(self, mock_post):
        """Test successful DNS record creation"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'result': {
                'id': 'record_123',
                'type': 'A',
                'name': 'www',
                'content': '192.168.1.1'
            }
        }
        mock_post.return_value = mock_response
        
        service = CloudflareService('test_token', 'test_account')
        result = service.create_dns_record('zone_123', 'A', 'www', '192.168.1.1')
        
        self.assertTrue(result['success'])
        self.assertEqual(result['record_id'], 'record_123')


class CloudflareTokenAPITestCase(APITestCase):
    """Test cases for CloudflareToken API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )
        
        self.cloudflare_token = CloudflareToken.objects.create(
            name='Test Token',
            api_token='test_token_123',
            account_id='test_account_123',
            owner=self.user
        )
    
    def test_list_cloudflare_tokens_authenticated(self):
        """Test listing cloudflare tokens for authenticated user"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/integrations/cloudflare-tokens/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_list_cloudflare_tokens_unauthenticated(self):
        """Test listing cloudflare tokens without authentication"""
        response = self.client.get('/api/integrations/cloudflare-tokens/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_cloudflare_token(self):
        """Test creating a new cloudflare token"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'name': 'New Token',
            'api_token': 'new_token_123',
            'account_id': 'new_account_123'
        }
        
        response = self.client.post('/api/integrations/cloudflare-tokens/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CloudflareToken.objects.count(), 2)
    
    def test_test_credentials_endpoint(self):
        """Test the test credentials endpoint"""
        self.client.force_authenticate(user=self.user)
        
        with patch('integrations.cloudflare.CloudflareService.test_credentials') as mock_test:
            mock_test.return_value = {'success': True, 'message': 'Credentials valid'}
            
            response = self.client.post(f'/api/integrations/cloudflare-tokens/{self.cloudflare_token.id}/test_credentials/')
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(response.data['success'])
    
    def test_get_nameservers_endpoint(self):
        """Test the get nameservers endpoint"""
        self.client.force_authenticate(user=self.user)
        
        with patch('integrations.cloudflare.CloudflareService.get_nameservers') as mock_get:
            mock_get.return_value = {
                'success': True,
                'nameservers': ['ns1.cloudflare.com', 'ns2.cloudflare.com']
            }
            
            data = {'domain': 'test.com'}
            response = self.client.post(f'/api/integrations/cloudflare-tokens/{self.cloudflare_token.id}/get_nameservers/', data)
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(response.data['success'])
            self.assertEqual(len(response.data['nameservers']), 2)
    
    def test_verify_domain_endpoint(self):
        """Test the verify domain endpoint"""
        self.client.force_authenticate(user=self.user)
        
        with patch('integrations.cloudflare.CloudflareService.verify_domain_ownership') as mock_verify:
            mock_verify.return_value = {
                'success': True,
                'verified': True,
                'zone_id': 'zone_123',
                'nameservers': ['ns1.cloudflare.com', 'ns2.cloudflare.com']
            }
            
            data = {'domain': 'test.com'}
            response = self.client.post(f'/api/integrations/cloudflare-tokens/{self.cloudflare_token.id}/verify_domain/', data)
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(response.data['verified'])
    
    def test_create_dns_record_endpoint(self):
        """Test the create DNS record endpoint"""
        self.client.force_authenticate(user=self.user)
        
        with patch('integrations.cloudflare.CloudflareService.create_dns_record') as mock_create:
            mock_create.return_value = {
                'success': True,
                'record_id': 'record_123'
            }
            
            data = {
                'domain': 'test.com',
                'type': 'A',
                'name': 'www',
                'content': '192.168.1.1',
                'ttl': 300
            }
            response = self.client.post(f'/api/integrations/cloudflare-tokens/{self.cloudflare_token.id}/create_dns_record/', data)
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(response.data['success'])
    
    def test_create_redirect_rule_endpoint(self):
        """Test the create redirect rule endpoint"""
        self.client.force_authenticate(user=self.user)
        
        with patch('integrations.cloudflare.CloudflareService.create_redirect_rule') as mock_create:
            mock_create.return_value = {
                'success': True,
                'rule_id': 'rule_123'
            }
            
            data = {
                'domain': 'test.com',
                'source_url': 'http://test.com',
                'target_url': 'https://test.com',
                'status_code': 301
            }
            response = self.client.post(f'/api/integrations/cloudflare-tokens/{self.cloudflare_token.id}/create_redirect_rule/', data)
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(response.data['success'])


class IntegrationErrorHandlingTestCase(TestCase):
    """Test cases for error handling in integrations"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    @patch('integrations.cloudflare.requests.post')
    def test_cloudflare_api_error_handling(self, mock_post):
        """Test proper error handling for Cloudflare API errors"""
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.json.return_value = {
            'errors': [{'message': 'Invalid request'}]
        }
        mock_post.return_value = mock_response
        
        service = CloudflareService('test_token', 'test_account')
        result = service.test_credentials()
        
        self.assertFalse(result['success'])
        self.assertIn('error', result)
    
    @patch('integrations.cloudflare.requests.post')
    def test_cloudflare_network_error_handling(self, mock_post):
        """Test proper error handling for network errors"""
        mock_post.side_effect = Exception('Network error')
        
        service = CloudflareService('test_token', 'test_account')
        result = service.test_credentials()
        
        self.assertFalse(result['success'])
        self.assertIn('error', result)
    
    def test_invalid_cloudflare_token_creation(self):
        """Test validation of cloudflare token creation"""
        self.client.force_authenticate(user=self.user)
        
        # Test with missing required fields
        data = {'name': 'Test Token'}  # Missing api_token and account_id
        response = self.client.post('/api/integrations/cloudflare-tokens/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('api_token', response.data)
        self.assertIn('account_id', response.data)


class CloudflareServiceIntegrationTestCase(TestCase):
    """Integration test cases for CloudflareService"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.cloudflare_token = CloudflareToken.objects.create(
            name='Test Token',
            api_token='test_token_123',
            account_id='test_account_123',
            owner=self.user
        )
    
    @patch('integrations.cloudflare.requests.get')
    @patch('integrations.cloudflare.requests.post')
    def test_complete_domain_setup_flow(self, mock_post, mock_get):
        """Test complete domain setup flow"""
        # Mock zone ID retrieval
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            'result': [{'id': 'zone_123', 'name': 'test.com'}]
        }
        
        # Mock nameservers retrieval
        mock_get.return_value.json.return_value = {
            'result': {
                'name_servers': ['ns1.cloudflare.com', 'ns2.cloudflare.com']
            }
        }
        
        service = CloudflareService('test_token', 'test_account')
        
        # Test zone ID retrieval
        zone_result = service.get_zone_id('test.com')
        self.assertTrue(zone_result['success'])
        
        # Test nameservers retrieval
        ns_result = service.get_nameservers('zone_123')
        self.assertTrue(ns_result['success'])
    
    @patch('integrations.cloudflare.requests.post')
    def test_deployment_workflow(self, mock_post):
        """Test complete deployment workflow"""
        # Mock project creation
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            'result': {
                'id': 'project_123',
                'name': 'test-project',
                'subdomain': 'test-project.pages.dev'
            }
        }
        
        service = CloudflareService('test_token', 'test_account')
        
        # Test project creation
        project_result = service.create_project('test-project')
        self.assertTrue(project_result['success'])
        
        # Test deployment creation
        mock_post.return_value.json.return_value = {
            'result': {
                'id': 'deployment_123',
                'url': 'https://deployment.pages.dev',
                'environment': 'production'
            }
        }
        
        files = {'index.html': '<html><body>Test</body></html>'}
        deployment_result = service.create_deployment('project_123', files)
        self.assertTrue(deployment_result['success'])


if __name__ == '__main__':
    pytest.main([__file__])
