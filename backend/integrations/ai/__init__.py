"""
AI Integration module with provider abstraction
"""
from django.conf import settings
from typing import Dict, Any, Optional
import logging

from integrations.ai.providers.factory import ProviderFactory
from integrations.ai.providers.base import AIProviderInterface
from integrations.ai.providers.model_mapper import ModelMapper

logger = logging.getLogger(__name__)


class AIService:
    """Service for AI content generation with provider abstraction"""
    
    def __init__(self):
        self._provider = None
    
    @property
    def provider(self):
        """Lazy-load provider"""
        if self._provider is None:
            self._provider = ProviderFactory.create_provider()
        if self._provider is None:
            raise ValueError("No AI provider configured. Please set AI_PROVIDER and corresponding API keys.")
        return self._provider
    
    def generate_content(
        self,
        prompt: str,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """
        Generate content using specified or default AI provider
        
        Args:
            prompt: The prompt to send to AI
            provider: Override default provider ('openrouter', 'openai', 'anthropic', or None for auto)
            model: Model to use (optional, will use default for provider)
            max_tokens: Maximum tokens to generate
            temperature: Creativity level (0-1)
        
        Returns:
            Dict with 'content', 'provider', 'model', 'tokens_used'
        """
        try:
            # Get provider (explicit or default)
            ai_provider = ProviderFactory.create_provider(provider) if provider else self.provider
            
            if ai_provider is None:
                raise ValueError("No AI provider available")
            
            # Prepare messages
            messages = [
                {"role": "user", "content": prompt}
            ]
            
            # Normalize model name for provider
            normalized_model = self._normalize_model_name(model, ai_provider)
            
            # Generate content
            result = ai_provider.generate_content(
                messages=messages,
                model=normalized_model or self._get_default_model(ai_provider),
                max_tokens=max_tokens,
                temperature=temperature,
                system_prompt="You are a helpful content writer."
            )
            
            return result
        except Exception as e:
            logger.error(f"AI generation error: {e}")
            raise
    
    def _normalize_model_name(self, model: Optional[str], provider) -> Optional[str]:
        """Normalize model name based on provider type"""
        if model is None:
            return None
        return ModelMapper.normalize_model_name(model, provider)
    
    def _get_default_model(self, provider) -> str:
        """Get default model for provider"""
        provider_name = provider.provider_name if hasattr(provider, 'provider_name') else None
        return ModelMapper.get_default_model(provider_name or 'openai')


# Singleton instance
ai_service = AIService()

__all__ = ['ProviderFactory', 'AIProviderInterface', 'AIService', 'ai_service']

