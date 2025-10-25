import json
import re
import requests
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
from django.conf import settings
from .ai_service import AIService


class CompetitorAnalysisService:
    """
    Service for analyzing competitor websites and providing SEO insights
    """
    
    def __init__(self):
        self.ai_service = AIService()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def analyze_competitor(
        self,
        competitor_url: str,
        target_keywords: List[str] = None,
        analysis_depth: str = 'basic'
    ) -> Dict[str, any]:
        """
        Analyze a competitor website
        
        Args:
            competitor_url: URL of the competitor website
            target_keywords: Keywords to analyze for
            analysis_depth: 'basic', 'detailed', or 'comprehensive'
            
        Returns:
            Dict with competitor analysis results
        """
        
        try:
            # Validate and normalize URL
            normalized_url = self._normalize_url(competitor_url)
            
            # Fetch and parse the webpage
            page_data = self._fetch_page_data(normalized_url)
            
            if not page_data:
                return {
                    'success': False,
                    'error': 'Failed to fetch competitor page'
                }
            
            # Basic analysis
            basic_analysis = self._analyze_basic_seo(page_data)
            
            # Keyword analysis
            keyword_analysis = self._analyze_keywords(page_data, target_keywords or [])
            
            # Content analysis
            content_analysis = self._analyze_content(page_data)
            
            # Technical SEO analysis
            technical_analysis = self._analyze_technical_seo(page_data)
            
            # Meta analysis
            meta_analysis = self._analyze_meta_tags(page_data)
            
            # Generate insights
            insights = self._generate_insights(
                basic_analysis, keyword_analysis, content_analysis, 
                technical_analysis, meta_analysis, target_keywords
            )
            
            return {
                'success': True,
                'competitor_url': normalized_url,
                'analysis_timestamp': page_data.get('timestamp'),
                'basic_analysis': basic_analysis,
                'keyword_analysis': keyword_analysis,
                'content_analysis': content_analysis,
                'technical_analysis': technical_analysis,
                'meta_analysis': meta_analysis,
                'insights': insights,
                'recommendations': self._generate_recommendations(insights)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Analysis failed: {str(e)}',
                'fallback_analysis': self._generate_fallback_analysis(competitor_url)
            }
    
    def _normalize_url(self, url: str) -> str:
        """Normalize URL for analysis"""
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        parsed = urlparse(url)
        return f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
    
    def _fetch_page_data(self, url: str) -> Optional[Dict[str, any]]:
        """Fetch and parse webpage data"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract basic page data
            page_data = {
                'url': url,
                'title': self._extract_title(soup),
                'meta_description': self._extract_meta_description(soup),
                'h1_tags': self._extract_h1_tags(soup),
                'h2_tags': self._extract_h2_tags(soup),
                'h3_tags': self._extract_h3_tags(soup),
                'meta_keywords': self._extract_meta_keywords(soup),
                'canonical_url': self._extract_canonical_url(soup),
                'robots_meta': self._extract_robots_meta(soup),
                'content_text': self._extract_content_text(soup),
                'word_count': 0,
                'images': self._extract_images(soup),
                'links': self._extract_links(soup),
                'timestamp': response.headers.get('date', ''),
                'status_code': response.status_code,
                'content_type': response.headers.get('content-type', ''),
                'content_length': len(response.content)
            }
            
            # Calculate word count
            page_data['word_count'] = len(page_data['content_text'].split())
            
            return page_data
            
        except Exception as e:
            print(f"Error fetching page data: {e}")
            return None
    
    def _extract_title(self, soup: BeautifulSoup) -> str:
        """Extract page title"""
        title_tag = soup.find('title')
        return title_tag.get_text().strip() if title_tag else ''
    
    def _extract_meta_description(self, soup: BeautifulSoup) -> str:
        """Extract meta description"""
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        return meta_desc.get('content', '').strip() if meta_desc else ''
    
    def _extract_h1_tags(self, soup: BeautifulSoup) -> List[str]:
        """Extract H1 tags"""
        h1_tags = soup.find_all('h1')
        return [h1.get_text().strip() for h1 in h1_tags if h1.get_text().strip()]
    
    def _extract_h2_tags(self, soup: BeautifulSoup) -> List[str]:
        """Extract H2 tags"""
        h2_tags = soup.find_all('h2')
        return [h2.get_text().strip() for h2 in h2_tags if h2.get_text().strip()]
    
    def _extract_h3_tags(self, soup: BeautifulSoup) -> List[str]:
        """Extract H3 tags"""
        h3_tags = soup.find_all('h3')
        return [h3.get_text().strip() for h3 in h3_tags if h3.get_text().strip()]
    
    def _extract_meta_keywords(self, soup: BeautifulSoup) -> str:
        """Extract meta keywords"""
        meta_keywords = soup.find('meta', attrs={'name': 'keywords'})
        return meta_keywords.get('content', '').strip() if meta_keywords else ''
    
    def _extract_canonical_url(self, soup: BeautifulSoup) -> str:
        """Extract canonical URL"""
        canonical = soup.find('link', attrs={'rel': 'canonical'})
        return canonical.get('href', '').strip() if canonical else ''
    
    def _extract_robots_meta(self, soup: BeautifulSoup) -> str:
        """Extract robots meta tag"""
        robots = soup.find('meta', attrs={'name': 'robots'})
        return robots.get('content', '').strip() if robots else ''
    
    def _extract_content_text(self, soup: BeautifulSoup) -> str:
        """Extract main content text"""
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        # Get text content
        text = soup.get_text()
        
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        return text
    
    def _extract_images(self, soup: BeautifulSoup) -> List[Dict[str, str]]:
        """Extract image information"""
        images = []
        img_tags = soup.find_all('img')
        
        for img in img_tags:
            images.append({
                'src': img.get('src', ''),
                'alt': img.get('alt', ''),
                'title': img.get('title', '')
            })
        
        return images
    
    def _extract_links(self, soup: BeautifulSoup) -> List[Dict[str, str]]:
        """Extract link information"""
        links = []
        link_tags = soup.find_all('a', href=True)
        
        for link in link_tags:
            links.append({
                'href': link.get('href', ''),
                'text': link.get_text().strip(),
                'title': link.get('title', '')
            })
        
        return links
    
    def _analyze_basic_seo(self, page_data: Dict[str, any]) -> Dict[str, any]:
        """Analyze basic SEO elements"""
        title = page_data.get('title', '')
        meta_desc = page_data.get('meta_description', '')
        h1_tags = page_data.get('h1_tags', [])
        
        return {
            'title_length': len(title),
            'title_optimal': 30 <= len(title) <= 60,
            'meta_description_length': len(meta_desc),
            'meta_description_optimal': 50 <= len(meta_desc) <= 160,
            'h1_count': len(h1_tags),
            'h1_optimal': len(h1_tags) == 1,
            'has_meta_description': bool(meta_desc),
            'has_title': bool(title),
            'word_count': page_data.get('word_count', 0),
            'content_optimal': page_data.get('word_count', 0) >= 300
        }
    
    def _analyze_keywords(self, page_data: Dict[str, any], target_keywords: List[str]) -> Dict[str, any]:
        """Analyze keyword usage"""
        content_text = page_data.get('content_text', '').lower()
        title = page_data.get('title', '').lower()
        meta_desc = page_data.get('meta_description', '').lower()
        h1_tags = [h1.lower() for h1 in page_data.get('h1_tags', [])]
        
        keyword_analysis = {
            'target_keywords_found': [],
            'keyword_density': {},
            'title_keyword_usage': {},
            'meta_keyword_usage': {},
            'h1_keyword_usage': {}
        }
        
        for keyword in target_keywords:
            keyword_lower = keyword.lower()
            
            # Count keyword occurrences in content
            content_count = content_text.count(keyword_lower)
            word_count = len(content_text.split())
            density = (content_count / word_count * 100) if word_count > 0 else 0
            
            keyword_analysis['keyword_density'][keyword] = {
                'count': content_count,
                'density': round(density, 2)
            }
            
            # Check keyword usage in title
            keyword_analysis['title_keyword_usage'][keyword] = keyword_lower in title
            
            # Check keyword usage in meta description
            keyword_analysis['meta_keyword_usage'][keyword] = keyword_lower in meta_desc
            
            # Check keyword usage in H1 tags
            keyword_analysis['h1_keyword_usage'][keyword] = any(
                keyword_lower in h1 for h1 in h1_tags
            )
            
            if content_count > 0:
                keyword_analysis['target_keywords_found'].append(keyword)
        
        return keyword_analysis
    
    def _analyze_content(self, page_data: Dict[str, any]) -> Dict[str, any]:
        """Analyze content structure and quality"""
        h1_tags = page_data.get('h1_tags', [])
        h2_tags = page_data.get('h2_tags', [])
        h3_tags = page_data.get('h3_tags', [])
        images = page_data.get('images', [])
        links = page_data.get('links', [])
        
        # Analyze heading structure
        heading_analysis = {
            'h1_count': len(h1_tags),
            'h2_count': len(h2_tags),
            'h3_count': len(h3_tags),
            'heading_structure_optimal': len(h1_tags) == 1 and len(h2_tags) > 0,
            'h1_text': h1_tags[0] if h1_tags else '',
            'h2_texts': h2_tags[:5]  # First 5 H2 tags
        }
        
        # Analyze images
        images_with_alt = [img for img in images if img.get('alt')]
        image_analysis = {
            'total_images': len(images),
            'images_with_alt': len(images_with_alt),
            'alt_text_coverage': (len(images_with_alt) / len(images) * 100) if images else 0,
            'images_optimal': len(images_with_alt) == len(images) if images else True
        }
        
        # Analyze links
        internal_links = [link for link in links if link.get('href', '').startswith('/')]
        external_links = [link for link in links if link.get('href', '').startswith('http')]
        
        link_analysis = {
            'total_links': len(links),
            'internal_links': len(internal_links),
            'external_links': len(external_links),
            'links_with_text': len([link for link in links if link.get('text')])
        }
        
        return {
            'heading_analysis': heading_analysis,
            'image_analysis': image_analysis,
            'link_analysis': link_analysis,
            'content_structure_score': self._calculate_content_score(heading_analysis, image_analysis, link_analysis)
        }
    
    def _analyze_technical_seo(self, page_data: Dict[str, any]) -> Dict[str, any]:
        """Analyze technical SEO elements"""
        canonical_url = page_data.get('canonical_url', '')
        robots_meta = page_data.get('robots_meta', '')
        content_type = page_data.get('content_type', '')
        content_length = page_data.get('content_length', 0)
        
        return {
            'has_canonical': bool(canonical_url),
            'canonical_url': canonical_url,
            'robots_meta': robots_meta,
            'content_type': content_type,
            'content_length': content_length,
            'page_size_optimal': content_length < 1000000,  # Less than 1MB
            'technical_score': self._calculate_technical_score(canonical_url, robots_meta, content_length)
        }
    
    def _analyze_meta_tags(self, page_data: Dict[str, any]) -> Dict[str, any]:
        """Analyze meta tags and structured data"""
        title = page_data.get('title', '')
        meta_desc = page_data.get('meta_description', '')
        meta_keywords = page_data.get('meta_keywords', '')
        
        return {
            'title': title,
            'meta_description': meta_desc,
            'meta_keywords': meta_keywords,
            'has_meta_keywords': bool(meta_keywords),
            'meta_keywords_count': len(meta_keywords.split(',')) if meta_keywords else 0,
            'meta_score': self._calculate_meta_score(title, meta_desc, meta_keywords)
        }
    
    def _calculate_content_score(self, heading_analysis: Dict, image_analysis: Dict, link_analysis: Dict) -> int:
        """Calculate content structure score"""
        score = 0
        
        # Heading structure (40 points)
        if heading_analysis['h1_count'] == 1:
            score += 20
        if heading_analysis['h2_count'] > 0:
            score += 20
        
        # Image optimization (30 points)
        if image_analysis['alt_text_coverage'] == 100:
            score += 30
        elif image_analysis['alt_text_coverage'] >= 80:
            score += 20
        elif image_analysis['alt_text_coverage'] >= 50:
            score += 10
        
        # Link structure (30 points)
        if link_analysis['total_links'] > 0:
            score += 10
        if link_analysis['internal_links'] > 0:
            score += 10
        if link_analysis['external_links'] > 0:
            score += 10
        
        return min(100, score)
    
    def _calculate_technical_score(self, canonical_url: str, robots_meta: str, content_length: int) -> int:
        """Calculate technical SEO score"""
        score = 0
        
        # Canonical URL (40 points)
        if canonical_url:
            score += 40
        
        # Robots meta (30 points)
        if robots_meta:
            score += 30
        
        # Page size (30 points)
        if content_length < 1000000:  # Less than 1MB
            score += 30
        elif content_length < 2000000:  # Less than 2MB
            score += 20
        else:
            score += 10
        
        return min(100, score)
    
    def _calculate_meta_score(self, title: str, meta_desc: str, meta_keywords: str) -> int:
        """Calculate meta tags score"""
        score = 0
        
        # Title (40 points)
        if title:
            score += 20
            if 30 <= len(title) <= 60:
                score += 20
        
        # Meta description (40 points)
        if meta_desc:
            score += 20
            if 50 <= len(meta_desc) <= 160:
                score += 20
        
        # Meta keywords (20 points)
        if meta_keywords:
            score += 20
        
        return min(100, score)
    
    def _generate_insights(
        self,
        basic_analysis: Dict,
        keyword_analysis: Dict,
        content_analysis: Dict,
        technical_analysis: Dict,
        meta_analysis: Dict,
        target_keywords: List[str]
    ) -> List[str]:
        """Generate insights from analysis"""
        insights = []
        
        # Basic SEO insights
        if not basic_analysis['title_optimal']:
            insights.append(f"Title length ({basic_analysis['title_length']}) should be 30-60 characters")
        
        if not basic_analysis['meta_description_optimal']:
            insights.append(f"Meta description length ({basic_analysis['meta_description_length']}) should be 50-160 characters")
        
        if not basic_analysis['h1_optimal']:
            insights.append(f"Should have exactly 1 H1 tag (found {basic_analysis['h1_count']})")
        
        if not basic_analysis['content_optimal']:
            insights.append(f"Content is too short ({basic_analysis['word_count']} words, aim for 300+)")
        
        # Keyword insights
        if target_keywords:
            found_keywords = keyword_analysis['target_keywords_found']
            if found_keywords:
                insights.append(f"Uses target keywords: {', '.join(found_keywords)}")
            else:
                insights.append("Does not use any target keywords in content")
        
        # Content insights
        content_score = content_analysis['content_structure_score']
        if content_score < 70:
            insights.append(f"Content structure needs improvement (score: {content_score}/100)")
        
        # Technical insights
        technical_score = technical_analysis['technical_score']
        if technical_score < 70:
            insights.append(f"Technical SEO needs improvement (score: {technical_score}/100)")
        
        # Meta insights
        meta_score = meta_analysis['meta_score']
        if meta_score < 70:
            insights.append(f"Meta tags need optimization (score: {meta_score}/100)")
        
        return insights
    
    def _generate_recommendations(self, insights: List[str]) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        for insight in insights:
            if 'Title length' in insight:
                recommendations.append("Optimize title length for better search engine display")
            elif 'Meta description' in insight:
                recommendations.append("Write compelling meta description within optimal length")
            elif 'H1 tag' in insight:
                recommendations.append("Ensure exactly one H1 tag per page for better structure")
            elif 'Content is too short' in insight:
                recommendations.append("Expand content with valuable information and keywords")
            elif 'target keywords' in insight:
                recommendations.append("Research and implement relevant keywords naturally")
            elif 'Content structure' in insight:
                recommendations.append("Improve heading hierarchy and content organization")
            elif 'Technical SEO' in insight:
                recommendations.append("Fix technical issues like canonical URLs and page speed")
            elif 'Meta tags' in insight:
                recommendations.append("Optimize meta tags for better search visibility")
        
        return recommendations
    
    def _generate_fallback_analysis(self, url: str) -> Dict[str, any]:
        """Generate basic fallback analysis when full analysis fails"""
        return {
            'competitor_url': url,
            'analysis_type': 'fallback',
            'message': 'Full analysis unavailable, basic information only',
            'recommendations': [
                'Manually analyze competitor website',
                'Check title and meta description',
                'Review content structure',
                'Analyze keyword usage'
            ]
        }
    
    def compare_competitors(
        self,
        competitor_urls: List[str],
        target_keywords: List[str] = None
    ) -> Dict[str, any]:
        """Compare multiple competitors"""
        try:
            competitor_analyses = []
            
            for url in competitor_urls:
                analysis = self.analyze_competitor(url, target_keywords)
                if analysis['success']:
                    competitor_analyses.append(analysis)
            
            if not competitor_analyses:
                return {
                    'success': False,
                    'error': 'No successful competitor analyses'
                }
            
            # Generate comparison insights
            comparison_insights = self._generate_comparison_insights(competitor_analyses, target_keywords)
            
            return {
                'success': True,
                'competitor_count': len(competitor_analyses),
                'competitor_analyses': competitor_analyses,
                'comparison_insights': comparison_insights,
                'recommendations': self._generate_comparison_recommendations(comparison_insights)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Comparison failed: {str(e)}'
            }
    
    def _generate_comparison_insights(self, analyses: List[Dict], target_keywords: List[str]) -> List[str]:
        """Generate insights from competitor comparison"""
        insights = []
        
        # Compare title lengths
        title_lengths = [a['basic_analysis']['title_length'] for a in analyses]
        avg_title_length = sum(title_lengths) / len(title_lengths)
        insights.append(f"Average title length: {avg_title_length:.0f} characters")
        
        # Compare content lengths
        word_counts = [a['basic_analysis']['word_count'] for a in analyses]
        avg_word_count = sum(word_counts) / len(word_counts)
        insights.append(f"Average content length: {avg_word_count:.0f} words")
        
        # Compare keyword usage
        if target_keywords:
            keyword_usage = {}
            for keyword in target_keywords:
                usage_count = sum(1 for a in analyses if keyword in a['keyword_analysis']['target_keywords_found'])
                keyword_usage[keyword] = usage_count
            
            most_used_keyword = max(keyword_usage.items(), key=lambda x: x[1])
            insights.append(f"Most used target keyword: {most_used_keyword[0]} ({most_used_keyword[1]}/{len(analyses)} competitors)")
        
        return insights
    
    def _generate_comparison_recommendations(self, insights: List[str]) -> List[str]:
        """Generate recommendations from comparison insights"""
        recommendations = []
        
        for insight in insights:
            if 'Average title length' in insight:
                recommendations.append("Optimize title length based on competitor average")
            elif 'Average content length' in insight:
                recommendations.append("Match or exceed competitor content length")
            elif 'Most used target keyword' in insight:
                recommendations.append("Consider using the most popular competitor keyword")
        
        return recommendations
