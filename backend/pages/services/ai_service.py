import openai
from anthropic import Anthropic
from django.conf import settings


class AIService:
    """Simple AI service for meta generation"""
    
    def __init__(self):
        self.openai_api_key = getattr(settings, 'OPENAI_API_KEY', None)
        self.anthropic_api_key = getattr(settings, 'ANTHROPIC_API_KEY', None)
        self.default_model = getattr(settings, 'DEFAULT_AI_MODEL', 'gpt-3.5-turbo')
    
    def generate_content(self, prompt: str, max_tokens: int = 200, model: str = None) -> str:
        """
        Generate content using AI
        
        Args:
            prompt: The prompt to send to AI
            max_tokens: Maximum tokens to generate
            model: AI model to use (defaults to configured model)
            
        Returns:
            Generated content string
        """
        model = model or self.default_model
        
        try:
            if 'gpt' in model.lower():
                return self._generate_with_openai(prompt, max_tokens, model)
            elif 'claude' in model.lower():
                return self._generate_with_anthropic(prompt, max_tokens, model)
            else:
                # Fallback to OpenAI
                return self._generate_with_openai(prompt, max_tokens, 'gpt-3.5-turbo')
        except Exception as e:
            # Return a fallback response
            return self._generate_fallback_response(prompt)
    
    def _generate_with_openai(self, prompt: str, max_tokens: int, model: str) -> str:
        """Generate content using OpenAI"""
        if not self.openai_api_key:
            raise ValueError("OpenAI API key not configured")
        
        client = openai.OpenAI(api_key=self.openai_api_key)
        
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are an SEO expert. Generate concise, optimized content for web pages."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=max_tokens
        )
        
        return response.choices[0].message.content
    
    def _generate_with_anthropic(self, prompt: str, max_tokens: int, model: str) -> str:
        """Generate content using Anthropic Claude"""
        if not self.anthropic_api_key:
            raise ValueError("Anthropic API key not configured")
        
        client = Anthropic(api_key=self.anthropic_api_key)
        
        response = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            temperature=0.7,
            system="You are an SEO expert. Generate concise, optimized content for web pages.",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        return response.content[0].text
    
    def _generate_fallback_response(self, prompt: str) -> str:
        """Generate a simple fallback response when AI is not available"""
        # Extract key information from prompt for basic response
        if 'meta title' in prompt.lower():
            return "SEO Optimized Title"
        elif 'meta description' in prompt.lower():
            return "Discover more about this topic with our comprehensive guide."
        elif 'h1 tag' in prompt.lower():
            return "Main Heading"
        elif 'keywords' in prompt.lower():
            return "keyword1, keyword2, keyword3"
        else:
            return "AI-generated content"
