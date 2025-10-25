from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ApiToken, CloudflareToken
from .serializers import ApiTokenSerializer, CloudflareTokenSerializer
from .services.third_party_integrations_service import ThirdPartyIntegrationsService
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


class ThirdPartyIntegrationsViewSet(viewsets.ViewSet):
    """
    ViewSet for third-party integrations
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def share_to_facebook(self, request):
        """Share a page to Facebook"""
        site_id = request.data.get('site_id')
        page_id = request.data.get('page_id')
        message = request.data.get('message', '')
        access_token = request.data.get('access_token')
        
        if not all([site_id, page_id, access_token]):
            return Response(
                {'error': 'site_id, page_id, and access_token are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            integrations_service = ThirdPartyIntegrationsService()
            
            result = integrations_service.share_to_facebook(
                site_id=int(site_id),
                page_id=int(page_id),
                message=message,
                access_token=access_token
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to share to Facebook: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def share_to_twitter(self, request):
        """Share a page to Twitter"""
        site_id = request.data.get('site_id')
        page_id = request.data.get('page_id')
        message = request.data.get('message', '')
        access_token = request.data.get('access_token')
        access_token_secret = request.data.get('access_token_secret')
        consumer_key = request.data.get('consumer_key')
        consumer_secret = request.data.get('consumer_secret')
        
        if not all([site_id, page_id, access_token, access_token_secret, consumer_key, consumer_secret]):
            return Response(
                {'error': 'All Twitter credentials are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            integrations_service = ThirdPartyIntegrationsService()
            
            result = integrations_service.share_to_twitter(
                site_id=int(site_id),
                page_id=int(page_id),
                message=message,
                access_token=access_token,
                access_token_secret=access_token_secret,
                consumer_key=consumer_key,
                consumer_secret=consumer_secret
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to share to Twitter: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def share_to_linkedin(self, request):
        """Share a page to LinkedIn"""
        site_id = request.data.get('site_id')
        page_id = request.data.get('page_id')
        message = request.data.get('message', '')
        access_token = request.data.get('access_token')
        
        if not all([site_id, page_id, access_token]):
            return Response(
                {'error': 'site_id, page_id, and access_token are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            integrations_service = ThirdPartyIntegrationsService()
            
            result = integrations_service.share_to_linkedin(
                site_id=int(site_id),
                page_id=int(page_id),
                message=message,
                access_token=access_token
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to share to LinkedIn: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def send_google_analytics_event(self, request):
        """Send an event to Google Analytics"""
        site_id = request.data.get('site_id')
        event_name = request.data.get('event_name')
        event_category = request.data.get('event_category')
        event_action = request.data.get('event_action')
        event_label = request.data.get('event_label')
        event_value = request.data.get('event_value')
        tracking_id = request.data.get('tracking_id')
        
        if not all([site_id, event_name, event_category, event_action]):
            return Response(
                {'error': 'site_id, event_name, event_category, and event_action are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            integrations_service = ThirdPartyIntegrationsService()
            
            result = integrations_service.send_google_analytics_event(
                site_id=int(site_id),
                event_name=event_name,
                event_category=event_category,
                event_action=event_action,
                event_label=event_label,
                event_value=event_value,
                tracking_id=tracking_id
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to send Google Analytics event: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def send_facebook_pixel_event(self, request):
        """Send an event to Facebook Pixel"""
        site_id = request.data.get('site_id')
        event_name = request.data.get('event_name')
        pixel_id = request.data.get('pixel_id')
        user_data = request.data.get('user_data', {})
        
        if not all([site_id, event_name, pixel_id]):
            return Response(
                {'error': 'site_id, event_name, and pixel_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            integrations_service = ThirdPartyIntegrationsService()
            
            result = integrations_service.send_facebook_pixel_event(
                site_id=int(site_id),
                event_name=event_name,
                pixel_id=pixel_id,
                user_data=user_data
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to send Facebook Pixel event: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def purge_cloudflare_cache(self, request):
        """Purge Cloudflare cache"""
        site_id = request.data.get('site_id')
        urls = request.data.get('urls', [])
        zone_id = request.data.get('zone_id')
        api_token = request.data.get('api_token')
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            integrations_service = ThirdPartyIntegrationsService()
            
            result = integrations_service.purge_cloudflare_cache(
                site_id=int(site_id),
                urls=urls,
                zone_id=zone_id,
                api_token=api_token
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to purge Cloudflare cache: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def submit_to_google_search_console(self, request):
        """Submit URLs to Google Search Console"""
        site_id = request.data.get('site_id')
        page_urls = request.data.get('page_urls', [])
        access_token = request.data.get('access_token')
        
        if not all([site_id, page_urls]):
            return Response(
                {'error': 'site_id and page_urls are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            integrations_service = ThirdPartyIntegrationsService()
            
            result = integrations_service.submit_to_google_search_console(
                site_id=int(site_id),
                page_urls=page_urls,
                access_token=access_token
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to submit to Google Search Console: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def send_mailchimp_campaign(self, request):
        """Send a campaign via Mailchimp"""
        site_id = request.data.get('site_id')
        campaign_data = request.data.get('campaign_data', {})
        api_key = request.data.get('api_key')
        
        if not all([site_id, campaign_data]):
            return Response(
                {'error': 'site_id and campaign_data are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            integrations_service = ThirdPartyIntegrationsService()
            
            result = integrations_service.send_mailchimp_campaign(
                site_id=int(site_id),
                campaign_data=campaign_data,
                api_key=api_key
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to send Mailchimp campaign: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def check_integration_status(self, request):
        """Check the status of a specific integration"""
        site_id = request.query_params.get('site_id')
        platform = request.query_params.get('platform')
        
        if not all([site_id, platform]):
            return Response(
                {'error': 'site_id and platform are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            integrations_service = ThirdPartyIntegrationsService()
            
            result = integrations_service.check_integration_status(
                site_id=int(site_id),
                platform=platform
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to check integration status: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def get_all_integrations_status(self, request):
        """Get status of all integrations for a site"""
        site_id = request.query_params.get('site_id')
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            integrations_service = ThirdPartyIntegrationsService()
            
            result = integrations_service.get_all_integrations_status(int(site_id))
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get all integrations status: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
