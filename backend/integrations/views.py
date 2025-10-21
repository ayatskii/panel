from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ApiToken, CloudflareToken
from .serializers import ApiTokenSerializer, CloudflareTokenSerializer
from users.permissions import IsAdminUser


class ApiTokenViewSet(viewsets.ModelViewSet):
    """CRUD for external API tokens (admin only)"""
    queryset = ApiToken.objects.all()
    serializer_class = ApiTokenSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['service', 'is_active']
    search_fields = ['name', 'service']
    ordering = ['-created_at']
    
    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """Validate this API token by making a test call."""
        api_token = self.get_object()
        # Placeholder: actual integration logic per service
        # Demo for Cloudflare tokens:
        if api_token.service == 'cloudflare':
            from .services.cloudflare_service import CloudflareService
            try:
                cf_service = CloudflareService(api_token)
                valid = cf_service.test_credentials()
                return Response({'valid': valid})
            except Exception as e:
                return Response({'error': str(e)}, status=400)
        return Response({'valid': False, 'info': 'Not implemented for this service'})


class CloudflareTokenViewSet(viewsets.ModelViewSet):
    """CRUD for specific Cloudflare token configurations"""
    queryset = CloudflareToken.objects.select_related('api_token').all()
    serializer_class = CloudflareTokenSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['api_token']
    search_fields = ['name']
    ordering = ['-created_at']
    
    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        """Test connection to Cloudflare using this token config."""
        token = self.get_object()
        from .services.cloudflare_service import CloudflareService
        try:
            cf_service = CloudflareService(token.api_token)
            valid = cf_service.test_credentials()
            return Response({'valid': valid})
        except Exception as e:
            return Response({'error': str(e)}, status=400)
