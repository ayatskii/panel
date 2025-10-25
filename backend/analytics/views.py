from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone as django_timezone
from datetime import datetime, timedelta
from .models import PageView, Analytics
from .serializers import PageViewSerializer, SiteAnalyticsSerializer
from .services.advanced_analytics_service import AdvancedAnalyticsService


class PageViewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing page views
    """
    queryset = PageView.objects.all()
    serializer_class = PageViewSerializer
    
    def get_queryset(self):
        queryset = PageView.objects.all()
        site_id = self.request.query_params.get('site_id')
        if site_id:
            queryset = queryset.filter(site_id=site_id)
        return queryset.order_by('-timestamp')
    
    @action(detail=False, methods=['get'])
    def analytics_overview(self, request):
        """Get comprehensive analytics overview"""
        site_id = request.query_params.get('site_id')
        period_days = int(request.query_params.get('period_days', 30))
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            analytics_service = AdvancedAnalyticsService()
            
            result = analytics_service.get_dashboard_overview(
                site_id=int(site_id),
                period_days=period_days
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get analytics overview: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def real_time_analytics(self, request):
        """Get real-time analytics data"""
        site_id = request.query_params.get('site_id')
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            analytics_service = AdvancedAnalyticsService()
            
            result = analytics_service.get_real_time_analytics(int(site_id))
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get real-time analytics: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def export_analytics(self, request):
        """Export analytics data"""
        site_id = request.data.get('site_id')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        format = request.data.get('format', 'json')
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Parse dates
            if start_date:
                start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            else:
                start_date = django_timezone.now() - timedelta(days=30)
            
            if end_date:
                end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            else:
                end_date = django_timezone.now()
            
            analytics_service = AdvancedAnalyticsService()
            
            result = analytics_service.export_analytics_data(
                site_id=int(site_id),
                start_date=start_date,
                end_date=end_date,
                format=format
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to export analytics: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def traffic_summary(self, request):
        """Get traffic summary"""
        site_id = request.query_params.get('site_id')
        period_days = int(request.query_params.get('period_days', 7))
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            end_date = django_timezone.now()
            start_date = end_date - timedelta(days=period_days)
            
            # Get traffic data
            total_views = PageView.objects.filter(
                site_id=site_id,
                timestamp__range=[start_date, end_date]
            ).count()
            
            unique_visitors = PageView.objects.filter(
                site_id=site_id,
                timestamp__range=[start_date, end_date]
            ).values('ip_address').distinct().count()
            
            # Get previous period for comparison
            prev_start_date = start_date - timedelta(days=period_days)
            prev_total_views = PageView.objects.filter(
                site_id=site_id,
                timestamp__range=[prev_start_date, start_date]
            ).count()
            
            prev_unique_visitors = PageView.objects.filter(
                site_id=site_id,
                timestamp__range=[prev_start_date, start_date]
            ).values('ip_address').distinct().count()
            
            # Calculate growth
            views_growth = ((total_views - prev_total_views) / prev_total_views * 100) if prev_total_views > 0 else 0
            visitors_growth = ((unique_visitors - prev_unique_visitors) / prev_unique_visitors * 100) if prev_unique_visitors > 0 else 0
            
            return Response({
                'success': True,
                'site_id': site_id,
                'period_days': period_days,
                'current_period': {
                    'total_views': total_views,
                    'unique_visitors': unique_visitors
                },
                'previous_period': {
                    'total_views': prev_total_views,
                    'unique_visitors': prev_unique_visitors
                },
                'growth': {
                    'views_growth': round(views_growth, 2),
                    'visitors_growth': round(visitors_growth, 2)
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get traffic summary: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def top_pages(self, request):
        """Get top performing pages"""
        site_id = request.query_params.get('site_id')
        period_days = int(request.query_params.get('period_days', 30))
        limit = int(request.query_params.get('limit', 10))
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            end_date = django_timezone.now()
            start_date = end_date - timedelta(days=period_days)
            
            top_pages = PageView.objects.filter(
                site_id=site_id,
                timestamp__range=[start_date, end_date]
            ).values(
                'page__id', 'page__title', 'page__slug', 'page__created_at'
            ).annotate(
                views=Count('id'),
                unique_visitors=Count('ip_address', distinct=True)
            ).order_by('-views')[:limit]
            
            return Response({
                'success': True,
                'site_id': site_id,
                'period_days': period_days,
                'top_pages': list(top_pages)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get top pages: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SiteAnalyticsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing site analytics
    """
    queryset = Analytics.objects.all()
    serializer_class = SiteAnalyticsSerializer
    
    def get_queryset(self):
        queryset = Analytics.objects.all()
        site_id = self.request.query_params.get('site_id')
        if site_id:
            queryset = queryset.filter(site_id=site_id)
        return queryset.order_by('-date')
    
    @action(detail=False, methods=['get'])
    def performance_metrics(self, request):
        """Get performance metrics"""
        site_id = request.query_params.get('site_id')
        period_days = int(request.query_params.get('period_days', 30))
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            end_date = django_timezone.now()
            start_date = end_date - timedelta(days=period_days)
            
            # Get performance data
            performance_data = PageView.objects.filter(
                site_id=site_id,
                timestamp__range=[start_date, end_date]
            ).aggregate(
                avg_load_time=Avg('load_time'),
                max_load_time=Max('load_time'),
                min_load_time=Min('load_time')
            )
            
            # Get bounce rate
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
            
            bounce_rate = (single_page_sessions / total_sessions * 100) if total_sessions > 0 else 0
            
            return Response({
                'success': True,
                'site_id': site_id,
                'period_days': period_days,
                'performance_metrics': {
                    'load_times': performance_data,
                    'bounce_rate': round(bounce_rate, 2),
                    'total_sessions': total_sessions,
                    'single_page_sessions': single_page_sessions
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get performance metrics: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )