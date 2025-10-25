from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from .models import Media, MediaFolder, MediaTag
from .serializers import MediaSerializer, MediaFolderSerializer, MediaTagSerializer
import json



class MediaViewSet(viewsets.ModelViewSet):
    """CRUD for media files, supports uploads, bulk actions"""
    queryset = Media.objects.all()  # Add this line
    serializer_class = MediaSerializer  # Add this line
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
        
        return queryset
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        return MediaSerializer

    def perform_create(self, serializer):
        """Ensure uploaded_by is set on creation."""
        serializer.save(uploaded_by=self.request.user)



class MediaFolderViewSet(viewsets.ModelViewSet):
    """CRUD for media folders, supports nesting"""
    queryset = MediaFolder.objects.all()  # Add this line
    serializer_class = MediaFolderSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['parent_folder']
    search_fields = ['name']
    ordering = ['name']
    
    def get_queryset(self):
        """Filter folders with counts and user filtering"""
        queryset = MediaFolder.objects.prefetch_related('subfolders', 'files').annotate(
            media_count=Count('files'),
            subfolder_count=Count('subfolders'),
            file_count=Count('files')
        )
        return queryset



class MediaTagViewSet(viewsets.ModelViewSet):
    """CRUD for media tags"""
    queryset = MediaTag.objects.all()  # Add this line
    serializer_class = MediaTagSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['name']
    ordering = ['name']
    
    def get_queryset(self):
        """Get tags with media counts"""
        return MediaTag.objects.annotate(media_count=Count('media_files'))
