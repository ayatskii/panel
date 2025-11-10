from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from .models import Deployment
from .serializers import DeploymentSerializer
from users.permissions import IsOwnerOrAdmin
import zipfile
import io
import tempfile
import os
from .services.template_processor import TemplateProcessor

class DeploymentViewSet(viewsets.ModelViewSet):
    """Read-only; lists and inspects deployments"""
    serializer_class = DeploymentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['site', 'status']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Deployment.objects.select_related('site', 'cloudflare_token')
        return Deployment.objects.filter(site__user=user).select_related('site', 'cloudflare_token')

    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        """Retrieve build logs for a deployment."""
        dep = self.get_object()
        # Convert build_log string to array of lines for frontend compatibility
        logs = dep.build_log.split('\n') if dep.build_log else []
        return Response({
            'logs': logs,
            'status': dep.status
        })

    @action(detail=True, methods=['post'])
    def trigger(self, request, pk=None):
        """Trigger a new deployment for this deployment's site."""
        from .tasks import deploy_site_async
        
        dep = self.get_object()
        
        # Check if deployment is already in progress
        if dep.status in ['pending', 'building']:
            return Response(
                {'error': 'Deployment already in progress'},
                status=400
            )
        
        # Create a new deployment for the same site
        new_deployment = Deployment.objects.create(
            site=dep.site,
            cloudflare_token=dep.cloudflare_token,
            status='pending'
        )
        
        # Trigger the deployment task
        deploy_site_async.delay(new_deployment.id, request.user.id)
        
        return Response({
            'message': 'Deployment triggered successfully',
            'deployment_id': new_deployment.id
        }, status=201)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a pending deployment."""
        dep = self.get_object()
        if dep.status == 'pending':
            dep.status = 'failed'
            dep.build_log = 'Cancelled by user'
            dep.save()
            return Response({'message': 'Deployment cancelled'}, status=200)
        else:
            return Response(
                {'error': 'Cannot cancel deployment in current status'},
                status=400
            )

    @action(detail=True, methods=['get'])
    def download_zip(self, request, pk=None):
        """Download generated site as ZIP archive."""
        from media.services.favicon_generation_service import favicon_generation_service
        
        dep = self.get_object()
        site = dep.site
        
        # Check permission
        if not request.user.is_admin and site.user != request.user:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Generate site files
        processor = TemplateProcessor(site)
        files = {}
        
        # Generate pages
        for page in site.pages.filter(is_published=True):
            page_processor = TemplateProcessor(site, page)
            page_html = page_processor.generate_html()
            
            # Determine filename
            if page.slug == 'home' or page.slug == '':
                filename = 'index.html'
            else:
                filename = f"{page.slug}.html"
            
            files[filename] = page_html.encode('utf-8')
        
        # Generate global CSS
        global_css = processor.generate_css()
        files['styles.css'] = global_css.encode('utf-8')
        
        # Generate global JS if exists
        if site.template and site.template.js_content:
            files['scripts.js'] = site.template.js_content.encode('utf-8')
        
        # Generate favicon files if favicon is set
        if site.favicon_media:
            favicon_files = self._generate_favicon_files_for_zip(site, site.favicon_media)
            files.update(favicon_files)
        
        # Create ZIP file in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file_path, file_content in files.items():
                # Ensure file_content is bytes
                if isinstance(file_content, str):
                    file_content = file_content.encode('utf-8')
                zip_file.writestr(file_path, file_content)
        
        zip_buffer.seek(0)
        
        # Create HTTP response
        response = HttpResponse(zip_buffer, content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="{site.domain}-{dep.id}.zip"'
        response['Content-Length'] = zip_buffer.tell()
        
        return response
    
    def _generate_favicon_files_for_zip(self, site, favicon_media):
        """Generate favicon files for ZIP download"""
        from media.services.favicon_generation_service import favicon_generation_service
        
        if not favicon_media:
            return {}
        
        try:
            result = favicon_generation_service.generate_favicons(favicon_media, site.domain)
            
            if not result.get('success'):
                return {}
            
            files = {}
            generated = result.get('generated_files', {})
            
            # Map generated files to ZIP file paths
            if 'ico' in generated:
                files['_assets/favicon.ico'] = self._read_favicon_file(generated['ico']['path'])
            
            if 'png_16' in generated:
                files['_assets/favicon-16x16.png'] = self._read_favicon_file(generated['png_16']['path'])
            
            if 'png_32' in generated:
                files['_assets/favicon-32x32.png'] = self._read_favicon_file(generated['png_32']['path'])
            
            if 'png_48' in generated:
                files['_assets/favicon-48x48.png'] = self._read_favicon_file(generated['png_48']['path'])
            
            if 'svg' in generated:
                files['_assets/favicon.svg'] = self._read_favicon_file(generated['svg']['path'])
            
            if 'apple_touch_icon' in generated:
                files['_assets/apple-touch-icon.png'] = self._read_favicon_file(generated['apple_touch_icon']['path'])
            
            if 'safari_pinned_tab' in generated:
                files['_assets/safari-pinned-tab.svg'] = self._read_favicon_file(generated['safari_pinned_tab']['path'])
            
            return files
            
        except Exception as e:
            return {}
    
    def _read_favicon_file(self, file_path):
        """Read favicon file content from storage"""
        from django.core.files.storage import default_storage
        try:
            with default_storage.open(file_path, 'rb') as f:
                return f.read()
        except Exception:
            return b''
