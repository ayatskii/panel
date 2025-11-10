# OpenRouter Integration Plan

## Overview

This plan outlines the architecture and implementation steps to enhance the AI integration system to support OpenRouter as an alternative to direct API calls (OpenAI, Anthropic). OpenRouter provides a unified API gateway that routes requests to multiple LLM providers, offering benefits like:
- Single API key for multiple providers
- Automatic failover and load balancing
- Access to models from multiple providers
- Cost optimization through provider selection

## Current Architecture

### Existing AI Services

1. **`backend/integrations/ai.py`** - Main `AIService` class
   - Supports OpenAI and Anthropic
   - Used by general content generation

2. **`backend/pages/services/advanced_ai_service.py`** - `AdvancedAIService`
   - Block-specific content generation
   - Uses `_call_ai_api()` which routes to OpenAI/Anthropic

3. **`backend/prompts/services/ai_service.py`** - `AIContentService`
   - Prompt-based content generation
   - Direct OpenAI/Anthropic calls

4. **`backend/pages/services/ai_service.py`** - Simple `AIService`
   - Basic meta generation
   - Direct API calls

### Current Configuration

- Settings: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
- Model detection: Based on model name (e.g., 'gpt' → OpenAI, 'claude' → Anthropic)
- Direct client initialization: `OpenAI()` and `Anthropic()` clients

## Proposed Architecture

### Design Principles

1. **Provider Abstraction**: Create a unified interface for all AI providers
2. **Backward Compatibility**: Existing code continues to work without changes
3. **Configuration-Driven**: Switch providers via settings, not code changes
4. **Extensibility**: Easy to add new providers in the future
5. **Transparent Routing**: OpenRouter handles model routing automatically

### Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│              Application Layer                          │
│  (AIService, AdvancedAIService, AIContentService)      │
└────────────────────┬──────────────────────────────────┘
                     │
┌────────────────────▼──────────────────────────────────┐
│         AI Provider Abstraction Layer                  │
│  (AIProviderInterface, ProviderFactory)                │
└─────┬──────────────┬──────────────┬──────────────────┘
      │              │              │
┌─────▼─────┐ ┌──────▼──────┐ ┌─────▼──────────┐
│  OpenAI   │ │  Anthropic  │ │   OpenRouter   │
│  Provider │ │  Provider   │ │    Provider    │
└───────────┘ └─────────────┘ └────────────────┘
```

## Implementation Plan

### Phase 1: Core Abstraction Layer

#### 1.1 Create Provider Interface

**File**: `backend/integrations/ai/providers/base.py`

```python
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
        
        Returns:
            Dict with 'content', 'model', 'tokens_used', 'provider'
        """
        pass
    
    @abstractmethod
    def is_model_supported(self, model: str) -> bool:
        """Check if provider supports the model"""
        pass
    
    @abstractmethod
    def get_available_models(self) -> List[str]:
        """Get list of available models"""
        pass
```

#### 1.2 Create Provider Implementations

**File**: `backend/integrations/ai/providers/openai_provider.py`

```python
from openai import OpenAI
from .base import AIProviderInterface
from typing import Dict, Any, List, Optional

class OpenAIProvider(AIProviderInterface):
    """OpenAI direct API provider"""
    
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)
        self.supported_models = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', ...]
    
    def generate_content(self, messages, model, max_tokens, temperature, system_prompt, **kwargs):
        # Implementation using OpenAI client
        pass
```

**File**: `backend/integrations/ai/providers/anthropic_provider.py`

```python
from anthropic import Anthropic
from .base import AIProviderInterface

class AnthropicProvider(AIProviderInterface):
    """Anthropic direct API provider"""
    
    def __init__(self, api_key: str):
        self.client = Anthropic(api_key=api_key)
        self.supported_models = ['claude-3-sonnet', 'claude-3-opus', ...]
```

**File**: `backend/integrations/ai/providers/openrouter_provider.py`

```python
from openai import OpenAI  # OpenRouter uses OpenAI-compatible API
from .base import AIProviderInterface
from typing import Dict, Any, List, Optional

class OpenRouterProvider(AIProviderInterface):
    """OpenRouter unified API provider"""
    
    def __init__(self, api_key: str, base_url: str = "https://openrouter.ai/api/v1"):
        # OpenRouter uses OpenAI-compatible API
        self.client = OpenAI(
            api_key=api_key,
            base_url=base_url
        )
        self.api_key = api_key
        self.base_url = base_url
    
    def generate_content(self, messages, model, max_tokens, temperature, system_prompt, **kwargs):
        """
        Generate content via OpenRouter
        
        OpenRouter supports models from multiple providers:
        - openai/gpt-4, openai/gpt-3.5-turbo
        - anthropic/claude-3-sonnet, anthropic/claude-3-opus
        - google/gemini-pro, meta/llama-2, etc.
        """
        # Add OpenRouter-specific headers
        headers = {
            "HTTP-Referer": kwargs.get('http_referer', ''),
            "X-Title": kwargs.get('app_name', 'Panel CMS')
        }
        
        response = self.client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            extra_headers=headers
        )
        
        return {
            'content': response.choices[0].message.content,
            'model': model,
            'tokens_used': response.usage.total_tokens if response.usage else 0,
            'provider': 'openrouter'
        }
    
    def is_model_supported(self, model: str) -> bool:
        """OpenRouter supports models from multiple providers"""
        # Can check against OpenRouter's model list API
        return True  # OpenRouter supports most models
    
    def get_available_models(self) -> List[str]:
        """Fetch available models from OpenRouter"""
        # Call OpenRouter's models endpoint
        import requests
        response = requests.get(
            f"{self.base_url}/models",
            headers={"Authorization": f"Bearer {self.api_key}"}
        )
        return [model['id'] for model in response.json().get('data', [])]
```

#### 1.3 Create Provider Factory

**File**: `backend/integrations/ai/providers/factory.py`

```python
from django.conf import settings
from typing import Optional
from .openai_provider import OpenAIProvider
from .anthropic_provider import AnthropicProvider
from .openrouter_provider import OpenRouterProvider
from .base import AIProviderInterface

class ProviderFactory:
    """Factory for creating AI providers"""
    
    @staticmethod
    def create_provider(provider_type: str = None) -> Optional[AIProviderInterface]:
        """
        Create provider based on configuration
        
        Priority:
        1. Explicit provider_type parameter
        2. AI_PROVIDER setting
        3. Auto-detect based on available API keys
        """
        provider_type = provider_type or getattr(settings, 'AI_PROVIDER', 'auto')
        
        if provider_type == 'openrouter':
            api_key = getattr(settings, 'OPENROUTER_API_KEY', None)
            if api_key:
                return OpenRouterProvider(api_key)
        
        elif provider_type == 'openai':
            api_key = getattr(settings, 'OPENAI_API_KEY', None)
            if api_key:
                return OpenAIProvider(api_key)
        
        elif provider_type == 'anthropic':
            api_key = getattr(settings, 'ANTHROPIC_API_KEY', None)
            if api_key:
                return AnthropicProvider(api_key)
        
        elif provider_type == 'auto':
            # Auto-detect: prefer OpenRouter if configured
            if getattr(settings, 'OPENROUTER_API_KEY', None):
                return OpenRouterProvider(getattr(settings, 'OPENROUTER_API_KEY'))
            elif getattr(settings, 'OPENAI_API_KEY', None):
                return OpenAIProvider(getattr(settings, 'OPENAI_API_KEY'))
            elif getattr(settings, 'ANTHROPIC_API_KEY', None):
                return AnthropicProvider(getattr(settings, 'ANTHROPIC_API_KEY'))
        
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
        """
        # If model has provider prefix (e.g., openai/gpt-4), use OpenRouter
        if '/' in model:
            return ProviderFactory.create_provider('openrouter')
        
        # Check current provider setting
        provider = ProviderFactory.create_provider()
        
        # If using OpenRouter, it can handle any model
        if isinstance(provider, OpenRouterProvider):
            return provider
        
        # Otherwise, route based on model name
        if 'gpt' in model.lower():
            return ProviderFactory.create_provider('openai')
        elif 'claude' in model.lower():
            return ProviderFactory.create_provider('anthropic')
        
        return provider
```

### Phase 2: Refactor Existing Services

#### 2.1 Update Main AIService

**File**: `backend/integrations/ai.py`

```python
from integrations.ai.providers.factory import ProviderFactory
from integrations.ai.providers.base import AIProviderInterface

class AIService:
    """Service for AI content generation with provider abstraction"""
    
    def __init__(self):
        self._provider: Optional[AIProviderInterface] = None
    
    @property
    def provider(self) -> AIProviderInterface:
        """Lazy-load provider"""
        if self._provider is None:
            self._provider = ProviderFactory.create_provider()
        if self._provider is None:
            raise ValueError("No AI provider configured")
        return self._provider
    
    def generate_content(
        self,
        prompt: str,
        provider: str = None,  # Override default provider
        model: str = None,
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """Generate content using specified or default provider"""
        
        # Get provider (explicit or default)
        ai_provider = ProviderFactory.create_provider(provider) if provider else self.provider
        
        # Prepare messages
        messages = [
            {"role": "system", "content": "You are a helpful content writer."},
            {"role": "user", "content": prompt}
        ]
        
        # Normalize model name for OpenRouter
        model = self._normalize_model_name(model, ai_provider)
        
        # Generate content
        result = ai_provider.generate_content(
            messages=messages,
            model=model or self._get_default_model(ai_provider),
            max_tokens=max_tokens,
            temperature=temperature
        )
        
        return result
    
    def _normalize_model_name(self, model: str, provider: AIProviderInterface) -> str:
        """Normalize model name based on provider"""
        if model is None:
            return None
        
        # If using OpenRouter and model doesn't have prefix, add it
        if isinstance(provider, OpenRouterProvider):
            if '/' not in model:
                if 'gpt' in model.lower():
                    return f'openai/{model}'
                elif 'claude' in model.lower():
                    return f'anthropic/{model}'
        
        return model
    
    def _get_default_model(self, provider: AIProviderInterface) -> str:
        """Get default model for provider"""
        from django.conf import settings
        
        if isinstance(provider, OpenRouterProvider):
            return getattr(settings, 'OPENROUTER_DEFAULT_MODEL', 'openai/gpt-3.5-turbo')
        elif isinstance(provider, OpenAIProvider):
            return 'gpt-3.5-turbo'
        elif isinstance(provider, AnthropicProvider):
            return 'claude-3-sonnet-20240229'
        return 'gpt-3.5-turbo'
```

#### 2.2 Update AdvancedAIService

**File**: `backend/pages/services/advanced_ai_service.py`

```python
from integrations.ai.providers.factory import ProviderFactory

class AdvancedAIService:
    """Advanced AI service with provider abstraction"""
    
    def __init__(self):
        # Remove direct API key initialization
        # Provider will be loaded lazily
        self.default_model = getattr(settings, 'DEFAULT_AI_MODEL', 'gpt-3.5-turbo')
    
    def _call_ai_api(self, prompt: str, model: Optional[str] = None, max_tokens: int = 500) -> str:
        """Call AI API using provider abstraction"""
        from integrations.ai.providers.factory import ProviderFactory
        
        # Get provider for model
        provider = ProviderFactory.get_provider_for_model(model or self.default_model)
        
        if provider is None:
            raise ValueError("No AI provider available")
        
        # Prepare messages
        messages = [
            {
                "role": "system",
                "content": "You are an expert content writer specializing in SEO-optimized web content."
            },
            {"role": "user", "content": prompt}
        ]
        
        # Normalize model name
        normalized_model = self._normalize_model_name(model or self.default_model, provider)
        
        # Generate content
        result = provider.generate_content(
            messages=messages,
            model=normalized_model,
            max_tokens=max_tokens,
            temperature=0.7
        )
        
        return result['content']
```

#### 2.3 Update AIContentService

**File**: `backend/prompts/services/ai_service.py`

Similar refactoring to use provider abstraction instead of direct API calls.

### Phase 3: Configuration Management

#### 3.1 Add Settings

**File**: `backend/panel/settings.py`

```python
# AI Provider Configuration
# Options: 'auto', 'openrouter', 'openai', 'anthropic'
AI_PROVIDER = os.environ.get('AI_PROVIDER', 'auto')

# OpenRouter Configuration
OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY', None)
OPENROUTER_DEFAULT_MODEL = os.environ.get('OPENROUTER_DEFAULT_MODEL', 'openai/gpt-3.5-turbo')
OPENROUTER_HTTP_REFERER = os.environ.get('OPENROUTER_HTTP_REFERER', 'https://yourdomain.com')
OPENROUTER_APP_NAME = os.environ.get('OPENROUTER_APP_NAME', 'Panel CMS')

# Existing OpenAI/Anthropic keys (for backward compatibility)
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', None)
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', None)
```

#### 3.2 Add Settings Model (Optional)

**File**: `backend/integrations/models.py`

```python
class AIProviderSettings(models.Model):
    """Per-site AI provider configuration"""
    site = models.OneToOneField('sites.Site', on_delete=models.CASCADE, related_name='ai_settings')
    
    provider_type = models.CharField(
        max_length=20,
        choices=[
            ('auto', 'Auto-detect'),
            ('openrouter', 'OpenRouter'),
            ('openai', 'OpenAI Direct'),
            ('anthropic', 'Anthropic Direct'),
        ],
        default='auto'
    )
    
    openrouter_api_key = models.CharField(max_length=255, blank=True, null=True)
    openrouter_default_model = models.CharField(max_length=100, default='openai/gpt-3.5-turbo')
    
    openai_api_key = models.CharField(max_length=255, blank=True, null=True)
    anthropic_api_key = models.CharField(max_length=255, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### Phase 4: Model Mapping and Normalization

#### 4.1 Create Model Mapper

**File**: `backend/integrations/ai/providers/model_mapper.py`

```python
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
        # Anthropic models
        'claude-3-sonnet': {
            'anthropic': 'claude-3-sonnet-20240229',
            'openrouter': 'anthropic/claude-3-sonnet'
        },
        'claude-3-opus': {
            'anthropic': 'claude-3-opus-20240229',
            'openrouter': 'anthropic/claude-3-opus'
        },
    }
    
    @classmethod
    def get_model_for_provider(cls, model: str, provider_type: str) -> str:
        """Get provider-specific model name"""
        if model in cls.MODEL_MAPPINGS:
            return cls.MODEL_MAPPINGS[model].get(provider_type, model)
        return model
    
    @classmethod
    def normalize_model_name(cls, model: str, provider) -> str:
        """Normalize model name based on provider type"""
        if isinstance(provider, OpenRouterProvider):
            # If model doesn't have prefix, add it
            if '/' not in model:
                if 'gpt' in model.lower():
                    return f'openai/{model}'
                elif 'claude' in model.lower():
                    return f'anthropic/{model}'
        return model
```

### Phase 5: Testing and Validation

#### 5.1 Unit Tests

**File**: `backend/integrations/ai/tests/test_providers.py`

```python
class TestOpenRouterProvider(TestCase):
    def test_openrouter_provider_initialization(self):
        provider = OpenRouterProvider(api_key='test-key')
        self.assertIsNotNone(provider)
    
    def test_model_normalization(self):
        provider = OpenRouterProvider(api_key='test-key')
        normalized = ModelMapper.normalize_model_name('gpt-4', provider)
        self.assertEqual(normalized, 'openai/gpt-4')
    
    def test_provider_factory(self):
        with override_settings(OPENROUTER_API_KEY='test-key', AI_PROVIDER='openrouter'):
            provider = ProviderFactory.create_provider()
            self.assertIsInstance(provider, OpenRouterProvider)
```

#### 5.2 Integration Tests

Test that existing services work with OpenRouter provider.

### Phase 6: Documentation and Migration Guide

#### 6.1 Update Documentation

- Add OpenRouter setup instructions
- Document model naming conventions
- Explain provider selection logic

#### 6.2 Migration Guide

- How to switch from direct APIs to OpenRouter
- Environment variable changes
- Model name updates needed

## Configuration Examples

### Example 1: Use OpenRouter for All Requests

```python
# settings.py
AI_PROVIDER = 'openrouter'
OPENROUTER_API_KEY = 'sk-or-v1-...'
OPENROUTER_DEFAULT_MODEL = 'openai/gpt-3.5-turbo'
```

### Example 2: Auto-detect (OpenRouter Preferred)

```python
# settings.py
AI_PROVIDER = 'auto'
OPENROUTER_API_KEY = 'sk-or-v1-...'  # Will be used if present
OPENAI_API_KEY = 'sk-...'  # Fallback
```

### Example 3: Per-Site Configuration

```python
# Use site-specific AI settings
site = Site.objects.get(id=1)
ai_settings = site.ai_settings
provider = ProviderFactory.create_provider(ai_settings.provider_type)
```

## Benefits of This Architecture

1. **Flexibility**: Easy to switch between providers
2. **Cost Optimization**: Use OpenRouter for better pricing
3. **Model Access**: Access to models from multiple providers via OpenRouter
4. **Failover**: OpenRouter provides automatic failover
5. **Backward Compatible**: Existing code continues to work
6. **Extensible**: Easy to add new providers (e.g., Together AI, Replicate)

## Implementation Checklist

### Phase 1: Core Abstraction
- [ ] Create `AIProviderInterface` base class
- [ ] Implement `OpenAIProvider`
- [ ] Implement `AnthropicProvider`
- [ ] Implement `OpenRouterProvider`
- [ ] Create `ProviderFactory`
- [ ] Add model normalization logic

### Phase 2: Service Refactoring
- [ ] Refactor `backend/integrations/ai.py`
- [ ] Refactor `backend/pages/services/advanced_ai_service.py`
- [ ] Refactor `backend/prompts/services/ai_service.py`
- [ ] Refactor `backend/pages/services/ai_service.py`
- [ ] Update all service calls to use provider abstraction

### Phase 3: Configuration
- [ ] Add settings for OpenRouter
- [ ] Add `AIProviderSettings` model (optional)
- [ ] Create migration for new settings
- [ ] Update environment variable documentation

### Phase 4: Testing
- [ ] Write unit tests for providers
- [ ] Write integration tests
- [ ] Test backward compatibility
- [ ] Test model name normalization

### Phase 5: Documentation
- [ ] Update README with OpenRouter setup
- [ ] Create migration guide
- [ ] Document model naming conventions
- [ ] Add code examples

## OpenRouter-Specific Considerations

1. **Model Naming**: OpenRouter uses provider prefixes (e.g., `openai/gpt-4`)
2. **Headers**: OpenRouter requires `HTTP-Referer` and `X-Title` headers
3. **API Compatibility**: OpenRouter uses OpenAI-compatible API
4. **Rate Limits**: OpenRouter has its own rate limits
5. **Cost Tracking**: OpenRouter provides cost information in responses

## Future Enhancements

1. **Provider Selection per Request**: Allow specifying provider per API call
2. **Cost Tracking**: Track costs across providers
3. **Performance Metrics**: Compare response times across providers
4. **Automatic Failover**: Switch providers on errors
5. **Caching Layer**: Cache responses to reduce API calls
6. **Batch Processing**: Optimize batch requests

## Risk Mitigation

1. **Backward Compatibility**: Maintain existing API interfaces
2. **Gradual Migration**: Allow per-service migration
3. **Feature Flags**: Use settings to enable/disable OpenRouter
4. **Error Handling**: Graceful fallback to direct APIs
5. **Testing**: Comprehensive test coverage before deployment

