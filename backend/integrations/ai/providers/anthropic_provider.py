"""
Anthropic direct API provider
"""
from anthropic import Anthropic
from typing import Dict, Any, List, Optional
import logging

from integrations.ai.providers.base import AIProviderInterface

logger = logging.getLogger(__name__)


class AnthropicProvider(AIProviderInterface):
    """Anthropic direct API provider"""
    
    def __init__(self, api_key: str):
        """
        Initialize Anthropic provider
        
        Args:
            api_key: Anthropic API key
        """
        if not api_key:
            raise ValueError("Anthropic API key is required")
        
        self.client = Anthropic(api_key=api_key)
        self.api_key = api_key
        self._supported_models = [
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307',
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022',
        ]
    
    @property
    def provider_name(self) -> str:
        return 'anthropic'
    
    def generate_content(
        self,
        messages: List[Dict[str, str]],
        model: str,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        system_prompt: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate content using Anthropic Claude"""
        try:
            # Anthropic requires system prompt as separate parameter
            # Filter out system messages from messages list
            user_messages = [
                msg for msg in messages 
                if msg.get('role') != 'system'
            ]
            
            # Use provided system_prompt or extract from messages
            if not system_prompt:
                system_messages = [
                    msg.get('content', '') for msg in messages 
                    if msg.get('role') == 'system'
                ]
                system_prompt = ' '.join(system_messages) if system_messages else None
            
            response = self.client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt or "",
                messages=user_messages,
                **kwargs
            )
            
            return {
                'content': response.content[0].text,
                'model': model,
                'tokens_used': (
                    response.usage.input_tokens + response.usage.output_tokens
                    if response.usage else 0
                ),
                'provider': 'anthropic',
                'input_tokens': response.usage.input_tokens if response.usage else 0,
                'output_tokens': response.usage.output_tokens if response.usage else 0,
            }
        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            raise
    
    def is_model_supported(self, model: str) -> bool:
        """Check if Anthropic supports the model"""
        # Remove provider prefix if present (e.g., 'anthropic/claude-3-sonnet' -> 'claude-3-sonnet')
        model_name = model.split('/')[-1] if '/' in model else model
        return model_name in self._supported_models or 'claude' in model_name.lower()
    
    def get_available_models(self) -> List[str]:
        """Get list of available Anthropic models"""
        return self._supported_models.copy()

