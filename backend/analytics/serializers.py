from rest_framework import serializers
from .models import PageView, Analytics


class PageViewSerializer(serializers.ModelSerializer):
    """
    Serializer for PageView model
    """
    page_title = serializers.CharField(source='page.title', read_only=True)
    page_slug = serializers.CharField(source='page.slug', read_only=True)
    site_domain = serializers.CharField(source='site.domain', read_only=True)
    
    class Meta:
        model = PageView
        fields = [
            'id', 'site', 'page', 'ip_address', 'user_agent', 'referrer',
            'timestamp', 'load_time', 'page_title', 'page_slug', 'site_domain'
        ]
        read_only_fields = ['id', 'timestamp']


class SiteAnalyticsSerializer(serializers.ModelSerializer):
    """
    Serializer for Analytics model
    """
    site_domain = serializers.CharField(source='site.domain', read_only=True)
    
    class Meta:
        model = Analytics
        fields = [
            'id', 'site', 'date', 'visitors', 'pageviews',
            'bounce_rate', 'avg_session_duration', 'traffic_source',
            'conversions', 'revenue', 'site_domain'
        ]
        read_only_fields = ['id']


class AnalyticsOverviewSerializer(serializers.Serializer):
    """
    Serializer for analytics overview data
    """
    site_id = serializers.IntegerField()
    site_domain = serializers.CharField()
    period_days = serializers.IntegerField()
    date_range = serializers.DictField()
    basic_metrics = serializers.DictField()
    traffic_analytics = serializers.DictField()
    content_analytics = serializers.DictField()
    user_analytics = serializers.DictField()
    performance_metrics = serializers.DictField()
    seo_metrics = serializers.DictField()
    generated_at = serializers.DateTimeField()


class RealTimeAnalyticsSerializer(serializers.Serializer):
    """
    Serializer for real-time analytics data
    """
    site_id = serializers.IntegerField()
    active_users = serializers.IntegerField()
    hourly_views = serializers.IntegerField()
    top_pages_hourly = serializers.ListField()
    recent_visitors = serializers.ListField()
    generated_at = serializers.DateTimeField()


class TrafficSummarySerializer(serializers.Serializer):
    """
    Serializer for traffic summary data
    """
    site_id = serializers.IntegerField()
    period_days = serializers.IntegerField()
    current_period = serializers.DictField()
    previous_period = serializers.DictField()
    growth = serializers.DictField()


class TopPagesSerializer(serializers.Serializer):
    """
    Serializer for top pages data
    """
    site_id = serializers.IntegerField()
    period_days = serializers.IntegerField()
    top_pages = serializers.ListField()


class PerformanceMetricsSerializer(serializers.Serializer):
    """
    Serializer for performance metrics data
    """
    site_id = serializers.IntegerField()
    period_days = serializers.IntegerField()
    performance_metrics = serializers.DictField()


class ExportAnalyticsSerializer(serializers.Serializer):
    """
    Serializer for analytics export data
    """
    site_id = serializers.IntegerField()
    format = serializers.CharField()
    data = serializers.CharField()
    exported_at = serializers.DateTimeField()
    date_range = serializers.DictField()