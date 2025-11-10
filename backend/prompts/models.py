from django.db import models

class Prompt(models.Model):
    """AI prompts for content and image generation"""
    TYPE_CHOICES = [
        ('text', 'Text Generation'),
        ('image', 'Image Generation'),
    ]
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    block_type = models.CharField(
        max_length=100,
        blank=True,
        help_text='Associated page block type: article, title, description, faq, hero'
    )
    ai_model = models.CharField(
        max_length=100,
        help_text='AI model: gpt-4, gpt-3.5-turbo, claude-3, openai/gpt-4, anthropic/claude-3-sonnet, dall-e-3, etc.'
    )
    temperature = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.7,
        help_text='Creativity level (0.0-1.0)'
    )
    max_tokens = models.IntegerField(
        null=True,
        blank=True,
        help_text='Maximum tokens for generation'
    )
    prompt_text = models.TextField(
        help_text='Prompt template with variable placeholders: {keywords}, {brand_name}, etc.'
    )
    
    # System prompt for models that support it
    system_prompt = models.TextField(
        blank=True,
        help_text='System prompt for ChatGPT/Claude models'
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'prompts'
        verbose_name = 'Prompt'
        verbose_name_plural = 'Prompts'
        indexes = [
            models.Index(fields=['type']),
            models.Index(fields=['block_type']),
            models.Index(fields=['ai_model']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.ai_model})"
    
    @property
    def is_text_prompt(self):
        return self.type == 'text'
    
    @property
    def is_image_prompt(self):
        return self.type == 'image'
