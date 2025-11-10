"""
Factory for creating AI providers
"""
from django.conf import settings
from typing import Optional
import logging

from integrations.ai.providers.openai_provider import OpenAIProvider
from integrations.ai.providers.anthropic_provider import AnthropicProvider
from integrations.ai.providers.openrouter_provider import OpenRouterProvider
from integrations.ai.providers.base import AIProviderInterface

logger = logging.getLogger(__name__)


class ProviderFactory:
    """Factory for creating AI providers"""
    
    @staticmethod
    def _get_api_token_from_db(service: str) -> Optional[str]:
        """
        Get API token from database ApiToken model
        
        Args:
            service: Service name ('openrouter', 'chatgpt', 'claude')
        
        Returns:
            API key string or None
        """
        try:
            from integrations.models import ApiToken
            
            # Map provider types to service names
            service_map = {
                'openrouter': 'openrouter',
                'openai': 'chatgpt',
                'anthropic': 'claude',
            }
            
            db_service = service_map.get(service, service)
            token = ApiToken.objects.filter(
                service=db_service,
                is_active=True
            ).first()
            
            if token:
                return token.token_value
        except Exception as e:
            logger.debug(f"Could not fetch API token from database: {e}")
        
        return None
    
    @staticmethod
    def create_provider(provider_type: str = None, api_token_id: Optional[int] = None) -> Optional[AIProviderInterface]:
        """
        Create provider based on configuration
        
        Priority:
        1. Explicit provider_type parameter
        2. AI_PROVIDER setting
        3. Auto-detect based on available API keys
        
        Args:
            provider_type: 'auto', 'openrouter', 'openai', 'anthropic', or None
        
        Returns:
            Provider instance or None if no provider can be created
        """
        # Get provider type from parameter or settings
        if provider_type is None:
            provider_type = getattr(settings, 'AI_PROVIDER', 'auto')
        
        provider_type = provider_type.lower() if provider_type else 'auto'
        
        # If api_token_id is provided, use that token (highest priority)
        if api_token_id:
            try:
                from integrations.models import ApiToken
                token = ApiToken.objects.get(id=api_token_id, is_active=True)
                
                if token.service == 'openrouter':
                    http_referer = getattr(settings, 'OPENROUTER_HTTP_REFERER', None)
                    app_name = getattr(settings, 'OPENROUTER_APP_NAME', 'Panel CMS')
                    return OpenRouterProvider(
                        api_key=token.token_value,
                        http_referer=http_referer,
                        app_name=app_name
                    )
                elif token.service == 'chatgpt':
                    return OpenAIProvider(api_key=token.token_value)
                elif token.service == 'claude':
                    return AnthropicProvider(api_key=token.token_value)
                else:
                    logger.warning(f"API token service '{token.service}' not supported for AI providers")
                    return None
            except Exception as e:
                # Check if it's a DoesNotExist exception
                exception_name = type(e).__name__
                if exception_name == 'DoesNotExist':
                    logger.warning(f"API token {api_token_id} not found or not active")
                else:
                    logger.warning(f"Failed to use API token {api_token_id}: {e}")
                return None
        
        # Create provider based on type
        if provider_type == 'openrouter':
            # Try database first, then settings
            api_key = ProviderFactory._get_api_token_from_db('openrouter')
            if not api_key:
                api_key = getattr(settings, 'OPENROUTER_API_KEY', None)
            
            if api_key:
                http_referer = getattr(settings, 'OPENROUTER_HTTP_REFERER', None)
                app_name = getattr(settings, 'OPENROUTER_APP_NAME', 'Panel CMS')
                return OpenRouterProvider(
                    api_key=api_key,
                    http_referer=http_referer,
                    app_name=app_name
                )
            logger.warning("OpenRouter API key not configured")
        
        elif provider_type == 'openai':
            # Try database first, then settings
            api_key = ProviderFactory._get_api_token_from_db('openai')
            if not api_key:
                api_key = getattr(settings, 'OPENAI_API_KEY', None)
            
            if api_key:
                return OpenAIProvider(api_key=api_key)
            logger.warning("OpenAI API key not configured")
        
        elif provider_type == 'anthropic':
            # Try database first, then settings
            api_key = ProviderFactory._get_api_token_from_db('anthropic')
            if not api_key:
                api_key = getattr(settings, 'ANTHROPIC_API_KEY', None)
            
            if api_key:
                return AnthropicProvider(api_key=api_key)
            logger.warning("Anthropic API key not configured")
        
        elif provider_type == 'auto':
            # Auto-detect: check database first, then settings
            # Prefer OpenRouter if configured
            api_key = ProviderFactory._get_api_token_from_db('openrouter')
            if not api_key:
                api_key = getattr(settings, 'OPENROUTER_API_KEY', None)
            
            if api_key:
                http_referer = getattr(settings, 'OPENROUTER_HTTP_REFERER', None)
                app_name = getattr(settings, 'OPENROUTER_APP_NAME', 'Panel CMS')
                return OpenRouterProvider(
                    api_key=api_key,
                    http_referer=http_referer,
                    app_name=app_name
                )
            
            # Try OpenAI
            api_key = ProviderFactory._get_api_token_from_db('openai')
            if not api_key:
                api_key = getattr(settings, 'OPENAI_API_KEY', None)
            if api_key:
                return OpenAIProvider(api_key=api_key)
            
            # Try Anthropic
            api_key = ProviderFactory._get_api_token_from_db('anthropic')
            if not api_key:
                api_key = getattr(settings, 'ANTHROPIC_API_KEY', None)
            if api_key:
                return AnthropicProvider(api_key=api_key)
        
        logger.error(f"Failed to create AI provider: type={provider_type}")
        return None
    
    @staticmethod
    def get_provider_for_model(model: str) -> Optional[AIProviderInterface]:
        """
        Get appropriate provider for a specific model
        
        Model format examples:
        - openai/gpt-4 → OpenRouter
        - anthropic/claude-3-sonnet → OpenRouter
        - gpt-4 → OpenAI (if direct) or OpenRouter
        - claude-3-sonnet → Anthropic (if direct) or OpenRouter
        
        Args:
            model: Model identifier
        
        Returns:
            Provider instance or None
        """
        # If model has provider prefix (e.g., openai/gpt-4), prefer OpenRouter
        if model and '/' in model:
            provider = ProviderFactory.create_provider('openrouter')
            if provider:
                return provider
        
        # Check current provider setting
        provider = ProviderFactory.create_provider()
        
        # If using OpenRouter, it can handle any model
        if isinstance(provider, OpenRouterProvider):
            return provider
        
        # Otherwise, route based on model name
        if model:
            model_lower = model.lower()
            if 'gpt' in model_lower:
                return ProviderFactory.create_provider('openai')
            elif 'claude' in model_lower:
                return ProviderFactory.create_provider('anthropic')
        
        return provider

