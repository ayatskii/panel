import random
import string
import re
from django.utils import timezone


class TemplateProcessor:
    """Process templates with variables and generate unique variations"""
    
    def __init__(self, site):
        self.site = site
        self.template = site.template
        self.footprint = site.template_footprint
    
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
        """Add unique class prefix to avoid conflicts"""
        unique_prefix = self.site.unique_class_prefix
        
        if not unique_prefix:
            unique_prefix = self.generate_unique_class_prefix()
            self.site.unique_class_prefix = unique_prefix
            self.site.save()
        
        html_content = re.sub(
            r'class="([^"]+)"',
            lambda m: f'class="{unique_prefix}-{m.group(1)}"',
            html_content
        )
        
        return html_content
    
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
        """Generate CSS with custom colors"""
        css = self.template.css_content
        
        # Apply custom colors
        css = self.apply_custom_colors(css)
        
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
