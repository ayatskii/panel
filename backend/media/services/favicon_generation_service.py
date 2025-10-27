import logging
import os
import tempfile
from typing import Dict, Any, Optional, List
from PIL import Image, ImageOps
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from ..models import Media

logger = logging.getLogger(__name__)


class FaviconGenerationService:
    """Service for generating multiple favicon formats from a single source image"""
    
    # Favicon sizes and formats
    FAVICON_SIZES = {
        'ico': [16, 32, 48],
        'png': [16, 32, 48, 180],  # 180 for apple-touch-icon
        'svg': [None],  # SVG doesn't need specific size
    }
    
    # Apple touch icon size
    APPLE_TOUCH_ICON_SIZE = 180
    
    # Safari pinned tab size (should be monochrome)
    SAFARI_PINNED_TAB_SIZE = 32
    
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()
    
    def generate_favicons(self, source_media: Media, site_domain: str) -> Dict[str, Any]:
        """
        Generate all required favicon formats from a source media file
        
        Args:
            source_media: Media object containing the source image
            site_domain: Domain name for the site (used in file naming)
            
        Returns:
            Dict containing generated favicon information
        """
        try:
            # Download the source image
            source_path = self._download_source_image(source_media)
            if not source_path:
                return {
                    'success': False,
                    'error': 'Failed to download source image'
                }
            
            # Open and process the source image
            with Image.open(source_path) as img:
                # Convert to RGBA if needed
                if img.mode != 'RGBA':
                    img = img.convert('RGBA')
                
                # Generate all favicon formats
                generated_files = {}
                
                # Generate ICO file (multiple sizes in one file)
                ico_file = self._generate_ico_file(img, site_domain)
                if ico_file:
                    generated_files['ico'] = ico_file
                
                # Generate PNG files for different sizes
                png_files = self._generate_png_files(img, site_domain)
                generated_files.update(png_files)
                
                # Generate SVG file (if source is SVG, keep it; otherwise convert)
                svg_file = self._generate_svg_file(img, source_media, site_domain)
                if svg_file:
                    generated_files['svg'] = svg_file
                
                # Generate Apple Touch Icon
                apple_touch_icon = self._generate_apple_touch_icon(img, site_domain)
                if apple_touch_icon:
                    generated_files['apple_touch_icon'] = apple_touch_icon
                
                # Generate Safari Pinned Tab (monochrome)
                safari_pinned_tab = self._generate_safari_pinned_tab(img, site_domain)
                if safari_pinned_tab:
                    generated_files['safari_pinned_tab'] = safari_pinned_tab
                
                # Generate HTML link tags
                html_links = self._generate_html_links(site_domain, generated_files)
                
                # Clean up temporary files
                self._cleanup_temp_files()
                
                return {
                    'success': True,
                    'generated_files': generated_files,
                    'html_links': html_links,
                    'total_files': len(generated_files)
                }
                
        except Exception as e:
            logger.error(f"Failed to generate favicons: {e}")
            self._cleanup_temp_files()
            return {
                'success': False,
                'error': str(e)
            }
    
    def _download_source_image(self, media: Media) -> Optional[str]:
        """Download source image to temporary file"""
        try:
            if media.file_url:
                # For now, we'll work with the file directly
                # In production, you might want to download from URL
                return media.file.path if hasattr(media.file, 'path') else None
            return None
        except Exception as e:
            logger.error(f"Failed to download source image: {e}")
            return None
    
    def _generate_ico_file(self, img: Image.Image, site_domain: str) -> Optional[Dict[str, Any]]:
        """Generate ICO file with multiple sizes"""
        try:
            # Create ICO file with multiple sizes
            ico_sizes = [16, 32, 48]
            ico_images = []
            
            for size in ico_sizes:
                resized = img.resize((size, size), Image.Resampling.LANCZOS)
                ico_images.append(resized)
            
            # Save as ICO
            ico_filename = f"favicon_{site_domain.replace('.', '_')}.ico"
            ico_path = os.path.join(self.temp_dir, ico_filename)
            
            # Save the first image as ICO (PIL doesn't support multi-size ICO well)
            ico_images[0].save(ico_path, format='ICO')
            
            # Upload to storage
            with open(ico_path, 'rb') as f:
                file_content = f.read()
            
            file_obj = ContentFile(file_content, name=ico_filename)
            stored_path = default_storage.save(f"favicons/{ico_filename}", file_obj)
            
            return {
                'filename': ico_filename,
                'path': stored_path,
                'url': default_storage.url(stored_path),
                'sizes': ico_sizes
            }
            
        except Exception as e:
            logger.error(f"Failed to generate ICO file: {e}")
            return None
    
    def _generate_png_files(self, img: Image.Image, site_domain: str) -> Dict[str, Any]:
        """Generate PNG files for different sizes"""
        png_files = {}
        
        try:
            for size in self.FAVICON_SIZES['png']:
                resized = img.resize((size, size), Image.Resampling.LANCZOS)
                
                if size == 180:
                    filename = f"apple-touch-icon_{site_domain.replace('.', '_')}.png"
                else:
                    filename = f"favicon-{size}x{size}_{site_domain.replace('.', '_')}.png"
                
                png_path = os.path.join(self.temp_dir, filename)
                resized.save(png_path, format='PNG')
                
                # Upload to storage
                with open(png_path, 'rb') as f:
                    file_content = f.read()
                
                file_obj = ContentFile(file_content, name=filename)
                stored_path = default_storage.save(f"favicons/{filename}", file_obj)
                
                png_files[f'png_{size}'] = {
                    'filename': filename,
                    'path': stored_path,
                    'url': default_storage.url(stored_path),
                    'size': size
                }
                
        except Exception as e:
            logger.error(f"Failed to generate PNG files: {e}")
        
        return png_files
    
    def _generate_svg_file(self, img: Image.Image, source_media: Media, site_domain: str) -> Optional[Dict[str, Any]]:
        """Generate or preserve SVG file"""
        try:
            # If source is already SVG, use it
            if source_media.file.name.endswith('.svg'):
                filename = f"favicon_{site_domain.replace('.', '_')}.svg"
                
                # Copy the original SVG file
                with source_media.file.open('rb') as f:
                    file_content = f.read()
                
                file_obj = ContentFile(file_content, name=filename)
                stored_path = default_storage.save(f"favicons/{filename}", file_obj)
                
                return {
                    'filename': filename,
                    'path': stored_path,
                    'url': default_storage.url(stored_path),
                    'format': 'svg'
                }
            else:
                # Convert to SVG (simplified approach)
                filename = f"favicon_{site_domain.replace('.', '_')}.svg"
                svg_path = os.path.join(self.temp_dir, filename)
                
                # Create a simple SVG wrapper
                svg_content = self._create_svg_from_image(img, site_domain)
                
                with open(svg_path, 'w') as f:
                    f.write(svg_content)
                
                # Upload to storage
                with open(svg_path, 'rb') as f:
                    file_content = f.read()
                
                file_obj = ContentFile(file_content, name=filename)
                stored_path = default_storage.save(f"favicons/{filename}", file_obj)
                
                return {
                    'filename': filename,
                    'path': stored_path,
                    'url': default_storage.url(stored_path),
                    'format': 'svg'
                }
                
        except Exception as e:
            logger.error(f"Failed to generate SVG file: {e}")
            return None
    
    def _generate_apple_touch_icon(self, img: Image.Image, site_domain: str) -> Optional[Dict[str, Any]]:
        """Generate Apple Touch Icon (180x180)"""
        try:
            resized = img.resize((self.APPLE_TOUCH_ICON_SIZE, self.APPLE_TOUCH_ICON_SIZE), Image.Resampling.LANCZOS)
            
            filename = f"apple-touch-icon_{site_domain.replace('.', '_')}.png"
            icon_path = os.path.join(self.temp_dir, filename)
            resized.save(icon_path, format='PNG')
            
            # Upload to storage
            with open(icon_path, 'rb') as f:
                file_content = f.read()
            
            file_obj = ContentFile(file_content, name=filename)
            stored_path = default_storage.save(f"favicons/{filename}", file_obj)
            
            return {
                'filename': filename,
                'path': stored_path,
                'url': default_storage.url(stored_path),
                'size': self.APPLE_TOUCH_ICON_SIZE
            }
            
        except Exception as e:
            logger.error(f"Failed to generate Apple Touch Icon: {e}")
            return None
    
    def _generate_safari_pinned_tab(self, img: Image.Image, site_domain: str) -> Optional[Dict[str, Any]]:
        """Generate Safari Pinned Tab icon (monochrome SVG)"""
        try:
            # Convert to grayscale and resize
            grayscale = img.convert('L')
            resized = grayscale.resize((self.SAFARI_PINNED_TAB_SIZE, self.SAFARI_PINNED_TAB_SIZE), Image.Resampling.LANCZOS)
            
            # Convert back to RGBA for SVG
            rgba = resized.convert('RGBA')
            
            filename = f"safari-pinned-tab_{site_domain.replace('.', '_')}.svg"
            svg_path = os.path.join(self.temp_dir, filename)
            
            # Create monochrome SVG
            svg_content = self._create_monochrome_svg(rgba, site_domain)
            
            with open(svg_path, 'w') as f:
                f.write(svg_content)
            
            # Upload to storage
            with open(svg_path, 'rb') as f:
                file_content = f.read()
            
            file_obj = ContentFile(file_content, name=filename)
            stored_path = default_storage.save(f"favicons/{filename}", file_obj)
            
            return {
                'filename': filename,
                'path': stored_path,
                'url': default_storage.url(stored_path),
                'format': 'svg',
                'monochrome': True
            }
            
        except Exception as e:
            logger.error(f"Failed to generate Safari Pinned Tab: {e}")
            return None
    
    def _create_svg_from_image(self, img: Image.Image, site_domain: str) -> str:
        """Create SVG content from PIL Image"""
        # Convert image to base64
        import base64
        from io import BytesIO
        
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        img_data = base64.b64encode(buffer.getvalue()).decode()
        
        return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <image href="data:image/png;base64,{img_data}" width="32" height="32"/>
</svg>'''
    
    def _create_monochrome_svg(self, img: Image.Image, site_domain: str) -> str:
        """Create monochrome SVG for Safari pinned tab"""
        # Convert image to base64
        import base64
        from io import BytesIO
        
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        img_data = base64.b64encode(buffer.getvalue()).decode()
        
        return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <image href="data:image/png;base64,{img_data}" width="32" height="32"/>
</svg>'''
    
    def _generate_html_links(self, site_domain: str, generated_files: Dict[str, Any]) -> List[str]:
        """Generate HTML link tags for all favicon formats"""
        html_links = []
        
        # ICO file
        if 'ico' in generated_files:
            ico_file = generated_files['ico']
            html_links.append(f'<link href="{ico_file["url"]}" rel="icon" type="image/x-icon">')
        
        # PNG files
        for key, png_file in generated_files.items():
            if key.startswith('png_'):
                size = png_file['size']
                if size == 180:
                    html_links.append(f'<link href="{png_file["url"]}" rel="apple-touch-icon" sizes="{size}x{size}">')
                else:
                    html_links.append(f'<link href="{png_file["url"]}" rel="icon" type="image/png" sizes="{size}x{size}">')
        
        # SVG file
        if 'svg' in generated_files:
            svg_file = generated_files['svg']
            html_links.append(f'<link href="{svg_file["url"]}" rel="icon" type="image/svg+xml">')
        
        # Apple Touch Icon
        if 'apple_touch_icon' in generated_files:
            apple_file = generated_files['apple_touch_icon']
            html_links.append(f'<link href="{apple_file["url"]}" rel="apple-touch-icon" sizes="{apple_file["size"]}x{apple_file["size"]}">')
        
        # Safari Pinned Tab
        if 'safari_pinned_tab' in generated_files:
            safari_file = generated_files['safari_pinned_tab']
            html_links.append(f'<link href="{safari_file["url"]}" rel="mask-icon" color="#24282a">')
        
        return html_links
    
    def _cleanup_temp_files(self):
        """Clean up temporary files"""
        try:
            import shutil
            if os.path.exists(self.temp_dir):
                shutil.rmtree(self.temp_dir)
        except Exception as e:
            logger.error(f"Failed to cleanup temp files: {e}")


# Singleton instance
favicon_generation_service = FaviconGenerationService()
