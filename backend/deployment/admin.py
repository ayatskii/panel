from django.contrib import admin
from django.utils.html import format_html
from django_json_widget.widgets import JSONEditorWidget #type:ignore
from django.db import models
from .models import Deployment

@admin.register(Deployment)
class DeploymentAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'site', 'status_badge',
        'template_info', 'duration_display',
        'file_count', 'created_at'
    ]
    list_filter = ['status', 'created_at', 'site__template']
    search_fields = ['site__domain', 'site__brand_name', 'git_commit_hash']
    readonly_fields = [
        'status', 'git_commit_hash', 'build_log', 'deployed_url',
        'build_time_seconds', 'file_count', 'total_size_bytes',
        'template_snapshot', 'generated_files', 'unique_identifiers',
        'created_at', 'completed_at', 'deployment_details'
    ]
    
    formfield_overrides = {
        models.JSONField: {'widget': JSONEditorWidget},
    }
    
    fieldsets = (
        ('Deployment Information', {
            'fields': ('site', 'cloudflare_token', 'status')
        }),
        ('Build Details', {
            'fields': (
                'git_commit_hash', 'deployed_url',
                'build_time_seconds', 'file_count', 'total_size_bytes'
            )
        }),
        ('Template Configuration', {
            'fields': ('template_snapshot', 'deployment_details'),
            'classes': ('collapse',)
        }),
        ('Generated Files', {
            'fields': ('generated_files', 'unique_identifiers'),
            'classes': ('collapse',)
        }),
        ('Build Log', {
            'fields': ('build_log',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )
    
    def status_badge(self, obj):
        """Display status with color badge"""
        colors = {
            'pending': 'gray',
            'building': 'blue',
            'success': 'green',
            'failed': 'red'
        }
        return format_html(
            '<span style="background-color: {}; color: white; '
            'padding: 3px 8px; border-radius: 3px; font-weight: bold;">{}</span>',
            colors.get(obj.status, 'gray'),
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def template_info(self, obj):
        """Display template information"""
        template = obj.template_snapshot.get('template', {})
        footprint = obj.template_snapshot.get('footprint', {})
        
        if template:
            return format_html(
                '<strong>{}</strong> ({})<br/>'
                '<span style="color: gray; font-size: 11px;">Footprint: {}</span>',
                template.get('name', 'Unknown'),
                template.get('type', 'Unknown'),
                footprint.get('name', 'None') if footprint else 'None'
            )
        return '-'
    template_info.short_description = 'Template'
    
    def duration_display(self, obj):
        """Display deployment duration"""
        if obj.duration:
            minutes = int(obj.duration // 60)
            seconds = int(obj.duration % 60)
            return f"{minutes}m {seconds}s"
        return '-'
    duration_display.short_description = 'Duration'
    
    def deployment_details(self, obj):
        """Show detailed deployment configuration"""
        if obj.template_snapshot:
            snapshot = obj.template_snapshot
            template = snapshot.get('template', {})
            footprint = snapshot.get('footprint', {})
            variables = snapshot.get('variables', {})
            colors = snapshot.get('colors', {})
            settings = snapshot.get('settings', {})
            
            html = f"""
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
                <h3 style="margin-top: 0;">Template Configuration</h3>
                
                <strong>Template:</strong> {template.get('name')} (v{template.get('version')})<br/>
                <strong>Type:</strong> {template.get('type')}<br/>
                
                {f'<br/><strong>Footprint:</strong> {footprint.get("name")} ({footprint.get("cms_type")})<br/>' if footprint else ''}
                
                <br/><strong>Variables ({len(variables)}):</strong><br/>
                {', '.join(variables.keys()) if variables else 'None'}<br/>
                
                <br/><strong>Custom Colors ({len(colors)}):</strong><br/>
                {', '.join(colors.keys()) if colors else 'None'}<br/>
                
                <br/><strong>Settings:</strong><br/>
                - Page Speed: {settings.get('enable_page_speed', False)}<br/>
                - Unique Class: {settings.get('unique_class_prefix', 'Not set')}<br/>
                
                <br/><strong>Files Generated:</strong> {len(obj.generated_files)}<br/>
                <strong>Total Size:</strong> {obj.total_size_bytes / 1024:.2f} KB
            </div>
            """
            return format_html(html)
        return "No snapshot available"
    deployment_details.short_description = 'Configuration Details'
