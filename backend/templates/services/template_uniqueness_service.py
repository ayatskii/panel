import logging
import re
import random
import string
from typing import Dict, Any, List, Optional, Tuple
from django.conf import settings
from ..models import Template
from sites.models import Site

logger = logging.getLogger(__name__)


class TemplateUniquenessService:
    """Service for generating unique CSS classes and styles for templates"""
    
    # Predefined class name patterns for different element types
    CLASS_PATTERNS = {
        'button': ['btn', 'button', 'cta', 'action'],
        'container': ['container', 'wrapper', 'box', 'section'],
        'header': ['header', 'head', 'top', 'nav'],
        'footer': ['footer', 'foot', 'bottom'],
        'content': ['content', 'main', 'body', 'text'],
        'sidebar': ['sidebar', 'side', 'aside'],
        'card': ['card', 'item', 'block', 'panel'],
        'form': ['form', 'input', 'field', 'control'],
        'navigation': ['nav', 'menu', 'links', 'tabs'],
        'image': ['img', 'image', 'photo', 'picture'],
        'title': ['title', 'heading', 'h1', 'h2', 'h3'],
        'text': ['text', 'paragraph', 'p', 'description'],
        'list': ['list', 'ul', 'ol', 'items'],
        'link': ['link', 'a', 'anchor', 'url'],
        'div': ['div', 'block', 'element', 'wrapper'],
        'span': ['span', 'inline', 'text', 'label'],
    }
    
    # CSS property patterns for randomization
    CSS_PROPERTIES = {
        'color': ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'],
        'background': ['#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd', '#6c757d', '#495057', '#343a40'],
        'border': ['1px solid #dee2e6', '2px solid #007bff', '1px dashed #6c757d', '3px solid #28a745'],
        'border_radius': ['4px', '8px', '12px', '16px', '20px', '50%'],
        'padding': ['8px', '12px', '16px', '20px', '24px', '32px'],
        'margin': ['4px', '8px', '12px', '16px', '20px', '24px'],
        'font_size': ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'],
        'font_weight': ['300', '400', '500', '600', '700', '800'],
        'text_align': ['left', 'center', 'right', 'justify'],
        'display': ['block', 'inline-block', 'flex', 'grid', 'inline-flex'],
        'position': ['static', 'relative', 'absolute', 'fixed', 'sticky'],
    }
    
    def __init__(self):
        self.generated_classes = set()
        self.generated_styles = {}
    
    def generate_unique_template(self, template: Template, site: Site) -> Dict[str, Any]:
        """
        Generate unique CSS classes and styles for a template
        
        Args:
            template: Template object to make unique
            site: Site object for context
            
        Returns:
            Dict containing unique template data
        """
        try:
            # Reset state for new generation
            self.generated_classes = set()
            self.generated_styles = {}
            
            # Generate unique class names
            unique_classes = self._generate_unique_classes(template)
            
            # Generate unique styles
            unique_styles = self._generate_unique_styles(template, unique_classes)
            
            # Process template content
            processed_content = self._process_template_content(
                template.content, 
                unique_classes, 
                unique_styles
            )
            
            # Generate custom CSS
            custom_css = self._generate_custom_css(unique_styles)
            
            return {
                'success': True,
                'template_id': template.id,
                'site_id': site.id,
                'unique_classes': unique_classes,
                'unique_styles': unique_styles,
                'processed_content': processed_content,
                'custom_css': custom_css,
                'total_classes': len(unique_classes),
                'total_styles': len(unique_styles)
            }
            
        except Exception as e:
            logger.error(f"Failed to generate unique template: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _generate_unique_classes(self, template: Template) -> Dict[str, str]:
        """Generate unique class names for template elements"""
        unique_classes = {}
        
        # Extract existing classes from template content
        existing_classes = self._extract_existing_classes(template.content)
        
        for original_class in existing_classes:
            # Generate unique class name
            unique_class = self._generate_unique_class_name(original_class)
            unique_classes[original_class] = unique_class
        
        return unique_classes
    
    def _extract_existing_classes(self, content: str) -> List[str]:
        """Extract all CSS classes from template content"""
        # Pattern to match class attributes
        class_pattern = r'class\s*=\s*["\']([^"\']+)["\']'
        classes = re.findall(class_pattern, content, re.IGNORECASE)
        
        # Split multiple classes and flatten
        all_classes = []
        for class_string in classes:
            all_classes.extend(class_string.split())
        
        return list(set(all_classes))  # Remove duplicates
    
    def _generate_unique_class_name(self, original_class: str) -> str:
        """Generate a unique class name based on original class"""
        # Determine element type based on class name
        element_type = self._determine_element_type(original_class)
        
        # Generate base name
        base_name = self._generate_base_name(element_type)
        
        # Add uniqueness suffix
        unique_suffix = self._generate_unique_suffix()
        
        # Combine to create unique class name
        unique_class = f"_{base_name}_{unique_suffix}"
        
        # Ensure uniqueness
        counter = 1
        while unique_class in self.generated_classes:
            unique_class = f"_{base_name}_{unique_suffix}_{counter}"
            counter += 1
        
        self.generated_classes.add(unique_class)
        return unique_class
    
    def _determine_element_type(self, class_name: str) -> str:
        """Determine element type based on class name"""
        class_name_lower = class_name.lower()
        
        for element_type, patterns in self.CLASS_PATTERNS.items():
            for pattern in patterns:
                if pattern in class_name_lower:
                    return element_type
        
        return 'div'  # Default fallback
    
    def _generate_base_name(self, element_type: str) -> str:
        """Generate base name for element type"""
        patterns = self.CLASS_PATTERNS.get(element_type, ['element'])
        return random.choice(patterns)
    
    def _generate_unique_suffix(self) -> str:
        """Generate unique suffix for class name"""
        # Generate random string of letters and numbers
        length = random.randint(4, 8)
        characters = string.ascii_lowercase + string.digits
        return ''.join(random.choice(characters) for _ in range(length))
    
    def _generate_unique_styles(self, template: Template, unique_classes: Dict[str, str]) -> Dict[str, Dict[str, str]]:
        """Generate unique styles for template elements"""
        unique_styles = {}
        
        # Extract existing styles from template content
        existing_styles = self._extract_existing_styles(template.content)
        
        for class_name, unique_class in unique_classes.items():
            # Generate unique styles for this class
            styles = self._generate_styles_for_class(class_name, existing_styles.get(class_name, {}))
            unique_styles[unique_class] = styles
        
        return unique_styles
    
    def _extract_existing_styles(self, content: str) -> Dict[str, Dict[str, str]]:
        """Extract existing inline styles from template content"""
        styles = {}
        
        # Pattern to match style attributes
        style_pattern = r'style\s*=\s*["\']([^"\']+)["\']'
        style_matches = re.findall(style_pattern, content, re.IGNORECASE)
        
        # Parse styles (simplified - in production you might want more robust parsing)
        for style_string in style_matches:
            # This is a simplified parser - in production you'd want more robust CSS parsing
            pass
        
        return styles
    
    def _generate_styles_for_class(self, original_class: str, existing_styles: Dict[str, str]) -> Dict[str, str]:
        """Generate unique styles for a specific class"""
        styles = {}
        
        # Determine element type
        element_type = self._determine_element_type(original_class)
        
        # Generate random styles based on element type
        if element_type in ['button', 'cta']:
            styles.update(self._generate_button_styles())
        elif element_type in ['container', 'wrapper']:
            styles.update(self._generate_container_styles())
        elif element_type in ['header', 'footer']:
            styles.update(self._generate_header_footer_styles())
        elif element_type in ['card', 'panel']:
            styles.update(self._generate_card_styles())
        elif element_type in ['form', 'input']:
            styles.update(self._generate_form_styles())
        else:
            styles.update(self._generate_default_styles())
        
        # Merge with existing styles
        styles.update(existing_styles)
        
        return styles
    
    def _generate_button_styles(self) -> Dict[str, str]:
        """Generate styles for button elements"""
        return {
            'background-color': random.choice(self.CSS_PROPERTIES['color']),
            'color': '#ffffff',
            'border': random.choice(self.CSS_PROPERTIES['border']),
            'border-radius': random.choice(self.CSS_PROPERTIES['border_radius']),
            'padding': random.choice(self.CSS_PROPERTIES['padding']),
            'font-weight': random.choice(self.CSS_PROPERTIES['font_weight']),
            'text-align': 'center',
            'display': 'inline-block',
            'cursor': 'pointer',
            'transition': 'all 0.3s ease',
        }
    
    def _generate_container_styles(self) -> Dict[str, str]:
        """Generate styles for container elements"""
        return {
            'background-color': random.choice(self.CSS_PROPERTIES['background']),
            'padding': random.choice(self.CSS_PROPERTIES['padding']),
            'margin': random.choice(self.CSS_PROPERTIES['margin']),
            'border-radius': random.choice(self.CSS_PROPERTIES['border_radius']),
            'display': random.choice(['block', 'flex', 'grid']),
        }
    
    def _generate_header_footer_styles(self) -> Dict[str, str]:
        """Generate styles for header/footer elements"""
        return {
            'background-color': random.choice(self.CSS_PROPERTIES['background']),
            'padding': random.choice(self.CSS_PROPERTIES['padding']),
            'text-align': random.choice(self.CSS_PROPERTIES['text_align']),
            'border-bottom' if 'header' in str(self) else 'border-top': '1px solid #dee2e6',
        }
    
    def _generate_card_styles(self) -> Dict[str, str]:
        """Generate styles for card elements"""
        return {
            'background-color': '#ffffff',
            'border': '1px solid #dee2e6',
            'border-radius': random.choice(self.CSS_PROPERTIES['border_radius']),
            'padding': random.choice(self.CSS_PROPERTIES['padding']),
            'margin': random.choice(self.CSS_PROPERTIES['margin']),
            'box-shadow': '0 2px 4px rgba(0,0,0,0.1)',
        }
    
    def _generate_form_styles(self) -> Dict[str, str]:
        """Generate styles for form elements"""
        return {
            'border': '1px solid #ced4da',
            'border-radius': random.choice(self.CSS_PROPERTIES['border_radius']),
            'padding': random.choice(self.CSS_PROPERTIES['padding']),
            'font-size': random.choice(self.CSS_PROPERTIES['font_size']),
            'width': '100%',
        }
    
    def _generate_default_styles(self) -> Dict[str, str]:
        """Generate default styles for other elements"""
        return {
            'color': random.choice(self.CSS_PROPERTIES['color']),
            'font-size': random.choice(self.CSS_PROPERTIES['font_size']),
            'font-weight': random.choice(self.CSS_PROPERTIES['font_weight']),
            'margin': random.choice(self.CSS_PROPERTIES['margin']),
            'padding': random.choice(self.CSS_PROPERTIES['padding']),
        }
    
    def _process_template_content(self, content: str, unique_classes: Dict[str, str], unique_styles: Dict[str, Dict[str, str]]) -> str:
        """Process template content to replace classes and add styles"""
        processed_content = content
        
        # Replace class names
        for original_class, unique_class in unique_classes.items():
            # Replace class attributes
            class_pattern = rf'class\s*=\s*["\']([^"\']*)\b{re.escape(original_class)}\b([^"\']*)["\']'
            processed_content = re.sub(
                class_pattern,
                lambda m: f'class="{m.group(1)}{unique_class}{m.group(2)}"',
                processed_content,
                flags=re.IGNORECASE
            )
        
        # Add inline styles
        for unique_class, styles in unique_styles.items():
            # Find elements with this class and add styles
            style_string = '; '.join([f'{prop}: {value}' for prop, value in styles.items()])
            
            # Add style attribute to elements with this class
            class_pattern = rf'(<[^>]*class\s*=\s*["\'][^"\']*{re.escape(unique_class)}[^"\']*["\'][^>]*?)(?:\s+style\s*=\s*["\'][^"\']*["\'])?'
            processed_content = re.sub(
                class_pattern,
                rf'\1 style="{style_string}"',
                processed_content,
                flags=re.IGNORECASE
            )
        
        return processed_content
    
    def _generate_custom_css(self, unique_styles: Dict[str, Dict[str, str]]) -> str:
        """Generate custom CSS for unique styles"""
        css_rules = []
        
        for class_name, styles in unique_styles.items():
            css_rule = f".{class_name} {{\n"
            for property, value in styles.items():
                css_rule += f"  {property}: {value};\n"
            css_rule += "}\n"
            css_rules.append(css_rule)
        
        return "\n".join(css_rules)
    
    def generate_css_class_list(self, site: Site, list_name: str) -> Dict[str, Any]:
        """Generate a custom CSS class list for a site"""
        try:
            # Generate a set of unique class names
            class_count = random.randint(20, 50)  # Generate 20-50 unique classes
            unique_classes = []
            
            for _ in range(class_count):
                element_type = random.choice(list(self.CLASS_PATTERNS.keys()))
                base_name = random.choice(self.CLASS_PATTERNS[element_type])
                suffix = self._generate_unique_suffix()
                unique_class = f"_{base_name}_{suffix}"
                unique_classes.append(unique_class)
            
            # Save to site model
            if not hasattr(site, 'custom_css_class_list'):
                # Add the field if it doesn't exist
                site.custom_css_class_list = {}
            
            if not site.custom_css_class_list:
                site.custom_css_class_list = {}
            
            site.custom_css_class_list[list_name] = unique_classes
            site.save(update_fields=['custom_css_class_list'])
            
            return {
                'success': True,
                'list_name': list_name,
                'classes': unique_classes,
                'count': len(unique_classes)
            }
            
        except Exception as e:
            logger.error(f"Failed to generate CSS class list: {e}")
            return {
                'success': False,
                'error': str(e)
            }


# Singleton instance
template_uniqueness_service = TemplateUniquenessService()
