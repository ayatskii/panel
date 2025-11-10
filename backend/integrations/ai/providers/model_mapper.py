"""
Model name mapping and normalization between providers
"""
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class ModelMapper:
    """Maps model names between providers"""
    
    # Model name mappings
    MODEL_MAPPINGS = {
        # OpenAI models
        'gpt-3.5-turbo': {
            'openai': 'gpt-3.5-turbo',
            'openrouter': 'openai/gpt-3.5-turbo'
        },
        'gpt-4': {
            'openai': 'gpt-4',
            'openrouter': 'openai/gpt-4'
        },
        'gpt-4-turbo': {
            'openai': 'gpt-4-turbo',
            'openrouter': 'openai/gpt-4-turbo'
        },
        'gpt-4o': {
            'openai': 'gpt-4o',
            'openrouter': 'openai/gpt-4o'
        },
        # Anthropic models
        'claude-3-sonnet': {
            'anthropic': 'claude-3-sonnet-20240229',
            'openrouter': 'anthropic/claude-3-sonnet'
        },
        'claude-3-opus': {
            'anthropic': 'claude-3-opus-20240229',
            'openrouter': 'anthropic/claude-3-opus'
        },
        'claude-3-haiku': {
            'anthropic': 'claude-3-haiku-20240307',
            'openrouter': 'anthropic/claude-3-haiku'
        },
        'claude-3-5-sonnet': {
            'anthropic': 'claude-3-5-sonnet-20241022',
            'openrouter': 'anthropic/claude-3-5-sonnet-20241022'
        },
    }
    
    @classmethod
    def get_model_for_provider(cls, model: str, provider_type: str) -> str:
        """
        Get provider-specific model name
        
        Args:
            model: Generic model name
            provider_type: 'openai', 'anthropic', or 'openrouter'
        
        Returns:
            Provider-specific model name
        """
        if model in cls.MODEL_MAPPINGS:
            return cls.MODEL_MAPPINGS[model].get(provider_type, model)
        return model
    
    @classmethod
    def normalize_model_name(cls, model: str, provider) -> str:
        """
        Normalize model name based on provider type
        
        Args:
            model: Model name (may or may not have provider prefix)
            provider: Provider instance
        
        Returns:
            Normalized model name
        """
        if model is None:
            return None
        
        provider_name = provider.provider_name if hasattr(provider, 'provider_name') else None
        
        # If using OpenRouter and model doesn't have prefix, add it
        if provider_name == 'openrouter':
            if '/' not in model:
                model_lower = model.lower()
                if 'gpt' in model_lower:
                    return f'openai/{model}'
                elif 'claude' in model_lower:
                    # Map common Claude model names
                    if 'sonnet' in model_lower:
                        if '3-5' in model_lower or '3.5' in model_lower:
                            return 'anthropic/claude-3-5-sonnet-20241022'
                        return 'anthropic/claude-3-sonnet'
                    elif 'opus' in model_lower:
                        return 'anthropic/claude-3-opus'
                    elif 'haiku' in model_lower:
                        return 'anthropic/claude-3-haiku'
                    return f'anthropic/{model}'
                elif 'gemini' in model_lower:
                    return f'google/{model}'
                elif 'llama' in model_lower:
                    return f'meta/{model}'
        
        # For direct providers, remove prefix if present
        elif provider_name in ['openai', 'anthropic']:
            if '/' in model:
                # Remove provider prefix (e.g., 'openai/gpt-4' -> 'gpt-4')
                return model.split('/', 1)[1]
        
        return model
    
    @classmethod
    def get_default_model(cls, provider_type: str) -> str:
        """
        Get default model for provider type
        
        Args:
            provider_type: 'openai', 'anthropic', or 'openrouter'
        
        Returns:
            Default model name
        """
        defaults = {
            'openrouter': 'openai/gpt-3.5-turbo',
            'openai': 'gpt-3.5-turbo',
            'anthropic': 'claude-3-sonnet-20240229',
        }
        return defaults.get(provider_type, 'gpt-3.5-turbo')

