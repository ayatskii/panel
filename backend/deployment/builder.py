from typing import Dict, List
from sites.models import Site
from pages.models import Page
from templates.models import Template
import logging

logger = logging.getLogger(__name__)


class SiteBuilder:
    """Build static HTML/CSS/JS for site deployment"""
    
    def __init__(self, site: Site):
        self.site = site
        self.template = site.template
        self.pages = site.pages.filter(is_published=True)
    
    def build(self) -> Dict[str, str]:
        """
        Build all site files
        
        Returns:
            Dict of file paths to content
        """
        files = {}
        
        # Build each page
        for page in self.pages:
            html_content = self._build_page(page)
            
            # Use slug for filename
            filename = f"{page.slug}.html" if page.slug != 'home' else "index.html"
            files[filename] = html_content
        
        # Add global CSS
        files['styles.css'] = self._build_global_css()
        
        # Add global JS (if any)
        if self.template.base_js:
            files['scripts.js'] = self.template.base_js
        
        logger.info(f"Built {len(files)} files for site: {self.site.domain}")
        return files
    
    def _build_page(self, page: Page) -> str:
        """Build HTML for a single page"""
        # Start with template base HTML
        html = self.template.base_html or self._default_html_template()
        
        # Replace template variables
        html = html.replace('{{brand_name}}', self.site.brand_name)
        html = html.replace('{{page_title}}', page.title)
        html = html.replace('{{meta_title}}', page.meta_title)
        html = html.replace('{{meta_description}}', page.meta_description)
        
        # Build blocks content
        blocks_html = self._build_blocks(page)
        html = html.replace('{{content}}', blocks_html)
        
        # Add navigation
        nav_html = self._build_navigation()
        html = html.replace('{{navigation}}', nav_html)
        
        # Add footer
        if self.site.template_footprint:
            footer_html = self.site.template_footprint.footer_html or ''
            html = html.replace('{{footer}}', footer_html)
        
        return html
    
    def _build_blocks(self, page: Page) -> str:
        """Build HTML for all page blocks"""
        blocks_html = []
        
        for block in page.blocks.all().order_by('order'):
            block_html = self._render_block(block)
            blocks_html.append(block_html)
        
        return '\n'.join(blocks_html)
    
    def _render_block(self, block) -> str:
        """Render a single block to HTML"""
        content = block.content
        
        if block.block_type == 'hero':
            return f'''
            <section class="hero" style="background-image: url('{content.get('background_image', '')}');">
                <div class="hero-content">
                    <h1>{content.get('title', '')}</h1>
                    <p>{content.get('subtitle', '')}</p>
                    {f'<a href="{content.get("cta_url", "#")}" class="btn">{content.get("cta_text", "")}</a>' if content.get('cta_text') else ''}
                </div>
            </section>
            '''
        
        elif block.block_type == 'article':
            return f'''
            <article class="article-block">
                <div class="container">
                    {f'<h2>{content.get("title", "")}</h2>' if content.get('title') else ''}
                    <div class="article-content">{content.get('text', '')}</div>
                </div>
            </article>
            '''
        
        elif block.block_type == 'text':
            return f'''
            <section class="text-block">
                <div class="container">
                    {f'<h2>{content.get("title", "")}</h2>' if content.get('title') else ''}
                    <div class="text-content">{content.get('text', '')}</div>
                </div>
            </section>
            '''
        
        elif block.block_type == 'image':
            return f'''
            <section class="image-block">
                <div class="container">
                    <img src="{content.get('image_url', '')}" alt="{content.get('alt_text', '')}" />
                    {f'<p class="caption">{content.get("caption", "")}</p>' if content.get('caption') else ''}
                </div>
            </section>
            '''
        
        elif block.block_type == 'text_image':
            title = content.get('title', '')
            text = content.get('text', '')
            image_url = content.get('image_url', '')
            alt_text = content.get('alt_text', '')
            image_position = content.get('image_position', 'left')
            image_size = content.get('image_size', 'medium')
            
            # Determine flex direction and widths
            flex_direction = 'row' if image_position in ['left', 'right'] else 'column'
            if image_position == 'right':
                flex_direction = 'row-reverse'
            elif image_position == 'bottom':
                flex_direction = 'column-reverse'
            
            size_map = {'small': '33%', 'medium': '50%', 'large': '66%'}
            image_width = size_map.get(image_size, '50%')
            
            return f'''
            <section class="text-image-block">
                <div class="container">
                    <div class="text-image-wrapper" style="display: flex; flex-direction: {flex_direction}; gap: 2rem; align-items: flex-start;">
                        <div class="text-image-img" style="flex: 0 0 {image_width};">
                            <img src="{image_url}" alt="{alt_text}" style="width: 100%; border-radius: 4px;" />
                        </div>
                        <div class="text-image-text" style="flex: 1;">
                            {f'<h2>{title}</h2>' if title else ''}
                            <div class="text-content">{text}</div>
                        </div>
                    </div>
                </div>
            </section>
            '''
        
        elif block.block_type == 'gallery':
            images = content.get('images', [])
            images_html = ''.join([
                f'<img src="{img.get("url", "")}" alt="{img.get("alt", "")}" />'
                for img in images
            ])
            return f'''
            <section class="gallery-block">
                <div class="container">
                    <div class="gallery-grid">{images_html}</div>
                </div>
            </section>
            '''
        
        elif block.block_type == 'cta':
            title = content.get('title', '')
            description = content.get('description', '')
            buttons = content.get('buttons', [])
            bg_color = content.get('background_color', '#1976d2')
            text_color = content.get('text_color', '#ffffff')
            
            buttons_html = ''
            for button in buttons:
                btn_text = button.get('text', '')
                btn_url = button.get('url', '#')
                btn_style = button.get('style', 'primary')
                btn_class = f'btn btn-{btn_style}'
                buttons_html += f'<a href="{btn_url}" class="{btn_class}">{btn_text}</a>'
            
            return f'''
            <section class="cta-block" style="background-color: {bg_color}; color: {text_color};">
                <div class="container">
                    {f'<h2 class="cta-title">{title}</h2>' if title else ''}
                    {f'<p class="cta-description">{description}</p>' if description else ''}
                    <div class="cta-buttons">
                        {buttons_html}
                    </div>
                </div>
            </section>
            '''
        
        elif block.block_type == 'faq':
            title = content.get('title', '')
            items = content.get('items', [])
            
            faq_items_html = ''
            for i, item in enumerate(items):
                question = item.get('question', '')
                answer = item.get('answer', '')
                faq_items_html += f'''
                <details class="faq-item">
                    <summary class="faq-question">{question}</summary>
                    <div class="faq-answer">{answer}</div>
                </details>
                '''
            
            return f'''
            <section class="faq-block">
                <div class="container">
                    {f'<h2 class="faq-title">{title}</h2>' if title else ''}
                    <div class="faq-list">
                        {faq_items_html}
                    </div>
                </div>
            </section>
            '''
        
        return ''
    
    def _build_navigation(self) -> str:
        """Build navigation menu"""
        nav_items = []
        for page in self.pages.order_by('order'):
            slug = page.slug if page.slug != 'home' else ''
            nav_items.append(f'<a href="/{slug}">{page.title}</a>')
        
        return f'<nav>{"".join(nav_items)}</nav>'
    
    def _build_global_css(self) -> str:
        """Build global CSS"""
        css = self.template.base_css or self._default_css()
        
        # Add custom colors if available
        if self.site.custom_colors:
            color_vars = '\n'.join([
                f'--{key}: {value};'
                for key, value in self.site.custom_colors.items()
            ])
            css = f':root {{ {color_vars} }}\n' + css
        
        return css
    
    def _default_html_template(self) -> str:
        """Default HTML template"""
        return '''
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{{page_title}} - {{brand_name}}</title>
            <meta name="description" content="{{meta_description}}">
            <link rel="stylesheet" href="/styles.css">
        </head>
        <body>
            {{navigation}}
            <main>
                {{content}}
            </main>
            {{footer}}
            <script src="/scripts.js"></script>
        </body>
        </html>
        '''
    
    def _default_css(self) -> str:
        """Default CSS"""
        return '''
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .hero { min-height: 500px; display: flex; align-items: center; justify-content: center; }
        .gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        '''


def build_site(site: Site) -> Dict[str, str]:
    """Helper function to build a site"""
    builder = SiteBuilder(site)
    return builder.build()
