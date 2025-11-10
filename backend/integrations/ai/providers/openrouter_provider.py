"""
OpenRouter unified API provider
"""
from openai import OpenAI  # OpenRouter uses OpenAI-compatible API
from typing import Dict, Any, List, Optional
import logging
import requests

from integrations.ai.providers.base import AIProviderInterface

logger = logging.getLogger(__name__)


class OpenRouterProvider(AIProviderInterface):
    """OpenRouter unified API provider"""
    
    def __init__(
        self,
        api_key: str,
        base_url: str = "https://openrouter.ai/api/v1",
        http_referer: Optional[str] = None,
        app_name: Optional[str] = None
    ):
        """
        Initialize OpenRouter provider
        
        Args:
            api_key: OpenRouter API key
            base_url: OpenRouter API base URL
            http_referer: HTTP referer for OpenRouter (optional)
            app_name: Application name for OpenRouter (optional)
        """
        if not api_key:
            raise ValueError("OpenRouter API key is required")
        
        # OpenRouter-specific headers
        default_headers = {}
        if http_referer:
            default_headers["HTTP-Referer"] = http_referer
        if app_name:
            default_headers["X-Title"] = app_name
        
        # OpenRouter uses OpenAI-compatible API
        self.client = OpenAI(
            api_key=api_key,
            base_url=base_url,
            default_headers=default_headers if default_headers else None
        )
        self.api_key = api_key
        self.base_url = base_url
        self.http_referer = http_referer
        self.app_name = app_name
        self._available_models = None  # Cache for available models
    
    @property
    def provider_name(self) -> str:
        return 'openrouter'
    
    def generate_content(
        self,
        messages: List[Dict[str, str]],
        model: str,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        system_prompt: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate content via OpenRouter"""
        try:
            # Prepare messages
            formatted_messages = []
            
            # Check if messages already contain a system message
            has_system_in_messages = any(msg.get('role') == 'system' for msg in messages)
            
            if system_prompt and not has_system_in_messages:
                formatted_messages.append({"role": "system", "content": system_prompt})
            
            formatted_messages.extend(messages)
            
            # OpenRouter uses OpenAI-compatible API
            # Headers are set during client initialization
            response = self.client.chat.completions.create(
                model=model,
                messages=formatted_messages,
                max_tokens=max_tokens,
                temperature=temperature,
                **kwargs
            )
            
            # Extract cost information if available
            cost_info = {}
            if hasattr(response, 'model') and hasattr(response, 'usage'):
                # OpenRouter may include cost in response metadata
                pass
            
            return {
                'content': response.choices[0].message.content,
                'model': model,
                'tokens_used': response.usage.total_tokens if response.usage else 0,
                'provider': 'openrouter',
                'input_tokens': response.usage.prompt_tokens if response.usage else 0,
                'output_tokens': response.usage.completion_tokens if response.usage else 0,
                **cost_info
            }
        except Exception as e:
            logger.error(f"OpenRouter API error: {e}")
            raise
    
    def is_model_supported(self, model: str) -> bool:
        """
        Check if OpenRouter supports the model
        
        OpenRouter supports models from multiple providers, so we return True
        for most models. Can be refined by checking against available models.
        """
        # OpenRouter supports models from multiple providers
        # Format: provider/model-name (e.g., openai/gpt-4, anthropic/claude-3-sonnet)
        if '/' in model:
            return True
        
        # If no prefix, check if it's a known model pattern
        model_lower = model.lower()
        return any(
            prefix in model_lower 
            for prefix in ['gpt', 'claude', 'gemini', 'llama', 'mistral']
        )
    
    def get_available_models(self) -> List[str]:
        """Fetch available models from OpenRouter"""
        if self._available_models is not None:
            return self._available_models
        
        try:
            response = requests.get(
                f"{self.base_url}/models",
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            self._available_models = [
                model['id'] for model in data.get('data', [])
            ]
            return self._available_models
        except Exception as e:
            logger.warning(f"Failed to fetch OpenRouter models: {e}")
            # Return common models as fallback
            return [
                'openai/gpt-3.5-turbo',
                'openai/gpt-4',
                'openai/gpt-4-turbo',
                'anthropic/claude-3-sonnet',
                'anthropic/claude-3-opus',
                'google/gemini-pro',
            ]

