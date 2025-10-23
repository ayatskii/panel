from rest_framework import serializers
from .models import Site, Language, AffiliateLink
from templates.models import Template
from templates.serializers import TemplateFootprintSerializer

class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = ['id', 'code', 'name', 'is_active']


class AffiliateLinkListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for affiliate link lists"""
    site_count = serializers.IntegerField(read_only=True)
    swiper_preset_count = serializers.IntegerField(read_only=True)
    total_usage = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = AffiliateLink
        fields = [
            'id', 'name', 'click_tracking',
            'site_count', 'swiper_preset_count', 'total_usage',
            'created_at'
        ]


class AffiliateLinkSerializer(serializers.ModelSerializer):
    """Full affiliate link serializer"""
    site_count = serializers.IntegerField(read_only=True)
    swiper_preset_count = serializers.IntegerField(read_only=True)
    total_usage = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = AffiliateLink
        fields = [
            'id', 'name', 'url', 'description', 'click_tracking',
            'site_count', 'swiper_preset_count', 'total_usage',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_url(self, value):
        """Validate URL format"""
        from django.core.validators import URLValidator
        from django.core.exceptions import ValidationError as DjangoValidationError
        
        validator = URLValidator()
        try:
            validator(value)
        except DjangoValidationError:
            raise serializers.ValidationError("Invalid URL format")
        
        return value
    
    def validate_name(self, value):
        """Check name uniqueness"""
        if self.instance:
            if AffiliateLink.objects.exclude(pk=self.instance.pk).filter(name=value).exists():
                raise serializers.ValidationError(
                    "Affiliate link with this name already exists"
                )
        else:
            if AffiliateLink.objects.filter(name=value).exists():
                raise serializers.ValidationError(
                    "Affiliate link with this name already exists"
                )
        
        return value


class SiteSerializer(serializers.ModelSerializer):
    """Full site serializer with template configuration"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    template_type = serializers.CharField(source='template.type', read_only=True)
    template_type_display = serializers.CharField(
        source='template.get_type_display',
        read_only=True
    )
    footprint_details = TemplateFootprintSerializer(
        source='template_footprint',
        read_only=True
    )
    is_deployed = serializers.BooleanField(read_only=True)
    supports_color_customization = serializers.BooleanField(
        source='template.supports_color_customization',
        read_only=True
    )
    supports_page_speed = serializers.BooleanField(
        source='template.supports_page_speed',
        read_only=True
    )
    
    class Meta:
        model = Site
        fields = [
            'id', 'user', 'user_username', 'domain', 'brand_name',
            'language_code', 
            'template', 'template_name', 'template_type', 'template_type_display',
            'template_footprint', 'footprint_details',
            'template_variables', 'custom_colors', 
            'unique_class_prefix', 'enable_page_speed',
            'supports_color_customization', 'supports_page_speed',
            'cloudflare_token', 'affiliate_link', 
            'favicon_media', 'logo_media',
            'allow_indexing', 'redirect_404_to_home',
            'use_www_version', 'custom_css_class',
            'created_at', 'updated_at', 'deployed_at', 'is_deployed'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at', 'deployed_at']
    
    def validate_domain(self, value):
        """Validate domain format"""
        import re
        domain_pattern = r'^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$'
        if not re.match(domain_pattern, value):
            raise serializers.ValidationError("Invalid domain format")
        return value
    
    def validate_template_footprint(self, value):
        """Ensure footprint belongs to selected template"""
        if not value:
            return value
        
        template = self.initial_data.get('template')
        if self.instance:
            template = self.instance.template
        elif template:
            try:
                template = Template.objects.get(id=template)
            except Template.DoesNotExist:
                raise serializers.ValidationError("Invalid template")
        
        if value and template and value.template != template:
            raise serializers.ValidationError(
                f"Footprint '{value.name}' does not belong to template '{template.name}'"
            )
        
        return value
    
    def validate_template_variables(self, value):
        """Ensure all required template variables are provided"""
        template = None
        
        if self.instance:
            template = self.instance.template
        else:
            template_id = self.initial_data.get('template')
            if template_id:
                try:
                    template = Template.objects.get(id=template_id)
                except Template.DoesNotExist:
                    pass
        
        if template:
            required_vars = template.variables.filter(is_required=True)
            missing_vars = []
            
            for var in required_vars:
                if var.name not in value and not var.default_value:
                    missing_vars.append(var.name)
            
            if missing_vars:
                raise serializers.ValidationError(
                    f"Missing required template variables: {', '.join(missing_vars)}"
                )
        
        return value
    
    def validate_custom_colors(self, value):
        """Validate custom colors if template supports it"""
        template = None
        
        if self.instance:
            template = self.instance.template
        else:
            template_id = self.initial_data.get('template')
            if template_id:
                try:
                    template = Template.objects.get(id=template_id)
                except Template.DoesNotExist:
                    pass
        
        if template and not template.supports_color_customization and value:
            raise serializers.ValidationError(
                "This template does not support color customization"
            )
        
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        template = data.get('template', self.instance.template if self.instance else None)
        if template and template.is_monolithic:
            if not data.get('template_footprint') and not (
                self.instance and self.instance.template_footprint
            ):
                raise serializers.ValidationError({
                    'template_footprint': 'Footprint is required for monolithic templates'
                })
        
        return data


class SiteListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    template_name = serializers.CharField(source='template.name', read_only=True)
    template_type = serializers.CharField(source='template.type', read_only=True)
    page_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Site
        fields = [
            'id', 'domain', 'brand_name', 'template_name', 
            'template_type', 'deployed_at', 'page_count'
        ]


class SiteCreateSerializer(serializers.ModelSerializer):
    """Serializer for site creation with template setup wizard"""
    
    class Meta:
        model = Site
        fields = [
            'domain', 'brand_name', 'language_code',
            'template', 'template_footprint', 'template_variables',
            'custom_colors', 'enable_page_speed',
            'cloudflare_token', 'affiliate_link',
            'allow_indexing', 'redirect_404_to_home', 'use_www_version'
        ]
    
    def create(self, validated_data):
        """Create site with user from context"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
