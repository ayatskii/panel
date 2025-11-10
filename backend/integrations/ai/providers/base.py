"""
Base interface for AI providers
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional


class AIProviderInterface(ABC):
    """Base interface for all AI providers"""
    
    @abstractmethod
    def generate_content(
        self,
        messages: List[Dict[str, str]],
        model: str,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        system_prompt: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate content using the provider
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Model identifier
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0-1)
            system_prompt: Optional system prompt (some providers handle this separately)
            **kwargs: Additional provider-specific parameters
        
        Returns:
            Dict with:
                - 'content': Generated text content
                - 'model': Model used
                - 'tokens_used': Total tokens used
                - 'provider': Provider name
                - Additional provider-specific fields
        """
        pass
    
    @abstractmethod
    def is_model_supported(self, model: str) -> bool:
        """
        Check if provider supports the model
        
        Args:
            model: Model identifier
        
        Returns:
            True if model is supported
        """
        pass
    
    @abstractmethod
    def get_available_models(self) -> List[str]:
        """
        Get list of available models for this provider
        
        Returns:
            List of model identifiers
        """
        pass
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return the name of the provider"""
        pass

