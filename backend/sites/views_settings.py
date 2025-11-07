from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from django.utils import timezone
from .models import Language, AffiliateLink
from .serializers import LanguageSerializer, AffiliateLinkSerializer
from .services.settings_service import settings_service
from users.permissions import IsAdminUser


class LanguageViewSet(viewsets.ModelViewSet):
    """Language management (admin only)"""
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['is_active']
    search_fields = ['name', 'code']
    ordering = ['name']
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Bulk create languages from text input"""
        text_input = request.data.get('text', '')
        
        if not text_input:
            return Response(
                {'error': 'text field is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Parse languages from text
            languages_data = settings_service.parse_languages_from_text(text_input)
            
            if not languages_data:
                return Response(
                    {'error': 'No valid languages found in text input'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Bulk create languages
            result = settings_service.bulk_update_languages(languages_data)
            
            if result.get('success'):
                return Response(result, status=status.HTTP_201_CREATED)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to bulk create languages: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get only active languages"""
        try:
            languages = settings_service.get_languages()
            return Response({'languages': languages})
        except Exception as e:
            return Response(
                {'error': f'Failed to get active languages: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AffiliateLinkViewSet(viewsets.ModelViewSet):
    """Affiliate link management (admin only)"""
    queryset = AffiliateLink.objects.all()
    serializer_class = AffiliateLinkSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['click_tracking']
    search_fields = ['name', 'description']
    ordering = ['-created_at']
    
    @action(detail=True, methods=['post'])
    def test_link(self, request, pk=None):
        """Test an affiliate link (placeholder for future implementation)"""
        link = self.get_object()
        
        # In a real implementation, this would test the link
        return Response({
            'message': 'Link test not implemented yet',
            'link_id': link.id,
            'link_name': link.name
        })


class SettingsViewSet(viewsets.ViewSet):
    """Comprehensive settings management"""
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Admin-only for most settings operations"""
        if self.action in ['update_ai_settings', 'update_cloudflare_settings', 'update_git_settings']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['get'])
    def all(self, request):
        """Get all settings"""
        try:
            settings_data = settings_service.get_all_settings()
            return Response(settings_data)
        except Exception as e:
            return Response(
                {'error': f'Failed to get settings: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def languages(self, request):
        """Get all languages"""
        try:
            languages = settings_service.get_languages()
            return Response({'languages': languages})
        except Exception as e:
            return Response(
                {'error': f'Failed to get languages: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def add_language(self, request):
        """Add a new language"""
        code = request.data.get('code')
        name = request.data.get('name')
        
        if not code or not name:
            return Response(
                {'error': 'code and name are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = settings_service.add_language(code, name)
            
            if result['success']:
                return Response(result, status=status.HTTP_201_CREATED)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response(
                {'error': f'Failed to add language: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def affiliate_links(self, request):
        """Get all affiliate links"""
        try:
            links = settings_service.get_affiliate_links()
            return Response({'affiliate_links': links})
        except Exception as e:
            return Response(
                {'error': f'Failed to get affiliate links: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def add_affiliate_link(self, request):
        """Add a new affiliate link"""
        name = request.data.get('name')
        url = request.data.get('url')
        description = request.data.get('description', '')
        click_tracking = request.data.get('click_tracking', True)
        
        if not name or not url:
            return Response(
                {'error': 'name and url are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = settings_service.add_affiliate_link(name, url, description, click_tracking)
            
            if result['success']:
                return Response(result, status=status.HTTP_201_CREATED)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response(
                {'error': f'Failed to add affiliate link: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def ai_settings(self, request):
        """Get AI settings"""
        try:
            ai_settings = settings_service.get_ai_settings()
            return Response(ai_settings)
        except Exception as e:
            return Response(
                {'error': f'Failed to get AI settings: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def cloudflare_settings(self, request):
        """Get Cloudflare settings"""
        try:
            cf_settings = settings_service.get_cloudflare_settings()
            return Response(cf_settings)
        except Exception as e:
            return Response(
                {'error': f'Failed to get Cloudflare settings: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def git_settings(self, request):
        """Get Git settings"""
        try:
            git_settings = settings_service.get_git_settings()
            return Response(git_settings)
        except Exception as e:
            return Response(
                {'error': f'Failed to get Git settings: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def application_settings(self, request):
        """Get application settings"""
        try:
            app_settings = settings_service.get_application_settings()
            return Response(app_settings)
        except Exception as e:
            return Response(
                {'error': f'Failed to get application settings: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def update_ai_settings(self, request):
        """Update AI settings (admin only)"""
        # This would typically update environment variables or database settings
        # For now, return a placeholder response
        return Response({
            'message': 'AI settings update not implemented yet',
            'note': 'Settings are typically configured via environment variables'
        })
    
    @action(detail=False, methods=['post'])
    def update_cloudflare_settings(self, request):
        """Update Cloudflare settings (admin only)"""
        # This would typically update environment variables or database settings
        return Response({
            'message': 'Cloudflare settings update not implemented yet',
            'note': 'Settings are typically configured via environment variables'
        })
    
    @action(detail=False, methods=['post'])
    def update_git_settings(self, request):
        """Update Git settings (admin only)"""
        # This would typically update environment variables or database settings
        return Response({
            'message': 'Git settings update not implemented yet',
            'note': 'Settings are typically configured via environment variables'
        })
    
    @action(detail=False, methods=['get'])
    def system_status(self, request):
        """Get system status and health check"""
        try:
            from django.db import connection
            from django.core.cache import cache
            
            # Test database connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                db_status = "connected"
        except Exception:
            db_status = "disconnected"
        
        # Test cache connection
        try:
            cache.set('test_key', 'test_value', 1)
            cache.get('test_key')
            cache_status = "connected"
        except Exception:
            cache_status = "disconnected"
        
        return Response({
            'database': db_status,
            'cache': cache_status,
            'timestamp': timezone.now().isoformat()
        })
