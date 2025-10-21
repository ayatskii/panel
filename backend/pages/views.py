from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Prefetch
from django.utils import timezone
from .models import Page, PageBlock, SwiperPreset
from .serializers import (
    PageListSerializer,
    PageDetailSerializer,
    PageCreateSerializer,
    PageBlockSerializer,
    SwiperPresetSerializer
)
from .permissions import IsPageOwnerOrAdmin
from users.permissions import IsAdminUser


class PageViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for pages
    - Users can only access pages from their sites
    - Admin can access all pages
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter pages based on user and site"""
        user = self.request.user
        queryset = Page.objects.select_related('site').prefetch_related('blocks')
        
        # Filter by site if provided
        site_id = self.request.query_params.get('site')
        if site_id:
            queryset = queryset.filter(site_id=site_id)
        
        # Add block count for list view
        if self.action == 'list':
            queryset = queryset.annotate(blocks_count=Count('blocks'))
        
        # Filter by user
        if not user.is_admin:
            queryset = queryset.filter(site__user=user)
        
        return Response(queryset.order_by('site', 'order', '-created_at'))
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return PageListSerializer
        elif self.action == 'create':
            return PageCreateSerializer
        return PageDetailSerializer
    
    def get_permissions(self):
        """Set permissions for different actions"""
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsPageOwnerOrAdmin()]
        return [IsAuthenticated()]
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate a page with all its blocks"""
        page = self.get_object()
        
        # Create duplicate page
        new_page = Page.objects.create(
            site=page.site,
            title=f"{page.title} (Copy)",
            slug=f"{page.slug}-copy",
            page_type=page.page_type,
            meta_title=page.meta_title,
            meta_description=page.meta_description,
            order=page.order + 1,
            is_published=False
        )
        
        # Duplicate all blocks
        for block in page.blocks.all():
            PageBlock.objects.create(
                page=new_page,
                block_type=block.block_type,
                order=block.order,
                content=block.content,
                swiper_preset=block.swiper_preset
            )
        
        serializer = PageDetailSerializer(new_page)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a page"""
        page = self.get_object()
        page.is_published = True
        page.published_at = timezone.now()
        page.save()
        
        return Response({
            'message': 'Page published successfully',
            'is_published': True
        })
    
    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        """Unpublish a page"""
        page = self.get_object()
        page.is_published = False
        page.save()
        
        return Response({
            'message': 'Page unpublished successfully',
            'is_published': False
        })
    
    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """Reorder pages"""
        page_orders = request.data.get('pages', [])
        # Expected format: [{"id": 1, "order": 0}, {"id": 2, "order": 1}]
        
        for item in page_orders:
            Page.objects.filter(id=item['id']).update(order=item['order'])
        
        return Response({'message': 'Pages reordered successfully'})


class PageBlockViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for page blocks
    """
    queryset = PageBlock.objects.select_related('page', 'swiper_preset')
    serializer_class = PageBlockSerializer
    permission_classes = [IsAuthenticated, IsPageOwnerOrAdmin]
    
    def get_queryset(self):
        """Filter blocks by page if provided"""
        queryset = super().get_queryset()
        page_id = self.request.query_params.get('page')
        
        if page_id:
            queryset = queryset.filter(page_id=page_id)
        
        # Filter by user
        if not self.request.user.is_admin:
            queryset = queryset.filter(page__site__user=self.request.user)
        
        return queryset.order_by('order')
    
    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """Reorder blocks within a page"""
        block_orders = request.data.get('blocks', [])
        # Expected format: [{"id": 1, "order": 0}, {"id": 2, "order": 1}]
        
        for item in block_orders:
            PageBlock.objects.filter(id=item['id']).update(order=item['order'])
        
        return Response({'message': 'Blocks reordered successfully'})


class SwiperPresetViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for swiper presets
    """
    queryset = SwiperPreset.objects.all().order_by('name')
    serializer_class = SwiperPresetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Only admin can create/update/delete presets"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminUser()]
        return [IsAuthenticated()]
