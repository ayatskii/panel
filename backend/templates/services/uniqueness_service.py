import hashlib
import random
import string
import re
from typing import Dict, List, Tuple, Optional
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class TemplateUniquenessService:
    """Service for generating unique CSS classes and styles for templates"""
    
    def __init__(self):
        self.generated_classes = set()
        self.class_mappings = {}
        self.custom_class_lists = self._load_custom_class_lists()
    
    def _load_custom_class_lists(self) -> Dict[str, List[str]]:
        """Load custom class lists from settings or database"""
        # In a real implementation, this would load from database
        # For now, return some predefined class lists
        return {
            'list_1': [
                'btn-primary', 'btn-secondary', 'btn-success', 'btn-danger',
                'card-header', 'card-body', 'card-footer', 'card-title',
                'nav-link', 'nav-item', 'navbar-brand', 'navbar-nav',
                'form-control', 'form-group', 'form-label', 'form-check',
                'alert-info', 'alert-warning', 'alert-success', 'alert-danger',
                'badge-primary', 'badge-secondary', 'badge-success', 'badge-info',
                'text-center', 'text-left', 'text-right', 'text-justify',
                'd-flex', 'd-block', 'd-inline', 'd-none',
                'container', 'row', 'col', 'col-sm', 'col-md', 'col-lg'
            ],
            'list_2': [
                'primary-btn', 'secondary-btn', 'success-btn', 'danger-btn',
                'header-card', 'body-card', 'footer-card', 'title-card',
                'link-nav', 'item-nav', 'brand-navbar', 'nav-navbar',
                'control-form', 'group-form', 'label-form', 'check-form',
                'info-alert', 'warning-alert', 'success-alert', 'danger-alert',
                'primary-badge', 'secondary-badge', 'success-badge', 'info-badge',
                'center-text', 'left-text', 'right-text', 'justify-text',
                'flex-display', 'block-display', 'inline-display', 'none-display',
                'main-container', 'content-row', 'column', 'small-col', 'medium-col', 'large-col'
            ],
            'list_3': [
                'btn-main', 'btn-alt', 'btn-ok', 'btn-error',
                'head-card', 'content-card', 'foot-card', 'name-card',
                'nav-link-item', 'nav-element', 'brand-element', 'nav-container',
                'input-field', 'field-group', 'field-label', 'checkbox-field',
                'info-message', 'warning-message', 'success-message', 'error-message',
                'main-badge', 'alt-badge', 'ok-badge', 'info-badge',
                'center-align', 'left-align', 'right-align', 'justify-align',
                'flex-layout', 'block-layout', 'inline-layout', 'hidden-layout',
                'page-container', 'grid-row', 'grid-col', 'small-grid', 'medium-grid', 'large-grid'
            ]
        }
    
    def generate_unique_css_classes(
        self, 
        css_content: str, 
        site_id: int, 
        class_list_name: Optional[str] = None
    ) -> Tuple[str, Dict[str, str]]:
        """
        Generate unique CSS classes for a template
        
        Args:
            css_content: Original CSS content
            site_id: ID of the site (for uniqueness)
            class_list_name: Optional custom class list to use
            
        Returns:
            Tuple of (modified_css, class_mappings)
        """
        try:
            # Extract all CSS classes from the content
            css_classes = self._extract_css_classes(css_content)
            
            # Generate unique class mappings
            if class_list_name and class_list_name in self.custom_class_lists:
                class_mappings = self._generate_mappings_from_list(
                    css_classes, 
                    self.custom_class_lists[class_list_name],
                    site_id
                )
            else:
                class_mappings = self._generate_random_mappings(css_classes, site_id)
            
            # Replace classes in CSS content
            modified_css = self._replace_css_classes(css_content, class_mappings)
            
            # Store mappings for this site
            self.class_mappings[site_id] = class_mappings
            
            logger.info(f"Generated {len(class_mappings)} unique CSS classes for site {site_id}")
            
            return modified_css, class_mappings
            
        except Exception as e:
            logger.error(f"Failed to generate unique CSS classes: {e}")
            return css_content, {}
    
    def _extract_css_classes(self, css_content: str) -> List[str]:
        """Extract all CSS class names from CSS content"""
        # Pattern to match CSS class selectors
        class_pattern = r'\.([a-zA-Z][a-zA-Z0-9_-]*)'
        matches = re.findall(class_pattern, css_content)
        
        # Remove duplicates and return sorted list
        unique_classes = list(set(matches))
        unique_classes.sort()
        
        return unique_classes
    
    def _generate_random_mappings(self, css_classes: List[str], site_id: int) -> Dict[str, str]:
        """Generate random unique class mappings"""
        mappings = {}
        used_classes = set()
        
        for original_class in css_classes:
            # Generate unique class name
            unique_class = self._generate_unique_class_name(original_class, site_id, used_classes)
            mappings[original_class] = unique_class
            used_classes.add(unique_class)
        
        return mappings
    
    def _generate_mappings_from_list(
        self, 
        css_classes: List[str], 
        class_list: List[str], 
        site_id: int
    ) -> Dict[str, str]:
        """Generate mappings using predefined class list"""
        mappings = {}
        used_classes = set()
        
        # Create a hash-based seed for consistent mapping
        seed = hashlib.md5(f"{site_id}".encode()).hexdigest()
        random.seed(seed)
        
        # Shuffle the class list for this site
        shuffled_list = class_list.copy()
        random.shuffle(shuffled_list)
        
        for i, original_class in enumerate(css_classes):
            if i < len(shuffled_list):
                # Use class from predefined list
                unique_class = shuffled_list[i]
            else:
                # Generate additional unique class if needed
                unique_class = self._generate_unique_class_name(original_class, site_id, used_classes)
            
            mappings[original_class] = unique_class
            used_classes.add(unique_class)
        
        return mappings
    
    def _generate_unique_class_name(
        self, 
        original_class: str, 
        site_id: int, 
        used_classes: set
    ) -> str:
        """Generate a unique class name"""
        # Create a hash-based prefix for this site
        site_hash = hashlib.md5(f"{site_id}".encode()).hexdigest()[:8]
        
        # Try different approaches to create unique class
        attempts = [
            f"_{site_hash}_{original_class}",
            f"_{site_hash}_{self._generate_random_suffix()}",
            f"_{site_hash}_{original_class}_{self._generate_random_suffix()}",
            f"_{self._generate_random_suffix()}_{original_class}",
        ]
        
        for attempt in attempts:
            if attempt not in used_classes and attempt not in self.generated_classes:
                self.generated_classes.add(attempt)
                return attempt
        
        # Fallback: generate completely random class
        while True:
            random_class = f"_{self._generate_random_suffix()}"
            if random_class not in used_classes and random_class not in self.generated_classes:
                self.generated_classes.add(random_class)
                return random_class
    
    def _generate_random_suffix(self, length: int = 8) -> str:
        """Generate a random suffix for class names"""
        return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))
    
    def _replace_css_classes(self, css_content: str, class_mappings: Dict[str, str]) -> str:
        """Replace CSS class names in content"""
        modified_content = css_content
        
        # Replace class selectors (e.g., .btn-primary)
        for original_class, unique_class in class_mappings.items():
            # Replace class selectors
            pattern = rf'\.{re.escape(original_class)}\b'
            modified_content = re.sub(pattern, f'.{unique_class}', modified_content)
        
        return modified_content
    
    def apply_class_mappings_to_html(self, html_content: str, class_mappings: Dict[str, str]) -> str:
        """Apply class mappings to HTML content"""
        modified_html = html_content
        
        for original_class, unique_class in class_mappings.items():
            # Replace class attributes in HTML
            # Pattern to match class="..." or class='...'
            pattern = rf'class\s*=\s*["\']([^"\']*)\b{re.escape(original_class)}\b([^"\']*)["\']'
            
            def replace_class(match):
                full_class_attr = match.group(1) + original_class + match.group(2)
                new_class_attr = full_class_attr.replace(original_class, unique_class)
                return f'class="{new_class_attr}"'
            
            modified_html = re.sub(pattern, replace_class, modified_html)
        
        return modified_html
    
    def get_class_mappings_for_site(self, site_id: int) -> Dict[str, str]:
        """Get class mappings for a specific site"""
        return self.class_mappings.get(site_id, {})
    
    def get_available_class_lists(self) -> Dict[str, List[str]]:
        """Get available custom class lists"""
        return self.custom_class_lists
    
    def create_custom_class_list(self, name: str, classes: List[str]) -> bool:
        """Create a new custom class list"""
        try:
            if name in self.custom_class_lists:
                return False  # List already exists
            
            self.custom_class_lists[name] = classes
            # In a real implementation, this would save to database
            return True
            
        except Exception as e:
            logger.error(f"Failed to create custom class list: {e}")
            return False
    
    def validate_css_classes(self, css_content: str) -> Dict[str, any]:
        """Validate CSS content and return analysis"""
        css_classes = self._extract_css_classes(css_content)
        
        return {
            'total_classes': len(css_classes),
            'classes': css_classes,
            'has_conflicts': len(css_classes) != len(set(css_classes)),
            'recommendations': self._get_css_recommendations(css_classes)
        }
    
    def _get_css_recommendations(self, css_classes: List[str]) -> List[str]:
        """Get recommendations for CSS optimization"""
        recommendations = []
        
        if len(css_classes) > 100:
            recommendations.append("Consider reducing the number of CSS classes for better performance")
        
        # Check for common naming patterns
        if any('btn' in cls for cls in css_classes):
            recommendations.append("Button classes detected - consider using a design system")
        
        if any('card' in cls for cls in css_classes):
            recommendations.append("Card classes detected - ensure consistent spacing and styling")
        
        return recommendations


# Singleton instance
template_uniqueness_service = TemplateUniquenessService()
