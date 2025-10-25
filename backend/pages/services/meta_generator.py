import json
import re
from typing import Dict, List, Optional, Tuple
from django.conf import settings
from .ai_service import AIService


class MetaGeneratorService:
    """
    AI-powered service for generating SEO-optimized meta tags
    """
    
    def __init__(self):
        self.ai_service = AIService()
    
    def generate_meta_tags(
        self, 
        page_title: str,
        page_content: str,
        keywords: Optional[str] = None,
        site_domain: Optional[str] = None,
        target_audience: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Generate SEO-optimized meta title and description
        
        Args:
            page_title: The main page title
            page_content: The page content (from blocks)
            keywords: Optional keywords to include
            site_domain: The site domain for context
            target_audience: Target audience description
            
        Returns:
            Dict with 'title', 'description', 'h1_tag', 'keywords'
        """
        
        # Extract content from page blocks
        content_text = self._extract_text_from_content(page_content)
        
        # Generate meta title
        meta_title = self._generate_meta_title(
            page_title, content_text, keywords, site_domain
        )
        
        # Generate meta description
        meta_description = self._generate_meta_description(
            page_title, content_text, keywords, target_audience
        )
        
        # Generate H1 tag
        h1_tag = self._generate_h1_tag(page_title, content_text)
        
        # Generate keywords
        generated_keywords = self._generate_keywords(
            page_title, content_text, keywords
        )
        
        return {
            'title': meta_title,
            'meta_description': meta_description,
            'h1_tag': h1_tag,
            'keywords': generated_keywords
        }
    
    def _extract_text_from_content(self, page_content: str) -> str:
        """Extract plain text from page content JSON"""
        try:
            if not page_content:
                return ""
            
            content_data = json.loads(page_content) if isinstance(page_content, str) else page_content
            
            if not isinstance(content_data, list):
                return ""
            
            text_parts = []
            
            for block in content_data:
                if not isinstance(block, dict):
                    continue
                
                block_type = block.get('block_type', '')
                content = block.get('content', {})
                
                # Extract text based on block type
                if block_type == 'text':
                    text_parts.append(content.get('text', ''))
                elif block_type == 'article':
                    text_parts.append(content.get('text', ''))
                elif block_type == 'hero':
                    text_parts.append(content.get('title', ''))
                    text_parts.append(content.get('subtitle', ''))
                elif block_type == 'faq':
                    for item in content.get('items', []):
                        text_parts.append(item.get('question', ''))
                        text_parts.append(item.get('answer', ''))
                elif block_type == 'cta':
                    text_parts.append(content.get('title', ''))
                    text_parts.append(content.get('description', ''))
                elif block_type == 'text_image':
                    text_parts.append(content.get('title', ''))
                    text_parts.append(content.get('text', ''))
                
                # Add any other text fields
                for key, value in content.items():
                    if isinstance(value, str) and len(value) > 10:
                        text_parts.append(value)
            
            # Join and clean text
            full_text = ' '.join(text_parts)
            return self._clean_text(full_text)
            
        except (json.JSONDecodeError, TypeError, AttributeError):
            return ""
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        if not text:
            return ""
        
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', ' ', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s.,!?-]', ' ', text)
        
        return text.strip()
    
    def _generate_meta_title(
        self, 
        page_title: str, 
        content: str, 
        keywords: Optional[str] = None,
        site_domain: Optional[str] = None
    ) -> str:
        """Generate SEO-optimized meta title (30-60 characters)"""
        
        prompt = f"""
        Create an SEO-optimized meta title for a webpage. The title should be:
        - 30-60 characters long
        - Include primary keywords
        - Compelling and click-worthy
        - Clear and descriptive
        
        Page Title: {page_title}
        Content Summary: {content[:500]}
        Keywords: {keywords or 'Not specified'}
        Site Domain: {site_domain or 'Not specified'}
        
        Return ONLY the meta title, no quotes or extra text.
        """
        
        try:
            response = self.ai_service.generate_content(prompt, max_tokens=100)
            title = response.strip().strip('"').strip("'")
            
            # Ensure length constraints
            if len(title) > 60:
                title = title[:57] + "..."
            elif len(title) < 30:
                # Try to extend with keywords
                if keywords:
                    keyword_list = [k.strip() for k in keywords.split(',')]
                    for keyword in keyword_list:
                        if len(title + f" - {keyword}") <= 60:
                            title = f"{title} - {keyword}"
                            break
            
            return title
            
        except Exception as e:
            # Fallback to page title with length check
            if len(page_title) <= 60:
                return page_title
            return page_title[:57] + "..."
    
    def _generate_meta_description(
        self, 
        page_title: str, 
        content: str, 
        keywords: Optional[str] = None,
        target_audience: Optional[str] = None
    ) -> str:
        """Generate SEO-optimized meta description (50-160 characters)"""
        
        prompt = f"""
        Create an SEO-optimized meta description for a webpage. The description should be:
        - 50-160 characters long
        - Include primary keywords naturally
        - Compelling and encourage clicks
        - Summarize the page value proposition
        
        Page Title: {page_title}
        Content Summary: {content[:500]}
        Keywords: {keywords or 'Not specified'}
        Target Audience: {target_audience or 'General audience'}
        
        Return ONLY the meta description, no quotes or extra text.
        """
        
        try:
            response = self.ai_service.generate_content(prompt, max_tokens=150)
            description = response.strip().strip('"').strip("'")
            
            # Ensure length constraints
            if len(description) > 160:
                description = description[:157] + "..."
            elif len(description) < 50:
                # Extend with content summary
                if content:
                    words = content.split()[:10]
                    extension = " ".join(words)
                    if len(description + f" {extension}") <= 160:
                        description = f"{description} {extension}"
            
            return description
            
        except Exception as e:
            # Fallback to content summary
            if content:
                words = content.split()[:20]
                fallback = " ".join(words)
                if len(fallback) > 160:
                    fallback = fallback[:157] + "..."
                return fallback
            return f"Learn more about {page_title.lower()}"
    
    def _generate_h1_tag(self, page_title: str, content: str) -> str:
        """Generate H1 tag (max 70 characters)"""
        
        prompt = f"""
        Create an H1 tag for a webpage. The H1 should be:
        - Maximum 70 characters
        - Clear and descriptive
        - Include primary keywords
        - Different from the meta title
        
        Page Title: {page_title}
        Content Summary: {content[:300]}
        
        Return ONLY the H1 tag, no quotes or extra text.
        """
        
        try:
            response = self.ai_service.generate_content(prompt, max_tokens=100)
            h1 = response.strip().strip('"').strip("'")
            
            # Ensure length constraint
            if len(h1) > 70:
                h1 = h1[:67] + "..."
            
            return h1
            
        except Exception as e:
            # Fallback to page title
            if len(page_title) <= 70:
                return page_title
            return page_title[:67] + "..."
    
    def _generate_keywords(
        self, 
        page_title: str, 
        content: str, 
        existing_keywords: Optional[str] = None
    ) -> str:
        """Generate relevant keywords"""
        
        prompt = f"""
        Generate 5-10 relevant SEO keywords for a webpage. Return them as a comma-separated list.
        
        Page Title: {page_title}
        Content Summary: {content[:500]}
        Existing Keywords: {existing_keywords or 'None'}
        
        Focus on:
        - Primary keywords from the title
        - Long-tail keywords from content
        - Related terms and synonyms
        - Industry-specific terms
        
        Return ONLY the keywords separated by commas, no extra text.
        """
        
        try:
            response = self.ai_service.generate_content(prompt, max_tokens=200)
            keywords = response.strip().strip('"').strip("'")
            
            # Clean and validate keywords
            keyword_list = [k.strip() for k in keywords.split(',')]
            keyword_list = [k for k in keyword_list if len(k) > 2 and len(k) < 50]
            
            # Limit to 10 keywords
            if len(keyword_list) > 10:
                keyword_list = keyword_list[:10]
            
            return ', '.join(keyword_list)
            
        except Exception as e:
            # Fallback to basic keywords from title
            words = page_title.lower().split()
            # Filter out common words
            stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
            keywords = [w for w in words if w not in stop_words and len(w) > 2]
            return ', '.join(keywords[:5])
    
    def analyze_seo_potential(
        self, 
        page_title: str, 
        content: str, 
        current_meta: Dict[str, str]
    ) -> Dict[str, any]:
        """
        Analyze SEO potential and provide recommendations
        
        Returns:
            Dict with analysis results and recommendations
        """
        
        analysis = {
            'score': 0,
            'recommendations': [],
            'strengths': [],
            'weaknesses': []
        }
        
        # Analyze title
        title = current_meta.get('title', '')
        if 30 <= len(title) <= 60:
            analysis['score'] += 20
            analysis['strengths'].append('Title length is optimal')
        else:
            analysis['score'] += 10
            analysis['weaknesses'].append(f'Title length ({len(title)}) should be 30-60 characters')
        
        # Analyze description
        description = current_meta.get('meta_description', '')
        if 50 <= len(description) <= 160:
            analysis['score'] += 20
            analysis['strengths'].append('Description length is optimal')
        else:
            analysis['score'] += 10
            analysis['weaknesses'].append(f'Description length ({len(description)}) should be 50-160 characters')
        
        # Analyze H1
        h1 = current_meta.get('h1_tag', '')
        if h1 and len(h1) <= 70:
            analysis['score'] += 15
            analysis['strengths'].append('H1 tag is present and optimal length')
        else:
            analysis['weaknesses'].append('H1 tag is missing or too long')
        
        # Analyze keywords
        keywords = current_meta.get('keywords', '')
        if keywords:
            keyword_count = len([k.strip() for k in keywords.split(',') if k.strip()])
            if 3 <= keyword_count <= 10:
                analysis['score'] += 15
                analysis['strengths'].append(f'Good keyword count ({keyword_count})')
            else:
                analysis['score'] += 10
                analysis['weaknesses'].append(f'Keyword count ({keyword_count}) should be 3-10')
        else:
            analysis['weaknesses'].append('No keywords defined')
        
        # Analyze content quality
        if len(content) > 300:
            analysis['score'] += 15
            analysis['strengths'].append('Good content length')
        else:
            analysis['weaknesses'].append('Content is too short (aim for 300+ words)')
        
        # Analyze keyword density
        if keywords and content:
            keyword_list = [k.strip().lower() for k in keywords.split(',')]
            content_lower = content.lower()
            keyword_density = sum(content_lower.count(k) for k in keyword_list) / len(content.split()) * 100
            
            if 1 <= keyword_density <= 3:
                analysis['score'] += 15
                analysis['strengths'].append('Good keyword density')
            else:
                analysis['weaknesses'].append(f'Keyword density ({keyword_density:.1f}%) should be 1-3%')
        
        # Generate recommendations
        if analysis['score'] < 70:
            analysis['recommendations'].append('Consider using AI to generate optimized meta tags')
        
        if not h1:
            analysis['recommendations'].append('Add an H1 tag for better SEO')
        
        if not keywords:
            analysis['recommendations'].append('Define relevant keywords')
        
        if len(content) < 300:
            analysis['recommendations'].append('Add more content to improve SEO')
        
        return analysis
