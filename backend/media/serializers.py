from rest_framework import serializers
from .models import Media, MediaFolder


class MediaFolderSerializer(serializers.ModelSerializer):
    """Media folder serializer"""
    full_path = serializers.CharField(read_only=True)
    subfolder_count = serializers.IntegerField(read_only=True)
    file_count = serializers.IntegerField(read_only=True)
    parent_name = serializers.CharField(source='parent_folder.name', read_only=True)
    media_count = serializers.IntegerField(read_only=True)  # Add alias for frontend compatibility
    
    class Meta:
        model = MediaFolder
        fields = [
            'id', 'name', 'parent_folder', 'parent_name',
            'full_path', 'subfolder_count', 'file_count', 'media_count',  # Add media_count
            'created_at', 'updated_at'  # Add updated_at
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, data):
        """Prevent circular folder references"""
        parent = data.get('parent_folder')
        if self.instance and parent:
            current = parent
            while current:
                if current == self.instance:
                    raise serializers.ValidationError({
                        'parent_folder': 'Cannot create circular folder reference'
                    })
                current = current.parent_folder
        return data


class MediaSerializer(serializers.ModelSerializer):
    """Media file serializer"""
    folder_path = serializers.CharField(source='folder.full_path', read_only=True)
    folder_name = serializers.CharField(source='folder.name', read_only=True)  # Add for frontend
    uploaded_by_username = serializers.CharField(
        source='uploaded_by.username',
        read_only=True
    )
    user_username = serializers.CharField(source='uploaded_by.username', read_only=True)  # Alias for frontend
    file_url = serializers.SerializerMethodField()
    is_image = serializers.BooleanField(read_only=True)
    is_svg = serializers.BooleanField(read_only=True)
    size_kb = serializers.FloatField(read_only=True)
    size_mb = serializers.FloatField(read_only=True)
    file_size_mb = serializers.FloatField(source='size_mb', read_only=True)  # Alias for frontend
    file_type = serializers.SerializerMethodField()  # Add file_type for frontend
    thumbnail_url = serializers.SerializerMethodField()  # Add thumbnail support
    
    class Meta:
        model = Media
        fields = [
            'id', 'folder', 'folder_path', 'folder_name', 'filename', 'original_name',
            'file', 'file_url', 'file_path', 'file_size', 'mime_type',
            'alt_text', 'caption', 'width', 'height',  # Add caption if model has it
            'uploaded_by', 'user_username',  # Add user alias
            'uploaded_by_username', 'is_image', 'is_svg',
            'size_kb', 'size_mb', 'file_size_mb', 'file_type',
            'thumbnail_url', 'created_at', 'updated_at'  # Add thumbnail_url and updated_at
        ]
        read_only_fields = [
            'filename', 'file_path', 'file_size', 'mime_type',
            'width', 'height', 'uploaded_by',
            'created_at', 'updated_at'
        ]
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None
    
    def get_file_type(self, obj):
        """Return simplified file type for frontend"""
        if obj.is_image:
            return 'image'
        elif obj.mime_type and 'video' in obj.mime_type:
            return 'video'
        elif obj.mime_type and 'pdf' in obj.mime_type:
            return 'document'
        return 'document'
    
    def get_thumbnail_url(self, obj):
        """Return thumbnail URL for images"""
        request = self.context.get('request')
        
        # If image, return file URL as thumbnail (or implement actual thumbnail generation)
        if obj.is_image and obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        
        return None


class MediaUploadSerializer(serializers.ModelSerializer):
    """Serializer for file uploads"""
    file = serializers.FileField(write_only=True)
    name = serializers.CharField(required=False, write_only=True)
    
    class Meta:
        model = Media
        fields = ['file', 'folder', 'alt_text', 'caption', 'name']
    
    def validate_file(self, value):
        """Validate file size and type"""
        max_size = 50 * 1024 * 1024  # 50MB
        
        if value.size > max_size:
            raise serializers.ValidationError(
                f"File size cannot exceed {max_size / (1024 * 1024)}MB"
            )
        
        return value
    
    def create(self, validated_data):
        """Create media with all required fields populated"""
        from PIL import Image
        import mimetypes
        
        file = validated_data.pop('file')
        name = validated_data.pop('name', None)
        uploaded_by = validated_data.pop('uploaded_by')

        original_name = name or file.name
        mime_type = file.content_type or mimetypes.guess_type(file.name)[0] or 'application/octet-stream'

        # Create the media instance with all required fields
        media = Media.objects.create(
            file=file,
            filename=file.name,
            original_name=original_name,
            file_size=file.size,
            mime_type=mime_type,
            uploaded_by=uploaded_by,
            **validated_data
        )
        
        # Set file_path after save (Django's FileField sets the path)
        media.file_path = str(media.file.name)
        
        # If image, try to get dimensions
        if mime_type.startswith('image/') and not mime_type.endswith('svg+xml'):
            try:
                with Image.open(media.file.path) as img:
                    media.width, media.height = img.size
            except Exception:
                pass  # Not critical if we can't get dimensions
        
        media.save(update_fields=['file_path', 'width', 'height'])
        
        return media


class MediaListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    file_url = serializers.SerializerMethodField()
    folder_name = serializers.CharField(source='folder.name', read_only=True)
    file_type = serializers.SerializerMethodField()
    file_size_mb = serializers.FloatField(source='size_mb', read_only=True)
    thumbnail_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Media
        fields = [
            'id', 'filename', 'original_name', 'file_url',
            'mime_type', 'folder_name', 'size_kb', 'size_mb',
            'file_size_mb', 'file_type', 'thumbnail_url',
            'created_at'
        ]
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None
    
    def get_file_type(self, obj):
        if obj.is_image:
            return 'image'
        elif obj.mime_type and 'video' in obj.mime_type:
            return 'video'
        return 'document'
    
    def get_thumbnail_url(self, obj):
        request = self.context.get('request')
        if obj.is_image and obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None
