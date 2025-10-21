from django.db import models
from django.utils import timezone

class Deployment(models.Model):
    """Deployment history and status - UPDATED with template snapshots"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('building', 'Building'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]
    
    site = models.ForeignKey(
        'sites.Site',
        on_delete=models.CASCADE,
        related_name='deployments'
    )
    cloudflare_token = models.ForeignKey(
        'integrations.CloudflareToken',
        on_delete=models.PROTECT,
        related_name='deployments'
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='pending'
    )
    git_commit_hash = models.CharField(max_length=40, blank=True)
    build_log = models.TextField(blank=True)
    deployed_url = models.URLField(max_length=500, blank=True)
    build_time_seconds = models.IntegerField(null=True, blank=True)
    file_count = models.IntegerField(null=True, blank=True)
    total_size_bytes = models.BigIntegerField(null=True, blank=True)
    template_snapshot = models.JSONField(
        default=dict,
        help_text='Snapshot of template, footprint, and variables used in this deployment'
    )
    generated_files = models.JSONField(
        default=list,
        help_text='List of all generated file paths'
    )
    unique_identifiers = models.JSONField(
        default=dict,
        help_text='Unique class prefixes, image dimensions, etc. used in this deployment'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'deployments'
        verbose_name = 'Deployment'
        verbose_name_plural = 'Deployments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['site']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.site.domain} - {self.status} ({self.created_at})"
    
    def save(self, *args, **kwargs):
        """Save template configuration snapshot"""
        if not self.template_snapshot and self.site:
            self.template_snapshot = {
                'template': {
                    'id': self.site.template.id,
                    'name': self.site.template.name,
                    'type': self.site.template.type,
                    'version': self.site.template.version,
                },
                'footprint': {
                    'id': self.site.template_footprint.id if self.site.template_footprint else None,
                    'name': self.site.template_footprint.name if self.site.template_footprint else None,
                    'cms_type': self.site.template_footprint.cms_type if self.site.template_footprint else None,
                } if self.site.template_footprint else None,
                'variables': self.site.template_variables,
                'colors': self.site.custom_colors,
                'settings': {
                    'enable_page_speed': self.site.enable_page_speed,
                    'unique_class_prefix': self.site.unique_class_prefix,
                },
                'timestamp': timezone.now().isoformat()
            }
        super().save(*args, **kwargs)
    
    @property
    def is_complete(self):
        return self.status in ['success', 'failed']
    
    @property
    def duration(self):
        """Get deployment duration"""
        if self.completed_at:
            delta = self.completed_at - self.created_at
            return delta.total_seconds()
        return None
