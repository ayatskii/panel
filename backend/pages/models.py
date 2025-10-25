from django.db import models


class Page(models.Model):
    """Individual pages within sites"""
    site = models.ForeignKey(
        'sites.Site',
        on_delete=models.CASCADE,
        related_name='pages'
    )
    slug = models.CharField(
        max_length=255,
        help_text='URL slug for the page (e.g., "about", "contact")'
    )
    title = models.CharField(
        max_length=255,
        blank=True,
        help_text='Page title for SEO'
    )
    meta_description = models.TextField(
        blank=True,
        help_text='Meta description for SEO'
    )
    h1_tag = models.CharField(
        max_length=255,
        blank=True,
        help_text='H1 heading for the page'
    )
    use_h1_in_hero = models.BooleanField(
        default=False,
        help_text='Use H1 tag inside hero block instead of separately'
    )
    canonical_url = models.URLField(
        max_length=500,
        blank=True,
        help_text='Canonical URL for SEO'
    )
    custom_head_html = models.TextField(
        blank=True,
        help_text='Custom HTML to inject in <head> (tracking scripts, etc.)'
    )
    keywords = models.TextField(
        blank=True,
        help_text='Keywords for AI content generation (one per line)'
    )
    lsi_phrases = models.TextField(
        blank=True,
        help_text='LSI phrases for AI content generation (one per line)'
    )
    order = models.IntegerField(
        default=0,
        help_text='Display order in navigation menus'
    )
    is_published = models.BooleanField(
        default=False,
        help_text='Whether the page is published and visible'
    )
    published_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Date and time when page was published'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'pages'
        verbose_name = 'Page'
        verbose_name_plural = 'Pages'
        unique_together = ['site', 'slug']
        ordering = ['site', 'order', 'slug']
        indexes = [
            models.Index(fields=['site']),
            models.Index(fields=['slug']),
            models.Index(fields=['site', 'slug']),
        ]
    
    def __str__(self):
        return f"{self.site.domain}/{self.slug}"
    
    @property
    def full_url(self):
        """Get complete URL for this page"""
        protocol = 'https' if self.site.allow_indexing else 'http'
        www = 'www.' if self.site.use_www_version else ''
        return f"{protocol}://{www}{self.site.domain}/{self.slug}"
    
    @property
    def keywords_list(self):
        """Get keywords as a list"""
        if self.keywords:
            return [k.strip() for k in self.keywords.split('\n') if k.strip()]
        return []
    
    @property
    def lsi_phrases_list(self):
        """Get LSI phrases as a list"""
        if self.lsi_phrases:
            return [p.strip() for p in self.lsi_phrases.split('\n') if p.strip()]
        return []


class PageBlock(models.Model):
    """Content blocks within pages"""
    BLOCK_TYPE_CHOICES = [
        ('hero', 'Hero Banner'),
        ('article', 'Article/Text Content'),
        ('image', 'Image Block'),
        ('text_image', 'Text + Image Combination'),
        ('cta', 'Call to Action'),
        ('faq', 'FAQ Section'),
        ('swiper', 'Game Carousel (Swiper)'),
    ]
    
    page = models.ForeignKey(
        Page,
        on_delete=models.CASCADE,
        related_name='blocks'
    )
    block_type = models.CharField(
        max_length=20,
        choices=BLOCK_TYPE_CHOICES,
        help_text='Type of content block'
    )
    content_data = models.JSONField(
        default=dict,
        help_text='Block content stored as JSON (flexible structure)'
    )
    order_index = models.IntegerField(
        default=0,
        help_text='Display order (lower numbers appear first)'
    )
    prompt = models.ForeignKey(
        'prompts.Prompt',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='page_blocks',
        help_text='AI prompt used to generate content for this block'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'page_blocks'
        verbose_name = 'Page Block'
        verbose_name_plural = 'Page Blocks'
        ordering = ['order_index']
        indexes = [
            models.Index(fields=['page', 'order_index']),
            models.Index(fields=['block_type']),
        ]
    
    def __str__(self):
        return f"{self.page} - {self.get_block_type_display()} #{self.order_index}"
    
    @property
    def is_hero(self):
        return self.block_type == 'hero'
    
    @property
    def is_article(self):
        return self.block_type == 'article'
    
    @property
    def is_cta(self):
        return self.block_type == 'cta'


class SwiperPreset(models.Model):
    """Predefined game carousels for swiper blocks"""
    name = models.CharField(
        max_length=255,
        help_text='Preset name (e.g., "Top 10 Slots", "New Games")'
    )
    games_data = models.JSONField(
        help_text='Array of game objects with name, image, description, etc.'
    )
    button_text = models.CharField(
        max_length=100,
        default='Play Now',
        help_text='Default button text for games in this preset'
    )
    affiliate_link = models.ForeignKey(
        'sites.AffiliateLink',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='swiper_presets',
        help_text='Affiliate link for all games in this preset'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'swiper_presets'
        verbose_name = 'Swiper Preset'
        verbose_name_plural = 'Swiper Presets'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    @property
    def game_count(self):
        """Get number of games in preset"""
        if isinstance(self.games_data, list):
            return len(self.games_data)
        return 0

