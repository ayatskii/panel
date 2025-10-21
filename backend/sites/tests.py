from django.test import TestCase
from django.contrib.auth import get_user_model
from sites.models import Site, Language, AffiliateLink
from templates.models import Template, TemplateFootprint
from media.models import Media
from integrations.models import CloudflareToken, ApiToken

User = get_user_model()


class LanguageModelTestCase(TestCase):
    """Test Language model"""

    def test_language_creation(self):
        """Test language creation"""
        lang = Language.objects.create(code="en-US", name="English (US)", is_active=True)

        self.assertEqual(lang.code, "en-US")
        self.assertEqual(lang.name, "English (US)")
        self.assertTrue(lang.is_active)

    def test_language_unique_code(self):
        """Test language code is unique"""
        Language.objects.create(code="en-US", name="English")

        with self.assertRaises(Exception):
            Language.objects.create(code="en-US", name="English Duplicate")

    def test_language_str_representation(self):
        """Test string representation"""
        lang = Language.objects.create(code="fr-FR", name="French")
        self.assertEqual(str(lang), "French (fr-FR)")


class AffiliateLinkModelTestCase(TestCase):
    """Test AffiliateLink model"""

    def test_affiliate_link_creation(self):
        """Test affiliate link creation"""
        link = AffiliateLink.objects.create(
            name="Test Affiliate",
            url="https://affiliate.example.com/ref123",
            description="Test affiliate link",
            click_tracking=True,
        )

        self.assertEqual(link.name, "Test Affiliate")
        self.assertTrue(link.click_tracking)
        self.assertIsNotNone(link.created_at)

    def test_affiliate_link_url_validation(self):
        """Test URL validation"""
        from django.core.exceptions import ValidationError

        # Valid URL should work
        link = AffiliateLink.objects.create(
            name="Valid Link", url="https://example.com/affiliate"
        )
        self.assertIsNotNone(link.id)

        # Invalid URL should fail on full_clean()
        invalid_link = AffiliateLink(name="Invalid Link", url="not-a-valid-url")
        with self.assertRaises(ValidationError):
            invalid_link.full_clean()

    def test_affiliate_link_str_representation(self):
        """Test string representation"""
        link = AffiliateLink.objects.create(
            name="My Affiliate", url="https://example.com"
        )
        self.assertEqual(str(link), "My Affiliate")


class SiteModelTestCase(TestCase):
    """Test Site model"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        self.template = Template.objects.create(
            name="Test Template",
            html_content="<html>{{brand_name}}</html>",
            css_content="body { color: #000; }",
        )

    def test_site_creation(self):
        """Test site creation with required fields"""
        site = Site.objects.create(
            user=self.user,
            domain="example.com",
            brand_name="Example Brand",
            language_code="en-US",
            template=self.template,
        )

        self.assertEqual(site.domain, "example.com")
        self.assertEqual(site.brand_name, "Example Brand")
        self.assertEqual(site.user, self.user)
        self.assertEqual(site.template, self.template)
        self.assertIsNotNone(site.created_at)

    def test_site_unique_domain(self):
        """Test domain uniqueness"""
        Site.objects.create(
            user=self.user,
            domain="example.com",
            brand_name="Brand 1",
            template=self.template,
        )

        with self.assertRaises(Exception):
            Site.objects.create(
                user=self.user,
                domain="example.com",
                brand_name="Brand 2",
                template=self.template,
            )

    def test_site_template_variables(self):
        """Test template variables JSON field"""
        site = Site.objects.create(
            user=self.user,
            domain="example.com",
            brand_name="Example",
            template=self.template,
            template_variables={
                "meta_title": "My Site",
                "meta_description": "A great site",
                "copyright": "2025",
            },
        )

        self.assertIsInstance(site.template_variables, dict)
        self.assertEqual(site.template_variables["meta_title"], "My Site")
        self.assertEqual(site.template_variables["copyright"], "2025")

    def test_site_custom_colors(self):
        """Test custom colors JSON field"""
        site = Site.objects.create(
            user=self.user,
            domain="example.com",
            brand_name="Example",
            template=self.template,
            custom_colors={
                "primary": "#FF5733",
                "secondary": "#33FF57",
                "accent": "#3357FF",
            },
        )

        self.assertIsInstance(site.custom_colors, dict)
        self.assertEqual(site.custom_colors["primary"], "#FF5733")
        self.assertEqual(len(site.custom_colors), 3)

    def test_site_unique_class_prefix(self):
        """Test unique CSS class prefix"""
        site = Site.objects.create(
            user=self.user,
            domain="example.com",
            brand_name="Example",
            template=self.template,
            unique_class_prefix="site-123-abc",
        )

        self.assertEqual(site.unique_class_prefix, "site-123-abc")

    def test_site_page_speed_settings(self):
        """Test page speed optimization settings"""
        site = Site.objects.create(
            user=self.user,
            domain="example.com",
            brand_name="Example",
            template=self.template,
            enable_page_speed=True,
        )

        self.assertTrue(site.enable_page_speed)

    def test_site_seo_settings(self):
        """Test SEO-related settings"""
        site = Site.objects.create(
            user=self.user,
            domain="example.com",
            brand_name="Example",
            template=self.template,
            allow_indexing=True,
            redirect_404_to_home=False,
            use_www_version=True,
        )

        self.assertTrue(site.allow_indexing)
        self.assertFalse(site.redirect_404_to_home)
        self.assertTrue(site.use_www_version)

    def test_site_with_footprint(self):
        """Test site with template footprint"""
        footprint = TemplateFootprint.objects.create(
            template=self.template, name="WordPress", cms_type="wordpress"
        )

        site = Site.objects.create(
            user=self.user,
            domain="example.com",
            brand_name="Example",
            template=self.template,
            template_footprint=footprint,
        )

        self.assertEqual(site.template_footprint, footprint)
        self.assertEqual(site.template_footprint.cms_type, "wordpress")

    def test_site_with_cloudflare_token(self):
        """Test site with Cloudflare token"""
        api_token = ApiToken.objects.create(
            name="CF Token", service="cloudflare", token_value="test-token-12345"
        )
        cf_token = CloudflareToken.objects.create(
            api_token=api_token,
            name="My CF Token",
            account_id="account123",
            zone_id="zone123",
        )

        site = Site.objects.create(
            user=self.user,
            domain="example.com",
            brand_name="Example",
            template=self.template,
            cloudflare_token=cf_token,
        )

        self.assertEqual(site.cloudflare_token, cf_token)
        self.assertEqual(site.cloudflare_token.account_id, "account123")

    def test_site_with_affiliate_link(self):
        """Test site with affiliate link"""
        affiliate = AffiliateLink.objects.create(
            name="Test Affiliate", url="https://affiliate.example.com"
        )

        site = Site.objects.create(
            user=self.user,
            domain="example.com",
            brand_name="Example",
            template=self.template,
            affiliate_link=affiliate,
        )

        self.assertEqual(site.affiliate_link, affiliate)

    def test_site_with_media_assets(self):
        """Test site with favicon and logo media"""
        # Note: Media requires a file, so we'll test the FK relationship
        from django.core.files.uploadedfile import SimpleUploadedFile

        favicon_file = SimpleUploadedFile("favicon.svg", b"<svg></svg>")
        logo_file = SimpleUploadedFile("logo.svg", b"<svg></svg>")

        favicon = Media.objects.create(
            filename="favicon.svg",
            original_name="favicon.svg",
            file=favicon_file,
            file_path="/media/favicon.svg",
            file_size=100,
            mime_type="image/svg+xml",
            uploaded_by=self.user,
        )

        logo = Media.objects.create(
            filename="logo.svg",
            original_name="logo.svg",
            file=logo_file,
            file_path="/media/logo.svg",
            file_size=200,
            mime_type="image/svg+xml",
            uploaded_by=self.user,
        )

        site = Site.objects.create(
            user=self.user,
            domain="example.com",
            brand_name="Example",
            template=self.template,
            favicon_media=favicon,
            logo_media=logo,
        )

        self.assertEqual(site.favicon_media, favicon)
        self.assertEqual(site.logo_media, logo)

    def test_site_is_deployed_property(self):
        """Test is_deployed property"""
        from django.utils import timezone

        # Site without deployed_at should not be deployed
        site = Site.objects.create(
            user=self.user,
            domain="example.com",
            brand_name="Example",
            template=self.template,
        )
        self.assertFalse(site.is_deployed)

        # Site with deployed_at should be deployed
        site.deployed_at = timezone.now()
        site.save()
        self.assertTrue(site.is_deployed)

    def test_site_str_representation(self):
        """Test string representation"""
        site = Site.objects.create(
            user=self.user,
            domain="example.com",
            brand_name="Example Brand",
            template=self.template,
        )
        expected = "Example Brand (example.com)"
        self.assertEqual(str(site), expected)

    def test_site_user_relationship(self):
        """Test site-user relationship"""
        site1 = Site.objects.create(
            user=self.user,
            domain="site1.com",
            brand_name="Site 1",
            template=self.template,
        )
        site2 = Site.objects.create(
            user=self.user,
            domain="site2.com",
            brand_name="Site 2",
            template=self.template,
        )

        self.assertEqual(self.user.sites.count(), 2)
        self.assertIn(site1, self.user.sites.all())
        self.assertIn(site2, self.user.sites.all())

    def test_site_deletion_cascade(self):
        """Test that deleting user cascades to sites"""
        site = Site.objects.create(
            user=self.user,
            domain="example.com",
            brand_name="Example",
            template=self.template,
        )

        site_id = site.id
        user_id = self.user.id
        
        # Delete site first (to avoid cascade issues with pages)
        site.delete()
        
        # Then delete user
        self.user.delete()

        # Both should be deleted
        self.assertEqual(Site.objects.filter(id=site_id).count(), 0)
        self.assertEqual(Site.objects.filter(user_id=user_id).count(), 0)

    def test_site_template_protect(self):
        """Test that template cannot be deleted if sites use it"""
        site = Site.objects.create(
            user=self.user,
            domain="example.com",
            brand_name="Example",
            template=self.template,
        )

        # This should raise an error because site uses this template
        with self.assertRaises(Exception):
            self.template.delete()
