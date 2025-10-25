import json
import re
from typing import Dict, List, Optional, Tuple
from django.conf import settings
from .ai_service import AIService


class LSIKeywordService:
    """
    Service for LSI (Latent Semantic Indexing) keyword research and analysis
    """
    
    def __init__(self):
        self.ai_service = AIService()
    
    def research_lsi_keywords(
        self,
        primary_keyword: str,
        content: str = "",
        industry: str = "",
        target_audience: str = "",
        max_keywords: int = 20
    ) -> Dict[str, any]:
        """
        Research LSI keywords related to a primary keyword
        
        Args:
            primary_keyword: The main keyword to research
            content: Existing page content for context
            industry: Industry/niche context
            target_audience: Target audience description
            max_keywords: Maximum number of keywords to return
            
        Returns:
            Dict with keyword research results
        """
        
        try:
            # Generate LSI keywords using AI
            lsi_keywords = self._generate_lsi_keywords(
                primary_keyword, content, industry, target_audience, max_keywords
            )
            
            # Analyze keyword difficulty and relevance
            analyzed_keywords = self._analyze_keywords(lsi_keywords, primary_keyword)
            
            # Categorize keywords
            categorized = self._categorize_keywords(analyzed_keywords)
            
            # Generate keyword suggestions for content
            content_suggestions = self._generate_content_suggestions(
                primary_keyword, analyzed_keywords, content
            )
            
            return {
                'success': True,
                'primary_keyword': primary_keyword,
                'total_keywords': len(analyzed_keywords),
                'keywords': analyzed_keywords,
                'categories': categorized,
                'content_suggestions': content_suggestions,
                'research_summary': self._generate_research_summary(
                    primary_keyword, analyzed_keywords
                )
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'fallback_keywords': self._generate_fallback_keywords(primary_keyword)
            }
    
    def _generate_lsi_keywords(
        self,
        primary_keyword: str,
        content: str,
        industry: str,
        target_audience: str,
        max_keywords: int
    ) -> List[str]:
        """Generate LSI keywords using AI"""
        
        prompt = f"""
        Generate {max_keywords} LSI (Latent Semantic Indexing) keywords related to "{primary_keyword}".
        
        LSI keywords are semantically related terms that search engines use to understand content context.
        They should be:
        - Thematically related to the primary keyword
        - Commonly used together in content
        - Natural variations and synonyms
        - Long-tail variations
        - Industry-specific terms
        
        Primary Keyword: {primary_keyword}
        Industry: {industry or 'General'}
        Target Audience: {target_audience or 'General audience'}
        Content Context: {content[:300] if content else 'No content provided'}
        
        Return ONLY a comma-separated list of keywords, no explanations or extra text.
        Example format: keyword1, keyword2, keyword3, keyword4
        """
        
        try:
            response = self.ai_service.generate_content(prompt, max_tokens=300)
            keywords = [k.strip() for k in response.split(',') if k.strip()]
            
            # Clean and validate keywords
            cleaned_keywords = []
            for keyword in keywords:
                # Remove quotes and extra whitespace
                keyword = keyword.strip().strip('"').strip("'")
                # Filter out very short or very long keywords
                if 2 <= len(keyword) <= 50:
                    cleaned_keywords.append(keyword)
            
            return cleaned_keywords[:max_keywords]
            
        except Exception as e:
            # Fallback to basic keyword variations
            return self._generate_fallback_keywords(primary_keyword)[:max_keywords]
    
    def _analyze_keywords(self, keywords: List[str], primary_keyword: str) -> List[Dict[str, any]]:
        """Analyze keyword difficulty, relevance, and other metrics"""
        
        analyzed = []
        
        for keyword in keywords:
            # Calculate relevance score (0-100)
            relevance = self._calculate_relevance(keyword, primary_keyword)
            
            # Estimate difficulty (0-100)
            difficulty = self._estimate_difficulty(keyword)
            
            # Determine keyword type
            keyword_type = self._determine_keyword_type(keyword, primary_keyword)
            
            # Calculate search volume estimate
            search_volume = self._estimate_search_volume(keyword)
            
            analyzed.append({
                'keyword': keyword,
                'relevance_score': relevance,
                'difficulty_score': difficulty,
                'search_volume_estimate': search_volume,
                'keyword_type': keyword_type,
                'recommended': relevance >= 70 and difficulty <= 60,
                'priority': self._calculate_priority(relevance, difficulty)
            })
        
        # Sort by priority
        analyzed.sort(key=lambda x: x['priority'], reverse=True)
        
        return analyzed
    
    def _calculate_relevance(self, keyword: str, primary_keyword: str) -> int:
        """Calculate relevance score between 0-100"""
        
        # Convert to lowercase for comparison
        keyword_lower = keyword.lower()
        primary_lower = primary_keyword.lower()
        
        # Exact match
        if keyword_lower == primary_lower:
            return 100
        
        # Check for word overlap
        keyword_words = set(keyword_lower.split())
        primary_words = set(primary_lower.split())
        
        if not keyword_words or not primary_words:
            return 0
        
        # Calculate Jaccard similarity
        intersection = keyword_words.intersection(primary_words)
        union = keyword_words.union(primary_words)
        
        if not union:
            return 0
        
        jaccard_score = len(intersection) / len(union)
        
        # Boost score for semantic similarity
        semantic_boost = 0
        if any(word in keyword_lower for word in primary_words):
            semantic_boost = 20
        
        # Boost for length similarity
        length_boost = 0
        length_diff = abs(len(keyword) - len(primary_keyword))
        if length_diff <= 5:
            length_boost = 10
        
        final_score = int((jaccard_score * 60) + semantic_boost + length_boost)
        return min(100, max(0, final_score))
    
    def _estimate_difficulty(self, keyword: str) -> int:
        """Estimate keyword difficulty (0-100)"""
        
        # Shorter keywords are generally more competitive
        length_factor = min(50, len(keyword) * 2)
        
        # Common words increase difficulty
        common_words = ['the', 'and', 'or', 'for', 'with', 'best', 'top', 'how', 'what', 'why']
        common_word_penalty = sum(10 for word in common_words if word in keyword.lower())
        
        # Long-tail keywords are generally easier
        word_count = len(keyword.split())
        long_tail_bonus = max(0, (word_count - 2) * 10)
        
        # Special characters and numbers can indicate easier keywords
        special_char_bonus = 5 if any(c in keyword for c in ['-', '_', '(', ')', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) else 0
        
        difficulty = length_factor + common_word_penalty - long_tail_bonus - special_char_bonus
        return min(100, max(0, int(difficulty)))
    
    def _determine_keyword_type(self, keyword: str, primary_keyword: str) -> str:
        """Determine the type of keyword"""
        
        keyword_lower = keyword.lower()
        primary_lower = primary_keyword.lower()
        
        if keyword_lower == primary_lower:
            return 'primary'
        elif any(word in keyword_lower for word in primary_lower.split()):
            return 'related'
        elif len(keyword.split()) > 3:
            return 'long_tail'
        elif any(word in keyword_lower for word in ['how', 'what', 'why', 'when', 'where']):
            return 'question'
        elif any(word in keyword_lower for word in ['best', 'top', 'review', 'guide']):
            return 'commercial'
        else:
            return 'semantic'
    
    def _estimate_search_volume(self, keyword: str) -> str:
        """Estimate search volume category"""
        
        word_count = len(keyword.split())
        length = len(keyword)
        
        # Very short, common keywords
        if word_count == 1 and length <= 8:
            return 'High (10K+)'
        
        # Short, common keywords
        elif word_count <= 2 and length <= 15:
            return 'Medium (1K-10K)'
        
        # Long-tail keywords
        elif word_count >= 4:
            return 'Low (100-1K)'
        
        # Medium length keywords
        else:
            return 'Medium-Low (500-5K)'
    
    def _calculate_priority(self, relevance: int, difficulty: int) -> int:
        """Calculate priority score for ranking keywords"""
        
        # High relevance, low difficulty = high priority
        # Weight relevance more heavily
        priority = (relevance * 0.7) + ((100 - difficulty) * 0.3)
        return int(priority)
    
    def _categorize_keywords(self, keywords: List[Dict[str, any]]) -> Dict[str, List[Dict[str, any]]]:
        """Categorize keywords by type"""
        
        categories = {
            'primary': [],
            'related': [],
            'long_tail': [],
            'question': [],
            'commercial': [],
            'semantic': []
        }
        
        for keyword_data in keywords:
            keyword_type = keyword_data['keyword_type']
            if keyword_type in categories:
                categories[keyword_type].append(keyword_data)
        
        return categories
    
    def _generate_content_suggestions(
        self,
        primary_keyword: str,
        keywords: List[Dict[str, any]],
        existing_content: str
    ) -> List[str]:
        """Generate content suggestions based on keywords"""
        
        # Get top recommended keywords
        recommended = [k for k in keywords if k['recommended']][:5]
        
        if not recommended:
            return []
        
        suggestions = []
        
        # Suggest using keywords in headings
        if recommended:
            keyword_list = ', '.join([k['keyword'] for k in recommended[:3]])
            suggestions.append(f"Consider using these keywords in headings: {keyword_list}")
        
        # Suggest content expansion
        if len(existing_content) < 500:
            suggestions.append("Expand content to include more keyword variations naturally")
        
        # Suggest FAQ section
        question_keywords = [k for k in keywords if k['keyword_type'] == 'question']
        if question_keywords:
            suggestions.append(f"Add FAQ section with questions like: {question_keywords[0]['keyword']}")
        
        # Suggest related topics
        semantic_keywords = [k for k in keywords if k['keyword_type'] == 'semantic']
        if semantic_keywords:
            suggestions.append(f"Cover related topics: {semantic_keywords[0]['keyword']}")
        
        return suggestions
    
    def _generate_research_summary(
        self,
        primary_keyword: str,
        keywords: List[Dict[str, any]]
    ) -> str:
        """Generate a summary of the keyword research"""
        
        total_keywords = len(keywords)
        recommended_count = len([k for k in keywords if k['recommended']])
        avg_difficulty = sum(k['difficulty_score'] for k in keywords) / total_keywords if total_keywords > 0 else 0
        
        return f"Found {total_keywords} LSI keywords for '{primary_keyword}'. {recommended_count} are recommended for use. Average difficulty: {avg_difficulty:.0f}/100."
    
    def _generate_fallback_keywords(self, primary_keyword: str) -> List[str]:
        """Generate basic fallback keywords when AI is not available"""
        
        # Basic keyword variations
        variations = [
            f"{primary_keyword} guide",
            f"{primary_keyword} tips",
            f"best {primary_keyword}",
            f"{primary_keyword} review",
            f"how to {primary_keyword}",
            f"{primary_keyword} tutorial",
            f"{primary_keyword} examples",
            f"{primary_keyword} benefits",
            f"{primary_keyword} features",
            f"{primary_keyword} comparison"
        ]
        
        return variations
    
    def analyze_keyword_density(
        self,
        content: str,
        target_keywords: List[str]
    ) -> Dict[str, any]:
        """Analyze keyword density in content"""
        
        if not content or not target_keywords:
            return {
                'success': False,
                'error': 'Content or keywords not provided'
            }
        
        # Clean content
        content_lower = re.sub(r'[^\w\s]', ' ', content.lower())
        words = content_lower.split()
        total_words = len(words)
        
        if total_words == 0:
            return {
                'success': False,
                'error': 'No words found in content'
            }
        
        keyword_analysis = []
        
        for keyword in target_keywords:
            keyword_lower = keyword.lower()
            keyword_words = keyword_lower.split()
            
            # Count exact phrase matches
            exact_matches = content_lower.count(keyword_lower)
            
            # Count individual word matches
            word_matches = sum(content_lower.count(word) for word in keyword_words)
            
            # Calculate density
            exact_density = (exact_matches * len(keyword_words) / total_words) * 100
            word_density = (word_matches / total_words) * 100
            
            # Determine status
            if exact_density >= 1 and exact_density <= 3:
                status = 'optimal'
            elif exact_density < 1:
                status = 'low'
            else:
                status = 'high'
            
            keyword_analysis.append({
                'keyword': keyword,
                'exact_matches': exact_matches,
                'word_matches': word_matches,
                'exact_density': round(exact_density, 2),
                'word_density': round(word_density, 2),
                'status': status,
                'recommendation': self._get_density_recommendation(status, exact_density)
            })
        
        return {
            'success': True,
            'total_words': total_words,
            'keyword_analysis': keyword_analysis,
            'overall_density': round(sum(k['exact_density'] for k in keyword_analysis), 2)
        }
    
    def _get_density_recommendation(self, status: str, density: float) -> str:
        """Get recommendation based on keyword density"""
        
        if status == 'optimal':
            return 'Perfect density! Keep as is.'
        elif status == 'low':
            return f'Increase usage. Current density: {density:.1f}% (target: 1-3%)'
        else:
            return f'Reduce usage. Current density: {density:.1f}% (target: 1-3%)'
