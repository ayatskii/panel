from rest_framework import serializers
from .models import Deployment

class DeploymentSerializer(serializers.ModelSerializer):
    """Full deployment serializer"""
    site_domain = serializers.CharField(source='site.domain', read_only=True)
    site_brand = serializers.CharField(source='site.brand_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_complete = serializers.BooleanField(read_only=True)
    duration = serializers.FloatField(read_only=True)

    template_name = serializers.SerializerMethodField()
    template_type = serializers.SerializerMethodField()
    footprint_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Deployment
        fields = [
            'id', 'site', 'site_domain', 'site_brand',
            'cloudflare_token', 'status', 'status_display',
            'git_commit_hash', 'build_log', 'deployed_url',
            'build_time_seconds', 'file_count', 'total_size_bytes',
            'template_snapshot', 'generated_files', 'unique_identifiers',
            'template_name', 'template_type', 'footprint_name',
            'created_at', 'completed_at', 'is_complete', 'duration'
        ]
        read_only_fields = [
            'status', 'build_log', 'deployed_url',
            'build_time_seconds', 'file_count', 'total_size_bytes',
            'template_snapshot', 'generated_files', 'unique_identifiers',
            'created_at', 'completed_at'
        ]
    
    def get_template_name(self, obj):
        return obj.template_snapshot.get('template', {}).get('name', 'Unknown')
    
    def get_template_type(self, obj):
        return obj.template_snapshot.get('template', {}).get('type', 'Unknown')
    
    def get_footprint_name(self, obj):
        footprint = obj.template_snapshot.get('footprint')
        return footprint.get('name') if footprint else 'None'


class DeploymentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    site_domain = serializers.CharField(source='site.domain', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    duration = serializers.FloatField(read_only=True)
    
    class Meta:
        model = Deployment
        fields = [
            'id', 'site', 'site_domain', 'status', 'status_display',
            'deployed_url', 'created_at', 'completed_at', 'duration'
        ]
