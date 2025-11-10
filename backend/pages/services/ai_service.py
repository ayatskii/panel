from django.conf import settings
import logging

from integrations.ai.providers.factory import ProviderFactory
from integrations.ai.providers.model_mapper import ModelMapper

logger = logging.getLogger(__name__)


class AIService:
    """Simple AI service for meta generation with provider abstraction"""
    
    def __init__(self):
        self.default_model = getattr(settings, 'DEFAULT_AI_MODEL', 'gpt-3.5-turbo')
        self._provider = None
    
    @property
    def provider(self):
        """Lazy-load provider"""
        if self._provider is None:
            self._provider = ProviderFactory.create_provider()
        if self._provider is None:
            raise ValueError("No AI provider configured. Please set AI_PROVIDER and corresponding API keys.")
        return self._provider
    
    def generate_content(self, prompt: str, max_tokens: int = 200, model: str = None) -> str:
        """
        Generate content using AI
        
        Args:
            prompt: The prompt to send to AI
            max_tokens: Maximum tokens to generate
            model: AI model to use (defaults to configured model)
            
        Returns:
            Generated content string
        """
        model = model or self.default_model
        
        try:
            # Get provider for model
            provider = ProviderFactory.get_provider_for_model(model) or self.provider
            
            if provider is None:
                return self._generate_fallback_response(prompt)
            
            # Normalize model name
            normalized_model = ModelMapper.normalize_model_name(model, provider)
            if not normalized_model:
                normalized_model = ModelMapper.get_default_model(provider.provider_name)
            
            # Prepare messages
            messages = [
                {"role": "user", "content": prompt}
            ]
            
            # Generate content
            result = provider.generate_content(
                messages=messages,
                model=normalized_model,
                max_tokens=max_tokens,
                temperature=0.7,
                system_prompt="You are an SEO expert. Generate concise, optimized content for web pages."
            )
            
            return result['content']
        except Exception as e:
            logger.warning(f"AI generation failed, using fallback: {e}")
            # Return a fallback response
            return self._generate_fallback_response(prompt)
    
    def _generate_fallback_response(self, prompt: str) -> str:
        """Generate a simple fallback response when AI is not available"""
        # Extract key information from prompt for basic response
        if 'meta title' in prompt.lower():
            return "SEO Optimized Title"
        elif 'meta description' in prompt.lower():
            return "Discover more about this topic with our comprehensive guide."
        elif 'h1 tag' in prompt.lower():
            return "Main Heading"
        elif 'keywords' in prompt.lower():
            return "keyword1, keyword2, keyword3"
        else:
            return "AI-generated content"
