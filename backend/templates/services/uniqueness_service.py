import hashlib
import random
import string
import re
from typing import Dict, List, Tuple, Optional
from django.conf import settings
from django.db import transaction
import logging

logger = logging.getLogger(__name__)


class TemplateUniquenessService:
    """Service for generating unique CSS classes and styles for templates"""
    
    # System default lists that should always exist
    SYSTEM_LISTS = {
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
    
    def __init__(self):
        self.generated_classes = set()
        self.class_mappings = {}
        self._system_lists_ensured = False
    
    def _ensure_system_lists(self):
        """Ensure system lists exist in database (lazy initialization)"""
        if self._system_lists_ensured:
            return
        
        try:
            from templates.models import CssClassList
            for name, classes in self.SYSTEM_LISTS.items():
                CssClassList.objects.get_or_create(
                    name=name,
                    defaults={
                        'classes': classes,
                        'is_system': True
                    }
                )
            self._system_lists_ensured = True
        except Exception as e:
            # Silently fail during migrations/initialization (database might not be ready)
            logger.debug(f"Could not ensure system lists (this is normal during migrations): {e}")
    
    def _load_custom_class_lists(self) -> Dict[str, List[str]]:
        """Load custom class lists from database"""
        self._ensure_system_lists()  # Ensure system lists exist before loading
        try:
            from templates.models import CssClassList
            lists = {}
            for css_list in CssClassList.objects.all():
                lists[css_list.name] = css_list.classes
            return lists
        except Exception as e:
            logger.error(f"Failed to load class lists from database: {e}")
            return {}
    
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
            custom_class_lists = self._load_custom_class_lists()
            if class_list_name and class_list_name in custom_class_lists:
                class_mappings = self._generate_mappings_from_list(
                    css_classes, 
                    custom_class_lists[class_list_name],
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
        """Get available custom class lists (excluding system lists from deletion)"""
        return self._load_custom_class_lists()
    
    def create_custom_class_list(self, name: str, classes: List[str]) -> bool:
        """Create a new custom class list"""
        self._ensure_system_lists()  # Ensure system lists exist
        try:
            from templates.models import CssClassList
            
            # Check if list already exists
            if CssClassList.objects.filter(name=name).exists():
                return False  # List already exists
            
            # Don't allow creating lists with system list names
            if name in self.SYSTEM_LISTS:
                return False
            
            # Create new list
            CssClassList.objects.create(
                name=name,
                classes=classes,
                is_system=False
            )
            return True
            
        except Exception as e:
            logger.error(f"Failed to create custom class list: {e}")
            return False
    
    def update_custom_class_list(self, name: str, classes: List[str]) -> bool:
        """Update an existing custom class list"""
        self._ensure_system_lists()  # Ensure system lists exist
        try:
            from templates.models import CssClassList
            
            try:
                css_list = CssClassList.objects.get(name=name)
                # Don't allow updating system lists
                if css_list.is_system:
                    return False
                
                css_list.classes = classes
                css_list.save()
                return True
            except CssClassList.DoesNotExist:
                return False  # List doesn't exist
            
        except Exception as e:
            logger.error(f"Failed to update custom class list: {e}")
            return False
    
    def delete_custom_class_list(self, name: str) -> bool:
        """Delete a custom class list (only non-system lists)"""
        self._ensure_system_lists()  # Ensure system lists exist
        try:
            from templates.models import CssClassList
            
            try:
                css_list = CssClassList.objects.get(name=name)
                # Don't allow deleting system lists
                if css_list.is_system:
                    return False
                
                css_list.delete()
                return True
            except CssClassList.DoesNotExist:
                return False  # List doesn't exist
            
        except Exception as e:
            logger.error(f"Failed to delete custom class list: {e}")
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
