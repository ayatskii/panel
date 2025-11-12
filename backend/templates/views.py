from rest_framework import viewsets, status
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
from .services.uniqueness_service import template_uniqueness_service
from .services.template_uniqueness_service import template_uniqueness_service as template_uniqueness
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
        return Template.objects.prefetch_related(
            'variables',
            'sections',
            'footprints',
            'assets'
        ).annotate(
            site_count=Count('sites', distinct=True),
            footprint_count=Count('footprints', distinct=True),
            section_count=Count('sections', distinct=True)
        )
    
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
    
    @action(detail=True, methods=['post'])
    def generate_unique_css(self, request, pk=None):
        """Generate unique CSS classes for a template"""
        template = self.get_object()
        site_id = request.data.get('site_id')
        class_list_name = request.data.get('class_list_name')
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Generate unique CSS classes
            modified_css, class_mappings = template_uniqueness_service.generate_unique_css_classes(
                template.css_content,
                site_id,
                class_list_name
            )
            
            return Response({
                'modified_css': modified_css,
                'class_mappings': class_mappings,
                'total_classes': len(class_mappings)
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate unique CSS: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def validate_css(self, request, pk=None):
        """Validate CSS content and return analysis"""
        template = self.get_object()
        
        try:
            analysis = template_uniqueness_service.validate_css_classes(template.css_content)
            return Response(analysis)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to validate CSS: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def class_lists(self, request):
        """Get available custom class lists"""
        try:
            from templates.models import CssClassList
            class_lists = {}
            system_lists = {}
            
            for css_list in CssClassList.objects.all():
                class_lists[css_list.name] = css_list.classes
                system_lists[css_list.name] = css_list.is_system
            
            return Response({
                'class_lists': class_lists,
                'system_lists': system_lists
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get class lists: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def create_class_list(self, request):
        """Create a new custom class list (admin only)"""
        name = request.data.get('name')
        classes = request.data.get('classes', [])
        
        if not name or not classes:
            return Response(
                {'error': 'name and classes are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            success = template_uniqueness_service.create_custom_class_list(name, classes)
            
            if success:
                return Response({'message': 'Class list created successfully'})
            else:
                return Response(
                    {'error': 'Class list already exists'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': f'Failed to create class list: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['put'])
    def update_class_list(self, request):
        """Update an existing custom class list (admin only)"""
        name = request.data.get('name')
        classes = request.data.get('classes', [])
        
        if not name or not classes:
            return Response(
                {'error': 'name and classes are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            success = template_uniqueness_service.update_custom_class_list(name, classes)
            
            if success:
                return Response({'message': 'Class list updated successfully'})
            else:
                return Response(
                    {'error': 'Class list does not exist'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Exception as e:
            return Response(
                {'error': f'Failed to update class list: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['delete'])
    def delete_class_list(self, request):
        """Delete a custom class list (admin only)"""
        name = request.query_params.get('name')
        
        if not name:
            return Response(
                {'error': 'name parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from templates.models import CssClassList
            try:
                css_list = CssClassList.objects.get(name=name)
                if css_list.is_system:
                    return Response(
                        {'error': 'Cannot delete system class lists'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except CssClassList.DoesNotExist:
                pass
            
            success = template_uniqueness_service.delete_custom_class_list(name)
            
            if success:
                return Response({'message': 'Class list deleted successfully'})
            else:
                return Response(
                    {'error': 'Class list does not exist or cannot be deleted'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Exception as e:
            return Response(
                {'error': f'Failed to delete class list: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def generate_unique_template(self, request, pk=None):
        """Generate unique CSS classes and styles for a template"""
        template = self.get_object()
        site_id = request.data.get('site_id')
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from sites.models import Site
            site = Site.objects.get(id=site_id)
            
            result = template_uniqueness.generate_unique_template(template, site)
            return Response(result)
            
        except Site.DoesNotExist:
            return Response(
                {'error': 'Site not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to generate unique template: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def generate_css_class_list(self, request):
        """Generate a custom CSS class list for a site"""
        site_id = request.data.get('site_id')
        list_name = request.data.get('list_name', 'default')
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from sites.models import Site
            site = Site.objects.get(id=site_id)
            
            result = template_uniqueness.generate_css_class_list(site, list_name)
            return Response(result)
            
        except Site.DoesNotExist:
            return Response(
                {'error': 'Site not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to generate CSS class list: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TemplateFootprintViewSet(viewsets.ModelViewSet):
    """Footprint management (admin only)"""
    queryset = TemplateFootprint.objects.select_related('template').all()
    serializer_class = TemplateFootprintSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['template', 'cms_type']
    ordering = ['template', 'name']
