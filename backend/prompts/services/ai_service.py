import openai
from anthropic import Anthropic
from django.conf import settings


class AIContentService:
    """Service for AI content generation"""
    
    def __init__(self):
        self.openai_api_key = getattr(settings, 'OPENAI_API_KEY', None)
        self.anthropic_api_key = getattr(settings, 'ANTHROPIC_API_KEY', None)
    
    def generate_content(self, prompt, context):
        """Generate content using AI based on prompt"""
        if 'gpt' in prompt.ai_model.lower():
            return self._generate_with_openai(prompt, context)
        elif 'claude' in prompt.ai_model.lower():
            return self._generate_with_anthropic(prompt, context)
        else:
            raise ValueError(f"Unsupported AI model: {prompt.ai_model}")
    
    def _generate_with_openai(self, prompt, context):
        """Generate content using OpenAI"""
        if not self.openai_api_key:
            raise ValueError("OpenAI API key not configured")
        
        processed_prompt = prompt.prompt_text
        for key, value in context.items():
            processed_prompt = processed_prompt.replace(f'{{{key}}}', str(value))
        
        client = openai.OpenAI(api_key=self.openai_api_key)
        
        messages = []
        if prompt.system_prompt:
            messages.append({"role": "system", "content": prompt.system_prompt})
        messages.append({"role": "user", "content": processed_prompt})
        
        response = client.chat.completions.create(
            model=prompt.ai_model,
            messages=messages,
            temperature=float(prompt.temperature),
            max_tokens=prompt.max_tokens
        )
        
        return response.choices[0].message.content
    
    def _generate_with_anthropic(self, prompt, context):
        """Generate content using Anthropic Claude"""
        if not self.anthropic_api_key:
            raise ValueError("Anthropic API key not configured")
        
        processed_prompt = prompt.prompt_text
        for key, value in context.items():
            processed_prompt = processed_prompt.replace(f'{{{key}}}', str(value))
        
        client = Anthropic(api_key=self.anthropic_api_key)
        
        response = client.messages.create(
            model=prompt.ai_model,
            max_tokens=prompt.max_tokens or 1024,
            temperature=float(prompt.temperature),
            system=prompt.system_prompt if prompt.system_prompt else "",
            messages=[
                {"role": "user", "content": processed_prompt}
            ]
        )
        
        return response.content[0].text
