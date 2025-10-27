import pytest
import json
from unittest.mock import Mock, patch
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from templates.services.uniqueness_service import TemplateUniquenessService
from templates.models import Template
from sites.models import Site

User = get_user_model()


class TemplateUniquenessServiceTestCase(TestCase):
    """Test cases for TemplateUniquenessService"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.site = Site.objects.create(
            domain='test.com',
            brand_name='Test Brand',
            owner=self.user
        )
        
        self.template = Template.objects.create(
            name='Test Template',
            description='Test template description',
            html_content='<div class="container"><h1 class="title">Hello</h1></div>',
            css_content='.container { width: 100%; } .title { color: blue; }',
            type='gaming',
            css_framework='bootstrap'
        )
        
        self.service = TemplateUniquenessService()
    
    def test_extract_css_classes(self):
        """Test CSS class extraction from content"""
        css_content = """
        .btn-primary { background: blue; }
        .btn-secondary { background: gray; }
        .card-header { padding: 10px; }
        .container { width: 100%; }
        """
        
        classes = self.service._extract_css_classes(css_content)
        
        expected_classes = ['btn-primary', 'btn-secondary', 'card-header', 'container']
        self.assertEqual(sorted(classes), sorted(expected_classes))
    
    def test_generate_random_mappings(self):
        """Test random CSS class mapping generation"""
        css_classes = ['btn-primary', 'btn-secondary', 'card-header']
        
        mappings = self.service._generate_random_mappings(css_classes, self.site.id)
        
        self.assertEqual(len(mappings), len(css_classes))
        for original_class in css_classes:
            self.assertIn(original_class, mappings)
            self.assertNotEqual(original_class, mappings[original_class])
    
    def test_generate_mappings_from_list(self):
        """Test CSS class mapping generation from predefined list"""
        css_classes = ['btn-primary', 'btn-secondary']
        class_list = ['primary-btn', 'secondary-btn', 'alt-btn']
        
        mappings = self.service._generate_mappings_from_list(css_classes, class_list, self.site.id)
        
        self.assertEqual(len(mappings), len(css_classes))
        for original_class in css_classes:
            self.assertIn(original_class, mappings)
            self.assertIn(mappings[original_class], class_list)
    
    def test_generate_unique_css_classes_random(self):
        """Test unique CSS class generation with random mapping"""
        css_content = """
        .btn-primary { background: blue; }
        .btn-secondary { background: gray; }
        .card-header { padding: 10px; }
        """
        
        modified_css, class_mappings = self.service.generate_unique_css_classes(
            css_content, 
            self.site.id
        )
        
        self.assertIsInstance(class_mappings, dict)
        self.assertEqual(len(class_mappings), 3)
        
        # Check that original classes are replaced in CSS
        for original_class in class_mappings:
            self.assertNotIn(f'.{original_class}', modified_css)
            self.assertIn(f'.{class_mappings[original_class]}', modified_css)
    
    def test_generate_unique_css_classes_custom_list(self):
        """Test unique CSS class generation with custom class list"""
        css_content = """
        .btn-primary { background: blue; }
        .btn-secondary { background: gray; }
        """
        
        modified_css, class_mappings = self.service.generate_unique_css_classes(
            css_content, 
            self.site.id, 
            'list_1'
        )
        
        self.assertIsInstance(class_mappings, dict)
        self.assertEqual(len(class_mappings), 2)
        
        # Check that mappings use predefined classes
        for original_class, unique_class in class_mappings.items():
            self.assertIn(unique_class, self.service.custom_class_lists['list_1'])
    
    def test_apply_class_mappings_to_html(self):
        """Test applying class mappings to HTML content"""
        html_content = '<div class="btn-primary card-header">Content</div>'
        class_mappings = {
            'btn-primary': 'unique-btn-primary',
            'card-header': 'unique-card-header'
        }
        
        modified_html = self.service.apply_class_mappings_to_html(html_content, class_mappings)
        
        self.assertIn('unique-btn-primary', modified_html)
        self.assertIn('unique-card-header', modified_html)
        self.assertNotIn('btn-primary', modified_html)
        self.assertNotIn('card-header', modified_html)
    
    def test_get_class_mappings_for_site(self):
        """Test retrieving class mappings for a specific site"""
        css_content = '.btn-primary { background: blue; }'
        modified_css, class_mappings = self.service.generate_unique_css_classes(
            css_content, 
            self.site.id
        )
        
        retrieved_mappings = self.service.get_class_mappings_for_site(self.site.id)
        
        self.assertEqual(retrieved_mappings, class_mappings)
    
    def test_get_available_class_lists(self):
        """Test retrieving available custom class lists"""
        class_lists = self.service.get_available_class_lists()
        
        self.assertIsInstance(class_lists, dict)
        self.assertIn('list_1', class_lists)
        self.assertIn('list_2', class_lists)
        self.assertIn('list_3', class_lists)
        
        # Check that each list contains classes
        for list_name, classes in class_lists.items():
            self.assertIsInstance(classes, list)
            self.assertGreater(len(classes), 0)
    
    def test_create_custom_class_list(self):
        """Test creating a new custom class list"""
        new_classes = ['custom-btn', 'custom-card', 'custom-header']
        
        success = self.service.create_custom_class_list('custom_list', new_classes)
        
        self.assertTrue(success)
        class_lists = self.service.get_available_class_lists()
        self.assertIn('custom_list', class_lists)
        self.assertEqual(class_lists['custom_list'], new_classes)
    
    def test_create_custom_class_list_duplicate(self):
        """Test creating a custom class list with duplicate name"""
        new_classes = ['custom-btn', 'custom-card']
        
        # First creation should succeed
        success1 = self.service.create_custom_class_list('duplicate_list', new_classes)
        self.assertTrue(success1)
        
        # Second creation with same name should fail
        success2 = self.service.create_custom_class_list('duplicate_list', ['other-class'])
        self.assertFalse(success2)
    
    def test_validate_css_classes(self):
        """Test CSS class validation and analysis"""
        css_content = """
        .btn-primary { background: blue; }
        .btn-secondary { background: gray; }
        .card-header { padding: 10px; }
        .container { width: 100%; }
        .row { display: flex; }
        """
        
        analysis = self.service.validate_css_classes(css_content)
        
        self.assertIn('total_classes', analysis)
        self.assertIn('classes', analysis)
        self.assertIn('has_conflicts', analysis)
        self.assertIn('recommendations', analysis)
        
        self.assertEqual(analysis['total_classes'], 5)
        self.assertFalse(analysis['has_conflicts'])
        self.assertIsInstance(analysis['recommendations'], list)
    
    def test_validate_css_classes_with_conflicts(self):
        """Test CSS class validation with duplicate classes"""
        css_content = """
        .btn-primary { background: blue; }
        .btn-primary { background: red; }  /* Duplicate */
        .card-header { padding: 10px; }
        """
        
        analysis = self.service.validate_css_classes(css_content)
        
        self.assertTrue(analysis['has_conflicts'])
        self.assertEqual(analysis['total_classes'], 2)  # Only unique classes
    
    def test_generate_unique_class_name_collision_handling(self):
        """Test handling of class name collisions"""
        used_classes = set(['_abc12345_btn-primary', '_abc12345_btn-secondary'])
        
        unique_class = self.service._generate_unique_class_name(
            'btn-primary', 
            self.site.id, 
            used_classes
        )
        
        self.assertNotIn(unique_class, used_classes)
        self.assertNotEqual(unique_class, 'btn-primary')
        self.assertTrue(unique_class.startswith('_'))
    
    def test_replace_css_classes_complex(self):
        """Test CSS class replacement with complex selectors"""
        css_content = """
        .btn-primary:hover { background: darkblue; }
        .btn-primary.active { background: navy; }
        .container .btn-primary { margin: 10px; }
        """
        
        class_mappings = {'btn-primary': 'unique-btn-primary'}
        
        modified_css = self.service._replace_css_classes(css_content, class_mappings)
        
        self.assertIn('unique-btn-primary:hover', modified_css)
        self.assertIn('unique-btn-primary.active', modified_css)
        self.assertIn('.container .unique-btn-primary', modified_css)
        self.assertNotIn('.btn-primary', modified_css)


class TemplateUniquenessAPITestCase(APITestCase):
    """Test cases for template uniqueness API endpoints"""
    
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
        
        self.site = Site.objects.create(
            domain='test.com',
            brand_name='Test Brand',
            owner=self.user
        )
        
        self.template = Template.objects.create(
            name='Test Template',
            description='Test template description',
            html_content='<div class="container"><h1 class="title">Hello</h1></div>',
            css_content='.container { width: 100%; } .title { color: blue; }',
            type='gaming',
            css_framework='bootstrap'
        )
    
    def test_generate_unique_css_authenticated(self):
        """Test generating unique CSS for authenticated user"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'site_id': self.site.id,
            'class_list_name': 'list_1'
        }
        
        response = self.client.post(f'/api/templates/{self.template.id}/generate_unique_css/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('modified_css', response.data)
        self.assertIn('class_mappings', response.data)
        self.assertIn('total_classes', response.data)
    
    def test_generate_unique_css_unauthenticated(self):
        """Test generating unique CSS without authentication"""
        data = {
            'site_id': self.site.id,
            'class_list_name': 'list_1'
        }
        
        response = self.client.post(f'/api/templates/{self.template.id}/generate_unique_css/', data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_generate_unique_css_missing_site_id(self):
        """Test generating unique CSS without site_id"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'class_list_name': 'list_1'
        }
        
        response = self.client.post(f'/api/templates/{self.template.id}/generate_unique_css/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_validate_css_authenticated(self):
        """Test CSS validation for authenticated user"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.post(f'/api/templates/{self.template.id}/validate_css/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_classes', response.data)
        self.assertIn('classes', response.data)
        self.assertIn('has_conflicts', response.data)
        self.assertIn('recommendations', response.data)
    
    def test_get_class_lists_authenticated(self):
        """Test getting class lists for authenticated user"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/api/templates/class_lists/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('class_lists', response.data)
        self.assertIn('list_1', response.data['class_lists'])
        self.assertIn('list_2', response.data['class_lists'])
        self.assertIn('list_3', response.data['class_lists'])
    
    def test_create_class_list_admin(self):
        """Test creating class list as admin user"""
        self.client.force_authenticate(user=self.admin_user)
        
        data = {
            'name': 'test_list',
            'classes': ['test-btn', 'test-card', 'test-header']
        }
        
        response = self.client.post('/api/templates/create_class_list/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
    
    def test_create_class_list_non_admin(self):
        """Test creating class list as non-admin user"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'name': 'test_list',
            'classes': ['test-btn', 'test-card']
        }
        
        response = self.client.post('/api/templates/create_class_list/', data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_create_class_list_missing_data(self):
        """Test creating class list with missing data"""
        self.client.force_authenticate(user=self.admin_user)
        
        data = {
            'name': 'test_list'
            # Missing classes
        }
        
        response = self.client.post('/api/templates/create_class_list/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_create_class_list_duplicate_name(self):
        """Test creating class list with duplicate name"""
        self.client.force_authenticate(user=self.admin_user)
        
        # First creation
        data1 = {
            'name': 'duplicate_list',
            'classes': ['btn1', 'btn2']
        }
        response1 = self.client.post('/api/templates/create_class_list/', data1)
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        
        # Second creation with same name
        data2 = {
            'name': 'duplicate_list',
            'classes': ['btn3', 'btn4']
        }
        response2 = self.client.post('/api/templates/create_class_list/', data2)
        
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response2.data)


class TemplateUniquenessIntegrationTestCase(TestCase):
    """Integration test cases for template uniqueness"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.site1 = Site.objects.create(
            domain='site1.com',
            brand_name='Site 1',
            owner=self.user
        )
        
        self.site2 = Site.objects.create(
            domain='site2.com',
            brand_name='Site 2',
            owner=self.user
        )
        
        self.template = Template.objects.create(
            name='Test Template',
            description='Test template description',
            html_content='<div class="container"><h1 class="title">Hello</h1></div>',
            css_content='.container { width: 100%; } .title { color: blue; }',
            type='gaming',
            css_framework='bootstrap'
        )
        
        self.service = TemplateUniquenessService()
    
    def test_multiple_sites_unique_classes(self):
        """Test that different sites get unique CSS classes"""
        css_content = '.btn-primary { background: blue; } .card-header { padding: 10px; }'
        
        # Generate classes for site 1
        modified_css1, class_mappings1 = self.service.generate_unique_css_classes(
            css_content, 
            self.site1.id
        )
        
        # Generate classes for site 2
        modified_css2, class_mappings2 = self.service.generate_unique_css_classes(
            css_content, 
            self.site2.id
        )
        
        # Classes should be different between sites
        for original_class in class_mappings1:
            self.assertNotEqual(
                class_mappings1[original_class], 
                class_mappings2[original_class]
            )
    
    def test_same_site_consistent_classes(self):
        """Test that same site gets consistent CSS classes"""
        css_content = '.btn-primary { background: blue; }'
        
        # Generate classes for site 1 first time
        modified_css1, class_mappings1 = self.service.generate_unique_css_classes(
            css_content, 
            self.site1.id
        )
        
        # Generate classes for site 1 second time
        modified_css2, class_mappings2 = self.service.generate_unique_css_classes(
            css_content, 
            self.site1.id
        )
        
        # Classes should be the same for the same site
        self.assertEqual(class_mappings1, class_mappings2)
    
    def test_complete_template_processing_workflow(self):
        """Test complete template processing workflow"""
        html_content = '<div class="container"><h1 class="title">Hello</h1></div>'
        css_content = '.container { width: 100%; } .title { color: blue; }'
        
        # Step 1: Generate unique CSS classes
        modified_css, class_mappings = self.service.generate_unique_css_classes(
            css_content, 
            self.site1.id
        )
        
        # Step 2: Apply class mappings to HTML
        modified_html = self.service.apply_class_mappings_to_html(html_content, class_mappings)
        
        # Step 3: Verify results
        self.assertNotEqual(css_content, modified_css)
        self.assertNotEqual(html_content, modified_html)
        
        # Check that original classes are replaced
        for original_class in class_mappings:
            self.assertNotIn(f'.{original_class}', modified_css)
            self.assertNotIn(f'class="{original_class}"', modified_html)
            self.assertIn(f'.{class_mappings[original_class]}', modified_css)
            self.assertIn(f'class="{class_mappings[original_class]}"', modified_html)


class TemplateUniquenessPerformanceTestCase(TestCase):
    """Performance test cases for template uniqueness"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.site = Site.objects.create(
            domain='test.com',
            brand_name='Test Brand',
            owner=self.user
        )
        
        self.service = TemplateUniquenessService()
    
    def test_large_css_performance(self):
        """Test performance with large CSS file"""
        import time
        
        # Create large CSS content
        css_content = ""
        for i in range(100):
            css_content += f".class-{i} {{ property-{i}: value-{i}; }}\n"
        
        start_time = time.time()
        modified_css, class_mappings = self.service.generate_unique_css_classes(
            css_content, 
            self.site.id
        )
        end_time = time.time()
        
        # Should complete within reasonable time (less than 2 seconds)
        self.assertLess(end_time - start_time, 2.0)
        self.assertEqual(len(class_mappings), 100)
    
    def test_complex_html_performance(self):
        """Test performance with complex HTML"""
        import time
        
        # Create complex HTML content
        html_content = ""
        for i in range(50):
            html_content += f'<div class="container-{i}"><h1 class="title-{i}">Title {i}</h1></div>\n'
        
        css_content = ""
        for i in range(50):
            css_content += f".container-{i} {{ width: 100%; }}\n"
            css_content += f".title-{i} {{ color: blue; }}\n"
        
        # Generate mappings
        modified_css, class_mappings = self.service.generate_unique_css_classes(
            css_content, 
            self.site.id
        )
        
        start_time = time.time()
        modified_html = self.service.apply_class_mappings_to_html(html_content, class_mappings)
        end_time = time.time()
        
        # Should complete within reasonable time (less than 1 second)
        self.assertLess(end_time - start_time, 1.0)
        self.assertNotEqual(html_content, modified_html)


if __name__ == '__main__':
    pytest.main([__file__])
