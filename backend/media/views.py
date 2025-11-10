from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Prefetch
from .models import Media, MediaFolder, MediaTag
from .serializers import MediaSerializer, MediaFolderSerializer, MediaUploadSerializer, MediaListSerializer, MediaTagSerializer
from users.permissions import IsOwnerOrReadOnly
from pages.models import PageBlock, Page
from .image_optimizer import generate_image_variants, should_optimize
from .services.favicon_generation_service import favicon_generation_service
import json


class MediaTagViewSet(viewsets.ModelViewSet):
    """CRUD for media tags"""
    serializer_class = MediaTagSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['name']
    ordering = ['name']
    
    def get_queryset(self):
        """Get tags with media counts"""
        return MediaTag.objects.annotate(media_count=Count('media_files'))

class MediaViewSet(viewsets.ModelViewSet):
    """CRUD for media files, supports uploads, bulk actions"""
    permission_classes = [IsAuthenticated]
    filterset_fields = ['folder', 'mime_type']
    search_fields = ['original_name', 'filename', 'alt_text']
    ordering_fields = ['created_at', 'file_size', 'original_name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Optimized media queryset with user filtering"""
        user = self.request.user
        queryset = Media.objects.select_related('folder', 'uploaded_by').prefetch_related('tags')
        
        # Filter by user (non-admin sees only their files)
        if not user.is_admin:
            queryset = queryset.filter(uploaded_by=user)
        
        # Support 'type' query param for frontend
        file_type = self.request.query_params.get('type')
        if file_type == 'image':
            queryset = queryset.filter(mime_type__startswith='image/')
        elif file_type == 'video':
            queryset = queryset.filter(mime_type__startswith='video/')
        elif file_type == 'document':
            queryset = queryset.filter(mime_type__in=['application/pdf', 'application/msword'])
        
        # Support 'tags' query param for filtering by tag ID
        tags = self.request.query_params.get('tags')
        if tags:
            tag_ids = [int(tid) for tid in tags.split(',') if tid.isdigit()]
            if tag_ids:
                queryset = queryset.filter(tags__id__in=tag_ids).distinct()
        
        return queryset
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action in ['create', 'upload', 'bulk_upload']:
            return MediaUploadSerializer
        elif self.action == 'list':
            return MediaListSerializer
        return MediaSerializer

    def perform_create(self, serializer):
        """Ensure uploaded_by is set on creation."""
        serializer.save(uploaded_by=self.request.user)
    
    @action(detail=False, methods=['post'])
    def upload(self, request):
        """Upload a single file"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        media = serializer.instance
        return Response(
            MediaSerializer(media, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['post'])
    def import_from_url(self, request):
        """Import media file from URL"""
        import requests
        import mimetypes
        from urllib.parse import urlparse
        from django.core.files.base import ContentFile
        
        url = request.data.get('url', '').strip()
        folder_id = request.data.get('folder')
        name = request.data.get('name', '')
        
        if not url:
            return Response(
                {'error': 'URL is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate URL
        try:
            parsed_url = urlparse(url)
            if not parsed_url.scheme or not parsed_url.netloc:
                return Response(
                    {'error': 'Invalid URL format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception:
            return Response(
                {'error': 'Invalid URL format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get folder if provided
        folder = None
        if folder_id:
            try:
                folder = MediaFolder.objects.get(id=folder_id)
            except MediaFolder.DoesNotExist:
                return Response(
                    {'error': 'Folder not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        try:
            # Download file from URL
            response = requests.get(url, timeout=30, stream=True)
            response.raise_for_status()
            
            # Get filename from URL or Content-Disposition header
            filename = name
            if not filename:
                content_disposition = response.headers.get('Content-Disposition', '')
                if 'filename=' in content_disposition:
                    filename = content_disposition.split('filename=')[1].strip('"\'')
                else:
                    filename = urlparse(url).path.split('/')[-1] or 'downloaded_file'
            
            # Get mime type
            mime_type = response.headers.get('Content-Type', '').split(';')[0].strip()
            if not mime_type or mime_type == 'application/octet-stream':
                mime_type = mimetypes.guess_type(filename)[0] or 'application/octet-stream'
            
            # Read file content
            file_content = response.content
            file_size = len(file_content)
            
            # Create media instance
            media = Media(
                folder=folder,
                uploaded_by=request.user,
                filename=filename,
                original_name=filename,
                file_size=file_size,
                mime_type=mime_type,
            )
            
            # Save file
            media.file.save(filename, ContentFile(file_content), save=False)
            media.file_path = str(media.file.name)
            media.save()
            
            # Process image if it's an image
            if mime_type.startswith('image/'):
                try:
                    from PIL import Image
                    img = Image.open(media.file.path)
                    media.width, media.height = img.size
                    
                    # Generate optimized variants for non-SVG images
                    if should_optimize(mime_type):
                        with open(media.file.path, 'rb') as f:
                            variants = generate_image_variants(f, media.original_name)
                            
                            if variants:
                                media.thumbnail = variants.get('thumbnail')
                                media.medium = variants.get('medium')
                                media.large = variants.get('large')
                                media.webp = variants.get('webp')
                                media.is_optimized = True
                except Exception as e:
                    print(f"Error processing image: {e}")
                    pass
            
            media.save(update_fields=['file_path', 'width', 'height', 'thumbnail', 'medium', 'large', 'webp', 'is_optimized'])
            
            return Response(
                MediaSerializer(media, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
            
        except requests.exceptions.RequestException as e:
            return Response(
                {'error': f'Failed to download file from URL: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to import file: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def bulk_upload(self, request):
        """Upload multiple files"""
        import mimetypes
        
        files = request.FILES.getlist('files')
        folder_id = request.data.get('folder')
        uploaded = []
        
        folder = None
        if folder_id:
            folder = MediaFolder.objects.filter(id=folder_id).first()
        
        for file in files:
            # Get mime type
            mime_type = file.content_type or mimetypes.guess_type(file.name)[0] or 'application/octet-stream'
            
            # Create media instance with all required fields
            media = Media(
                file=file,
                folder=folder,
                uploaded_by=request.user,
                filename=file.name,
                original_name=file.name,
                file_size=file.size,
                mime_type=mime_type,
            )
            media.save()
            
            # Now file_path will have the correct path set by Django
            media.file_path = str(media.file.name)
            
            # Try to get image dimensions and generate variants
            if mime_type.startswith('image/'):
                try:
                    from PIL import Image
                    img = Image.open(media.file.path)
                    media.width, media.height = img.size
                    
                    # Generate optimized variants for non-SVG images
                    if should_optimize(mime_type):
                        # Reopen the file for variant generation
                        with open(media.file.path, 'rb') as f:
                            variants = generate_image_variants(f, media.original_name)
                            
                            if variants:
                                media.thumbnail = variants.get('thumbnail')
                                media.medium = variants.get('medium')
                                media.large = variants.get('large')
                                media.webp = variants.get('webp')
                                media.is_optimized = True
                except Exception as e:
                    print(f"Error processing image: {e}")
                    pass
            
            media.save(update_fields=['file_path', 'width', 'height', 'thumbnail', 'medium', 'large', 'webp', 'is_optimized'])
            uploaded.append(MediaSerializer(media, context={'request': request}).data)
        
        return Response(uploaded, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Delete multiple media files"""
        ids = request.data.get('ids', [])
        
        if not ids:
            return Response(
                {'error': 'No IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get media objects (filtered by user)
        queryset = self.get_queryset().filter(id__in=ids)
        count = queryset.count()
        
        # Delete files from storage
        for media in queryset:
            if media.file:
                try:
                    media.file.delete()
                except Exception as e:
                    print(f"Error deleting file: {e}")
        
        # Delete database records
        queryset.delete()
        
        return Response({
            'message': f'{count} files deleted successfully'
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def bulk_move(self, request):
        """Move multiple media files to a folder"""
        ids = request.data.get('ids', [])
        folder_id = request.data.get('folder_id')
        
        if not ids:
            return Response(
                {'error': 'No IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate folder exists if provided
        folder = None
        if folder_id:
            try:
                folder = MediaFolder.objects.get(id=folder_id)
            except MediaFolder.DoesNotExist:
                return Response(
                    {'error': 'Folder not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Get media objects (filtered by user)
        queryset = self.get_queryset().filter(id__in=ids)
        count = queryset.update(folder=folder)
        
        return Response({
            'message': f'{count} files moved successfully',
            'count': count
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def usage(self, request, pk=None):
        """Get where this media file is used in pages and blocks"""
        media = self.get_object()
        
        # Build the media URL to search for
        media_url = media.file.url if media.file else None
        if not media_url:
            return Response({'usage': []}, status=status.HTTP_200_OK)
        
        usage_list = []
        
        # Search through all page blocks for this media file
        blocks = PageBlock.objects.select_related('page', 'page__site').all()
        
        for block in blocks:
            content_json = json.dumps(block.content_data)
            
            # Check if media URL or media ID appears in the block content
            if media_url in content_json or str(media.id) in content_json:
                usage_list.append({
                    'page_id': block.page.id,
                    'page_title': block.page.title or block.page.slug,
                    'page_slug': block.page.slug,
                    'site_domain': block.page.site.domain,
                    'block_id': block.id,
                    'block_type': block.get_block_type_display(),
                    'block_order': block.order_index,
                })
        
        return Response({
            'media_id': media.id,
            'media_name': media.original_name,
            'media_url': media_url,
            'usage_count': len(usage_list),
            'usage': usage_list
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get media library analytics and statistics"""
        from django.db.models import Sum, Avg, Max, Min
        
        queryset = self.get_queryset()
        
        # Total statistics
        total_files = queryset.count()
        total_size = queryset.aggregate(total=Sum('file_size'))['total'] or 0
        avg_size = queryset.aggregate(avg=Avg('file_size'))['avg'] or 0
        
        # Storage by type
        type_stats = []
        for mime_prefix in ['image/', 'video/', 'application/pdf']:
            if mime_prefix == 'application/pdf':
                files = queryset.filter(mime_type='application/pdf')
                label = 'Documents'
            else:
                files = queryset.filter(mime_type__startswith=mime_prefix)
                label = mime_prefix.replace('/', '').capitalize()
            
            count = files.count()
            size = files.aggregate(total=Sum('file_size'))['total'] or 0
            
            if count > 0:
                type_stats.append({
                    'type': label,
                    'count': count,
                    'size_bytes': size,
                    'size_mb': round(size / (1024 * 1024), 2),
                    'percentage': round((size / total_size * 100) if total_size > 0 else 0, 1)
                })
        
        # Storage by folder
        folder_stats = []
        folders = MediaFolder.objects.all()
        for folder in folders:
            files = queryset.filter(folder=folder)
            count = files.count()
            size = files.aggregate(total=Sum('file_size'))['total'] or 0
            
            if count > 0:
                folder_stats.append({
                    'folder_id': folder.id,
                    'folder_name': folder.name,
                    'folder_path': folder.full_path,
                    'count': count,
                    'size_bytes': size,
                    'size_mb': round(size / (1024 * 1024), 2),
                    'percentage': round((size / total_size * 100) if total_size > 0 else 0, 1)
                })
        
        # Files in root (no folder)
        root_files = queryset.filter(folder__isnull=True)
        root_count = root_files.count()
        root_size = root_files.aggregate(total=Sum('file_size'))['total'] or 0
        
        if root_count > 0:
            folder_stats.append({
                'folder_id': None,
                'folder_name': 'Root',
                'folder_path': '/',
                'count': root_count,
                'size_bytes': root_size,
                'size_mb': round(root_size / (1024 * 1024), 2),
                'percentage': round((root_size / total_size * 100) if total_size > 0 else 0, 1)
            })
        
        # Sort by size descending
        folder_stats.sort(key=lambda x: x['size_bytes'], reverse=True)
        
        # Largest files
        largest_files = queryset.order_by('-file_size')[:10].values(
            'id', 'original_name', 'file_size', 'mime_type', 'created_at'
        )
        
        # Recently uploaded
        recent_files = queryset.order_by('-created_at')[:10].values(
            'id', 'original_name', 'file_size', 'mime_type', 'created_at'
        )
        
        # Optimized images count
        optimized_count = queryset.filter(is_optimized=True).count()
        
        return Response({
            'total_files': total_files,
            'total_size_bytes': total_size,
            'total_size_mb': round(total_size / (1024 * 1024), 2),
            'total_size_gb': round(total_size / (1024 * 1024 * 1024), 2),
            'average_size_bytes': int(avg_size),
            'average_size_mb': round(avg_size / (1024 * 1024), 2),
            'storage_by_type': type_stats,
            'storage_by_folder': folder_stats,
            'largest_files': list(largest_files),
            'recent_files': list(recent_files),
            'optimized_images': optimized_count,
            'optimization_percentage': round((optimized_count / total_files * 100) if total_files > 0 else 0, 1)
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def generate_favicons(self, request, pk=None):
        """Generate favicon files from a media image"""
        media = self.get_object()
        site_domain = request.data.get('site_domain')
        
        if not site_domain:
            return Response(
                {'error': 'site_domain is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if media is an image
        if not media.mime_type.startswith('image/'):
            return Response(
                {'error': 'Media file must be an image'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = favicon_generation_service.generate_favicons(media, site_domain)
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(
                    {'error': result['error']},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            return Response(
                {'error': f'Failed to generate favicons: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MediaFolderViewSet(viewsets.ModelViewSet):
    """CRUD for media folders, supports nesting"""
    serializer_class = MediaFolderSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['parent_folder']
    search_fields = ['name']
    ordering = ['name']
    
    def get_queryset(self):
        """Filter folders with counts and user filtering"""
        user = self.request.user
        queryset = MediaFolder.objects.prefetch_related('subfolders', 'files').annotate(
            media_count=Count('files'),
            subfolder_count=Count('subfolders'),
            file_count=Count('files')
        )
        
        # Filter by user (if your model has user field)
        # if not user.is_admin:
        #     queryset = queryset.filter(user=user)
        
        # Support 'parent' query param for frontend
        parent = self.request.query_params.get('parent')
        if parent == 'null':
            queryset = queryset.filter(parent_folder__isnull=True)
        elif parent:
            queryset = queryset.filter(parent_folder_id=parent)
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def contents(self, request, pk=None):
        """Get all subfolders and files for a folder"""
        folder = self.get_object()
        subfolders = folder.subfolders.all()
        files = folder.files.all()
        return Response({
            'subfolders': MediaFolderSerializer(subfolders, many=True, context={'request': request}).data,
            'files': MediaSerializer(files, many=True, context={'request': request}).data
        })




