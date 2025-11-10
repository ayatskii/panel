"""
OpenAI direct API provider
"""
from openai import OpenAI
from typing import Dict, Any, List, Optional
import logging

from integrations.ai.providers.base import AIProviderInterface

logger = logging.getLogger(__name__)


class OpenAIProvider(AIProviderInterface):
    """OpenAI direct API provider"""
    
    def __init__(self, api_key: str):
        """
        Initialize OpenAI provider
        
        Args:
            api_key: OpenAI API key
        """
        if not api_key:
            raise ValueError("OpenAI API key is required")
        
        self.client = OpenAI(api_key=api_key)
        self.api_key = api_key
        self._supported_models = [
            'gpt-3.5-turbo',
            'gpt-3.5-turbo-16k',
            'gpt-4',
            'gpt-4-turbo',
            'gpt-4-turbo-preview',
            'gpt-4-32k',
            'gpt-4o',
            'gpt-4o-mini',
        ]
    
    @property
    def provider_name(self) -> str:
        return 'openai'
    
    def generate_content(
        self,
        messages: List[Dict[str, str]],
        model: str,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        system_prompt: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate content using OpenAI"""
        try:
            # Prepare messages - OpenAI handles system messages in the messages list
            formatted_messages = []
            
            # Check if messages already contain a system message
            has_system_in_messages = any(msg.get('role') == 'system' for msg in messages)
            
            if system_prompt and not has_system_in_messages:
                formatted_messages.append({"role": "system", "content": system_prompt})
            
            formatted_messages.extend(messages)
            
            response = self.client.chat.completions.create(
                model=model,
                messages=formatted_messages,
                max_tokens=max_tokens,
                temperature=temperature,
                **kwargs
            )
            
            return {
                'content': response.choices[0].message.content,
                'model': model,
                'tokens_used': response.usage.total_tokens if response.usage else 0,
                'provider': 'openai',
                'input_tokens': response.usage.prompt_tokens if response.usage else 0,
                'output_tokens': response.usage.completion_tokens if response.usage else 0,
            }
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise
    
    def is_model_supported(self, model: str) -> bool:
        """Check if OpenAI supports the model"""
        # Remove provider prefix if present (e.g., 'openai/gpt-4' -> 'gpt-4')
        model_name = model.split('/')[-1] if '/' in model else model
        return model_name in self._supported_models or 'gpt' in model_name.lower()
    
    def get_available_models(self) -> List[str]:
        """Get list of available OpenAI models"""
        return self._supported_models.copy()

