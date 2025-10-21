from django.contrib import admin
from django.utils.html import format_html
from nested_admin import NestedModelAdmin, NestedTabularInline, NestedStackedInline # type: ignore
from django_json_widget.widgets import JSONEditorWidget # type: ignore
from django.db import models
from .models import (
    Template,
    TemplateFootprint,
    TemplateVariable,
    TemplateSection,
    TemplateAsset
)


class TemplateVariableInline(NestedTabularInline):
    model = TemplateVariable
    extra = 1
    fields = ['name', 'variable_type', 'default_value', 'is_required', 'description']


class TemplateSectionInline(NestedStackedInline):
    model = TemplateSection
    extra = 0
    fields = [
        'name', 'section_type', 'order_index', 
        'is_required', 'is_customizable',
        'html_content', 'css_content'
    ]
    classes = ['collapse']


class TemplateFootprintInline(NestedStackedInline):
    model = TemplateFootprint
    extra = 0
    fields = [
        'name', 'cms_type',
        'theme_path', 'assets_path', 'images_path', 'css_path', 'js_path',
        'generate_php_files', 'php_files_config', 'path_variables'
    ]
    formfield_overrides = {
        models.JSONField: {'widget': JSONEditorWidget},
    }


class TemplateAssetInline(NestedTabularInline):
    model = TemplateAsset
    extra = 1
    fields = ['name', 'asset_type', 'file', 'file_path_variable', 'auto_generate_formats']


@admin.register(Template)
class TemplateAdmin(NestedModelAdmin):
    list_display = [
        'name', 'type', 'version', 'css_framework',
        'color_customization_badge', 'page_speed_badge',
        'footprint_count', 'site_count', 'created_at'
    ]
    list_filter = [
        'type', 'css_framework', 'supports_color_customization',
        'supports_page_speed', 'created_at'
    ]
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at', 'site_count_display']
    
    inlines = [
        TemplateVariableInline,
        TemplateSectionInline,
        TemplateFootprintInline,
        TemplateAssetInline
    ]
    
    formfield_overrides = {
        models.JSONField: {'widget': JSONEditorWidget},
    }
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'type', 'version')
        }),
        ('Template Structure', {
            'fields': ('html_content', 'css_content', 'js_content'),
            'description': 'Main template HTML, CSS, and JavaScript'
        }),
        ('Output Configuration', {
            'fields': ('css_output_type', 'js_output_type')
        }),
        ('Template Components (Sectional Only)', {
            'fields': ('menu_html', 'footer_menu_html', 'faq_block_html', 'available_blocks'),
            'classes': ('collapse',),
            'description': 'Components for sectional templates'
        }),
        ('Styling & Customization', {
            'fields': (
                'css_framework', 
                'supports_color_customization', 
                'color_variables'
            )
        }),
        ('Image & Performance', {
            'fields': ('supports_page_speed', 'logo_svg')
        }),
        ('Statistics', {
            'fields': ('site_count_display', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def color_customization_badge(self, obj):
        if obj.supports_color_customization:
            return format_html(
                '<span style="color: green;">✓ Yes</span>'
            )
        return format_html('<span style="color: gray;">✗ No</span>')
    color_customization_badge.short_description = 'Color Customization'
    
    def page_speed_badge(self, obj):
        if obj.supports_page_speed:
            return format_html(
                '<span style="color: green;">✓ Enabled</span>'
            )
        return format_html('<span style="color: gray;">✗ Disabled</span>')
    page_speed_badge.short_description = 'Page Speed Optimization'
    
    def footprint_count(self, obj):
        return obj.footprints.count()
    footprint_count.short_description = 'Footprints'
    
    def site_count(self, obj):
        return obj.sites.count()
    site_count.short_description = 'Sites Using'
    
    def site_count_display(self, obj):
        count = obj.sites.count()
        return format_html(
            '<strong>{}</strong> sites using this template',
            count
        )
    site_count_display.short_description = 'Sites Using This Template'


@admin.register(TemplateFootprint)
class TemplateFootprintAdmin(admin.ModelAdmin):
    list_display = ['name', 'template', 'cms_type', 'generate_php_files', 'created_at']
    list_filter = ['cms_type', 'generate_php_files', 'created_at']
    search_fields = ['name', 'template__name']
    readonly_fields = ['created_at', 'updated_at']
    
    formfield_overrides = {
        models.JSONField: {'widget': JSONEditorWidget},
    }
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('template', 'name', 'cms_type')
        }),
        ('Path Configuration', {
            'fields': (
                'theme_path', 'assets_path', 'images_path',
                'css_path', 'js_path'
            ),
            'description': 'Configure folder structure for this footprint'
        }),
        ('PHP Generation (WordPress-like CMS)', {
            'fields': ('generate_php_files', 'php_files_config'),
            'classes': ('collapse',)
        }),
        ('Variables', {
            'fields': ('path_variables',),
            'description': 'Dynamic variables for path customization'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TemplateVariable)
class TemplateVariableAdmin(admin.ModelAdmin):
    list_display = ['placeholder', 'template', 'variable_type', 'is_required']
    list_filter = ['variable_type', 'is_required', 'template']
    search_fields = ['name', 'description', 'template__name']


@admin.register(TemplateSection)
class TemplateSectionAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'template', 'section_type', 'order_index',
        'is_required', 'is_customizable'
    ]
    list_filter = ['section_type', 'is_required', 'is_customizable', 'template']
    search_fields = ['name', 'template__name']
    ordering = ['template', 'order_index']


@admin.register(TemplateAsset)
class TemplateAssetAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'template', 'asset_type', 
        'file_path_variable', 'auto_generate_formats', 'created_at'
    ]
    list_filter = ['asset_type', 'auto_generate_formats', 'created_at']
    search_fields = ['name', 'template__name']
    readonly_fields = ['created_at']
