import random
import string
import re
from django.utils import timezone
from templates.services.uniqueness_service import template_uniqueness_service


class TemplateProcessor:
    """Process templates with variables and generate unique variations"""
    
    def __init__(self, site, page=None):
        self.site = site
        self.template = site.template
        self.footprint = site.template_footprint
        self.page = page
        self.uniqueness_service = template_uniqueness_service
    
    def generate_unique_class_prefix(self):
        """Generate unique CSS class prefix"""
        timestamp = int(timezone.now().timestamp())
        random_str = ''.join(random.choices(string.ascii_lowercase, k=6))
        return f"site-{self.site.id}-{timestamp}-{random_str}"
    
    def replace_variables(self, content):
        """Replace template variables with actual values"""
        variables = self.site.template_variables.copy()

        variables.update({
            'brand_name': self.site.brand_name,
            'domain': self.site.domain,
            'copyright_year': timezone.now().year,
            'language': self.site.language_code,
        })
        
        for var_name, var_value in variables.items():
            placeholder = f"{{{{{var_name}}}}}"
            content = content.replace(placeholder, str(var_value))
        
        return content
    
    def apply_custom_colors(self, css_content):
        """Apply custom color scheme to CSS"""
        if not self.site.custom_colors or not self.template.supports_color_customization:
            return css_content
        
        for color_name, color_value in self.site.custom_colors.items():
            css_var = f"--{color_name}"
            css_content = re.sub(
                rf"{css_var}:\s*#[0-9a-fA-F]{{6}};",
                f"{css_var}: {color_value};",
                css_content
            )
        
        return css_content
    
    def add_unique_classes(self, html_content):
        """Add unique class prefix to avoid conflicts using the uniqueness service"""
        # Get or generate class mappings for this site
        class_mappings = self.uniqueness_service.get_class_mappings_for_site(self.site.id)
        
        if not class_mappings:
            # Generate new mappings if none exist
            # This would typically be done during template processing
            return html_content
        
        # Apply class mappings to HTML
        return self.uniqueness_service.apply_class_mappings_to_html(html_content, class_mappings)
    
    def optimize_images(self, html_content):
        """Convert img tags to picture tags for page speed"""
        if not self.site.enable_page_speed or not self.template.supports_page_speed:
            return html_content
        
        def replace_img(match):
            img_tag = match.group(0)
            src_match = re.search(r'src="([^"]+)"', img_tag)
            alt_match = re.search(r'alt="([^"]*)"', img_tag)
            
            if src_match:
                src_url = src_match.group(1)
                alt_text = alt_match.group(1) if alt_match else ""
                
                mobile_size = random.randint(470, 490)
                desktop_size = random.randint(790, 810)
                
                return f'''
                <picture>
                    <source media="(max-width: 768px)" 
                            srcset="{src_url}?w={mobile_size}&format=webp" 
                            type="image/webp">
                    <source media="(min-width: 769px)" 
                            srcset="{src_url}?w={desktop_size}&format=webp" 
                            type="image/webp">
                    <img src="{src_url}" alt="{alt_text}" loading="lazy">
                </picture>
                '''
            return img_tag
        
        return re.sub(r'<img[^>]+>', replace_img, html_content)
    
    def generate_html(self):
        """Generate final HTML with all processing"""
        html = self.template.html_content
        
        # Step 1: Replace variables
        html = self.replace_variables(html)
        
        # Step 2: Add unique classes
        html = self.add_unique_classes(html)
        
        # Step 3: Optimize images
        html = self.optimize_images(html)
        
        return html
    
    def generate_css(self):
        """Generate CSS with custom colors and unique classes"""
        css = self.template.css_content
        
        # Apply custom colors
        css = self.apply_custom_colors(css)
        
        # Generate unique CSS classes
        if hasattr(self.site, 'custom_css_class_list') and self.site.custom_css_class_list:
            # Use custom class list if specified
            css, class_mappings = self.uniqueness_service.generate_unique_css_classes(
                css, 
                self.site.id, 
                self.site.custom_css_class_list
            )
        else:
            # Generate random unique classes
            css, class_mappings = self.uniqueness_service.generate_unique_css_classes(
                css, 
                self.site.id
            )
        
        return css
    
    def get_file_paths(self):
        """Get file paths based on footprint configuration"""
        if not self.footprint:
            return {
                'css': 'assets/css/style.css',
                'js': 'assets/js/script.js',
                'images': 'assets/images/'
            }
        
        return {
            'css': f"{self.footprint.css_path}/style.css",
            'js': f"{self.footprint.js_path}/script.js",
            'images': self.footprint.images_path
        }
