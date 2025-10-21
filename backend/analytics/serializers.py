from rest_framework import serializers
from .models import Analytics

class AnalyticsSerializer(serializers.ModelSerializer):
    """Analytics data serializer"""
    site_domain = serializers.CharField(source='site.domain', read_only=True)
    site_brand = serializers.CharField(source='site.brand_name', read_only=True)
    conversion_rate = serializers.FloatField(read_only=True)
    
    class Meta:
        model = Analytics
        fields = [
            'id', 'site', 'site_domain', 'site_brand',
            'date', 'visitors', 'pageviews', 'bounce_rate',
            'avg_session_duration', 'traffic_source',
            'conversions', 'conversion_rate', 'revenue',
            'created_at'
        ]
        read_only_fields = ['created_at']


class AnalyticsSummarySerializer(serializers.Serializer):
    """Serializer for analytics summary"""
    total_visitors = serializers.IntegerField()
    total_pageviews = serializers.IntegerField()
    avg_bounce_rate = serializers.FloatField()
    total_conversions = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    date_range = serializers.DictField()
