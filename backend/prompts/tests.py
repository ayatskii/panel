from django.test import TestCase
from prompts.models import Prompt
from decimal import Decimal


class PromptModelTestCase(TestCase):
    """Test Prompt model"""

    def test_prompt_creation(self):
        """Test prompt creation"""
        prompt = Prompt.objects.create(
            name="Article Generator",
            description="Generates article content",
            type="text",
            block_type="article",
            ai_model="gpt-4",
            temperature=Decimal("0.7"),
            max_tokens=1000,
            prompt_text="Write an article about {topic} for {brand_name}",
            system_prompt="You are a professional content writer.",
            is_active=True,
        )

        self.assertEqual(prompt.name, "Article Generator")
        self.assertEqual(prompt.type, "text")
        self.assertEqual(prompt.block_type, "article")
        self.assertEqual(prompt.ai_model, "gpt-4")
        self.assertEqual(prompt.temperature, Decimal("0.7"))
        self.assertEqual(prompt.max_tokens, 1000)
        self.assertTrue(prompt.is_active)

    def test_prompt_types(self):
        """Test prompt type choices"""
        text_prompt = Prompt.objects.create(
            name="Text Prompt",
            type="text",
            ai_model="gpt-3.5-turbo",
            prompt_text="Generate text",
        )

        image_prompt = Prompt.objects.create(
            name="Image Prompt",
            type="image",
            ai_model="dall-e-3",
            prompt_text="Generate image",
        )

        self.assertTrue(text_prompt.is_text_prompt)
        self.assertFalse(text_prompt.is_image_prompt)
        self.assertTrue(image_prompt.is_image_prompt)
        self.assertFalse(image_prompt.is_text_prompt)

    def test_prompt_block_type_association(self):
        """Test prompt association with block types"""
        block_types = ["article", "title", "description", "faq", "hero"]

        for block_type in block_types:
            prompt = Prompt.objects.create(
                name=f"{block_type.title()} Prompt",
                type="text",
                block_type=block_type,
                ai_model="gpt-4",
                prompt_text=f"Generate {block_type}",
            )
            self.assertEqual(prompt.block_type, block_type)

    def test_prompt_ai_models(self):
        """Test different AI models"""
        models = [
            "gpt-4",
            "gpt-3.5-turbo",
            "claude-3",
            "claude-3-opus",
            "dall-e-3",
        ]

        for model in models:
            prompt = Prompt.objects.create(
                name=f"Prompt for {model}",
                type="text" if "gpt" in model or "claude" in model else "image",
                ai_model=model,
                prompt_text="Generate content",
            )
            self.assertEqual(prompt.ai_model, model)

    def test_prompt_temperature_range(self):
        """Test temperature values"""
        # Low creativity
        prompt1 = Prompt.objects.create(
            name="Low Temp",
            type="text",
            ai_model="gpt-4",
            temperature=Decimal("0.1"),
            prompt_text="Generate",
        )
        self.assertEqual(prompt1.temperature, Decimal("0.1"))

        # Medium creativity
        prompt2 = Prompt.objects.create(
            name="Medium Temp",
            type="text",
            ai_model="gpt-4",
            temperature=Decimal("0.7"),
            prompt_text="Generate",
        )
        self.assertEqual(prompt2.temperature, Decimal("0.7"))

        # High creativity
        prompt3 = Prompt.objects.create(
            name="High Temp",
            type="text",
            ai_model="gpt-4",
            temperature=Decimal("0.9"),
            prompt_text="Generate",
        )
        self.assertEqual(prompt3.temperature, Decimal("0.9"))

    def test_prompt_max_tokens(self):
        """Test max_tokens configuration"""
        prompt = Prompt.objects.create(
            name="Long Content",
            type="text",
            ai_model="gpt-4",
            max_tokens=2000,
            prompt_text="Generate long content",
        )

        self.assertEqual(prompt.max_tokens, 2000)

    def test_prompt_with_variables(self):
        """Test prompt text with variable placeholders"""
        prompt = Prompt.objects.create(
            name="Custom Article",
            type="text",
            ai_model="gpt-4",
            prompt_text="Write an article about {keywords} for {brand_name} targeting {audience}",
        )

        self.assertIn("{keywords}", prompt.prompt_text)
        self.assertIn("{brand_name}", prompt.prompt_text)
        self.assertIn("{audience}", prompt.prompt_text)

    def test_prompt_system_prompt(self):
        """Test system prompt for chat models"""
        prompt = Prompt.objects.create(
            name="Expert Writer",
            type="text",
            ai_model="gpt-4",
            prompt_text="Write about {topic}",
            system_prompt="You are an expert writer with 10 years of experience in content creation.",
        )

        self.assertIsNotNone(prompt.system_prompt)
        self.assertIn("expert writer", prompt.system_prompt)

    def test_prompt_active_inactive(self):
        """Test is_active flag"""
        active_prompt = Prompt.objects.create(
            name="Active Prompt",
            type="text",
            ai_model="gpt-4",
            prompt_text="Generate",
            is_active=True,
        )

        inactive_prompt = Prompt.objects.create(
            name="Inactive Prompt",
            type="text",
            ai_model="gpt-4",
            prompt_text="Generate",
            is_active=False,
        )

        self.assertTrue(active_prompt.is_active)
        self.assertFalse(inactive_prompt.is_active)

        # Query active prompts
        active_prompts = Prompt.objects.filter(is_active=True)
        self.assertIn(active_prompt, active_prompts)
        self.assertNotIn(inactive_prompt, active_prompts)

    def test_prompt_timestamps(self):
        """Test created_at and updated_at timestamps"""
        import time
        
        prompt = Prompt.objects.create(
            name="Test Prompt",
            type="text",
            ai_model="gpt-4",
            prompt_text="Generate",
        )

        self.assertIsNotNone(prompt.created_at)
        self.assertIsNotNone(prompt.updated_at)

        # Update prompt
        original_updated_at = prompt.updated_at
        time.sleep(0.01)  # Small delay to ensure timestamp changes
        prompt.prompt_text = "Updated prompt text"
        prompt.save()

        self.assertGreaterEqual(prompt.updated_at, original_updated_at)

    def test_prompt_str_representation(self):
        """Test string representation"""
        prompt = Prompt.objects.create(
            name="GPT-4 Article",
            type="text",
            ai_model="gpt-4",
            prompt_text="Generate",
        )

        expected = "GPT-4 Article (gpt-4)"
        self.assertEqual(str(prompt), expected)

    def test_prompt_image_generation(self):
        """Test image generation prompt"""
        prompt = Prompt.objects.create(
            name="Logo Generator",
            type="image",
            ai_model="dall-e-3",
            prompt_text="Create a modern logo for {brand_name} with {colors}",
            max_tokens=None,  # Not used for image generation
        )

        self.assertTrue(prompt.is_image_prompt)
        self.assertEqual(prompt.ai_model, "dall-e-3")

    def test_prompt_complex_text_generation(self):
        """Test complex text generation prompt"""
        prompt = Prompt.objects.create(
            name="SEO Article",
            type="text",
            block_type="article",
            ai_model="gpt-4",
            temperature=Decimal("0.6"),
            max_tokens=1500,
            prompt_text="""Write a comprehensive SEO-optimized article about {main_keyword}.
            
Include these LSI keywords: {lsi_keywords}
Target audience: {target_audience}
Tone: {tone}

The article should be informative, engaging, and include:
- An attention-grabbing introduction
- 3-5 main sections with H2 headings
- A strong conclusion with a call to action
""",
            system_prompt="You are an SEO expert and professional content writer.",
            is_active=True,
        )

        self.assertIn("{main_keyword}", prompt.prompt_text)
        self.assertIn("{lsi_keywords}", prompt.prompt_text)
        self.assertEqual(prompt.temperature, Decimal("0.6"))
        self.assertEqual(prompt.max_tokens, 1500)

    def test_prompt_filtering_by_block_type(self):
        """Test filtering prompts by block type"""
        Prompt.objects.create(
            name="Hero Prompt",
            type="text",
            block_type="hero",
            ai_model="gpt-4",
            prompt_text="Generate hero",
        )
        Prompt.objects.create(
            name="Article Prompt 1",
            type="text",
            block_type="article",
            ai_model="gpt-4",
            prompt_text="Generate article",
        )
        Prompt.objects.create(
            name="Article Prompt 2",
            type="text",
            block_type="article",
            ai_model="gpt-3.5-turbo",
            prompt_text="Generate article",
        )
        Prompt.objects.create(
            name="FAQ Prompt",
            type="text",
            block_type="faq",
            ai_model="gpt-4",
            prompt_text="Generate FAQ",
        )

        article_prompts = Prompt.objects.filter(block_type="article")
        self.assertEqual(article_prompts.count(), 2)

    def test_prompt_filtering_by_ai_model(self):
        """Test filtering prompts by AI model"""
        Prompt.objects.create(
            name="GPT-4 Prompt 1",
            type="text",
            ai_model="gpt-4",
            prompt_text="Generate",
        )
        Prompt.objects.create(
            name="GPT-4 Prompt 2",
            type="text",
            ai_model="gpt-4",
            prompt_text="Generate",
        )
        Prompt.objects.create(
            name="Claude Prompt",
            type="text",
            ai_model="claude-3",
            prompt_text="Generate",
        )

        gpt4_prompts = Prompt.objects.filter(ai_model="gpt-4")
        self.assertEqual(gpt4_prompts.count(), 2)
