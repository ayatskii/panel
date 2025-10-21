from django.db import models
from django.core.validators import FileExtensionValidator

class Template(models.Model):
    TYPE_CHOICES = [
        ('monolithic', 'Monolithic - Fixed Structure'),
        ('sectional', 'Sectional - Modular Components'),
    ]

    CSS_OUTPUT_CHOICES = [
        ('inline', 'Inline within <style> tags'),
        ('external', 'External stylesheet reference'),
        ('async', 'Async loading'),
        ('path_only', 'Path-only reference'),
    ]
    
    JS_OUTPUT_CHOICES = [
        ('inline', 'Inline script'),
        ('external', 'External file reference'),
        ('defer', 'Defer loading'),
        ('async', 'Async loading'),
        ('path_only', 'Path-only reference'),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    type = models.CharField(
        max_length=20,
        choices = TYPE_CHOICES,
        default='sectional',
        help_text='Monolithic: fixed structure, Sectional: customizable modules'
    )

    version = models.CharField(max_length=20, default='1.0.0')
    html_content = models.TextField(
        help_text='Main HTML structure with variable placeholders'
    )
    css_content = models.TextField(
        help_text='CSS styling for the template'
    )
    js_content = models.TextField(
        blank=True,
        help_text='JavaScript functionality'
    )
    css_output_type = models.CharField(
        max_length=20,
        choices=CSS_OUTPUT_CHOICES,
        default='external'
    )
    js_output_type = models.CharField(
        max_length=20,
        choices=JS_OUTPUT_CHOICES,
        default='defer'
    )
    menu_html = models.TextField(
        blank=True,
        help_text='Navigation menu structure with sample menu items'
    )
    footer_menu_html = models.TextField(
        blank=True,
        help_text='Footer navigation structure'
    )
    faq_block_html = models.TextField(
        blank=True,
        help_text='FAQ section template'
    )
    available_blocks = models.JSONField(
        default=list,
        help_text='List of available block types: hero, article, cta, etc.'
    )
    css_framework = models.CharField(
        max_length=100,
        default='custom',
        choices=[
            ('tailwind', 'Tailwind CSS'),
            ('bootstrap', 'Bootstrap'),
            ('custom', 'Custom CSS'),
        ]
    )
    supports_color_customization = models.BooleanField(
        default=True,
        help_text='Allow color scheme customization'
    )
    color_variables = models.JSONField(
        default=dict,
        help_text='CSS color variables: primary, secondary, accent, etc.'
    )
    supports_page_speed = models.BooleanField(
        default=True,
        help_text='Convert img tags to picture tags with WebP'
    )
    logo_svg = models.FileField(
        upload_to='templates/logos/',
        validators=[FileExtensionValidator(['svg'])],
        blank=True,
        help_text='Template logo in SVG format'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'templates'
        verbose_name = 'Template'
        verbose_name_plural = 'Templates'
        indexes = [
            models.Index(fields=['type']),
            models.Index(fields=['name']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"
    
    @property
    def is_monolithic(self):
        return self.type == 'monolithic'
    
    @property
    def is_sectional(self):
        return self.type == 'sectional'
    
class TemplateFootprint(models.Model):
    CMS_CHOICES = [
        ('wordpress', 'WordPress'),
        ('joomla', 'Joomla'),
        ('drupal', 'Drupal'),
        ('custom', 'Custom CMS'),
        ('none', 'No CMS (Static)'),
    ]
    
    template = models.ForeignKey(
        Template,
        on_delete=models.CASCADE,
        related_name='footprints'
    )
    name = models.CharField(max_length=255)
    cms_type = models.CharField(max_length=50, choices=CMS_CHOICES)
    theme_path = models.CharField(
        max_length=255,
        default='wp-content/themes/{{theme_name}}',
        help_text='Template path structure with variables'
    )
    assets_path = models.CharField(
        max_length=255,
        default='assets',
        help_text='Assets folder path relative to theme'
    )
    images_path = models.CharField(
        max_length=255,
        default='assets/images',
        help_text='Images folder path'
    )
    css_path = models.CharField(
        max_length=255,
        default='assets/css',
        help_text='CSS files path'
    )
    js_path = models.CharField(
        max_length=255,
        default='assets/js',
        help_text='JavaScript files path'
    )
    generate_php_files = models.BooleanField(
        default=False,
        help_text='Generate PHP files like wp-login.php, wp-footer.php'
    )
    php_files_config = models.JSONField(
        default=dict,
        help_text='PHP files to generate: {filename: template_content}'
    )
    
    path_variables = models.JSONField(
        default=dict,
        help_text='Variables for path customization: theme_name, domain, etc.'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'template_footprints'
        verbose_name = 'Template Footprint'
        verbose_name_plural = 'Template Footprints'
        unique_together = ['template', 'name']
    
    def __str__(self):
        return f"{self.template.name} - {self.name} ({self.cms_type})"
    
class TemplateVariable(models.Model):    
    VARIABLE_TYPE_CHOICES = [
        ('meta', 'Meta Information'),
        ('brand', 'Brand Information'),
        ('content', 'Content Area'),
        ('style', 'Styling Variable'),
        ('script', 'Script Variable'),
    ]
    
    template = models.ForeignKey(
        Template,
        on_delete=models.CASCADE,
        related_name='variables'
    )
    name = models.CharField(
        max_length=100,
        help_text='Variable name without brackets: title, brand_name, etc.'
    )
    variable_type = models.CharField(max_length=20, choices=VARIABLE_TYPE_CHOICES)
    default_value = models.TextField(
        blank=True,
        help_text='Default value if not provided'
    )
    description = models.TextField(
        blank=True,
        help_text='Description of variable usage'
    )
    is_required = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'template_variables'
        verbose_name = 'Template Variable'
        verbose_name_plural = 'Template Variables'
        unique_together = ['template', 'name']
    
    def __str__(self):
        return f"{self.template.name} - {{{{ {self.name} }}}}"
    
    @property
    def placeholder(self):
        return f"{{{{{self.name}}}}}"


class TemplateSection(models.Model):
    template = models.ForeignKey(
        Template,
        on_delete=models.CASCADE,
        related_name='sections'
    )
    name = models.CharField(max_length=255)
    section_type = models.CharField(
        max_length=50,
        choices=[
            ('header', 'Header'),
            ('menu', 'Menu'),
            ('hero', 'Hero Section'),
            ('content', 'Content Area'),
            ('sidebar', 'Sidebar'),
            ('footer', 'Footer'),
            ('footer_menu', 'Footer Menu'),
            ('custom', 'Custom Section'),
        ]
    )
    html_content = models.TextField(
        help_text='HTML structure for this section'
    )
    css_content = models.TextField(
        blank=True,
        help_text='CSS specific to this section'
    )
    order_index = models.IntegerField(default=0)
    is_required = models.BooleanField(
        default=False,
        help_text='Must be included in all sites using this template'
    )
    is_customizable = models.BooleanField(
        default=True,
        help_text='Can be modified by users'
    )
    
    class Meta:
        db_table = 'template_sections'
        verbose_name = 'Template Section'
        verbose_name_plural = 'Template Sections'
        ordering = ['order_index']
        unique_together = ['template', 'name']
    
    def __str__(self):
        return f"{self.template.name} - {self.name}"


class TemplateAsset(models.Model):    
    ASSET_TYPE_CHOICES = [
        ('logo', 'Logo (SVG)'),
        ('favicon', 'Favicon (SVG)'),
        ('image', 'Image'),
        ('font', 'Font File'),
        ('icon', 'Icon'),
    ]
    
    template = models.ForeignKey(
        Template,
        on_delete=models.CASCADE,
        related_name='assets'
    )
    name = models.CharField(max_length=255)
    asset_type = models.CharField(max_length=20, choices=ASSET_TYPE_CHOICES)
    file = models.FileField(upload_to='templates/assets/')
    file_path_variable = models.CharField(
        max_length=100,
        help_text='Variable name used in template: logo_url, favicon_url, etc.'
    )

    auto_generate_formats = models.BooleanField(
        default=False,
        help_text='Auto-generate PNG and ICO for SVG favicons'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'template_assets'
        verbose_name = 'Template Asset'
        verbose_name_plural = 'Template Assets'
    
    def __str__(self):
        return f"{self.template.name} - {self.name}"