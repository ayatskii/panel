from django.db import models

class Analytics(models.Model):
    """Site analytics and traffic data"""
    site = models.ForeignKey(
        'sites.Site',
        on_delete=models.PROTECT,
        related_name='analytics'
    )
    date = models.DateField()
    visitors = models.IntegerField(default=0)
    pageviews = models.IntegerField(default=0)
    bounce_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True
    )
    avg_session_duration = models.IntegerField(
        null=True,
        blank=True,
        help_text='Average session duration in seconds'
    )
    traffic_source = models.CharField(
        max_length=100,
        blank=True,
        help_text='organic, direct, referral, social, paid'
    )
    conversions = models.IntegerField(
        default=0,
        help_text='Number of affiliate link clicks or goals'
    )
    revenue = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text='Estimated revenue from affiliate commissions'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'analytics'
        verbose_name = 'Analytics'
        verbose_name_plural = 'Analytics'
        unique_together = ['site', 'date', 'traffic_source']
        indexes = [
            models.Index(fields=['site', 'date']),
            models.Index(fields=['date']),
            models.Index(fields=['traffic_source']),
        ]
    
    def __str__(self):
        return f"{self.site.domain} - {self.date}"
    
    @property
    def conversion_rate(self):
        """Calculate conversion rate"""
        if self.visitors > 0:
            return round((self.conversions / self.visitors) * 100, 2)
        return 0.0

from sites.models import Site

class PageView(models.Model):
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='page_views')
    page_slug = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['site', 'page_slug', 'timestamp']),
        ]