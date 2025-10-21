from openai import OpenAI
from anthropic import Anthropic
from django.conf import settings
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class AIService:
    """Service for AI content generation"""
    
    def __init__(self):
        self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
        self.anthropic_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY) if settings.ANTHROPIC_API_KEY else None
    
    def generate_content(
        self,
        prompt: str,
        provider: str = 'openai',
        model: str = None,
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """
        Generate content using specified AI provider
        
        Args:
            prompt: The prompt to send to AI
            provider: 'openai' or 'anthropic'
            model: Model to use (optional)
            max_tokens: Maximum tokens to generate
            temperature: Creativity level (0-1)
        
        Returns:
            Dict with 'content', 'provider', 'model', 'tokens_used'
        """
        try:
            if provider == 'openai':
                return self._generate_openai(prompt, model, max_tokens, temperature)
            elif provider == 'anthropic':
                return self._generate_anthropic(prompt, model, max_tokens, temperature)
            else:
                raise ValueError(f"Unknown provider: {provider}")
        except Exception as e:
            logger.error(f"AI generation error: {e}")
            raise
    
    def _generate_openai(self, prompt: str, model: str, max_tokens: int, temperature: float) -> Dict[str, Any]:
        """Generate content using OpenAI"""
        if not self.openai_client:
            raise ValueError("OpenAI API key not configured")
        
        model = model or 'gpt-3.5-turbo'
        
        response = self.openai_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful content writer."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_tokens,
            temperature=temperature
        )
        
        return {
            'content': response.choices[0].message.content,
            'provider': 'openai',
            'model': model,
            'tokens_used': response.usage.total_tokens if response.usage else 0
        }
    
    def _generate_anthropic(self, prompt: str, model: str, max_tokens: int, temperature: float) -> Dict[str, Any]:
        """Generate content using Anthropic Claude"""
        if not self.anthropic_client:
            raise ValueError("Anthropic API key not configured")
        
        model = model or 'claude-3-sonnet-20240229'
        
        response = self.anthropic_client.messages.create(
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        return {
            'content': response.content[0].text,
            'provider': 'anthropic',
            'model': model,
            'tokens_used': response.usage.input_tokens + response.usage.output_tokens if response.usage else 0
        }


# Singleton instance
ai_service = AIService()
