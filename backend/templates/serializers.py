from rest_framework import serializers
from .models import TemplateAsset, TemplateVariable, TemplateFootprint, Template, TemplateSection

class TemplateVariableSerializer(serializers.ModelSerializer):
    placeholder = serializers.CharField(read_only=True)
    
    class Meta:
        model = TemplateVariable
        fields = [
            'id', 'template', 'name', 'variable_type', 'default_value',
            'description', 'is_required', 'placeholder'
        ]

class TemplateSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateSection
        fields = [
            'id', 'template', 'name', 'section_type', 'html_content',
            'css_content', 'order_index', 'is_required', 'is_customizable'
        ]


class TemplateFootprintSerializer(serializers.ModelSerializer):
    cms_type_display = serializers.CharField(
        source='get_cms_type_display',
        read_only=True
    )
    
    class Meta:
        model = TemplateFootprint
        fields = [
            'id', 'template', 'name', 'cms_type', 'cms_type_display',
            'theme_path', 'assets_path', 'images_path', 'css_path',
            'js_path', 'generate_php_files', 'php_files_config',
            'path_variables', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class TemplateAssetSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = TemplateAsset
        fields = [
            'id', 'template', 'name', 'asset_type', 'file', 'file_url',
            'file_path_variable', 'auto_generate_formats', 'created_at'
        ]
        read_only_fields = ['created_at']
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class TemplateSerializer(serializers.ModelSerializer):
    variables = TemplateVariableSerializer(many=True, read_only=True)
    sections = TemplateSectionSerializer(many=True, read_only=True)
    footprints = TemplateFootprintSerializer(many=True, read_only=True)
    assets = TemplateAssetSerializer(many=True, read_only=True)
    
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    css_output_type_display = serializers.CharField(
        source='get_css_output_type_display',
        read_only=True
    )
    js_output_type_display = serializers.CharField(
        source='get_js_output_type_display',
        read_only=True
    )
    
    site_count = serializers.IntegerField(read_only=True)
    is_monolithic = serializers.BooleanField(read_only=True)
    is_sectional = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Template
        fields = [
            'id', 'name', 'description', 'type', 'type_display',
            'version', 'html_content', 'css_content', 'js_content',
            'css_output_type', 'css_output_type_display',
            'js_output_type', 'js_output_type_display',
            'menu_html', 'footer_menu_html', 'faq_block_html',
            'available_blocks', 'css_framework', 'supports_color_customization',
            'color_variables', 'supports_page_speed', 'logo_svg',
            'variables', 'sections', 'footprints', 'assets',
            'site_count', 'is_monolithic', 'is_sectional',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_available_blocks(self, value):
        valid_blocks = ['hero', 'article', 'image', 'text_image', 
                       'cta', 'faq', 'swiper']
        for block in value:
            if block not in valid_blocks:
                raise serializers.ValidationError(
                    f"Invalid block type: {block}. Valid types: {', '.join(valid_blocks)}"
                )
        return value
    
    def validate(self, data):
        template_type = data.get('type', self.instance.type if self.instance else None)
        
        if template_type == 'monolithic':
            if not data.get('html_content', self.instance.html_content if self.instance else None):
                raise serializers.ValidationError({
                    'html_content': 'Monolithic templates require complete HTML structure'
                })
            if data.get('available_blocks'):
                raise serializers.ValidationError({
                    'available_blocks': 'Monolithic templates have fixed structure and cannot have modular blocks'
                })
        
        elif template_type == 'sectional':
            if not data.get('available_blocks', self.instance.available_blocks if self.instance else None):
                raise serializers.ValidationError({
                    'available_blocks': 'Sectional templates must define available block types'
                })
        
        return data


class TemplateListSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    footprint_count = serializers.IntegerField(read_only=True)
    section_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Template
        fields = [
            'id', 'name', 'type', 'type_display', 'version',
            'css_framework', 'supports_color_customization',
            'supports_page_speed', 'footprint_count', 'section_count',
            'created_at'
        ]


class TemplatePreviewSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    available_footprints = serializers.SerializerMethodField()
    
    class Meta:
        model = Template
        fields = [
            'id', 'name', 'description', 'type', 'type_display',
            'css_framework', 'available_blocks', 'available_footprints'
        ]
    
    def get_available_footprints(self, obj):
        return obj.footprints.values('id', 'name', 'cms_type')