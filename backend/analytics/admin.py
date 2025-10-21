from django.contrib import admin
from django.utils.html import format_html
from .models import Analytics

@admin.register(Analytics)
class AnalyticsAdmin(admin.ModelAdmin):
    list_display = [
        'site', 'date', 'visitors', 'pageviews',
        'bounce_rate_display', 'conversions',
        'revenue_display', 'traffic_source'
    ]
    list_filter = ['date', 'traffic_source', 'site']
    search_fields = ['site__domain', 'site__brand_name']
    readonly_fields = ['created_at', 'conversion_rate']
    date_hierarchy = 'date'
    
    fieldsets = (
        ('Site & Date', {
            'fields': ('site', 'date', 'traffic_source')
        }),
        ('Traffic Metrics', {
            'fields': ('visitors', 'pageviews', 'bounce_rate', 'avg_session_duration')
        }),
        ('Conversions & Revenue', {
            'fields': ('conversions', 'conversion_rate', 'revenue')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def bounce_rate_display(self, obj):
        """Display bounce rate with color coding"""
        if obj.bounce_rate:
            color = 'green' if obj.bounce_rate < 50 else 'orange' if obj.bounce_rate < 70 else 'red'
            return format_html(
                '<span style="color: {}; font-weight: bold;">{:.1f}%</span>',
                color,
                obj.bounce_rate
            )
        return '-'
    bounce_rate_display.short_description = 'Bounce Rate'
    
    def revenue_display(self, obj):
        """Display revenue with currency"""
        if obj.revenue:
            return format_html(
                '<span style="color: green; font-weight: bold;">${:.2f}</span>',
                obj.revenue
            )
        return '$0.00'
    revenue_display.short_description = 'Revenue'
