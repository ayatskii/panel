from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Prefetch
from django.utils import timezone
from .models import Site, Language, AffiliateLink
from .serializers import (
    SiteSerializer,
    SiteListSerializer,
    SiteCreateSerializer,
    LanguageSerializer,
    AffiliateLinkSerializer,
    AffiliateLinkListSerializer
)
from users.permissions import IsOwnerOrAdmin, IsSiteOwnerOrAdmin, IsAdminUser

from pages.models import Page, PageBlock

class SiteViewSet(viewsets.ModelViewSet):
    """
    Complete CRUD for sites with deployment actions
    Optimized with select_related and prefetch_related
    """
    permission_classes = [IsAuthenticated]
    filterset_fields = ['language_code', 'template', 'deployed_at']
    search_fields = ['domain', 'brand_name']
    ordering_fields = ['created_at', 'deployed_at', 'brand_name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Optimized queryset with related data"""
        queryset = Site.objects.select_related(
            'user',
            'template',
            'template_footprint',
            'cloudflare_token',
            'affiliate_link',
            'favicon_media',
            'logo_media'
        ).prefetch_related(
            Prefetch('pages', queryset=Page.objects.select_related('site')),
            'deployments'
        ).annotate(
            page_count=Count('pages', distinct=True),
            deployment_count=Count('deployments', distinct=True)
        )
        
        # Filter by user role
        if self.request.user.is_admin:
            return queryset
        return queryset.filter(user=self.request.user)
    
    def get_serializer_class(self):
        """Different serializers for different actions"""
        if self.action == 'list':
            return SiteListSerializer
        elif self.action == 'create':
            return SiteCreateSerializer
        return SiteSerializer
    
    def get_permissions(self):
        """Check ownership for update/delete"""
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsSiteOwnerOrAdmin()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Assign current user to site"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def deploy(self, request, pk=None):
        """Trigger site deployment"""
        site = self.get_object()
        
        if not site.template:
            return Response(
                {'error': 'Site must have a template assigned before deployment'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not site.cloudflare_token:
            return Response(
                {'error': 'Site must have a Cloudflare token'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Trigger async deployment
        from deployment.tasks import deploy_site_async
        task = deploy_site_async.delay(site.id, request.user.id)
        
        return Response({
            'message': 'Deployment started',
            'task_id': task.id,
            'site_id': site.id
        })
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate a site with all pages"""
        original_site = self.get_object()
        new_domain = request.data.get('domain')

        if not new_domain:
            return Response(
                {'error': 'New domain is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if Site.objects.filter(domain=new_domain).exists():
            return Response(
                {'error': 'A site with this domain already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
  
        new_site = Site.objects.create(
            user=request.user,
            domain=new_domain,
            brand_name=f"{original_site.brand_name} (Copy)",
            language_code=original_site.language_code,
            template=original_site.template,
            template_footprint=original_site.template_footprint,
            template_variables=original_site.template_variables.copy(),
            custom_colors=original_site.custom_colors.copy(),
            enable_page_speed=original_site.enable_page_speed,
            cloudflare_token=original_site.cloudflare_token,
            affiliate_link=original_site.affiliate_link,
        )
        
        from pages.models import Page, PageBlock
        for page in original_site.pages.all():
            new_page = Page.objects.create(
                site=new_site,
                slug=page.slug,
                title=page.title,
                meta_description=page.meta_description,
                h1_tag=page.h1_tag,
                keywords=page.keywords,
                lsi_phrases=page.lsi_phrases
            )

            for block in page.blocks.all():
                PageBlock.objects.create(
                    page=new_page,
                    block_type=block.block_type,
                    content_data=block.content_data.copy(),
                    order_index=block.order_index,
                    prompt=block.prompt
                )
        
        serializer = self.get_serializer(new_site)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def analytics_summary(self, request, pk=None):
        """Get analytics summary for site"""
        site = self.get_object()
        from analytics.models import Analytics
        from django.db.models import Sum, Avg
  
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now().date() - timezone.timedelta(days=days)
        
        summary = Analytics.objects.filter(
            site=site,
            date__gte=start_date
        ).aggregate(
            total_visitors=Sum('visitors'),
            total_pageviews=Sum('pageviews'),
            avg_bounce_rate=Avg('bounce_rate'),
            total_conversions=Sum('conversions'),
            total_revenue=Sum('revenue')
        )
        
        return Response(summary)
    
    @action(detail=False, methods=['get'])
    def templates_available(self, request):
        """Get available templates for site creation"""
        from templates.models import Template
        from templates.serializers import TemplateListSerializer
        
        templates = Template.objects.prefetch_related('footprints').all()
        serializer = TemplateListSerializer(templates, many=True)
        return Response(serializer.data)


class LanguageViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only viewset for languages"""
    queryset = Language.objects.filter(is_active=True)
    serializer_class = LanguageSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  


class AffiliateLinkViewSet(viewsets.ModelViewSet):
    """
    Complete CRUD for affiliate links with usage tracking
    - List: All authenticated users (read-only for regular users)
    - Create/Update/Delete: Admin only
    """
    serializer_class = AffiliateLinkSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['name', 'description', 'url']
    filterset_fields = ['click_tracking']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Optimized with usage counts"""
        return AffiliateLink.objects.annotate(
            site_count=Count('sites', distinct=True),
            swiper_preset_count=Count('swiper_presets', distinct=True),
            total_usage=Count('sites', distinct=True) + Count('swiper_presets', distinct=True)
        )
    
    def get_serializer_class(self):
        """Use lightweight serializer for lists"""
        if self.action == 'list':
            return AffiliateLinkListSerializer
        return AffiliateLinkSerializer
    
    def get_permissions(self):
        """Admin-only for create/update/delete"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    @action(detail=True, methods=['get'])
    def usage(self, request, pk=None):
        """Get detailed usage statistics for this affiliate link"""
        affiliate_link = self.get_object()
        
        # Get all sites using this link
        sites = affiliate_link.sites.select_related('user').values(
            'id', 'domain', 'brand_name', 'user__username', 'created_at'
        )
        
        # Get all swiper presets using this link
        presets = affiliate_link.swiper_presets.values(
            'id', 'name', 'created_at'
        )
        
        return Response({
            'affiliate_link': {
                'id': affiliate_link.id,
                'name': affiliate_link.name,
                'url': affiliate_link.url
            },
            'usage_summary': {
                'total_sites': sites.count(),
                'total_presets': presets.count(),
                'total_usage': sites.count() + presets.count()
            },
            'sites': list(sites),
            'swiper_presets': list(presets)
        })
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate an affiliate link"""
        original = self.get_object()
        
        new_link = AffiliateLink.objects.create(
            name=f"{original.name} (Copy)",
            url=original.url,
            description=original.description,
            click_tracking=original.click_tracking
        )
        
        serializer = self.get_serializer(new_link)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def toggle_tracking(self, request, pk=None):
        """Toggle click tracking on/off"""
        affiliate_link = self.get_object()
        affiliate_link.click_tracking = not affiliate_link.click_tracking
        affiliate_link.save()
        
        return Response({
            'id': affiliate_link.id,
            'name': affiliate_link.name,
            'click_tracking': affiliate_link.click_tracking,
            'message': f"Click tracking {'enabled' if affiliate_link.click_tracking else 'disabled'}"
        })
    
    @action(detail=False, methods=['get'])
    def most_used(self, request):
        """Get most used affiliate links"""
        links = self.get_queryset().order_by('-total_usage')[:10]
        serializer = self.get_serializer(links, many=True)
        return Response(serializer.data)
    
    def perform_destroy(self, instance):
        """Check if can be deleted before deleting"""
        site_count = instance.sites.count()
        preset_count = instance.swiper_presets.count()
        
        if site_count > 0 or preset_count > 0:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({
                'error': f'Cannot delete affiliate link in use',
                'details': {
                    'sites_using': site_count,
                    'presets_using': preset_count
                }
            })
        
        instance.delete()