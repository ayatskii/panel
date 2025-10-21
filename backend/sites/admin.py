from django.contrib import admin
from django.utils.html import format_html
from django_json_widget.widgets import JSONEditorWidget  # type: ignore
from django.db import models
from .models import Site, Language, AffiliateLink

@admin.register(Language)
class LanguageAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'is_active']
    list_filter = ['is_active']
    search_fields = ['code', 'name']


@admin.register(AffiliateLink)
class AffiliateLinkAdmin(admin.ModelAdmin):
    list_display = ['name', 'url', 'click_tracking', 'created_at']
    list_filter = ['click_tracking', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Site)
class SiteAdmin(admin.ModelAdmin):
    list_display = [
        'brand_name', 'domain', 'user', 
        'template_badge', 'footprint_badge',
        'deployment_status', 'created_at'
    ]
    list_filter = [
        'language_code', 'template', 'template__type',
        'allow_indexing', 'enable_page_speed',
        'deployed_at', 'created_at'
    ]
    search_fields = ['domain', 'brand_name', 'user__username']
    readonly_fields = [
        'created_at', 'updated_at', 'deployed_at',
        'unique_class_prefix', 'deployment_preview'
    ]
    
    formfield_overrides = {
        models.JSONField: {'widget': JSONEditorWidget},
    }
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'domain', 'brand_name', 'language_code')
        }),
        ('Template Configuration', {
            'fields': (
                'template', 'template_footprint',
                'template_variables', 'custom_colors'
            ),
            'description': 'Configure template, footprint, and customization'
        }),
        ('Template Settings', {
            'fields': (
                'unique_class_prefix', 'enable_page_speed'
            )
        }),
        ('Media Assets', {
            'fields': ('favicon_media', 'logo_media')
        }),
        ('External Integrations', {
            'fields': ('cloudflare_token', 'affiliate_link')
        }),
        ('Site Configuration', {
            'fields': (
                'allow_indexing', 'redirect_404_to_home',
                'use_www_version', 'custom_css_class'
            )
        }),
        ('Deployment', {
            'fields': ('deployment_preview', 'deployed_at'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def template_badge(self, obj):
        """Display template with type badge"""
        if obj.template:
            type_color = 'blue' if obj.template.is_monolithic else 'green'
            return format_html(
                '<strong>{}</strong><br/>'
                '<span style="background-color: {}; color: white; '
                'padding: 2px 6px; border-radius: 3px; font-size: 11px;">{}</span>',
                obj.template.name,
                type_color,
                obj.template.get_type_display()
            )
        return '-'
    template_badge.short_description = 'Template'
    
    def footprint_badge(self, obj):
        """Display footprint badge"""
        if obj.template_footprint:
            return format_html(
                '{}<br/>'
                '<span style="color: gray; font-size: 11px;">{}</span>',
                obj.template_footprint.name,
                obj.template_footprint.get_cms_type_display()
            )
        return format_html('<span style="color: gray;">Not set</span>')
    footprint_badge.short_description = 'Footprint'
    
    def deployment_status(self, obj):
        """Display deployment status"""
        if obj.deployed_at:
            return format_html(
                '<span style="color: green;">✓ Deployed</span><br/>'
                '<span style="color: gray; font-size: 11px;">{}</span>',
                obj.deployed_at.strftime('%Y-%m-%d %H:%M')
            )
        return format_html('<span style="color: orange;">Not deployed</span>')
    deployment_status.short_description = 'Status'
    
    def deployment_preview(self, obj):
        """Show deployment configuration preview"""
        if obj.pk:
            preview_html = f"""
            <div style="background: #f5f5f5; padding: 10px; border-radius: 5px;">
                <strong>Template Variables ({len(obj.template_variables)}):</strong><br/>
                {', '.join(obj.template_variables.keys()) if obj.template_variables else 'None'}
                <br/><br/>
                <strong>Custom Colors ({len(obj.custom_colors)}):</strong><br/>
                {', '.join(obj.custom_colors.keys()) if obj.custom_colors else 'None'}
                <br/><br/>
                <strong>Unique Class Prefix:</strong> {obj.unique_class_prefix or 'Will be generated'}
                <br/><br/>
                <strong>Page Speed Optimization:</strong> {'Enabled' if obj.enable_page_speed else 'Disabled'}
            </div>
            """
            return format_html(preview_html)
        return "Save to see preview"
    deployment_preview.short_description = 'Deployment Configuration'
