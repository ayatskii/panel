import pytest
import time
import json
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.db import connection
from django.core.cache import cache
from django.test.utils import override_settings
from rest_framework.test import APITestCase
from rest_framework import status
from sites.models import Site, Language, AffiliateLink
from pages.models import Page, PageBlock
from analytics.models import PageView, Analytics
from templates.models import Template
from integrations.models import CloudflareToken
from templates.services.uniqueness_service import TemplateUniquenessService
from analytics.services.realtime_analytics_service import RealtimeAnalyticsService

User = get_user_model()


class DatabasePerformanceTestCase(TransactionTestCase):
    """Test cases for database performance"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create test data
        self.sites = []
        self.pages = []
        self.page_views = []
        
        # Create 100 sites
        for i in range(100):
            site = Site.objects.create(
                domain=f'site{i}.com',
                brand_name=f'Brand {i}',
                owner=self.user
            )
            self.sites.append(site)
            
            # Create 10 pages per site
            for j in range(10):
                page = Page.objects.create(
                    site=site,
                    title=f'Page {j} for Site {i}',
                    slug=f'page-{j}-site-{i}',
                    status='published'
                )
                self.pages.append(page)
                
                # Create 50 page views per page
                for k in range(50):
                    page_view = PageView.objects.create(
                        site=site,
                        page=page,
                        ip_address=f'192.168.1.{k % 255}',
                        timestamp=timezone.now()
                    )
                    self.page_views.append(page_view)
    
    def test_site_list_performance(self):
        """Test performance of site listing with large dataset"""
        start_time = time.time()
        
        # Test with select_related optimization
        sites = Site.objects.select_related('owner', 'template').all()
        list(sites)  # Force evaluation
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time (less than 1 second)
        self.assertLess(execution_time, 1.0)
        self.assertEqual(len(sites), 100)
    
    def test_page_views_analytics_performance(self):
        """Test performance of page views analytics calculation"""
        start_time = time.time()
        
        # Test analytics calculation
        total_views = PageView.objects.count()
        unique_visitors = PageView.objects.values('ip_address').distinct().count()
        
        # Test grouped queries
        daily_views = PageView.objects.extra(
            select={'date': 'DATE(timestamp)'}
        ).values('date').annotate(
            views=Count('id')
        ).order_by('date')
        
        list(daily_views)  # Force evaluation
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time (less than 2 seconds)
        self.assertLess(execution_time, 2.0)
        self.assertEqual(total_views, 50000)  # 100 sites * 10 pages * 50 views
        self.assertGreater(unique_visitors, 0)
    
    def test_database_query_optimization(self):
        """Test database query optimization with prefetch_related"""
        start_time = time.time()
        
        # Test with prefetch_related for related objects
        sites = Site.objects.prefetch_related(
            'pages',
            'pages__blocks',
            'pages__pageviews'
        ).all()
        
        # Access related objects to test prefetch
        for site in sites[:10]:  # Test first 10 sites
            pages = site.pages.all()
            for page in pages[:5]:  # Test first 5 pages
                blocks = page.blocks.all()
                views = page.pageviews.all()
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time (less than 3 seconds)
        self.assertLess(execution_time, 3.0)
    
    def test_bulk_operations_performance(self):
        """Test performance of bulk operations"""
        start_time = time.time()
        
        # Test bulk creation
        new_sites = []
        for i in range(50):
            new_sites.append(Site(
                domain=f'bulk-site{i}.com',
                brand_name=f'Bulk Brand {i}',
                owner=self.user
            ))
        
        Site.objects.bulk_create(new_sites)
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time (less than 1 second)
        self.assertLess(execution_time, 1.0)
        
        # Verify creation
        self.assertEqual(Site.objects.count(), 150)  # 100 + 50


class APIPerformanceTestCase(APITestCase):
    """Test cases for API performance"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create test data
        self.sites = []
        for i in range(50):
            site = Site.objects.create(
                domain=f'api-site{i}.com',
                brand_name=f'API Brand {i}',
                owner=self.user
            )
            self.sites.append(site)
    
    def test_sites_api_performance(self):
        """Test performance of sites API endpoint"""
        self.client.force_authenticate(user=self.user)
        
        start_time = time.time()
        
        response = self.client.get('/api/sites/')
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time (less than 1 second)
        self.assertLess(execution_time, 1.0)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 50)
    
    def test_paginated_api_performance(self):
        """Test performance of paginated API responses"""
        self.client.force_authenticate(user=self.user)
        
        start_time = time.time()
        
        # Test with pagination
        response = self.client.get('/api/sites/?page=1&page_size=25')
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time (less than 0.5 seconds)
        self.assertLess(execution_time, 0.5)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 25)
    
    def test_search_api_performance(self):
        """Test performance of search API endpoints"""
        self.client.force_authenticate(user=self.user)
        
        start_time = time.time()
        
        # Test search functionality
        response = self.client.get('/api/sites/?search=API Brand 1')
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time (less than 0.5 seconds)
        self.assertLess(execution_time, 0.5)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)


class CachePerformanceTestCase(TestCase):
    """Test cases for cache performance"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.site = Site.objects.create(
            domain='cache-test.com',
            brand_name='Cache Test Brand',
            owner=self.user
        )
    
    def test_cache_set_get_performance(self):
        """Test performance of cache operations"""
        start_time = time.time()
        
        # Test cache set operations
        for i in range(1000):
            cache.set(f'test_key_{i}', f'test_value_{i}', 300)
        
        end_time = time.time()
        set_time = end_time - start_time
        
        start_time = time.time()
        
        # Test cache get operations
        for i in range(1000):
            value = cache.get(f'test_key_{i}')
            self.assertEqual(value, f'test_value_{i}')
        
        end_time = time.time()
        get_time = end_time - start_time
        
        # Should complete within reasonable time (less than 2 seconds total)
        self.assertLess(set_time, 1.0)
        self.assertLess(get_time, 1.0)
    
    def test_cache_invalidation_performance(self):
        """Test performance of cache invalidation"""
        # Set up cache data
        for i in range(100):
            cache.set(f'bulk_key_{i}', f'bulk_value_{i}', 300)
        
        start_time = time.time()
        
        # Test bulk cache invalidation
        for i in range(100):
            cache.delete(f'bulk_key_{i}')
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time (less than 0.5 seconds)
        self.assertLess(execution_time, 0.5)
        
        # Verify deletion
        for i in range(100):
            self.assertIsNone(cache.get(f'bulk_key_{i}'))


class TemplateUniquenessPerformanceTestCase(TestCase):
    """Test cases for template uniqueness performance"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.site = Site.objects.create(
            domain='uniqueness-test.com',
            brand_name='Uniqueness Test Brand',
            owner=self.user
        )
        
        self.service = TemplateUniquenessService()
    
    def test_large_css_processing_performance(self):
        """Test performance of large CSS processing"""
        # Create large CSS content
        css_content = ""
        for i in range(500):
            css_content += f"""
            .class-{i} {{
                property-{i}: value-{i};
                margin: {i}px;
                padding: {i}px;
                color: #{i:06x};
            }}
            """
        
        start_time = time.time()
        
        modified_css, class_mappings = self.service.generate_unique_css_classes(
            css_content, 
            self.site.id
        )
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time (less than 3 seconds)
        self.assertLess(execution_time, 3.0)
        self.assertEqual(len(class_mappings), 500)
    
    def test_complex_html_processing_performance(self):
        """Test performance of complex HTML processing"""
        # Create complex HTML content
        html_content = ""
        for i in range(200):
            html_content += f"""
            <div class="container-{i}">
                <h1 class="title-{i}">Title {i}</h1>
                <p class="content-{i}">Content {i}</p>
                <button class="btn-{i}">Button {i}</button>
            </div>
            """
        
        css_content = ""
        for i in range(200):
            css_content += f"""
            .container-{i} {{ width: 100%; }}
            .title-{i} {{ color: blue; }}
            .content-{i} {{ margin: 10px; }}
            .btn-{i} {{ background: red; }}
            """
        
        # Generate mappings
        modified_css, class_mappings = self.service.generate_unique_css_classes(
            css_content, 
            self.site.id
        )
        
        start_time = time.time()
        
        modified_html = self.service.apply_class_mappings_to_html(html_content, class_mappings)
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time (less than 2 seconds)
        self.assertLess(execution_time, 2.0)
        self.assertNotEqual(html_content, modified_html)
    
    def test_multiple_sites_uniqueness_performance(self):
        """Test performance of uniqueness generation for multiple sites"""
        sites = []
        for i in range(50):
            site = Site.objects.create(
                domain=f'uniqueness-site{i}.com',
                brand_name=f'Uniqueness Brand {i}',
                owner=self.user
            )
            sites.append(site)
        
        css_content = '.btn-primary { background: blue; } .card-header { padding: 10px; }'
        
        start_time = time.time()
        
        # Generate unique classes for all sites
        all_mappings = {}
        for site in sites:
            modified_css, class_mappings = self.service.generate_unique_css_classes(
                css_content, 
                site.id
            )
            all_mappings[site.id] = class_mappings
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time (less than 2 seconds)
        self.assertLess(execution_time, 2.0)
        self.assertEqual(len(all_mappings), 50)
        
        # Verify uniqueness across sites
        all_classes = set()
        for site_id, mappings in all_mappings.items():
            for original_class, unique_class in mappings.items():
                self.assertNotIn(unique_class, all_classes)
                all_classes.add(unique_class)


class RealtimeAnalyticsPerformanceTestCase(TestCase):
    """Test cases for real-time analytics performance"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.site = Site.objects.create(
            domain='analytics-test.com',
            brand_name='Analytics Test Brand',
            owner=self.user
        )
        
        self.page = Page.objects.create(
            site=self.site,
            title='Analytics Test Page',
            slug='analytics-test-page',
            status='published'
        )
        
        self.service = RealtimeAnalyticsService()
    
    def test_large_dataset_analytics_performance(self):
        """Test performance of analytics with large dataset"""
        # Create large dataset of page views
        now = timezone.now()
        page_views = []
        
        for i in range(1000):
            page_view = PageView(
                site=self.site,
                page=self.page,
                ip_address=f'192.168.1.{i % 255}',
                country='US',
                city='New York',
                device_type='desktop',
                browser='Chrome',
                os='Windows',
                timestamp=now
            )
            page_views.append(page_view)
        
        PageView.objects.bulk_create(page_views)
        
        start_time = time.time()
        
        # Test real-time metrics calculation
        metrics = self.service.get_realtime_metrics(self.site.id)
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time (less than 2 seconds)
        self.assertLess(execution_time, 2.0)
        self.assertIn('online_users', metrics)
        self.assertIn('hourly_views', metrics)
    
    def test_live_visitors_performance(self):
        """Test performance of live visitors calculation"""
        # Create recent page views
        now = timezone.now()
        page_views = []
        
        for i in range(500):
            page_view = PageView(
                site=self.site,
                page=self.page,
                ip_address=f'192.168.1.{i % 100}',  # 100 unique IPs
                country='US',
                city='New York',
                device_type='desktop',
                browser='Chrome',
                os='Windows',
                timestamp=now
            )
            page_views.append(page_view)
        
        PageView.objects.bulk_create(page_views)
        
        start_time = time.time()
        
        # Test live visitors calculation
        visitors = self.service.get_live_visitors(self.site.id)
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time (less than 1 second)
        self.assertLess(execution_time, 1.0)
        self.assertIsInstance(visitors, list)
        self.assertLessEqual(len(visitors), 100)  # Should be <= 100 unique IPs
    
    def test_realtime_alerts_performance(self):
        """Test performance of real-time alerts calculation"""
        # Create test data for alerts
        now = timezone.now()
        page_views = []
        
        # Create high traffic for traffic spike alert
        for i in range(100):
            page_view = PageView(
                site=self.site,
                page=self.page,
                ip_address=f'192.168.1.{i}',
                timestamp=now
            )
            page_views.append(page_view)
        
        PageView.objects.bulk_create(page_views)
        
        start_time = time.time()
        
        # Test real-time alerts calculation
        alerts = self.service.get_realtime_alerts(self.site.id)
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time (less than 1 second)
        self.assertLess(execution_time, 1.0)
        self.assertIsInstance(alerts, list)


class MemoryUsageTestCase(TestCase):
    """Test cases for memory usage"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_memory_usage_large_queries(self):
        """Test memory usage with large database queries"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss
        
        # Create large dataset
        sites = []
        for i in range(1000):
            site = Site(
                domain=f'memory-site{i}.com',
                brand_name=f'Memory Brand {i}',
                owner=self.user
            )
            sites.append(site)
        
        Site.objects.bulk_create(sites)
        
        # Test memory usage with large query
        all_sites = Site.objects.all()
        sites_list = list(all_sites)
        
        final_memory = process.memory_info().rss
        memory_increase = final_memory - initial_memory
        
        # Memory increase should be reasonable (less than 100MB)
        self.assertLess(memory_increase, 100 * 1024 * 1024)  # 100MB
        self.assertEqual(len(sites_list), 1000)
    
    def test_memory_usage_bulk_operations(self):
        """Test memory usage with bulk operations"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss
        
        # Test bulk creation
        sites = []
        for i in range(500):
            sites.append(Site(
                domain=f'bulk-memory-site{i}.com',
                brand_name=f'Bulk Memory Brand {i}',
                owner=self.user
            ))
        
        Site.objects.bulk_create(sites)
        
        final_memory = process.memory_info().rss
        memory_increase = final_memory - initial_memory
        
        # Memory increase should be reasonable (less than 50MB)
        self.assertLess(memory_increase, 50 * 1024 * 1024)  # 50MB


class ConcurrentAccessTestCase(TransactionTestCase):
    """Test cases for concurrent access"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.site = Site.objects.create(
            domain='concurrent-test.com',
            brand_name='Concurrent Test Brand',
            owner=self.user
        )
    
    def test_concurrent_site_creation(self):
        """Test concurrent site creation"""
        import threading
        import time
        
        results = []
        errors = []
        
        def create_site(site_id):
            try:
                site = Site.objects.create(
                    domain=f'concurrent-site{site_id}.com',
                    brand_name=f'Concurrent Brand {site_id}',
                    owner=self.user
                )
                results.append(site.id)
            except Exception as e:
                errors.append(str(e))
        
        # Create multiple threads
        threads = []
        for i in range(10):
            thread = threading.Thread(target=create_site, args=(i,))
            threads.append(thread)
        
        # Start all threads
        start_time = time.time()
        for thread in threads:
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time (less than 2 seconds)
        self.assertLess(execution_time, 2.0)
        self.assertEqual(len(results), 10)
        self.assertEqual(len(errors), 0)
        
        # Verify all sites were created
        self.assertEqual(Site.objects.count(), 11)  # 1 initial + 10 concurrent


if __name__ == '__main__':
    pytest.main([__file__])
