import json
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Set
from django.db.models import Count, Sum, Avg, Q, F
from django.db.models.functions import TruncMinute, TruncHour
from django.utils import timezone as django_timezone
from django.core.cache import cache
from django.conf import settings
try:
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    CHANNELS_AVAILABLE = True
except ImportError:
    CHANNELS_AVAILABLE = False
    get_channel_layer = None
    async_to_sync = None
from analytics.models import PageView, Analytics
from sites.models import Site
from pages.models import Page

logger = logging.getLogger(__name__)


class RealtimeAnalyticsService:
    """
    Service for real-time analytics and live data streaming
    """
    
    def __init__(self):
        self.channel_layer = get_channel_layer() if CHANNELS_AVAILABLE else None
        self.cache_timeout = 60  # 1 minute cache for real-time data
        self.websocket_group_prefix = "analytics_"
    
    def track_realtime_view(self, site_id: int, page_id: int, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Track a page view in real-time and broadcast to connected clients
        
        Args:
            site_id: ID of the site
            page_id: ID of the page
            user_data: User tracking data (IP, user agent, referrer, etc.)
            
        Returns:
            Dict with tracking result
        """
        try:
            # Create page view record
            page_view = PageView.objects.create(
                site_id=site_id,
                page_id=page_id,
                ip_address=user_data.get('ip_address', ''),
                user_agent=user_data.get('user_agent', ''),
                referrer=user_data.get('referrer', ''),
                country=user_data.get('country', ''),
                city=user_data.get('city', ''),
                device_type=user_data.get('device_type', 'desktop'),
                browser=user_data.get('browser', ''),
                os=user_data.get('os', ''),
                timestamp=django_timezone.now()
            )
            
            # Update real-time metrics
            self._update_realtime_metrics(site_id, page_id)
            
            # Broadcast to WebSocket clients
            self._broadcast_realtime_update(site_id, page_id, page_view)
            
            # Update cache
            self._update_realtime_cache(site_id)
            
            return {
                'success': True,
                'page_view_id': page_view.id,
                'timestamp': page_view.timestamp.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to track real-time view: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_realtime_metrics(self, site_id: int) -> Dict[str, Any]:
        """
        Get current real-time metrics for a site
        
        Args:
            site_id: ID of the site
            
        Returns:
            Dict with real-time metrics
        """
        try:
            # Try to get from cache first
            cache_key = f"realtime_metrics_{site_id}"
            cached_data = cache.get(cache_key)
            
            if cached_data:
                return cached_data
            
            # Calculate real-time metrics
            now = django_timezone.now()
            last_hour = now - timedelta(hours=1)
            last_5_minutes = now - timedelta(minutes=5)
            
            # Get current online users (last 5 minutes)
            online_users = PageView.objects.filter(
                site_id=site_id,
                timestamp__gte=last_5_minutes
            ).values('ip_address').distinct().count()
            
            # Get page views in last hour
            hourly_views = PageView.objects.filter(
                site_id=site_id,
                timestamp__gte=last_hour
            ).count()
            
            # Get top pages in last hour
            top_pages = PageView.objects.filter(
                site_id=site_id,
                timestamp__gte=last_hour
            ).values('page__title', 'page__slug').annotate(
                views=Count('id')
            ).order_by('-views')[:5]
            
            # Get traffic sources in last hour
            traffic_sources = PageView.objects.filter(
                site_id=site_id,
                timestamp__gte=last_hour
            ).exclude(referrer='').values('referrer').annotate(
                visits=Count('id')
            ).order_by('-visits')[:5]
            
            # Get device breakdown in last hour
            device_breakdown = PageView.objects.filter(
                site_id=site_id,
                timestamp__gte=last_hour
            ).values('device_type').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Get country breakdown in last hour
            country_breakdown = PageView.objects.filter(
                site_id=site_id,
                timestamp__gte=last_hour
            ).exclude(country='').values('country').annotate(
                visits=Count('id')
            ).order_by('-visits')[:10]
            
            # Get minute-by-minute data for last hour
            minute_data = PageView.objects.filter(
                site_id=site_id,
                timestamp__gte=last_hour
            ).extra(
                select={'minute': "DATE_TRUNC('minute', timestamp)"}
            ).values('minute').annotate(
                views=Count('id')
            ).order_by('minute')
            
            realtime_data = {
                'online_users': online_users,
                'hourly_views': hourly_views,
                'top_pages': list(top_pages),
                'traffic_sources': list(traffic_sources),
                'device_breakdown': list(device_breakdown),
                'country_breakdown': list(country_breakdown),
                'minute_data': list(minute_data),
                'last_updated': now.isoformat(),
                'site_id': site_id
            }
            
            # Cache the data
            cache.set(cache_key, realtime_data, self.cache_timeout)
            
            return realtime_data
            
        except Exception as e:
            logger.error(f"Failed to get real-time metrics: {e}")
            return {'error': str(e)}
    
    def get_live_visitors(self, site_id: int) -> List[Dict[str, Any]]:
        """
        Get list of current live visitors
        
        Args:
            site_id: ID of the site
            
        Returns:
            List of live visitor data
        """
        try:
            now = django_timezone.now()
            last_5_minutes = now - timedelta(minutes=5)
            
            # Get recent page views grouped by IP
            live_visitors = PageView.objects.filter(
                site_id=site_id,
                timestamp__gte=last_5_minutes
            ).values(
                'ip_address', 'country', 'city', 'device_type', 'browser', 'os'
            ).annotate(
                last_activity=Max('timestamp'),
                page_count=Count('id')
            ).order_by('-last_activity')
            
            visitors_data = []
            for visitor in live_visitors:
                # Get current page
                current_page = PageView.objects.filter(
                    site_id=site_id,
                    ip_address=visitor['ip_address'],
                    timestamp=visitor['last_activity']
                ).select_related('page').first()
                
                visitors_data.append({
                    'ip_address': visitor['ip_address'],
                    'country': visitor['country'],
                    'city': visitor['city'],
                    'device_type': visitor['device_type'],
                    'browser': visitor['browser'],
                    'os': visitor['os'],
                    'last_activity': visitor['last_activity'].isoformat(),
                    'page_count': visitor['page_count'],
                    'current_page': {
                        'title': current_page.page.title if current_page and current_page.page else 'Unknown',
                        'url': current_page.page.slug if current_page and current_page.page else 'unknown'
                    } if current_page else None
                })
            
            return visitors_data
            
        except Exception as e:
            logger.error(f"Failed to get live visitors: {e}")
            return []
    
    def get_realtime_alerts(self, site_id: int) -> List[Dict[str, Any]]:
        """
        Get real-time alerts and notifications
        
        Args:
            site_id: ID of the site
            
        Returns:
            List of alerts
        """
        try:
            alerts = []
            now = django_timezone.now()
            last_hour = now - timedelta(hours=1)
            last_24_hours = now - timedelta(hours=24)
            
            # Check for traffic spikes
            current_hour_views = PageView.objects.filter(
                site_id=site_id,
                timestamp__gte=last_hour
            ).count()
            
            # Get average hourly views for comparison
            avg_hourly_views = PageView.objects.filter(
                site_id=site_id,
                timestamp__gte=last_24_hours
            ).count() / 24
            
            if current_hour_views > avg_hourly_views * 2:
                alerts.append({
                    'type': 'traffic_spike',
                    'severity': 'high',
                    'message': f'Traffic spike detected: {current_hour_views} views in the last hour (avg: {avg_hourly_views:.1f})',
                    'timestamp': now.isoformat()
                })
            
            # Check for high bounce rate
            total_views = PageView.objects.filter(
                site_id=site_id,
                timestamp__gte=last_hour
            ).count()
            
            single_page_visits = PageView.objects.filter(
                site_id=site_id,
                timestamp__gte=last_hour
            ).values('ip_address').annotate(
                page_count=Count('id')
            ).filter(page_count=1).count()
            
            if total_views > 0:
                bounce_rate = (single_page_visits / total_views) * 100
                if bounce_rate > 70:
                    alerts.append({
                        'type': 'high_bounce_rate',
                        'severity': 'medium',
                        'message': f'High bounce rate detected: {bounce_rate:.1f}%',
                        'timestamp': now.isoformat()
                    })
            
            # Check for new traffic sources
            new_sources = PageView.objects.filter(
                site_id=site_id,
                timestamp__gte=last_hour
            ).exclude(referrer='').values('referrer').annotate(
                visits=Count('id')
            ).filter(visits__gte=5)
            
            # Check if these sources are new (not seen in last 7 days)
            week_ago = now - timedelta(days=7)
            for source in new_sources:
                existing_source = PageView.objects.filter(
                    site_id=site_id,
                    referrer=source['referrer'],
                    timestamp__gte=week_ago,
                    timestamp__lt=last_hour
                ).exists()
                
                if not existing_source:
                    alerts.append({
                        'type': 'new_traffic_source',
                        'severity': 'low',
                        'message': f'New traffic source detected: {source["referrer"]} ({source["visits"]} visits)',
                        'timestamp': now.isoformat()
                    })
            
            return alerts
            
        except Exception as e:
            logger.error(f"Failed to get real-time alerts: {e}")
            return []
    
    def subscribe_to_realtime_updates(self, site_id: int, user_id: int) -> str:
        """
        Subscribe a user to real-time analytics updates
        
        Args:
            site_id: ID of the site
            user_id: ID of the user
            
        Returns:
            WebSocket group name
        """
        group_name = f"{self.websocket_group_prefix}{site_id}_{user_id}"
        
        # Add to WebSocket group
        if CHANNELS_AVAILABLE and self.channel_layer:
            async_to_sync(self.channel_layer.group_add)(
                group_name,
                f"user_{user_id}"
            )
        
        return group_name
    
    def unsubscribe_from_realtime_updates(self, site_id: int, user_id: int) -> None:
        """
        Unsubscribe a user from real-time analytics updates
        
        Args:
            site_id: ID of the site
            user_id: ID of the user
        """
        group_name = f"{self.websocket_group_prefix}{site_id}_{user_id}"
        
        # Remove from WebSocket group
        if CHANNELS_AVAILABLE and self.channel_layer:
            async_to_sync(self.channel_layer.group_discard)(
                group_name,
                f"user_{user_id}"
            )
    
    def _update_realtime_metrics(self, site_id: int, page_id: int) -> None:
        """Update real-time metrics cache"""
        try:
            # Invalidate cache to force refresh
            cache_key = f"realtime_metrics_{site_id}"
            cache.delete(cache_key)
            
            # Update site analytics
            analytics, created = Analytics.objects.get_or_create(site_id=site_id)
            analytics.total_pageviews = F('total_pageviews') + 1
            analytics.save()
            
        except Exception as e:
            logger.error(f"Failed to update real-time metrics: {e}")
    
    def _broadcast_realtime_update(self, site_id: int, page_id: int, page_view: PageView) -> None:
        """Broadcast real-time update to WebSocket clients"""
        try:
            # Get updated metrics
            metrics = self.get_realtime_metrics(site_id)
            
            # Broadcast to all subscribers for this site
            group_name = f"{self.websocket_group_prefix}{site_id}_*"
            
            message = {
                'type': 'realtime_update',
                'data': {
                    'site_id': site_id,
                    'page_id': page_id,
                    'page_view_id': page_view.id,
                    'metrics': metrics,
                    'timestamp': page_view.timestamp.isoformat()
                }
            }
            
            if CHANNELS_AVAILABLE and self.channel_layer:
                async_to_sync(self.channel_layer.group_send)(
                    group_name,
                    message
                )
            
        except Exception as e:
            logger.error(f"Failed to broadcast real-time update: {e}")
    
    def _update_realtime_cache(self, site_id: int) -> None:
        """Update real-time cache with fresh data"""
        try:
            # Get fresh metrics
            metrics = self.get_realtime_metrics(site_id)
            
            # Cache for next request
            cache_key = f"realtime_metrics_{site_id}"
            cache.set(cache_key, metrics, self.cache_timeout)
            
        except Exception as e:
            logger.error(f"Failed to update real-time cache: {e}")
    
    def get_analytics_websocket_url(self, site_id: int) -> str:
        """Get WebSocket URL for real-time analytics"""
        return f"/ws/analytics/{site_id}/"


# Singleton instance
realtime_analytics_service = RealtimeAnalyticsService()
