import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from django.db.models import Count, Sum, Avg, Max, Min, Q, F
from django.db.models.functions import TruncDate, TruncHour, TruncDay
from django.utils import timezone as django_timezone
from django.conf import settings
from analytics.models import PageView, Analytics
from pages.models import Page
from sites.models import Site
from media.models import Media
from users.models import User


class AdvancedAnalyticsService:
    """
    Service for advanced analytics and reporting
    """
    
    def __init__(self):
        self.default_period_days = 30
        self.timezone = django_timezone.get_current_timezone()
    
    def get_dashboard_overview(
        self,
        site_id: int,
        period_days: int = None
    ) -> Dict[str, Any]:
        """
        Get comprehensive dashboard overview
        
        Args:
            site_id: ID of the site
            period_days: Number of days to analyze (default: 30)
            
        Returns:
            Dict with dashboard overview data
        """
        
        try:
            if period_days is None:
                period_days = self.default_period_days
            
            site = Site.objects.get(id=site_id)
            end_date = django_timezone.now()
            start_date = end_date - timedelta(days=period_days)
            
            # Get basic metrics
            basic_metrics = self._get_basic_metrics(site_id, start_date, end_date)
            
            # Get traffic analytics
            traffic_analytics = self._get_traffic_analytics(site_id, start_date, end_date)
            
            # Get content analytics
            content_analytics = self._get_content_analytics(site_id, start_date, end_date)
            
            # Get user analytics
            user_analytics = self._get_user_analytics(site_id, start_date, end_date)
            
            # Get performance metrics
            performance_metrics = self._get_performance_metrics(site_id, start_date, end_date)
            
            # Get SEO metrics
            seo_metrics = self._get_seo_metrics(site_id)
            
            return {
                'success': True,
                'site_id': site_id,
                'site_domain': site.domain,
                'period_days': period_days,
                'date_range': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat()
                },
                'basic_metrics': basic_metrics,
                'traffic_analytics': traffic_analytics,
                'content_analytics': content_analytics,
                'user_analytics': user_analytics,
                'performance_metrics': performance_metrics,
                'seo_metrics': seo_metrics,
                'generated_at': django_timezone.now().isoformat()
            }
            
        except Site.DoesNotExist:
            return {
                'success': False,
                'error': f'Site with ID {site_id} not found'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to get dashboard overview: {str(e)}'
            }
    
    def _get_basic_metrics(self, site_id: int, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get basic site metrics"""
        try:
            # Page views
            total_views = PageView.objects.filter(
                site_id=site_id,
                timestamp__range=[start_date, end_date]
            ).count()
            
            # Unique visitors (approximate)
            unique_visitors = PageView.objects.filter(
                site_id=site_id,
                timestamp__range=[start_date, end_date]
            ).values('ip_address').distinct().count()
            
            # Pages
            total_pages = Page.objects.filter(site_id=site_id).count()
            published_pages = Page.objects.filter(site_id=site_id, is_published=True).count()
            
            # Media files
            total_media = Media.objects.filter(folder__site_id=site_id).count()
            
            # Average session duration (approximate)
            avg_session_duration = self._calculate_avg_session_duration(site_id, start_date, end_date)
            
            return {
                'total_views': total_views,
                'unique_visitors': unique_visitors,
                'total_pages': total_pages,
                'published_pages': published_pages,
                'total_media': total_media,
                'avg_session_duration': avg_session_duration,
                'publish_percentage': (published_pages / total_pages * 100) if total_pages > 0 else 0
            }
            
        except Exception as e:
            print(f"Error getting basic metrics: {e}")
            return {}
    
    def _get_traffic_analytics(self, site_id: int, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get traffic analytics"""
        try:
            # Daily traffic
            daily_traffic = PageView.objects.filter(
                site_id=site_id,
                timestamp__range=[start_date, end_date]
            ).annotate(
                date=TruncDate('timestamp')
            ).values('date').annotate(
                views=Count('id'),
                unique_visitors=Count('ip_address', distinct=True)
            ).order_by('date')
            
            # Hourly traffic (last 24 hours)
            last_24h = django_timezone.now() - timedelta(hours=24)
            hourly_traffic = PageView.objects.filter(
                site_id=site_id,
                timestamp__gte=last_24h
            ).annotate(
                hour=TruncHour('timestamp')
            ).values('hour').annotate(
                views=Count('id')
            ).order_by('hour')
            
            # Top pages
            top_pages = PageView.objects.filter(
                site_id=site_id,
                timestamp__range=[start_date, end_date]
            ).values('page__title', 'page__slug').annotate(
                views=Count('id')
            ).order_by('-views')[:10]
            
            # Traffic sources (referrers)
            traffic_sources = PageView.objects.filter(
                site_id=site_id,
                timestamp__range=[start_date, end_date],
                referrer__isnull=False
            ).exclude(referrer='').values('referrer').annotate(
                visits=Count('id')
            ).order_by('-visits')[:10]
            
            # User agents (browsers)
            browsers = PageView.objects.filter(
                site_id=site_id,
                timestamp__range=[start_date, end_date],
                user_agent__isnull=False
            ).values('user_agent').annotate(
                visits=Count('id')
            ).order_by('-visits')[:10]
            
            return {
                'daily_traffic': list(daily_traffic),
                'hourly_traffic': list(hourly_traffic),
                'top_pages': list(top_pages),
                'traffic_sources': list(traffic_sources),
                'browsers': list(browsers)
            }
            
        except Exception as e:
            print(f"Error getting traffic analytics: {e}")
            return {}
    
    def _get_content_analytics(self, site_id: int, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get content analytics"""
        try:
            # Most viewed pages
            most_viewed = PageView.objects.filter(
                site_id=site_id,
                timestamp__range=[start_date, end_date]
            ).values(
                'page__id', 'page__title', 'page__slug', 'page__created_at'
            ).annotate(
                views=Count('id')
            ).order_by('-views')[:10]
            
            # Content performance by type
            content_performance = PageView.objects.filter(
                site_id=site_id,
                timestamp__range=[start_date, end_date]
            ).values('page__title').annotate(
                views=Count('id')
            ).order_by('-views')
            
            # Recent content performance
            recent_content = Page.objects.filter(
                site_id=site_id,
                created_at__range=[start_date, end_date]
            ).annotate(
                views=Count('pageview', filter=Q(pageview__timestamp__range=[start_date, end_date]))
            ).order_by('-created_at')[:10]
            
            # Content engagement (time on page approximation)
            engagement_metrics = self._calculate_content_engagement(site_id, start_date, end_date)
            
            return {
                'most_viewed': list(most_viewed),
                'content_performance': list(content_performance),
                'recent_content': [
                    {
                        'id': page.id,
                        'title': page.title,
                        'slug': page.slug,
                        'created_at': page.created_at.isoformat(),
                        'views': page.views
                    } for page in recent_content
                ],
                'engagement_metrics': engagement_metrics
            }
            
        except Exception as e:
            print(f"Error getting content analytics: {e}")
            return {}
    
    def _get_user_analytics(self, site_id: int, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get user analytics"""
        try:
            # User activity
            user_activity = PageView.objects.filter(
                site_id=site_id,
                timestamp__range=[start_date, end_date]
            ).values('ip_address').annotate(
                page_views=Count('id'),
                unique_pages=Count('page', distinct=True),
                first_visit=Min('timestamp'),
                last_visit=Max('timestamp')
            ).order_by('-page_views')[:20]
            
            # Geographic distribution (based on IP)
            geographic_data = self._get_geographic_distribution(site_id, start_date, end_date)
            
            # Device types
            device_types = PageView.objects.filter(
                site_id=site_id,
                timestamp__range=[start_date, end_date],
                user_agent__isnull=False
            ).values('user_agent').annotate(
                visits=Count('id')
            ).order_by('-visits')
            
            # Parse device types
            mobile_visits = 0
            desktop_visits = 0
            tablet_visits = 0
            
            for device in device_types:
                user_agent = device['user_agent'].lower()
                visits = device['visits']
                
                if any(mobile in user_agent for mobile in ['mobile', 'android', 'iphone']):
                    mobile_visits += visits
                elif any(tablet in user_agent for tablet in ['tablet', 'ipad']):
                    tablet_visits += visits
                else:
                    desktop_visits += visits
            
            return {
                'user_activity': list(user_activity),
                'geographic_distribution': geographic_data,
                'device_types': {
                    'mobile': mobile_visits,
                    'desktop': desktop_visits,
                    'tablet': tablet_visits
                }
            }
            
        except Exception as e:
            print(f"Error getting user analytics: {e}")
            return {}
    
    def _get_performance_metrics(self, site_id: int, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get performance metrics"""
        try:
            # Page load times (if available)
            performance_data = PageView.objects.filter(
                site_id=site_id,
                timestamp__range=[start_date, end_date]
            ).aggregate(
                avg_load_time=Avg('load_time'),
                max_load_time=Max('load_time'),
                min_load_time=Min('load_time')
            )
            
            # Bounce rate (approximate)
            bounce_rate = self._calculate_bounce_rate(site_id, start_date, end_date)
            
            # Conversion metrics (if applicable)
            conversion_metrics = self._get_conversion_metrics(site_id, start_date, end_date)
            
            return {
                'load_times': performance_data,
                'bounce_rate': bounce_rate,
                'conversion_metrics': conversion_metrics
            }
            
        except Exception as e:
            print(f"Error getting performance metrics: {e}")
            return {}
    
    def _get_seo_metrics(self, site_id: int) -> Dict[str, Any]:
        """Get SEO metrics"""
        try:
            site = Site.objects.get(id=site_id)
            pages = Page.objects.filter(site=site)
            
            # SEO completeness
            seo_completeness = {
                'total_pages': pages.count(),
                'pages_with_title': pages.exclude(title='').count(),
                'pages_with_meta_description': pages.exclude(meta_description='').count(),
                'pages_with_h1': pages.exclude(h1_tag='').count(),
                'pages_with_keywords': pages.exclude(keywords='').count(),
                'published_pages': pages.filter(is_published=True).count()
            }
            
            # Calculate percentages
            total = seo_completeness['total_pages']
            if total > 0:
                seo_completeness['title_percentage'] = (seo_completeness['pages_with_title'] / total) * 100
                seo_completeness['meta_percentage'] = (seo_completeness['pages_with_meta_description'] / total) * 100
                seo_completeness['h1_percentage'] = (seo_completeness['pages_with_h1'] / total) * 100
                seo_completeness['keywords_percentage'] = (seo_completeness['pages_with_keywords'] / total) * 100
                seo_completeness['publish_percentage'] = (seo_completeness['published_pages'] / total) * 100
            else:
                seo_completeness.update({
                    'title_percentage': 0,
                    'meta_percentage': 0,
                    'h1_percentage': 0,
                    'keywords_percentage': 0,
                    'publish_percentage': 0
                })
            
            # Content analysis
            content_analysis = {
                'avg_word_count': pages.aggregate(avg_words=Avg('word_count'))['avg_words'] or 0,
                'pages_with_images': pages.filter(blocks__block_type__in=['image', 'text_image', 'gallery']).distinct().count(),
                'pages_with_faq': pages.filter(blocks__block_type='faq').distinct().count()
            }
            
            return {
                'seo_completeness': seo_completeness,
                'content_analysis': content_analysis
            }
            
        except Exception as e:
            print(f"Error getting SEO metrics: {e}")
            return {}
    
    def _calculate_avg_session_duration(self, site_id: int, start_date: datetime, end_date: datetime) -> float:
        """Calculate average session duration"""
        try:
            # This is a simplified calculation
            # In a real implementation, you'd track actual session data
            sessions = PageView.objects.filter(
                site_id=site_id,
                timestamp__range=[start_date, end_date]
            ).values('ip_address', 'timestamp').order_by('ip_address', 'timestamp')
            
            session_durations = []
            current_session = None
            
            for view in sessions:
                if current_session is None or view['ip_address'] != current_session['ip_address']:
                    if current_session:
                        duration = (current_session['last_view'] - current_session['first_view']).total_seconds()
                        session_durations.append(duration)
                    current_session = {
                        'ip_address': view['ip_address'],
                        'first_view': view['timestamp'],
                        'last_view': view['timestamp']
                    }
                else:
                    current_session['last_view'] = view['timestamp']
            
            if current_session:
                duration = (current_session['last_view'] - current_session['first_view']).total_seconds()
                session_durations.append(duration)
            
            return sum(session_durations) / len(session_durations) if session_durations else 0
            
        except Exception as e:
            print(f"Error calculating session duration: {e}")
            return 0
    
    def _calculate_content_engagement(self, site_id: int, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Calculate content engagement metrics"""
        try:
            # This is a simplified engagement calculation
            # In a real implementation, you'd track actual engagement data
            
            total_views = PageView.objects.filter(
                site_id=site_id,
                timestamp__range=[start_date, end_date]
            ).count()
            
            # Estimate engagement based on page views and time spent
            engagement_score = min(100, (total_views / 100) * 10)  # Simplified calculation
            
            return {
                'engagement_score': engagement_score,
                'total_interactions': total_views,
                'avg_time_on_site': self._calculate_avg_session_duration(site_id, start_date, end_date)
            }
            
        except Exception as e:
            print(f"Error calculating content engagement: {e}")
            return {}
    
    def _get_geographic_distribution(self, site_id: int, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get geographic distribution of visitors"""
        try:
            # This is a simplified geographic analysis
            # In a real implementation, you'd use IP geolocation services
            
            ip_addresses = PageView.objects.filter(
                site_id=site_id,
                timestamp__range=[start_date, end_date]
            ).values('ip_address').annotate(
                visits=Count('id')
            ).order_by('-visits')[:20]
            
            # Mock geographic data (in real implementation, use IP geolocation)
            geographic_data = []
            countries = ['United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Australia', 'Japan', 'Brazil']
            
            for i, ip_data in enumerate(ip_addresses):
                country = countries[i % len(countries)]
                geographic_data.append({
                    'country': country,
                    'visits': ip_data['visits'],
                    'percentage': (ip_data['visits'] / sum(item['visits'] for item in ip_addresses)) * 100
                })
            
            return geographic_data
            
        except Exception as e:
            print(f"Error getting geographic distribution: {e}")
            return []
    
    def _calculate_bounce_rate(self, site_id: int, start_date: datetime, end_date: datetime) -> float:
        """Calculate bounce rate"""
        try:
            # Simplified bounce rate calculation
            # In a real implementation, you'd track actual bounce events
            
            total_sessions = PageView.objects.filter(
                site_id=site_id,
                timestamp__range=[start_date, end_date]
            ).values('ip_address').distinct().count()
            
            single_page_sessions = PageView.objects.filter(
                site_id=site_id,
                timestamp__range=[start_date, end_date]
            ).values('ip_address').annotate(
                page_count=Count('page', distinct=True)
            ).filter(page_count=1).count()
            
            return (single_page_sessions / total_sessions * 100) if total_sessions > 0 else 0
            
        except Exception as e:
            print(f"Error calculating bounce rate: {e}")
            return 0
    
    def _get_conversion_metrics(self, site_id: int, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get conversion metrics"""
        try:
            # This is a placeholder for conversion tracking
            # In a real implementation, you'd track actual conversion events
            
            return {
                'conversion_rate': 0.0,
                'total_conversions': 0,
                'conversion_goals': []
            }
            
        except Exception as e:
            print(f"Error getting conversion metrics: {e}")
            return {}
    
    def get_real_time_analytics(self, site_id: int) -> Dict[str, Any]:
        """Get real-time analytics data"""
        try:
            now = django_timezone.now()
            last_hour = now - timedelta(hours=1)
            last_24h = now - timedelta(hours=24)
            
            # Current active users (last hour)
            active_users = PageView.objects.filter(
                site_id=site_id,
                timestamp__gte=last_hour
            ).values('ip_address').distinct().count()
            
            # Page views in last hour
            hourly_views = PageView.objects.filter(
                site_id=site_id,
                timestamp__gte=last_hour
            ).count()
            
            # Top pages in last hour
            top_pages_hourly = PageView.objects.filter(
                site_id=site_id,
                timestamp__gte=last_hour
            ).values('page__title', 'page__slug').annotate(
                views=Count('id')
            ).order_by('-views')[:5]
            
            # Recent visitors
            recent_visitors = PageView.objects.filter(
                site_id=site_id,
                timestamp__gte=last_24h
            ).order_by('-timestamp')[:10]
            
            return {
                'success': True,
                'site_id': site_id,
                'active_users': active_users,
                'hourly_views': hourly_views,
                'top_pages_hourly': list(top_pages_hourly),
                'recent_visitors': [
                    {
                        'ip_address': visitor.ip_address,
                        'page_title': visitor.page.title if visitor.page else 'Unknown',
                        'timestamp': visitor.timestamp.isoformat(),
                        'user_agent': visitor.user_agent
                    } for visitor in recent_visitors
                ],
                'generated_at': now.isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to get real-time analytics: {str(e)}'
            }
    
    def export_analytics_data(
        self,
        site_id: int,
        start_date: datetime,
        end_date: datetime,
        format: str = 'json'
    ) -> Dict[str, Any]:
        """Export analytics data in various formats"""
        try:
            # Get comprehensive analytics data
            analytics_data = self.get_dashboard_overview(
                site_id=site_id,
                period_days=(end_date - start_date).days
            )
            
            if format == 'json':
                export_data = json.dumps(analytics_data, indent=2, default=str)
            elif format == 'csv':
                # Convert to CSV format (simplified)
                export_data = self._convert_to_csv(analytics_data)
            else:
                export_data = str(analytics_data)
            
            return {
                'success': True,
                'site_id': site_id,
                'format': format,
                'data': export_data,
                'exported_at': django_timezone.now().isoformat(),
                'date_range': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat()
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to export analytics data: {str(e)}'
            }
    
    def _convert_to_csv(self, data: Dict[str, Any]) -> str:
        """Convert analytics data to CSV format"""
        try:
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write basic metrics
            writer.writerow(['Metric', 'Value'])
            basic_metrics = data.get('basic_metrics', {})
            for key, value in basic_metrics.items():
                writer.writerow([key.replace('_', ' ').title(), value])
            
            # Write traffic data
            writer.writerow([])
            writer.writerow(['Daily Traffic'])
            writer.writerow(['Date', 'Views', 'Unique Visitors'])
            daily_traffic = data.get('traffic_analytics', {}).get('daily_traffic', [])
            for day in daily_traffic:
                writer.writerow([day['date'], day['views'], day['unique_visitors']])
            
            return output.getvalue()
            
        except Exception as e:
            print(f"Error converting to CSV: {e}")
            return str(data)
