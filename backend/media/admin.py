from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count
from .models import Media, MediaFolder

@admin.register(MediaFolder)
class MediaFolderAdmin(admin.ModelAdmin):
    list_display = ['name', 'full_path', 'parent_folder', 'subfolder_count', 'file_count', 'created_at']
    list_filter = ['created_at', 'parent_folder']
    search_fields = ['name']
    readonly_fields = ['created_at', 'full_path']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(
            _subfolder_count=Count('subfolders', distinct=True),
            _file_count=Count('files', distinct=True)
        )
    
    def subfolder_count(self, obj):
        return obj._subfolder_count
    subfolder_count.short_description = 'Subfolders'
    subfolder_count.admin_order_field = '_subfolder_count'
    
    def file_count(self, obj):
        return obj._file_count
    file_count.short_description = 'Files'
    file_count.admin_order_field = '_file_count'


@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = [
        'thumbnail', 'original_name', 'mime_type',
        'dimensions', 'size_display', 'folder',
        'uploaded_by', 'created_at'
    ]
    list_filter = ['mime_type', 'created_at', 'folder']
    search_fields = ['original_name', 'filename', 'alt_text']
    readonly_fields = [
        'filename', 'file_path', 'file_size', 'mime_type',
        'width', 'height', 'uploaded_by', 'created_at',
        'file_preview'
    ]
    
    fieldsets = (
        ('File Information', {
            'fields': ('file', 'file_preview', 'folder', 'original_name', 'filename')
        }),
        ('File Details', {
            'fields': ('mime_type', 'file_size', 'file_path')
        }),
        ('Image Properties', {
            'fields': ('width', 'height', 'alt_text'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('uploaded_by', 'created_at')
        }),
    )
    
    def thumbnail(self, obj):
        """Display thumbnail for images"""
        if obj.is_image and obj.file:
            return format_html(
                '<img src="{}" style="max-width: 50px; max-height: 50px;" />',
                obj.file.url
            )
        return format_html(
            '<span style="color: gray;">📄</span>'
        )
    thumbnail.short_description = 'Preview'
    
    def dimensions(self, obj):
        """Display image dimensions"""
        if obj.width and obj.height:
            return f"{obj.width} × {obj.height}"
        return '-'
    dimensions.short_description = 'Dimensions'
    
    def size_display(self, obj):
        """Display file size"""
        if obj.file_size < 1024:
            return f"{obj.file_size} B"
        elif obj.file_size < 1024 * 1024:
            return f"{obj.size_kb} KB"
        else:
            return f"{obj.size_mb} MB"
    size_display.short_description = 'Size'
    
    def file_preview(self, obj):
        """Large preview of file"""
        if obj.is_image and obj.file:
            return format_html(
                '<img src="{}" style="max-width: 400px; max-height: 400px;" />',
                obj.file.url
            )
        return "Not an image"
    file_preview.short_description = 'Preview'
