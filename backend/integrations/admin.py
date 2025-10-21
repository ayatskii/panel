from django.contrib import admin
from django.utils.html import format_html
from .models import ApiToken, CloudflareToken

@admin.register(ApiToken)
class ApiTokenAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'service_badge', 'status_badge',
        'usage_count', 'last_used', 'created_at'
    ]
    list_filter = ['service', 'is_active', 'created_at']
    search_fields = ['name']
    readonly_fields = ['usage_count', 'last_used', 'created_at', 'updated_at', 'token_preview']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'service')
        }),
        ('Token', {
            'fields': ('token_value', 'token_preview'),
            'description': 'Token will be encrypted in production'
        }),
        ('Status & Usage', {
            'fields': ('is_active', 'usage_count', 'last_used')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def service_badge(self, obj):
        """Display service with icon"""
        icons = {
            'chatgpt': '🤖',
            'grok': '🚀',
            'claude': '🧠',
            'cloudflare': '☁️',
            'elevenlabs': '🎙️',
            'dalle': '🎨',
            'midjourney': '🖼️',
        }
        icon = icons.get(obj.service, '🔑')
        return format_html(
            '{} <strong>{}</strong>',
            icon,
            obj.get_service_display()
        )
    service_badge.short_description = 'Service'
    
    def status_badge(self, obj):
        """Display active status"""
        if obj.is_active:
            return format_html(
                '<span style="color: green; font-weight: bold;">● Active</span>'
            )
        return format_html(
            '<span style="color: red;">○ Inactive</span>'
        )
    status_badge.short_description = 'Status'
    
    def token_preview(self, obj):
        """Show masked token"""
        if obj.token_value:
            token = obj.token_value
            if len(token) > 10:
                masked = f"{token[:6]}{'*' * (len(token) - 12)}{token[-6:]}"
            else:
                masked = '*' * len(token)
            return format_html(
                '<code style="background: #f5f5f5; padding: 5px; border-radius: 3px;">{}</code>',
                masked
            )
        return "No token"
    token_preview.short_description = 'Token Preview'


@admin.register(CloudflareToken)
class CloudflareTokenAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'api_token', 'account_id',
        'zone_id', 'pages_project_name', 'created_at'
    ]
    list_filter = ['created_at']
    search_fields = ['name', 'account_id', 'zone_id']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('api_token', 'name')
        }),
        ('Cloudflare Configuration', {
            'fields': ('account_id', 'zone_id', 'pages_project_name')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

