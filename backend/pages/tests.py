from django.test import TestCase
from django.contrib.auth import get_user_model
from pages.models import Page, PageBlock, SwiperPreset
from sites.models import Site, AffiliateLink
from templates.models import Template
from prompts.models import Prompt

User = get_user_model()


class PageModelTestCase(TestCase):
    """Test Page model"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        self.template = Template.objects.create(
            name="Test Template",
            html_content="<html></html>",
            css_content="body {}",
        )

        self.site = Site.objects.create(
            user=self.user,
            domain="example.com",
            brand_name="Example",
            template=self.template,
        )

    def test_page_creation(self):
        """Test page creation"""
        page = Page.objects.create(
            site=self.site,
            slug="about",
            title="About Us",
            meta_description="Learn about us",
            h1_tag="About Our Company",
            order=1,
        )

        self.assertEqual(page.slug, "about")
        self.assertEqual(page.title, "About Us")
        self.assertEqual(page.site, self.site)
        self.assertIsNotNone(page.created_at)

    def test_page_slug_unique_per_site(self):
        """Test slug is unique per site"""
        from django.db import IntegrityError, transaction
        
        Page.objects.create(site=self.site, slug="about", title="About")

        # Same slug on same site should fail
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                Page.objects.create(site=self.site, slug="about", title="About Duplicate")
        
        # Create a different site for next test
        site2 = Site.objects.create(
            user=self.user,
            domain="example2.com",
            brand_name="Example 2",
            template=self.template,
        )
        # Same slug on different site should work
        page2 = Page.objects.create(site=site2, slug="about", title="About")
        self.assertIsNotNone(page2.id)

    def test_page_seo_fields(self):
        """Test SEO-related fields"""
        page = Page.objects.create(
            site=self.site,
            slug="products",
            title="Our Products | Example",
            meta_description="Browse our amazing products",
            h1_tag="Product Catalog",
            canonical_url="https://example.com/products",
            custom_head_html='<meta property="og:title" content="Products" />',
        )

        self.assertEqual(page.title, "Our Products | Example")
        self.assertEqual(page.meta_description, "Browse our amazing products")
        self.assertEqual(page.canonical_url, "https://example.com/products")
        self.assertIn("og:title", page.custom_head_html)

    def test_page_h1_placement(self):
        """Test H1 tag placement control"""
        page = Page.objects.create(
            site=self.site,
            slug="home",
            h1_tag="Welcome to Our Site",
            use_h1_in_hero=True,
        )

        self.assertTrue(page.use_h1_in_hero)

    def test_page_keywords_and_lsi(self):
        """Test keywords and LSI phrases storage"""
        page = Page.objects.create(
            site=self.site,
            slug="casino-games",
            keywords="casino\nslots\npoker\nroulette",
            lsi_phrases="online casino games\nbest slot machines\nlive dealer poker",
        )

        self.assertIn("casino", page.keywords)
        self.assertIn("live dealer poker", page.lsi_phrases)

    def test_page_keywords_list_property(self):
        """Test keywords_list property"""
        page = Page.objects.create(
            site=self.site, slug="test", keywords="keyword1\nkeyword2\nkeyword3"
        )

        keywords_list = page.keywords_list
        self.assertEqual(len(keywords_list), 3)
        self.assertIn("keyword1", keywords_list)
        self.assertIn("keyword2", keywords_list)
        self.assertIn("keyword3", keywords_list)

    def test_page_lsi_phrases_list_property(self):
        """Test lsi_phrases_list property"""
        page = Page.objects.create(
            site=self.site, slug="test", lsi_phrases="phrase 1\nphrase 2\nphrase 3"
        )

        lsi_list = page.lsi_phrases_list
        self.assertEqual(len(lsi_list), 3)
        self.assertIn("phrase 1", lsi_list)
        self.assertIn("phrase 2", lsi_list)

    def test_page_full_url_property(self):
        """Test full_url property"""
        page = Page.objects.create(
            site=self.site, slug="about"
        )

        # Default: HTTPS with indexing allowed
        self.assertEqual(page.full_url, "https://example.com/about")

        # With WWW version
        self.site.use_www_version = True
        self.site.save()
        self.assertEqual(page.full_url, "https://www.example.com/about")

        # Without indexing (HTTP)
        self.site.allow_indexing = False
        self.site.save()
        self.assertEqual(page.full_url, "http://www.example.com/about")

    def test_page_ordering(self):
        """Test page ordering"""
        page1 = Page.objects.create(site=self.site, slug="first", order=2)
        page2 = Page.objects.create(site=self.site, slug="second", order=1)
        page3 = Page.objects.create(site=self.site, slug="third", order=3)

        pages = list(Page.objects.all())
        self.assertEqual(pages[0], page2)  # order=1
        self.assertEqual(pages[1], page1)  # order=2
        self.assertEqual(pages[2], page3)  # order=3

    def test_page_str_representation(self):
        """Test string representation"""
        page = Page.objects.create(site=self.site, slug="about")
        self.assertEqual(str(page), "example.com/about")
    
    def test_page_is_published_default(self):
        """Test page is not published by default"""
        page = Page.objects.create(site=self.site, slug="test")
        self.assertFalse(page.is_published)
        self.assertIsNone(page.published_at)
    
    def test_page_can_be_published(self):
        """Test page can be published"""
        from django.utils import timezone
        
        page = Page.objects.create(site=self.site, slug="test")
        page.is_published = True
        page.published_at = timezone.now()
        page.save()
        
        self.assertTrue(page.is_published)
        self.assertIsNotNone(page.published_at)
    
    def test_page_can_be_unpublished(self):
        """Test page can be unpublished"""
        from django.utils import timezone
        
        page = Page.objects.create(
            site=self.site, 
            slug="test",
            is_published=True,
            published_at=timezone.now()
        )
        
        page.is_published = False
        page.save()
        
        self.assertFalse(page.is_published)
    
    def test_published_pages_query(self):
        """Test filtering published pages"""
        Page.objects.create(site=self.site, slug="published", is_published=True)
        Page.objects.create(site=self.site, slug="draft", is_published=False)
        
        published_pages = Page.objects.filter(is_published=True)
        self.assertEqual(published_pages.count(), 1)
        self.assertEqual(published_pages.first().slug, "published")


class PageBlockModelTestCase(TestCase):
    """Test PageBlock model"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        self.template = Template.objects.create(
            name="Test Template",
            html_content="<html></html>",
            css_content="body {}",
        )

        self.site = Site.objects.create(
            user=self.user,
            domain="example.com",
            brand_name="Example",
            template=self.template,
        )

        self.page = Page.objects.create(site=self.site, slug="home")

    def test_block_creation(self):
        """Test block creation"""
        block = PageBlock.objects.create(
            page=self.page,
            block_type="hero",
            content_data={
                "title": "Welcome",
                "subtitle": "To our site",
                "background_image": "image.jpg",
            },
            order_index=1,
        )

        self.assertEqual(block.block_type, "hero")
        self.assertEqual(block.page, self.page)
        self.assertIsInstance(block.content_data, dict)
        self.assertEqual(block.content_data["title"], "Welcome")

    def test_block_types(self):
        """Test all block type options"""
        block_types = ["hero", "article", "image", "text_image", "cta", "faq", "swiper"]

        for i, block_type in enumerate(block_types):
            block = PageBlock.objects.create(
                page=self.page,
                block_type=block_type,
                content_data={"test": "data"},
                order_index=i,
            )
            self.assertEqual(block.block_type, block_type)

    def test_block_content_data_json(self):
        """Test content_data JSON field"""
        # Hero block
        hero_block = PageBlock.objects.create(
            page=self.page,
            block_type="hero",
            content_data={
                "title": "Welcome",
                "subtitle": "To our amazing site",
                "background_image": "https://example.com/hero.jpg",
                "cta_text": "Get Started",
                "cta_url": "/signup",
            },
            order_index=1,
        )
        self.assertEqual(hero_block.content_data["cta_text"], "Get Started")

        # Article block
        article_block = PageBlock.objects.create(
            page=self.page,
            block_type="article",
            content_data={
                "title": "Article Title",
                "text": "<p>Article content</p>",
                "alignment": "left",
            },
            order_index=2,
        )
        self.assertIn("<p>", article_block.content_data["text"])

        # Image block
        image_block = PageBlock.objects.create(
            page=self.page,
            block_type="image",
            content_data={
                "image_url": "https://example.com/image.jpg",
                "alt_text": "Description",
            },
            order_index=3,
        )
        self.assertEqual(image_block.content_data["alt_text"], "Description")

    def test_block_ordering(self):
        """Test block ordering"""
        block1 = PageBlock.objects.create(
            page=self.page,
            block_type="hero",
            content_data={},
            order_index=2,
        )
        block2 = PageBlock.objects.create(
            page=self.page,
            block_type="article",
            content_data={},
            order_index=1,
        )
        block3 = PageBlock.objects.create(
            page=self.page,
            block_type="cta",
            content_data={},
            order_index=3,
        )

        blocks = list(self.page.blocks.all())
        self.assertEqual(blocks[0], block2)  # order_index=1
        self.assertEqual(blocks[1], block1)  # order_index=2
        self.assertEqual(blocks[2], block3)  # order_index=3

    def test_block_with_prompt(self):
        """Test block with AI prompt association"""
        prompt = Prompt.objects.create(
            name="Article Generator",
            type="text",
            block_type="article",
            ai_model="gpt-4",
            prompt_text="Generate article about {topic}",
        )

        block = PageBlock.objects.create(
            page=self.page,
            block_type="article",
            content_data={"title": "AI Generated"},
            prompt=prompt,
        )

        self.assertEqual(block.prompt, prompt)
        self.assertEqual(block.prompt.ai_model, "gpt-4")

    def test_block_type_properties(self):
        """Test block type check properties"""
        hero_block = PageBlock.objects.create(
            page=self.page, block_type="hero", content_data={}
        )
        article_block = PageBlock.objects.create(
            page=self.page, block_type="article", content_data={}
        )
        cta_block = PageBlock.objects.create(
            page=self.page, block_type="cta", content_data={}
        )

        self.assertTrue(hero_block.is_hero)
        self.assertFalse(hero_block.is_article)
        self.assertFalse(hero_block.is_cta)

        self.assertTrue(article_block.is_article)
        self.assertFalse(article_block.is_hero)

        self.assertTrue(cta_block.is_cta)
        self.assertFalse(cta_block.is_hero)

    def test_block_str_representation(self):
        """Test string representation"""
        block = PageBlock.objects.create(
            page=self.page, block_type="hero", content_data={}, order_index=1
        )
        expected = "example.com/home - Hero Banner #1"
        self.assertEqual(str(block), expected)

    def test_block_deletion_cascades(self):
        """Test that deleting page cascades to blocks"""
        PageBlock.objects.create(
            page=self.page, block_type="hero", content_data={}
        )
        PageBlock.objects.create(
            page=self.page, block_type="article", content_data={}
        )

        page_id = self.page.id
        self.page.delete()

        # Blocks should be deleted
        self.assertEqual(PageBlock.objects.filter(page_id=page_id).count(), 0)


class SwiperPresetModelTestCase(TestCase):
    """Test SwiperPreset model"""

    def test_swiper_preset_creation(self):
        """Test swiper preset creation"""
        preset = SwiperPreset.objects.create(
            name="Top 10 Slots",
            games_data=[
                {
                    "name": "Starburst",
                    "image": "starburst.jpg",
                    "description": "Classic slot game",
                },
                {
                    "name": "Book of Dead",
                    "image": "book-of-dead.jpg",
                    "description": "Adventure slot",
                },
            ],
            button_text="Play Now",
        )

        self.assertEqual(preset.name, "Top 10 Slots")
        self.assertEqual(preset.button_text, "Play Now")
        self.assertIsInstance(preset.games_data, list)
        self.assertEqual(len(preset.games_data), 2)

    def test_swiper_preset_games_data(self):
        """Test games_data JSON field"""
        games = [
            {
                "name": "Game 1",
                "image": "game1.jpg",
                "description": "First game",
                "rating": 4.5,
            },
            {
                "name": "Game 2",
                "image": "game2.jpg",
                "description": "Second game",
                "rating": 4.8,
            },
            {
                "name": "Game 3",
                "image": "game3.jpg",
                "description": "Third game",
                "rating": 4.2,
            },
        ]

        preset = SwiperPreset.objects.create(
            name="Featured Games", games_data=games, button_text="Play"
        )

        self.assertEqual(len(preset.games_data), 3)
        self.assertEqual(preset.games_data[0]["name"], "Game 1")
        self.assertEqual(preset.games_data[1]["rating"], 4.8)

    def test_swiper_preset_with_affiliate_link(self):
        """Test swiper preset with affiliate link"""
        affiliate = AffiliateLink.objects.create(
            name="Casino Affiliate", url="https://casino.example.com/ref123"
        )

        preset = SwiperPreset.objects.create(
            name="Casino Games",
            games_data=[{"name": "Slot 1", "image": "slot1.jpg"}],
            affiliate_link=affiliate,
        )

        self.assertEqual(preset.affiliate_link, affiliate)
        self.assertEqual(preset.affiliate_link.url, "https://casino.example.com/ref123")

    def test_swiper_preset_game_count_property(self):
        """Test game_count property"""
        games = [
            {"name": "Game 1"},
            {"name": "Game 2"},
            {"name": "Game 3"},
            {"name": "Game 4"},
            {"name": "Game 5"},
        ]

        preset = SwiperPreset.objects.create(
            name="5 Games", games_data=games, button_text="Play"
        )

        self.assertEqual(preset.game_count, 5)

    def test_swiper_preset_str_representation(self):
        """Test string representation"""
        preset = SwiperPreset.objects.create(
            name="Top Slots", games_data=[], button_text="Play"
        )
        self.assertEqual(str(preset), "Top Slots")

    def test_swiper_preset_ordering(self):
        """Test swiper presets are ordered by created_at desc"""
        import time

        preset1 = SwiperPreset.objects.create(
            name="Preset 1", games_data=[], button_text="Play"
        )
        time.sleep(0.1)
        preset2 = SwiperPreset.objects.create(
            name="Preset 2", games_data=[], button_text="Play"
        )
        time.sleep(0.1)
        preset3 = SwiperPreset.objects.create(
            name="Preset 3", games_data=[], button_text="Play"
        )

        presets = list(SwiperPreset.objects.all())
        self.assertEqual(presets[0], preset3)  # Most recent first
        self.assertEqual(presets[1], preset2)
        self.assertEqual(presets[2], preset1)


class PageAPITestCase(TestCase):
    """Test Page API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        from rest_framework.test import APIClient
        
        self.client = APIClient()
        
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )
        
        self.template = Template.objects.create(
            name="Test Template",
            html_content="<html></html>",
            css_content="body {}",
        )
        
        self.site = Site.objects.create(
            user=self.user,
            domain="example.com",
            brand_name="Example",
            template=self.template,
        )
        
        self.page = Page.objects.create(
            site=self.site,
            slug="test-page",
            title="Test Page",
            is_published=False
        )
        
        # Authenticate
        self.client.force_authenticate(user=self.user)
    
    def test_publish_page_endpoint(self):
        """Test publishing a page via API"""
        url = f'/api/pages/{self.page.id}/publish/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['is_published'])
        
        # Verify in database
        self.page.refresh_from_db()
        self.assertTrue(self.page.is_published)
        self.assertIsNotNone(self.page.published_at)
    
    def test_unpublish_page_endpoint(self):
        """Test unpublishing a page via API"""
        from django.utils import timezone
        
        # Make page published first
        self.page.is_published = True
        self.page.published_at = timezone.now()
        self.page.save()
        
        url = f'/api/pages/{self.page.id}/unpublish/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['is_published'])
        
        # Verify in database
        self.page.refresh_from_db()
        self.assertFalse(self.page.is_published)
    
    def test_cannot_publish_other_users_page(self):
        """Test that users cannot publish pages they don't own"""
        # Create another user
        other_user = User.objects.create_user(
            username="otheruser",
            email="other@example.com",
            password="testpass123"
        )
        
        # Create page owned by other user
        other_template = Template.objects.create(
            name="Other Template",
            html_content="<html></html>",
            css_content="body {}",
        )
        
        other_site = Site.objects.create(
            user=other_user,
            domain="other.com",
            brand_name="Other",
            template=other_template,
        )
        
        other_page = Page.objects.create(
            site=other_site,
            slug="other-page",
            title="Other Page",
        )
        
        # Try to publish other user's page
        url = f'/api/pages/{other_page.id}/publish/'
        response = self.client.post(url)
        
        # Should be forbidden or not found
        self.assertIn(response.status_code, [403, 404])
    
    def test_duplicate_page_copies_published_status_as_false(self):
        """Test that duplicated pages are not published by default"""
        self.page.is_published = True
        self.page.save()
        
        url = f'/api/pages/{self.page.id}/duplicate/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, 201)
        
        # New page should not be published
        new_page_id = response.data['id']
        new_page = Page.objects.get(id=new_page_id)
        self.assertFalse(new_page.is_published)
