from django.test import TestCase
from django.utils import timezone
from integrations.models import ApiToken, CloudflareToken


class ApiTokenModelTestCase(TestCase):
    """Test ApiToken model"""

    def test_api_token_creation(self):
        """Test API token creation"""
        token = ApiToken.objects.create(
            name="OpenAI Token",
            service="chatgpt",
            token_value="sk-test1234567890abcdef",
            is_active=True,
        )

        self.assertEqual(token.name, "OpenAI Token")
        self.assertEqual(token.service, "chatgpt")
        self.assertEqual(token.token_value, "sk-test1234567890abcdef")
        self.assertTrue(token.is_active)
        self.assertEqual(token.usage_count, 0)

    def test_api_token_service_choices(self):
        """Test all service choices"""
        services = [
            "chatgpt",
            "grok",
            "claude",
            "cloudflare",
            "elevenlabs",
            "dalle",
            "midjourney",
        ]

        for service in services:
            token = ApiToken.objects.create(
                name=f"{service.title()} Token",
                service=service,
                token_value=f"token-{service}-123",
            )
            self.assertEqual(token.service, service)

    def test_api_token_min_length_validation(self):
        """Test token value minimum length validation"""
        from django.core.exceptions import ValidationError
        
        # Token with less than 10 characters should fail on full_clean()
        short_token = ApiToken(
            name="Short Token", service="chatgpt", token_value="short"
        )
        with self.assertRaises(ValidationError):
            short_token.full_clean()

        # Token with 10+ characters should pass
        token = ApiToken.objects.create(
            name="Valid Token",
            service="chatgpt",
            token_value="1234567890",  # Exactly 10
        )
        self.assertIsNotNone(token.id)

    def test_api_token_active_inactive(self):
        """Test is_active flag"""
        active_token = ApiToken.objects.create(
            name="Active Token",
            service="chatgpt",
            token_value="active-token-123",
            is_active=True,
        )

        inactive_token = ApiToken.objects.create(
            name="Inactive Token",
            service="chatgpt",
            token_value="inactive-token-123",
            is_active=False,
        )

        self.assertTrue(active_token.is_active)
        self.assertFalse(inactive_token.is_active)

        # Query active tokens
        active_tokens = ApiToken.objects.filter(is_active=True)
        self.assertIn(active_token, active_tokens)
        self.assertNotIn(inactive_token, active_tokens)

    def test_api_token_usage_tracking(self):
        """Test usage_count and last_used tracking"""
        token = ApiToken.objects.create(
            name="Test Token",
            service="chatgpt",
            token_value="test-token-123",
        )

        self.assertEqual(token.usage_count, 0)
        self.assertIsNone(token.last_used)

    def test_api_token_increment_usage(self):
        """Test increment_usage method"""
        token = ApiToken.objects.create(
            name="Test Token",
            service="chatgpt",
            token_value="test-token-123",
        )

        # Increment usage
        token.increment_usage()
        token.refresh_from_db()

        self.assertEqual(token.usage_count, 1)
        self.assertIsNotNone(token.last_used)
        self.assertLessEqual(token.last_used, timezone.now())

        # Increment again
        token.increment_usage()
        token.refresh_from_db()

        self.assertEqual(token.usage_count, 2)

    def test_api_token_timestamps(self):
        """Test created_at and updated_at timestamps"""
        import time
        
        token = ApiToken.objects.create(
            name="Test Token",
            service="chatgpt",
            token_value="test-token-123",
        )

        self.assertIsNotNone(token.created_at)
        self.assertIsNotNone(token.updated_at)

        # Update token
        original_updated_at = token.updated_at
        time.sleep(0.01)  # Small delay to ensure timestamp changes
        token.name = "Updated Token"
        token.save()

        self.assertGreaterEqual(token.updated_at, original_updated_at)

    def test_api_token_str_representation(self):
        """Test string representation"""
        token = ApiToken.objects.create(
            name="My GPT Token",
            service="chatgpt",
            token_value="test-token-123",
        )

        expected = "My GPT Token (ChatGPT)"
        self.assertEqual(str(token), expected)

    def test_api_token_multiple_services(self):
        """Test multiple tokens for different services"""
        tokens = []
        services = ["chatgpt", "claude", "cloudflare", "dalle"]

        for service in services:
            token = ApiToken.objects.create(
                name=f"{service} Token",
                service=service,
                token_value=f"token-{service}-123",
            )
            tokens.append(token)

        self.assertEqual(ApiToken.objects.count(), 4)

        # Filter by service
        chatgpt_tokens = ApiToken.objects.filter(service="chatgpt")
        self.assertEqual(chatgpt_tokens.count(), 1)


class CloudflareTokenModelTestCase(TestCase):
    """Test CloudflareToken model"""

    def setUp(self):
        """Set up test data"""
        self.api_token = ApiToken.objects.create(
            name="CF API Token",
            service="cloudflare",
            token_value="cloudflare-token-123",
        )

    def test_cloudflare_token_creation(self):
        """Test Cloudflare token creation"""
        cf_token = CloudflareToken.objects.create(
            api_token=self.api_token,
            name="My CF Token",
            account_id="account123abc",
            zone_id="zone456def",
            pages_project_name="my-project",
        )

        self.assertEqual(cf_token.api_token, self.api_token)
        self.assertEqual(cf_token.name, "My CF Token")
        self.assertEqual(cf_token.account_id, "account123abc")
        self.assertEqual(cf_token.zone_id, "zone456def")
        self.assertEqual(cf_token.pages_project_name, "my-project")

    def test_cloudflare_token_optional_fields(self):
        """Test Cloudflare token with optional fields"""
        cf_token = CloudflareToken.objects.create(
            api_token=self.api_token,
            name="Minimal CF Token",
        )

        self.assertEqual(cf_token.account_id, "")
        self.assertEqual(cf_token.zone_id, "")
        self.assertEqual(cf_token.pages_project_name, "")

    def test_cloudflare_token_account_id(self):
        """Test account_id storage"""
        cf_token = CloudflareToken.objects.create(
            api_token=self.api_token,
            name="Token with Account",
            account_id="abcdef123456",
        )

        self.assertEqual(cf_token.account_id, "abcdef123456")

    def test_cloudflare_token_zone_id(self):
        """Test zone_id storage for DNS operations"""
        cf_token = CloudflareToken.objects.create(
            api_token=self.api_token,
            name="Token with Zone",
            zone_id="zone-789-xyz",
        )

        self.assertEqual(cf_token.zone_id, "zone-789-xyz")

    def test_cloudflare_token_pages_project_name(self):
        """Test pages_project_name configuration"""
        cf_token = CloudflareToken.objects.create(
            api_token=self.api_token,
            name="Pages Token",
            pages_project_name="my-awesome-site",
        )

        self.assertEqual(cf_token.pages_project_name, "my-awesome-site")

    def test_cloudflare_token_str_representation(self):
        """Test string representation"""
        cf_token = CloudflareToken.objects.create(
            api_token=self.api_token,
            name="Production CF Token",
        )

        self.assertEqual(str(cf_token), "Production CF Token")

    def test_cloudflare_token_created_at(self):
        """Test created_at timestamp"""
        cf_token = CloudflareToken.objects.create(
            api_token=self.api_token,
            name="Test Token",
        )

        self.assertIsNotNone(cf_token.created_at)
        self.assertLessEqual(cf_token.created_at, timezone.now())

    def test_cloudflare_token_api_token_relationship(self):
        """Test relationship with ApiToken"""
        cf_token1 = CloudflareToken.objects.create(
            api_token=self.api_token,
            name="CF Token 1",
        )
        cf_token2 = CloudflareToken.objects.create(
            api_token=self.api_token,
            name="CF Token 2",
        )

        # One API token can have multiple CF configs
        self.assertEqual(self.api_token.cloudflare_configs.count(), 2)
        self.assertIn(cf_token1, self.api_token.cloudflare_configs.all())
        self.assertIn(cf_token2, self.api_token.cloudflare_configs.all())

    def test_cloudflare_token_deletion_cascade(self):
        """Test that deleting API token cascades to CF tokens"""
        cf_token1 = CloudflareToken.objects.create(
            api_token=self.api_token,
            name="CF Token 1",
        )
        cf_token2 = CloudflareToken.objects.create(
            api_token=self.api_token,
            name="CF Token 2",
        )

        api_token_id = self.api_token.id
        self.api_token.delete()

        # CF tokens should be deleted
        self.assertEqual(
            CloudflareToken.objects.filter(api_token_id=api_token_id).count(), 0
        )

    def test_cloudflare_token_multiple_configurations(self):
        """Test multiple Cloudflare configurations"""
        cf_token1 = CloudflareToken.objects.create(
            api_token=self.api_token,
            name="Production",
            account_id="prod-account",
            zone_id="prod-zone",
            pages_project_name="prod-project",
        )

        # Create another API token for staging
        api_token2 = ApiToken.objects.create(
            name="CF Staging Token",
            service="cloudflare",
            token_value="staging-token-123",
        )

        cf_token2 = CloudflareToken.objects.create(
            api_token=api_token2,
            name="Staging",
            account_id="staging-account",
            zone_id="staging-zone",
            pages_project_name="staging-project",
        )

        # Both should exist independently
        self.assertEqual(CloudflareToken.objects.count(), 2)
        self.assertEqual(cf_token1.account_id, "prod-account")
        self.assertEqual(cf_token2.account_id, "staging-account")

    def test_cloudflare_token_full_configuration(self):
        """Test Cloudflare token with all fields populated"""
        cf_token = CloudflareToken.objects.create(
            api_token=self.api_token,
            name="Complete CF Configuration",
            account_id="acc-123-xyz",
            zone_id="zone-456-abc",
            pages_project_name="my-production-site",
        )

        self.assertIsNotNone(cf_token.api_token)
        self.assertIsNotNone(cf_token.name)
        self.assertIsNotNone(cf_token.account_id)
        self.assertIsNotNone(cf_token.zone_id)
        self.assertIsNotNone(cf_token.pages_project_name)
        self.assertIsNotNone(cf_token.created_at)

        # Verify all values
        self.assertEqual(cf_token.account_id, "acc-123-xyz")
        self.assertEqual(cf_token.zone_id, "zone-456-abc")
        self.assertEqual(cf_token.pages_project_name, "my-production-site")
