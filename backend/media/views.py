from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Prefetch
from .models import Media, MediaFolder
from .serializers import MediaSerializer, MediaFolderSerializer, MediaUploadSerializer, MediaListSerializer
from users.permissions import IsOwnerOrReadOnly


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
        queryset = Media.objects.select_related('folder', 'uploaded_by')
        
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
        
        return queryset
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action in ['create', 'upload', 'bulk_upload']:
            return MediaUploadSerializer
        elif self.action == 'list':
            return MediaListSerializer
        return MediaSerializer
    
    @action(detail=False, methods=['post'])
    def upload(self, request):
        """Upload a single file"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        media = serializer.save(uploaded_by=request.user)
        return Response(
            MediaSerializer(media, context={'request': request}).data,
            status=status.HTTP_201_CREATED
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
            
            # Try to get image dimensions
            if mime_type.startswith('image/'):
                try:
                    from PIL import Image
                    img = Image.open(media.file.path)
                    media.width, media.height = img.size
                except Exception:
                    pass
            
            media.save(update_fields=['file_path', 'width', 'height'])
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
