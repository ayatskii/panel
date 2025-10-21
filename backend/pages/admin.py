from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count
from nested_admin import NestedModelAdmin, NestedTabularInline
from django_json_widget.widgets import JSONEditorWidget
from django.db import models
from .models import Page, PageBlock, SwiperPreset


class PageBlockInline(NestedTabularInline):
    """Inline for page blocks"""
    model = PageBlock
    extra = 1
    fields = ['block_type', 'order_index', 'prompt', 'content_data']
    formfield_overrides = {
        models.JSONField: {'widget': JSONEditorWidget},
    }
    ordering = ['order_index']


@admin.register(Page)
class PageAdmin(NestedModelAdmin):
    """Admin for pages with inline blocks"""
    list_display = [
        'full_path', 'site', 'title', 'block_count_display',
        'has_seo', 'created_at'
    ]
    list_filter = ['site', 'use_h1_in_hero', 'created_at']
    search_fields = ['slug', 'title', 'site__domain', 'site__brand_name']
    readonly_fields = ['created_at', 'updated_at', 'full_url', 'block_statistics']
    inlines = [PageBlockInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('site', 'slug', 'full_url')
        }),
        ('SEO Configuration', {
            'fields': (
                'title', 'meta_description', 'h1_tag',
                'use_h1_in_hero', 'canonical_url', 'custom_head_html'
            )
        }),
        ('Content Generation', {
            'fields': ('keywords', 'lsi_phrases'),
            'classes': ('collapse',)
        }),
        ('Statistics', {
            'fields': ('block_statistics',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Optimize with annotations"""
        qs = super().get_queryset(request)
        return qs.select_related('site').annotate(
            _block_count=Count('blocks', distinct=True)
        )
    
    def full_path(self, obj):
        """Display full page path"""
        return format_html(
            '<strong>{}</strong>/<span style="color: #2196F3;">{}</span>',
            obj.site.domain,
            obj.slug
        )
    full_path.short_description = 'Page Path'
    
    def block_count_display(self, obj):
        """Display block count with icon"""
        count = obj._block_count
        if count > 0:
            return format_html(
                '📦 <strong>{}</strong> blocks',
                count
            )
        return format_html('<span style="color: gray;">No blocks</span>')
    block_count_display.short_description = 'Blocks'
    block_count_display.admin_order_field = '_block_count'
    
    def has_seo(self, obj):
        """Check if page has SEO metadata"""
        has_title = bool(obj.title)
        has_desc = bool(obj.meta_description)
        has_h1 = bool(obj.h1_tag)
        
        seo_count = sum([has_title, has_desc, has_h1])
        
        if seo_count == 3:
            return format_html('<span style="color: green;">✓ Complete</span>')
        elif seo_count > 0:
            return format_html('<span style="color: orange;">⚠ Partial ({}/3)</span>', seo_count)
        else:
            return format_html('<span style="color: red;">✗ None</span>')
    has_seo.short_description = 'SEO Status'
    
    def block_statistics(self, obj):
        """Show block type statistics"""
        if obj.pk:
            from django.db.models import Count
            block_stats = obj.blocks.values('block_type').annotate(
                count=Count('id')
            ).order_by('-count')
            
            if block_stats:
                stats_html = '<table style="width: 100%; border-collapse: collapse;">'
                stats_html += '<tr><th style="text-align: left; padding: 5px; border-bottom: 1px solid #ddd;">Block Type</th>'
                stats_html += '<th style="text-align: right; padding: 5px; border-bottom: 1px solid #ddd;">Count</th></tr>'
                
                for stat in block_stats:
                    block_type = dict(PageBlock.BLOCK_TYPE_CHOICES)[stat['block_type']]
                    stats_html += f'<tr><td style="padding: 5px;">{block_type}</td>'
                    stats_html += f'<td style="text-align: right; padding: 5px;"><strong>{stat["count"]}</strong></td></tr>'
                
                stats_html += '</table>'
                return format_html(stats_html)
            else:
                return "No blocks yet"
        return "Save page to see statistics"
    block_statistics.short_description = 'Block Statistics'


@admin.register(PageBlock)
class PageBlockAdmin(admin.ModelAdmin):
    """Admin for individual page blocks"""
    list_display = [
        'block_display', 'page', 'block_type_badge',
        'order_index', 'has_prompt', 'updated_at'
    ]
    list_filter = ['block_type', 'page__site', 'created_at']
    search_fields = ['page__slug', 'page__site__domain']
    readonly_fields = ['created_at', 'updated_at', 'content_preview']
    ordering = ['page', 'order_index']
    
    formfield_overrides = {
        models.JSONField: {'widget': JSONEditorWidget},
    }
    
    fieldsets = (
        ('Block Information', {
            'fields': ('page', 'block_type', 'order_index')
        }),
        ('Content', {
            'fields': ('content_data', 'content_preview')
        }),
        ('AI Generation', {
            'fields': ('prompt',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def block_display(self, obj):
        """Display block with icon"""
        icons = {
            'hero': '🎯',
            'article': '📝',
            'image': '🖼️',
            'text_image': '📄',
            'cta': '🔔',
            'faq': '❓',
            'swiper': '🎮',
        }
        icon = icons.get(obj.block_type, '📦')
        return f"{icon} {obj.page.slug}"
    block_display.short_description = 'Block'
    
    def block_type_badge(self, obj):
        """Display block type with colored badge"""
        colors = {
            'hero': '#FF6B6B',
            'article': '#4ECDC4',
            'image': '#45B7D1',
            'text_image': '#96CEB4',
            'cta': '#FFEAA7',
            'faq': '#DFE6E9',
            'swiper': '#A29BFE',
        }
        color = colors.get(obj.block_type, '#95A5A6')
        return format_html(
            '<span style="background-color: {}; color: white; '
            'padding: 3px 10px; border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color,
            obj.get_block_type_display()
        )
    block_type_badge.short_description = 'Type'
    
    def has_prompt(self, obj):
        """Check if block has AI prompt"""
        if obj.prompt:
            return format_html(
                '<span style="color: green;">✓ {}</span>',
                obj.prompt.name
            )
        return format_html('<span style="color: gray;">✗ Manual</span>')
    has_prompt.short_description = 'AI Prompt'
    
    def content_preview(self, obj):
        """Show content data preview"""
        import json
        if obj.content_data:
            formatted = json.dumps(obj.content_data, indent=2)
            return format_html(
                '<pre style="background: #f5f5f5; padding: 10px; '
                'border-radius: 5px; max-height: 300px; overflow: auto;">{}</pre>',
                formatted
            )
        return "No content data"
    content_preview.short_description = 'Content Preview'


@admin.register(SwiperPreset)
class SwiperPresetAdmin(admin.ModelAdmin):
    """Admin for swiper presets"""
    list_display = [
        'name', 'game_count_display', 'button_text',
        'affiliate_link', 'created_at'
    ]
    list_filter = ['created_at', 'affiliate_link']
    search_fields = ['name', 'button_text']
    readonly_fields = ['created_at', 'updated_at', 'game_preview']
    
    formfield_overrides = {
        models.JSONField: {'widget': JSONEditorWidget},
    }
    
    fieldsets = (
        ('Preset Information', {
            'fields': ('name', 'button_text', 'affiliate_link')
        }),
        ('Games Data', {
            'fields': ('games_data', 'game_preview')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def game_count_display(self, obj):
        """Display game count"""
        count = obj.game_count
        return format_html(
            '🎮 <strong>{}</strong> games',
            count
        )
    game_count_display.short_description = 'Games'
    
    def game_preview(self, obj):
        """Show games preview"""
        if obj.games_data and isinstance(obj.games_data, list):
            preview_html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px;">'
            
            for game in obj.games_data[:12]:  
                name = game.get('name', 'Unnamed')
                image = game.get('image', '')
                
                preview_html += f'''
                <div style="border: 1px solid #ddd; padding: 10px; border-radius: 5px; text-align: center;">
                    {f'<img src="{image}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 3px;" />' if image else ''}
                    <div style="margin-top: 5px; font-size: 12px; font-weight: bold;">{name}</div>
                </div>
                '''
            
            if len(obj.games_data) > 12:
                preview_html += f'<div style="padding: 20px; text-align: center; color: gray;">... and {len(obj.games_data) - 12} more games</div>'
            
            preview_html += '</div>'
            return format_html(preview_html)
        return "No games in preset"
    game_preview.short_description = 'Game Preview'
