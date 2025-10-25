from django.db import models
from django.conf import settings
from django.core.validators import FileExtensionValidator


class MediaTag(models.Model):
    """Tags for organizing media files"""
    name = models.CharField(max_length=50, unique=True, db_index=True)
    color = models.CharField(max_length=7, default='#2196F3', help_text='Hex color code')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'media_tags'
        verbose_name = 'Media Tag'
        verbose_name_plural = 'Media Tags'
        ordering = ['name']
    
    def save(self, *args, **kwargs):
        # Convert name to lowercase for consistency
        self.name = self.name.lower()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name


class MediaFolder(models.Model):
    name = models.CharField(max_length=255)
    parent_folder = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subfolders'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'media_folders'
        verbose_name = 'Media Folder'
        verbose_name_plural = 'Media Folders'
        indexes = [
            models.Index(fields=['parent_folder']),
            models.Index(fields=['name']),
        ]
    
    def __str__(self):
        if self.parent_folder:
            return f"{self.parent_folder}/{self.name}"
        return self.name
    
    @property
    def full_path(self):
        """Get full folder path"""
        if self.parent_folder:
            return f"{self.parent_folder.full_path}/{self.name}"
        return self.name
    
class Media(models.Model):
    """Media library for images and files"""
    folder = models.ForeignKey(
        MediaFolder,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='files'
    )
    tags = models.ManyToManyField(
        MediaTag,
        blank=True,
        related_name='media_files',
        db_table='media_media_tags'
    )
    filename = models.CharField(max_length=255)
    original_name = models.CharField(max_length=255)
    file = models.FileField(upload_to='media/%Y/%m/%d/')
    file_path = models.CharField(max_length=500)
    file_size = models.BigIntegerField()
    mime_type = models.CharField(max_length=100)
    alt_text = models.CharField(max_length=255, blank=True)
    caption = models.CharField(max_length=500, blank=True)
    
    # Image-specific fields
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)
    
    # Image variants (optimized sizes)
    thumbnail = models.FileField(upload_to='media/%Y/%m/%d/thumbnails/', null=True, blank=True)
    medium = models.FileField(upload_to='media/%Y/%m/%d/medium/', null=True, blank=True)
    large = models.FileField(upload_to='media/%Y/%m/%d/large/', null=True, blank=True)
    webp = models.FileField(upload_to='media/%Y/%m/%d/webp/', null=True, blank=True)
    is_optimized = models.BooleanField(default=False, help_text='Whether image variants have been generated')
    
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='uploaded_media'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'media'
        verbose_name = 'Media'
        verbose_name_plural = 'Media'
        indexes = [
            models.Index(fields=['folder']),
            models.Index(fields=['uploaded_by']),
            models.Index(fields=['mime_type']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return self.original_name
    
    @property
    def is_image(self):
        return self.mime_type.startswith('image/')
    
    @property
    def is_svg(self):
        return self.mime_type == 'image/svg+xml'
    
    @property
    def size_kb(self):
        return round(self.file_size / 1024, 2)
    
    @property
    def size_mb(self):
        return round(self.file_size / (1024 * 1024), 2)
    
