from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count
from .models import Prompt

@admin.register(Prompt)
class PromptAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'type_badge', 'block_type',
        'ai_model_badge', 'temperature',
        'usage_count', 'is_active', 'created_at'
    ]
    list_filter = ['type', 'block_type', 'ai_model', 'is_active', 'created_at']
    search_fields = ['name', 'description', 'prompt_text']
    readonly_fields = ['created_at', 'updated_at', 'usage_statistics']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'type', 'block_type')
        }),
        ('AI Configuration', {
            'fields': ('ai_model', 'temperature', 'max_tokens')
        }),
        ('Prompt Content', {
            'fields': ('prompt_text', 'system_prompt')
        }),
        ('Status & Statistics', {
            'fields': ('is_active', 'usage_statistics')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(
            _usage_count=Count('page_blocks', distinct=True)
        )
    
    def type_badge(self, obj):
        """Display type with colored badge"""
        colors = {
            'text': '#4CAF50',
            'image': '#2196F3'
        }
        return format_html(
            '<span style="background-color: {}; color: white; '
            'padding: 3px 8px; border-radius: 3px;">{}</span>',
            colors.get(obj.type, 'gray'),
            obj.get_type_display()
        )
    type_badge.short_description = 'Type'
    
    def ai_model_badge(self, obj):
        """Display AI model with icon"""
        icons = {
            'gpt-4': '🧠',
            'gpt-3.5-turbo': '💭',
            'claude-3': '🤖',
            'dall-e-3': '🎨',
        }
        icon = icons.get(obj.ai_model, '🔮')
        return format_html('{} {}', icon, obj.ai_model)
    ai_model_badge.short_description = 'AI Model'
    
    def usage_count(self, obj):
        """Display usage count"""
        count = obj._usage_count
        if count > 0:
            return format_html(
                '<strong style="color: green;">{}</strong> uses',
                count
            )
        return format_html('<span style="color: gray;">Not used</span>')
    usage_count.short_description = 'Usage'
    usage_count.admin_order_field = '_usage_count'
    
    def usage_statistics(self, obj):
        """Show detailed usage statistics"""
        if obj.pk:
            usage = obj.page_blocks.count()
            return format_html(
                '<div style="background: #f5f5f5; padding: 10px; border-radius: 5px;">'
                '<strong>Used in {} page blocks</strong>'
                '</div>',
                usage
            )
        return "Save to see statistics"
    usage_statistics.short_description = 'Usage Statistics'
