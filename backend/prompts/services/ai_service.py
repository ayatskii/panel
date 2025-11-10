from django.conf import settings
from typing import Optional
import logging

from integrations.ai.providers.factory import ProviderFactory
from integrations.ai.providers.model_mapper import ModelMapper

logger = logging.getLogger(__name__)


class AIContentService:
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
    
    def generate_content(self, prompt, context, api_token_id: Optional[int] = None):
        """
        Generate content using AI based on prompt
        
        Args:
            prompt: Prompt model instance
            context: Context dictionary for variable replacement
            api_token_id: Optional API token ID to use (from ApiToken model)
        """
        try:
            # Process prompt template with context variables
            processed_prompt = prompt.prompt_text
            for key, value in context.items():
                processed_prompt = processed_prompt.replace(f'{{{key}}}', str(value))
            
            # Get provider for model, optionally using specific API token
            if api_token_id:
                provider = ProviderFactory.create_provider(api_token_id=api_token_id)
                if provider is None:
                    raise ValueError(f"No AI provider available for API token ID {api_token_id}")
            else:
                provider = ProviderFactory.get_provider_for_model(prompt.ai_model) or self.provider
                if provider is None:
                    raise ValueError("No AI provider available")
            
            # Normalize model name
            normalized_model = ModelMapper.normalize_model_name(prompt.ai_model, provider)
            if not normalized_model:
                normalized_model = prompt.ai_model
            
            # Prepare messages
            messages = [
                {"role": "user", "content": processed_prompt}
            ]
            
            # Generate content
            result = provider.generate_content(
                messages=messages,
                model=normalized_model,
                max_tokens=prompt.max_tokens or 1024,
                temperature=float(prompt.temperature),
                system_prompt=prompt.system_prompt if prompt.system_prompt else None
            )
            
            # Increment usage if using ApiToken
            if api_token_id:
                try:
                    from integrations.models import ApiToken
                    token = ApiToken.objects.get(id=api_token_id)
                    token.increment_usage()
                except Exception as e:
                    logger.debug(f"Could not increment API token usage: {e}")
            
            return result['content']
        except Exception as e:
            logger.error(f"AI content generation error: {e}")
            raise


# Create a singleton instance
ai_service = AIContentService()