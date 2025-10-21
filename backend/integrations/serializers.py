from rest_framework import serializers
from .models import ApiToken, CloudflareToken

class ApiTokenSerializer(serializers.ModelSerializer):
    """API token serializer - masks token value"""
    service_display = serializers.CharField(source='get_service_display', read_only=True)
    token_masked = serializers.SerializerMethodField()
    
    class Meta:
        model = ApiToken
        fields = [
            'id', 'name', 'service', 'service_display',
            'token_value', 'token_masked', 'is_active',
            'last_used', 'usage_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['last_used', 'usage_count', 'created_at', 'updated_at']
        extra_kwargs = {
            'token_value': {'write_only': True}
        }
    
    def get_token_masked(self, obj):
        """Return masked token for security"""
        if obj.token_value:
            token = obj.token_value
            if len(token) > 10:
                return f"{token[:4]}...{token[-4:]}"
            return "***"
        return None
    
    def to_representation(self, instance):
        """Never expose full token in responses"""
        rep = super().to_representation(instance)
        rep.pop('token_value', None)
        return rep


class CloudflareTokenSerializer(serializers.ModelSerializer):
    """Cloudflare token serializer"""
    api_token_name = serializers.CharField(source='api_token.name', read_only=True)
    api_token_service = serializers.CharField(source='api_token.service', read_only=True)
    
    class Meta:
        model = CloudflareToken
        fields = [
            'id', 'api_token', 'api_token_name', 'api_token_service',
            'name', 'account_id', 'zone_id', 'pages_project_name',
            'created_at'
        ]
        read_only_fields = ['created_at']
    
    def validate_api_token(self, value):
        """Ensure API token is for Cloudflare service"""
        if value.service != 'cloudflare':
            raise serializers.ValidationError(
                "API token must be for Cloudflare service"
            )
        if not value.is_active:
            raise serializers.ValidationError(
                "API token is not active"
            )
        return value


class ApiTokenListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    service_display = serializers.CharField(source='get_service_display', read_only=True)
    
    class Meta:
        model = ApiToken
        fields = [
            'id', 'name', 'service', 'service_display',
            'is_active', 'usage_count', 'last_used'
        ]
