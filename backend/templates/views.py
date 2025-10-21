from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Prefetch
from .models import Template, TemplateFootprint, TemplateVariable, TemplateSection
from .serializers import (
    TemplateSerializer,
    TemplateListSerializer,
    TemplatePreviewSerializer,
    TemplateFootprintSerializer
)
from users.permissions import IsAdminUser


class TemplateViewSet(viewsets.ModelViewSet):
    """
    Template management
    - List/Retrieve: All authenticated users
    - Create/Update/Delete: Admin only
    """
    permission_classes = [IsAuthenticated]
    filterset_fields = ['type', 'css_framework', 'supports_color_customization']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Optimized with related data"""
        return Response(Template.objects.prefetch_related(
            'variables',
            'sections',
            'footprints',
            'assets'
        ).annotate(
            site_count=Count('sites', distinct=True),
            footprint_count=Count('footprints', distinct=True),
            section_count=Count('sections', distinct=True)
        ))
    
    def get_serializer_class(self):
        """Different serializers for different actions"""
        if self.action == 'list':
            return TemplateListSerializer
        elif self.action == 'preview':
            return TemplatePreviewSerializer
        return TemplateSerializer
    
    def get_permissions(self):
        """Admin-only for create/update/delete"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Get template preview data"""
        template = self.get_object()
        serializer = TemplatePreviewSerializer(template, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def variables(self, request, pk=None):
        """Get all variables for a template"""
        template = self.get_object()
        variables = template.variables.all()
        from .serializers import TemplateVariableSerializer
        serializer = TemplateVariableSerializer(variables, many=True)
        return Response(serializer.data)


class TemplateFootprintViewSet(viewsets.ModelViewSet):
    """Footprint management (admin only)"""
    queryset = TemplateFootprint.objects.select_related('template').all()
    serializer_class = TemplateFootprintSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['template', 'cms_type']
    ordering = ['template', 'name']
