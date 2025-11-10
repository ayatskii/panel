# OpenRouter API Token Integration

## ✅ Implementation Complete

OpenRouter is now fully integrated with the ApiToken model and Prompt system.

## Changes Made

### 1. ApiToken Model Updates

**File**: `backend/integrations/models.py`

- ✅ Added `'openrouter'` to `SERVICE_CHOICES`
- Now supports: `'chatgpt'`, `'grok'`, `'claude'`, `'openrouter'`, `'cloudflare'`, `'elevenlabs'`, `'dalle'`, `'midjourney'`

### 2. ProviderFactory Updates

**File**: `backend/integrations/ai/providers/factory.py`

- ✅ Added `_get_api_token_from_db()` method to fetch API keys from database
- ✅ Updated `create_provider()` to:
  - Check database ApiToken entries first
  - Fallback to environment variables if no database token found
  - Support `api_token_id` parameter to use specific token
- ✅ Priority order:
  1. Explicit `api_token_id` parameter
  2. Database ApiToken entries (active tokens)
  3. Environment variables

### 3. AIContentService Updates

**File**: `backend/prompts/services/ai_service.py`

- ✅ Added `api_token_id` parameter to `generate_content()` method
- ✅ Automatically increments usage counter when using ApiToken
- ✅ Supports both database tokens and environment variables

### 4. Prompt Model Updates

**File**: `backend/prompts/models.py`

- ✅ Updated `ai_model` help text to include OpenRouter model format examples:
  - `openai/gpt-4`
  - `anthropic/claude-3-sonnet`
  - Direct models still supported: `gpt-4`, `claude-3-sonnet`

### 5. Frontend Type Updates

**File**: `frontend/src/types/index.ts`

- ✅ Added `'openrouter'` to ApiToken service type union

## Usage Examples

### Using ApiToken from Database

```python
from prompts.services.ai_service import ai_service
from prompts.models import Prompt

# Get a prompt
prompt = Prompt.objects.get(id=1)

# Use specific API token from database
result = ai_service.generate_content(
    prompt=prompt,
    context={'keywords': 'AI, technology'},
    api_token_id=5  # ID of OpenRouter ApiToken
)
```

### Automatic Token Selection

```python
# ProviderFactory automatically checks:
# 1. Database ApiToken entries (active)
# 2. Environment variables

from integrations.ai.providers.factory import ProviderFactory

# Will use database token if available, otherwise environment variable
provider = ProviderFactory.create_provider('openrouter')
```

### Creating OpenRouter ApiToken

```python
from integrations.models import ApiToken

token = ApiToken.objects.create(
    name='My OpenRouter Key',
    service='openrouter',
    token_value='sk-or-v1-...',
    is_active=True
)
```

## Migration Required

**Note**: A database migration is needed to add `'openrouter'` to the SERVICE_CHOICES.

To create the migration:
```bash
python manage.py makemigrations integrations --name add_openrouter_to_api_tokens
python manage.py migrate
```

## Benefits

✅ **Database-Managed Keys**: Store API keys in database instead of environment variables  
✅ **Usage Tracking**: Automatic usage counter increment for ApiToken  
✅ **Multiple Keys**: Support multiple API keys per service  
✅ **Token Selection**: Choose specific token per request  
✅ **Fallback Support**: Falls back to environment variables if no database token  
✅ **OpenRouter Models**: Support for OpenRouter model format (e.g., `openai/gpt-4`)  

## Model Name Support

The Prompt model now supports both formats:

**Direct Models** (for direct API access):
- `gpt-4`
- `gpt-3.5-turbo`
- `claude-3-sonnet-20240229`

**OpenRouter Models** (with provider prefix):
- `openai/gpt-4`
- `openai/gpt-3.5-turbo`
- `anthropic/claude-3-sonnet`
- `google/gemini-pro`
- `meta/llama-2`

Model names are automatically normalized based on the provider being used.

## Testing

### Test ApiToken Integration

```python
from integrations.models import ApiToken
from integrations.ai.providers.factory import ProviderFactory

# Create test token
token = ApiToken.objects.create(
    name='Test OpenRouter',
    service='openrouter',
    token_value='sk-or-v1-test-key',
    is_active=True
)

# Create provider using token
provider = ProviderFactory.create_provider(api_token_id=token.id)
print(provider.provider_name)  # Should print: openrouter
```

### Test Prompt with OpenRouter Model

```python
from prompts.models import Prompt
from prompts.services.ai_service import ai_service

# Create prompt with OpenRouter model format
prompt = Prompt.objects.create(
    name='Test Prompt',
    type='text',
    ai_model='openai/gpt-4',  # OpenRouter format
    prompt_text='Write about {keywords}',
    temperature=0.7,
    max_tokens=500
)

# Generate content
result = ai_service.generate_content(
    prompt=prompt,
    context={'keywords': 'artificial intelligence'}
)
```

## Status

✅ **Backend Integration**: Complete  
✅ **Frontend Types**: Updated  
⏳ **Migration**: Needs to be created and run  
✅ **Code Quality**: No linter errors  

The integration is ready to use once the migration is applied!

