import xml.etree.ElementTree as ET
from xml.dom import minidom
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from django.conf import settings
from django.urls import reverse
from django.utils import timezone as django_timezone
from pages.models import Page, Site
from media.models import Media


class SitemapService:
    """
    Service for generating XML sitemaps and robots.txt files
    """
    
    def __init__(self):
        self.namespace = 'http://www.sitemaps.org/schemas/sitemap/0.9'
        self.image_namespace = 'http://www.google.com/schemas/sitemap-image/1.1'
        self.news_namespace = 'http://www.google.com/schemas/sitemap-news/0.9'
    
    def generate_sitemap(
        self,
        site_id: int,
        include_images: bool = True,
        include_media: bool = True,
        priority_boost: Dict[str, float] = None
    ) -> Dict[str, any]:
        """
        Generate XML sitemap for a site
        
        Args:
            site_id: ID of the site to generate sitemap for
            include_images: Whether to include image sitemaps
            include_media: Whether to include media files
            priority_boost: Custom priority boosts for specific pages
            
        Returns:
            Dict with sitemap data and XML content
        """
        
        try:
            site = Site.objects.get(id=site_id)
            pages = Page.objects.filter(site=site, is_published=True).order_by('order', 'created_at')
            
            # Create root sitemap element
            root = ET.Element('urlset')
            root.set('xmlns', self.namespace)
            root.set('xmlns:image', self.image_namespace)
            
            # Add pages to sitemap
            page_count = 0
            image_count = 0
            
            for page in pages:
                url_element = self._create_url_element(page, site, priority_boost)
                if url_element is not None:
                    root.append(url_element)
                    page_count += 1
                    
                    # Add images if requested
                    if include_images:
                        image_elements = self._create_image_elements(page)
                        for img_element in image_elements:
                            url_element.append(img_element)
                            image_count += 1
            
            # Add media files if requested
            if include_media:
                media_elements = self._create_media_elements(site)
                for media_element in media_elements:
                    root.append(media_element)
            
            # Generate XML string
            xml_string = self._prettify_xml(root)
            
            return {
                'success': True,
                'site_id': site_id,
                'site_domain': site.domain,
                'page_count': page_count,
                'image_count': image_count,
                'xml_content': xml_string,
                'generated_at': django_timezone.now().isoformat(),
                'sitemap_size': len(xml_string)
            }
            
        except Site.DoesNotExist:
            return {
                'success': False,
                'error': f'Site with ID {site_id} not found'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to generate sitemap: {str(e)}'
            }
    
    def _create_url_element(self, page: Page, site: Site, priority_boost: Dict[str, float] = None) -> Optional[ET.Element]:
        """Create URL element for a page"""
        try:
            # Build full URL
            if page.slug == 'index':
                full_url = f"https://{site.domain}/"
            else:
                full_url = f"https://{site.domain}/{page.slug}/"
            
            # Create URL element
            url_element = ET.SubElement(ET.Element('url'), 'url')
            
            # Add loc (location)
            loc = ET.SubElement(url_element, 'loc')
            loc.text = full_url
            
            # Add lastmod (last modified)
            lastmod = ET.SubElement(url_element, 'lastmod')
            lastmod.text = page.updated_at.strftime('%Y-%m-%d')
            
            # Add changefreq (change frequency)
            changefreq = ET.SubElement(url_element, 'changefreq')
            changefreq.text = self._get_change_frequency(page)
            
            # Add priority
            priority = ET.SubElement(url_element, 'priority')
            base_priority = self._get_base_priority(page)
            
            # Apply priority boost if specified
            if priority_boost and page.slug in priority_boost:
                base_priority = min(1.0, base_priority + priority_boost[page.slug])
            
            priority.text = str(base_priority)
            
            return url_element
            
        except Exception as e:
            print(f"Error creating URL element for page {page.id}: {e}")
            return None
    
    def _create_image_elements(self, page: Page) -> List[ET.Element]:
        """Create image elements for a page"""
        image_elements = []
        
        try:
            # Get images from page blocks
            from pages.models import PageBlock
            
            blocks = PageBlock.objects.filter(page=page)
            for block in blocks:
                content_data = block.content_data or {}
                
                # Extract images from different block types
                images = self._extract_images_from_block(block.block_type, content_data)
                
                for image_url in images:
                    if image_url:
                        image_element = ET.SubElement(ET.Element('image:image'), 'image:image')
                        
                        # Add image loc
                        image_loc = ET.SubElement(image_element, 'image:loc')
                        image_loc.text = image_url
                        
                        # Add image title if available
                        if 'alt' in content_data:
                            image_title = ET.SubElement(image_element, 'image:title')
                            image_title.text = content_data.get('alt', '')
                        
                        # Add image caption if available
                        if 'caption' in content_data:
                            image_caption = ET.SubElement(image_element, 'image:caption')
                            image_caption.text = content_data.get('caption', '')
                        
                        image_elements.append(image_element)
            
        except Exception as e:
            print(f"Error creating image elements for page {page.id}: {e}")
        
        return image_elements
    
    def _extract_images_from_block(self, block_type: str, content_data: Dict) -> List[str]:
        """Extract image URLs from block content"""
        images = []
        
        try:
            if block_type == 'image':
                if 'image_url' in content_data:
                    images.append(content_data['image_url'])
            
            elif block_type == 'text_image':
                if 'image_url' in content_data:
                    images.append(content_data['image_url'])
            
            elif block_type == 'gallery':
                if 'images' in content_data and isinstance(content_data['images'], list):
                    images.extend(content_data['images'])
            
            elif block_type == 'swiper':
                if 'images' in content_data and isinstance(content_data['images'], list):
                    images.extend(content_data['images'])
            
            # Filter out empty or invalid URLs
            images = [img for img in images if img and img.startswith(('http://', 'https://', '/'))]
            
        except Exception as e:
            print(f"Error extracting images from block {block_type}: {e}")
        
        return images
    
    def _create_media_elements(self, site: Site) -> List[ET.Element]:
        """Create URL elements for media files"""
        media_elements = []
        
        try:
            # Get published media files
            media_files = Media.objects.filter(
                folder__site=site,
                file__isnull=False
            ).exclude(file='')
            
            for media in media_files:
                # Build media URL
                media_url = f"https://{site.domain}/media/{media.file.name}"
                
                # Create URL element
                url_element = ET.SubElement(ET.Element('url'), 'url')
                
                # Add loc
                loc = ET.SubElement(url_element, 'loc')
                loc.text = media_url
                
                # Add lastmod
                lastmod = ET.SubElement(url_element, 'lastmod')
                lastmod.text = media.updated_at.strftime('%Y-%m-%d')
                
                # Add changefreq
                changefreq = ET.SubElement(url_element, 'changefreq')
                changefreq.text = 'monthly'
                
                # Add priority
                priority = ET.SubElement(url_element, 'priority')
                priority.text = '0.3'
                
                media_elements.append(url_element)
            
        except Exception as e:
            print(f"Error creating media elements: {e}")
        
        return media_elements
    
    def _get_change_frequency(self, page: Page) -> str:
        """Get change frequency for a page"""
        # Determine change frequency based on page type and content
        if page.slug == 'index':
            return 'weekly'
        elif 'blog' in page.slug or 'news' in page.slug:
            return 'daily'
        elif 'about' in page.slug or 'contact' in page.slug:
            return 'monthly'
        else:
            return 'weekly'
    
    def _get_base_priority(self, page: Page) -> float:
        """Get base priority for a page"""
        # Determine priority based on page importance
        if page.slug == 'index':
            return 1.0
        elif 'about' in page.slug:
            return 0.8
        elif 'contact' in page.slug:
            return 0.7
        elif 'blog' in page.slug or 'news' in page.slug:
            return 0.6
        else:
            return 0.5
    
    def _prettify_xml(self, element: ET.Element) -> str:
        """Prettify XML output"""
        rough_string = ET.tostring(element, 'utf-8')
        reparsed = minidom.parseString(rough_string)
        return reparsed.toprettyxml(indent="  ")
    
    def generate_robots_txt(
        self,
        site_id: int,
        custom_rules: List[str] = None,
        sitemap_url: str = None
    ) -> Dict[str, any]:
        """
        Generate robots.txt file for a site
        
        Args:
            site_id: ID of the site to generate robots.txt for
            custom_rules: Custom robots.txt rules
            sitemap_url: Custom sitemap URL
            
        Returns:
            Dict with robots.txt content
        """
        
        try:
            site = Site.objects.get(id=site_id)
            
            # Build robots.txt content
            robots_content = []
            
            # Add user-agent rules
            robots_content.append("User-agent: *")
            robots_content.append("Allow: /")
            robots_content.append("")
            
            # Add disallow rules for admin and API
            robots_content.append("User-agent: *")
            robots_content.append("Disallow: /admin/")
            robots_content.append("Disallow: /api/")
            robots_content.append("Disallow: /media/private/")
            robots_content.append("")
            
            # Add custom rules if provided
            if custom_rules:
                for rule in custom_rules:
                    robots_content.append(rule)
                robots_content.append("")
            
            # Add sitemap URL
            if sitemap_url:
                robots_content.append(f"Sitemap: {sitemap_url}")
            else:
                robots_content.append(f"Sitemap: https://{site.domain}/sitemap.xml")
            
            # Add additional sitemaps
            robots_content.append(f"Sitemap: https://{site.domain}/sitemap-images.xml")
            robots_content.append(f"Sitemap: https://{site.domain}/sitemap-media.xml")
            
            robots_text = "\n".join(robots_content)
            
            return {
                'success': True,
                'site_id': site_id,
                'site_domain': site.domain,
                'robots_content': robots_text,
                'generated_at': django_timezone.now().isoformat(),
                'file_size': len(robots_text)
            }
            
        except Site.DoesNotExist:
            return {
                'success': False,
                'error': f'Site with ID {site_id} not found'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to generate robots.txt: {str(e)}'
            }
    
    def generate_sitemap_index(
        self,
        site_id: int,
        sitemap_types: List[str] = None
    ) -> Dict[str, any]:
        """
        Generate sitemap index file
        
        Args:
            site_id: ID of the site
            sitemap_types: Types of sitemaps to include
            
        Returns:
            Dict with sitemap index content
        """
        
        try:
            site = Site.objects.get(id=site_id)
            
            if sitemap_types is None:
                sitemap_types = ['pages', 'images', 'media']
            
            # Create sitemap index
            sitemap_index = ET.Element('sitemapindex')
            sitemap_index.set('xmlns', self.namespace)
            
            # Add main sitemap
            if 'pages' in sitemap_types:
                sitemap_element = ET.SubElement(sitemap_index, 'sitemap')
                
                loc = ET.SubElement(sitemap_element, 'loc')
                loc.text = f"https://{site.domain}/sitemap.xml"
                
                lastmod = ET.SubElement(sitemap_element, 'lastmod')
                lastmod.text = django_timezone.now().strftime('%Y-%m-%d')
            
            # Add image sitemap
            if 'images' in sitemap_types:
                sitemap_element = ET.SubElement(sitemap_index, 'sitemap')
                
                loc = ET.SubElement(sitemap_element, 'loc')
                loc.text = f"https://{site.domain}/sitemap-images.xml"
                
                lastmod = ET.SubElement(sitemap_element, 'lastmod')
                lastmod.text = django_timezone.now().strftime('%Y-%m-%d')
            
            # Add media sitemap
            if 'media' in sitemap_types:
                sitemap_element = ET.SubElement(sitemap_index, 'sitemap')
                
                loc = ET.SubElement(sitemap_element, 'loc')
                loc.text = f"https://{site.domain}/sitemap-media.xml"
                
                lastmod = ET.SubElement(sitemap_element, 'lastmod')
                lastmod.text = django_timezone.now().strftime('%Y-%m-%d')
            
            # Generate XML string
            xml_string = self._prettify_xml(sitemap_index)
            
            return {
                'success': True,
                'site_id': site_id,
                'site_domain': site.domain,
                'sitemap_types': sitemap_types,
                'xml_content': xml_string,
                'generated_at': django_timezone.now().isoformat()
            }
            
        except Site.DoesNotExist:
            return {
                'success': False,
                'error': f'Site with ID {site_id} not found'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to generate sitemap index: {str(e)}'
            }
    
    def validate_sitemap(self, xml_content: str) -> Dict[str, any]:
        """
        Validate sitemap XML content
        
        Args:
            xml_content: XML content to validate
            
        Returns:
            Dict with validation results
        """
        
        try:
            # Parse XML
            root = ET.fromstring(xml_content)
            
            # Check namespace
            namespace_valid = root.tag == f"{{{self.namespace}}}urlset" or root.tag == f"{{{self.namespace}}}sitemapindex"
            
            # Count elements
            if root.tag == f"{{{self.namespace}}}urlset":
                url_count = len(root.findall(f"{{{self.namespace}}}url"))
                element_type = "urlset"
            else:
                url_count = len(root.findall(f"{{{self.namespace}}}sitemap"))
                element_type = "sitemapindex"
            
            # Check for required elements
            validation_errors = []
            
            if element_type == "urlset":
                for url_element in root.findall(f"{{{self.namespace}}}url"):
                    loc = url_element.find(f"{{{self.namespace}}}loc")
                    if loc is None or not loc.text:
                        validation_errors.append("Missing or empty <loc> element")
            
            return {
                'success': True,
                'valid': namespace_valid and len(validation_errors) == 0,
                'namespace_valid': namespace_valid,
                'element_type': element_type,
                'element_count': url_count,
                'validation_errors': validation_errors,
                'file_size': len(xml_content)
            }
            
        except ET.ParseError as e:
            return {
                'success': False,
                'valid': False,
                'error': f'XML parsing error: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'valid': False,
                'error': f'Validation error: {str(e)}'
            }
    
    def get_sitemap_stats(self, site_id: int) -> Dict[str, any]:
        """
        Get sitemap statistics for a site
        
        Args:
            site_id: ID of the site
            
        Returns:
            Dict with sitemap statistics
        """
        
        try:
            site = Site.objects.get(id=site_id)
            
            # Count published pages
            published_pages = Page.objects.filter(site=site, is_published=True).count()
            
            # Count total pages
            total_pages = Page.objects.filter(site=site).count()
            
            # Count media files
            media_count = Media.objects.filter(folder__site=site).count()
            
            # Get last updated page
            last_updated_page = Page.objects.filter(site=site).order_by('-updated_at').first()
            
            return {
                'success': True,
                'site_id': site_id,
                'site_domain': site.domain,
                'published_pages': published_pages,
                'total_pages': total_pages,
                'media_files': media_count,
                'last_updated': last_updated_page.updated_at.isoformat() if last_updated_page else None,
                'publish_percentage': (published_pages / total_pages * 100) if total_pages > 0 else 0
            }
            
        except Site.DoesNotExist:
            return {
                'success': False,
                'error': f'Site with ID {site_id} not found'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to get sitemap stats: {str(e)}'
            }
