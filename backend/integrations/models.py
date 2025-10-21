from django.db import models
from django.core.validators import MinLengthValidator

class ApiToken(models.Model):
    """API tokens for external services"""
    SERVICE_CHOICES = [
        ('chatgpt', 'ChatGPT'),
        ('grok', 'Grok'),
        ('claude', 'Claude'),
        ('cloudflare', 'Cloudflare'),
        ('elevenlabs', 'ElevenLabs'),
        ('dalle', 'DALL-E'),
        ('midjourney', 'Midjourney'),
    ]
    
    name = models.CharField(max_length=255)
    service = models.CharField(max_length=20, choices=SERVICE_CHOICES)
    token_value = models.TextField(
        validators=[MinLengthValidator(10)],
        help_text='API token/key (will be encrypted in production)'
    )
    is_active = models.BooleanField(default=True)

    last_used = models.DateTimeField(null=True, blank=True)
    usage_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'api_tokens'
        verbose_name = 'API Token'
        verbose_name_plural = 'API Tokens'
        indexes = [
            models.Index(fields=['service']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_service_display()})"
    
    def increment_usage(self):
        """Increment usage counter"""
        from django.utils import timezone
        self.usage_count += 1
        self.last_used = timezone.now()
        self.save(update_fields=['usage_count', 'last_used'])


class CloudflareToken(models.Model):
    """Cloudflare-specific token configurations"""
    api_token = models.ForeignKey(
        ApiToken,
        on_delete=models.CASCADE,
        related_name='cloudflare_configs'
    )
    name = models.CharField(max_length=255)
    account_id = models.CharField(
        max_length=100,
        blank=True,
        help_text='Cloudflare account ID'
    )
    zone_id = models.CharField(
        max_length=100,
        blank=True,
        help_text='Cloudflare zone ID for DNS operations'
    )

    pages_project_name = models.CharField(
        max_length=255,
        blank=True,
        help_text='Default Pages project name'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'cloudflare_tokens'
        verbose_name = 'Cloudflare Token'
        verbose_name_plural = 'Cloudflare Tokens'
    
    def __str__(self):
        return f"{self.name}"
