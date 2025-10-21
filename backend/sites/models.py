from django.db import models
from django.conf import settings
from django.core.validators import URLValidator

class Language(models.Model):
    """Supported languages for sites"""
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'languages'
        verbose_name = 'Language'
        verbose_name_plural = 'Languages'
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class AffiliateLink(models.Model):
    """Affiliate marketing links"""
    name = models.CharField(max_length=255)
    url = models.TextField(validators=[URLValidator()])
    description = models.TextField(blank=True)
    click_tracking = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'affiliate_links'
        verbose_name = 'Affiliate Link'
        verbose_name_plural = 'Affiliate Links'
    
    def __str__(self):
        return self.name


class Site(models.Model):
    """Main website entity - UPDATED with template configuration"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sites'
    )
    domain = models.CharField(max_length=255, unique=True)
    brand_name = models.CharField(max_length=255)
    language_code = models.CharField(max_length=10, default='en-EN')
    
    template = models.ForeignKey(
        'templates.Template',
        on_delete=models.PROTECT,
        related_name='sites'
    )
    template_footprint = models.ForeignKey(
        'templates.TemplateFootprint',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sites',
        help_text='CMS footprint configuration for this site'
    )
    template_variables = models.JSONField(
        default=dict,
        help_text='Custom values for template variables'
    )
    custom_colors = models.JSONField(
        default=dict,
        help_text='Customized color values if template supports it'
    )
    unique_class_prefix = models.CharField(
        max_length=50,
        blank=True,
        help_text='Unique CSS class prefix for this site'
    )
    enable_page_speed = models.BooleanField(
        default=True,
        help_text='Enable page speed optimizations (img to picture tags)'
    )
    
    # External Services
    cloudflare_token = models.ForeignKey(
        'integrations.CloudflareToken',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sites'
    )
    affiliate_link = models.ForeignKey(
        AffiliateLink,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sites'
    )
    
    # Media
    favicon_media = models.ForeignKey(
        'media.Media',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='favicon_sites'
    )
    logo_media = models.ForeignKey(
        'media.Media',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logo_sites'
    )
    
    allow_indexing = models.BooleanField(default=True)
    redirect_404_to_home = models.BooleanField(default=False)
    use_www_version = models.BooleanField(default=False)
    custom_css_class = models.CharField(max_length=100, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deployed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'sites'
        verbose_name = 'Site'
        verbose_name_plural = 'Sites'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['domain']),
            models.Index(fields=['language_code']),
            models.Index(fields=['template']),
        ]
    
    def __str__(self):
        return f"{self.brand_name} ({self.domain})"
    
    @property
    def is_deployed(self):
        return self.deployed_at is not None
