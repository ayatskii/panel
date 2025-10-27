import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from analytics.models import PageView, Analytics
from analytics.services.realtime_analytics_service import RealtimeAnalyticsService
from sites.models import Site
from pages.models import Page

User = get_user_model()


class RealtimeAnalyticsServiceTestCase(TestCase):
    """Test cases for RealtimeAnalyticsService"""
    
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
        
        self.page = Page.objects.create(
            site=self.site,
            title='Test Page',
            slug='test-page',
            status='published'
        )
        
        self.service = RealtimeAnalyticsService()
    
    def test_track_realtime_view_success(self):
        """Test successful real-time view tracking"""
        user_data = {
            'ip_address': '192.168.1.1',
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'referrer': 'https://google.com',
            'country': 'US',
            'city': 'New York',
            'device_type': 'desktop',
            'browser': 'Chrome',
            'os': 'Windows'
        }
        
        with patch.object(self.service, '_update_realtime_metrics') as mock_update, \
             patch.object(self.service, '_broadcast_realtime_update') as mock_broadcast, \
             patch.object(self.service, '_update_realtime_cache') as mock_cache:
            
            result = self.service.track_realtime_view(
                self.site.id, 
                self.page.id, 
                user_data
            )
            
            self.assertTrue(result['success'])
            self.assertIn('page_view_id', result)
            self.assertIn('timestamp', result)
            
            # Verify page view was created
            page_view = PageView.objects.filter(
                site_id=self.site.id,
                page_id=self.page.id
            ).first()
            self.assertIsNotNone(page_view)
            self.assertEqual(page_view.ip_address, '192.168.1.1')
    
    def test_track_realtime_view_failure(self):
        """Test real-time view tracking failure"""
        # Test with invalid site ID
        result = self.service.track_realtime_view(999, self.page.id, {})
        
        self.assertFalse(result['success'])
        self.assertIn('error', result)
    
    def test_get_realtime_metrics_success(self):
        """Test successful real-time metrics retrieval"""
        # Create some test page views
        now = timezone.now()
        PageView.objects.create(
            site=self.site,
            page=self.page,
            ip_address='192.168.1.1',
            timestamp=now
        )
        PageView.objects.create(
            site=self.site,
            page=self.page,
            ip_address='192.168.1.2',
            timestamp=now
        )
        
        with patch('analytics.services.realtime_analytics_service.cache') as mock_cache:
            mock_cache.get.return_value = None  # No cached data
            
            result = self.service.get_realtime_metrics(self.site.id)
            
            self.assertIn('online_users', result)
            self.assertIn('hourly_views', result)
            self.assertIn('top_pages', result)
            self.assertIn('traffic_sources', result)
            self.assertIn('device_breakdown', result)
            self.assertIn('country_breakdown', result)
            self.assertIn('minute_data', result)
            self.assertIn('last_updated', result)
            self.assertEqual(result['site_id'], self.site.id)
    
    def test_get_realtime_metrics_cached(self):
        """Test real-time metrics retrieval from cache"""
        cached_data = {
            'online_users': 5,
            'hourly_views': 100,
            'last_updated': timezone.now().isoformat(),
            'site_id': self.site.id
        }
        
        with patch('analytics.services.realtime_analytics_service.cache') as mock_cache:
            mock_cache.get.return_value = cached_data
            
            result = self.service.get_realtime_metrics(self.site.id)
            
            self.assertEqual(result, cached_data)
    
    def test_get_live_visitors_success(self):
        """Test successful live visitors retrieval"""
        # Create recent page views
        now = timezone.now()
        PageView.objects.create(
            site=self.site,
            page=self.page,
            ip_address='192.168.1.1',
            country='US',
            city='New York',
            device_type='desktop',
            browser='Chrome',
            os='Windows',
            timestamp=now
        )
        
        result = self.service.get_live_visitors(self.site.id)
        
        self.assertIsInstance(result, list)
        if result:  # If there are visitors
            visitor = result[0]
            self.assertIn('ip_address', visitor)
            self.assertIn('country', visitor)
            self.assertIn('city', visitor)
            self.assertIn('device_type', visitor)
            self.assertIn('browser', visitor)
            self.assertIn('os', visitor)
            self.assertIn('last_activity', visitor)
            self.assertIn('page_count', visitor)
    
    def test_get_realtime_alerts_traffic_spike(self):
        """Test real-time alerts for traffic spike"""
        # Create high traffic in last hour
        now = timezone.now()
        for i in range(50):  # High traffic
            PageView.objects.create(
                site=self.site,
                page=self.page,
                ip_address=f'192.168.1.{i}',
                timestamp=now
            )
        
        # Create lower traffic in previous hours
        for i in range(5):  # Low traffic
            PageView.objects.create(
                site=self.site,
                page=self.page,
                ip_address=f'192.168.2.{i}',
                timestamp=now - timezone.timedelta(hours=2)
            )
        
        result = self.service.get_realtime_alerts(self.site.id)
        
        self.assertIsInstance(result, list)
        # Should detect traffic spike
        traffic_spike_alerts = [alert for alert in result if alert['type'] == 'traffic_spike']
        self.assertGreater(len(traffic_spike_alerts), 0)
    
    def test_get_realtime_alerts_high_bounce_rate(self):
        """Test real-time alerts for high bounce rate"""
        # Create single-page visits (high bounce rate)
        now = timezone.now()
        for i in range(20):
            PageView.objects.create(
                site=self.site,
                page=self.page,
                ip_address=f'192.168.1.{i}',
                timestamp=now
            )
        
        result = self.service.get_realtime_alerts(self.site.id)
        
        self.assertIsInstance(result, list)
        # Should detect high bounce rate
        bounce_rate_alerts = [alert for alert in result if alert['type'] == 'high_bounce_rate']
        self.assertGreater(len(bounce_rate_alerts), 0)
    
    def test_subscribe_to_realtime_updates(self):
        """Test subscribing to real-time updates"""
        with patch('analytics.services.realtime_analytics_service.async_to_sync') as mock_async:
            group_name = self.service.subscribe_to_realtime_updates(self.site.id, self.user.id)
            
            expected_group_name = f"analytics_{self.site.id}_{self.user.id}"
            self.assertEqual(group_name, expected_group_name)
            mock_async.assert_called_once()
    
    def test_unsubscribe_from_realtime_updates(self):
        """Test unsubscribing from real-time updates"""
        with patch('analytics.services.realtime_analytics_service.async_to_sync') as mock_async:
            self.service.unsubscribe_from_realtime_updates(self.site.id, self.user.id)
            mock_async.assert_called_once()
    
    def test_get_analytics_websocket_url(self):
        """Test getting analytics WebSocket URL"""
        url = self.service.get_analytics_websocket_url(self.site.id)
        expected_url = f"/ws/analytics/{self.site.id}/"
        self.assertEqual(url, expected_url)


class RealtimeAnalyticsAPITestCase(APITestCase):
    """Test cases for real-time analytics API endpoints"""
    
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
        
        self.page = Page.objects.create(
            site=self.site,
            title='Test Page',
            slug='test-page',
            status='published'
        )
    
    def test_get_realtime_metrics_authenticated(self):
        """Test getting real-time metrics for authenticated user"""
        self.client.force_authenticate(user=self.user)
        
        with patch('analytics.services.realtime_analytics_service.realtime_analytics_service.get_realtime_metrics') as mock_get:
            mock_get.return_value = {
                'online_users': 5,
                'hourly_views': 100,
                'site_id': self.site.id
            }
            
            response = self.client.get(f'/api/page-views/realtime_metrics/?site_id={self.site.id}')
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn('online_users', response.data)
            self.assertIn('hourly_views', response.data)
    
    def test_get_realtime_metrics_unauthenticated(self):
        """Test getting real-time metrics without authentication"""
        response = self.client.get(f'/api/page-views/realtime_metrics/?site_id={self.site.id}')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_get_realtime_metrics_missing_site_id(self):
        """Test getting real-time metrics without site_id parameter"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/api/page-views/realtime_metrics/')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_get_live_visitors_authenticated(self):
        """Test getting live visitors for authenticated user"""
        self.client.force_authenticate(user=self.user)
        
        with patch('analytics.services.realtime_analytics_service.realtime_analytics_service.get_live_visitors') as mock_get:
            mock_get.return_value = [
                {
                    'ip_address': '192.168.1.1',
                    'country': 'US',
                    'city': 'New York',
                    'device_type': 'desktop'
                }
            ]
            
            response = self.client.get(f'/api/page-views/live_visitors/?site_id={self.site.id}')
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn('visitors', response.data)
            self.assertIsInstance(response.data['visitors'], list)
    
    def test_get_realtime_alerts_authenticated(self):
        """Test getting real-time alerts for authenticated user"""
        self.client.force_authenticate(user=self.user)
        
        with patch('analytics.services.realtime_analytics_service.realtime_analytics_service.get_realtime_alerts') as mock_get:
            mock_get.return_value = [
                {
                    'type': 'traffic_spike',
                    'severity': 'high',
                    'message': 'Traffic spike detected',
                    'timestamp': timezone.now().isoformat()
                }
            ]
            
            response = self.client.get(f'/api/page-views/realtime_alerts/?site_id={self.site.id}')
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn('alerts', response.data)
            self.assertIsInstance(response.data['alerts'], list)
    
    def test_track_realtime_view_authenticated(self):
        """Test tracking real-time view for authenticated user"""
        self.client.force_authenticate(user=self.user)
        
        with patch('analytics.services.realtime_analytics_service.realtime_analytics_service.track_realtime_view') as mock_track:
            mock_track.return_value = {
                'success': True,
                'page_view_id': 123,
                'timestamp': timezone.now().isoformat()
            }
            
            data = {
                'site_id': self.site.id,
                'page_id': self.page.id,
                'user_data': {
                    'ip_address': '192.168.1.1',
                    'user_agent': 'Mozilla/5.0...',
                    'country': 'US'
                }
            }
            
            response = self.client.post('/api/page-views/track_realtime_view/', data)
            
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertTrue(response.data['success'])
    
    def test_track_realtime_view_missing_data(self):
        """Test tracking real-time view with missing data"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'site_id': self.site.id,
            # Missing page_id
            'user_data': {}
        }
        
        response = self.client.post('/api/page-views/track_realtime_view/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_get_websocket_url_authenticated(self):
        """Test getting WebSocket URL for authenticated user"""
        self.client.force_authenticate(user=self.user)
        
        with patch('analytics.services.realtime_analytics_service.realtime_analytics_service.get_analytics_websocket_url') as mock_get:
            mock_get.return_value = f"/ws/analytics/{self.site.id}/"
            
            response = self.client.get(f'/api/page-views/websocket_url/?site_id={self.site.id}')
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn('websocket_url', response.data)


class RealtimeAnalyticsErrorHandlingTestCase(TestCase):
    """Test cases for error handling in real-time analytics"""
    
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
        
        self.service = RealtimeAnalyticsService()
    
    def test_get_realtime_metrics_invalid_site_id(self):
        """Test getting real-time metrics with invalid site ID"""
        result = self.service.get_realtime_metrics(999)
        
        self.assertIn('error', result)
    
    def test_get_live_visitors_invalid_site_id(self):
        """Test getting live visitors with invalid site ID"""
        result = self.service.get_live_visitors(999)
        
        self.assertEqual(result, [])
    
    def test_get_realtime_alerts_invalid_site_id(self):
        """Test getting real-time alerts with invalid site ID"""
        result = self.service.get_realtime_alerts(999)
        
        self.assertEqual(result, [])
    
    def test_track_realtime_view_database_error(self):
        """Test tracking real-time view with database error"""
        with patch('analytics.models.PageView.objects.create') as mock_create:
            mock_create.side_effect = Exception('Database error')
            
            result = self.service.track_realtime_view(
                self.site.id, 
                1, 
                {'ip_address': '192.168.1.1'}
            )
            
            self.assertFalse(result['success'])
            self.assertIn('error', result)


class RealtimeAnalyticsPerformanceTestCase(TestCase):
    """Test cases for performance in real-time analytics"""
    
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
        
        self.service = RealtimeAnalyticsService()
    
    def test_realtime_metrics_performance(self):
        """Test performance of real-time metrics calculation"""
        import time
        
        # Create test data
        now = timezone.now()
        for i in range(100):
            PageView.objects.create(
                site=self.site,
                ip_address=f'192.168.1.{i % 10}',  # 10 unique IPs
                timestamp=now
            )
        
        start_time = time.time()
        result = self.service.get_realtime_metrics(self.site.id)
        end_time = time.time()
        
        # Should complete within reasonable time (less than 1 second)
        self.assertLess(end_time - start_time, 1.0)
        self.assertIn('online_users', result)
    
    def test_live_visitors_performance(self):
        """Test performance of live visitors calculation"""
        import time
        
        # Create test data
        now = timezone.now()
        for i in range(50):
            PageView.objects.create(
                site=self.site,
                ip_address=f'192.168.1.{i % 5}',  # 5 unique IPs
                timestamp=now
            )
        
        start_time = time.time()
        result = self.service.get_live_visitors(self.site.id)
        end_time = time.time()
        
        # Should complete within reasonable time (less than 1 second)
        self.assertLess(end_time - start_time, 1.0)
        self.assertIsInstance(result, list)


if __name__ == '__main__':
    pytest.main([__file__])
