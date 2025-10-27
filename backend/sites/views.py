from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Prefetch
from django.utils import timezone
from .models import Site
from .serializers import (
    SiteSerializer,
    SiteListSerializer,
    SiteCreateSerializer
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

