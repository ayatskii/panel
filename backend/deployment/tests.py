from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from deployment.models import Deployment
from sites.models import Site
from templates.models import Template, TemplateFootprint
from integrations.models import ApiToken, CloudflareToken

User = get_user_model()


class DeploymentModelTestCase(TestCase):
    """Test Deployment model"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        self.template = Template.objects.create(
            name="Test Template",
            html_content="<html>{{brand_name}}</html>",
            css_content="body { color: #000; }",
            type="sectional",
            version="1.0.0",
        )

        self.footprint = TemplateFootprint.objects.create(
            template=self.template,
            name="WordPress",
            cms_type="wordpress",
        )

        self.site = Site.objects.create(
            user=self.user,
            domain="example.com",
            brand_name="Example",
            template=self.template,
            template_footprint=self.footprint,
            template_variables={"meta_title": "Example Site"},
            custom_colors={"primary": "#FF0000"},
            enable_page_speed=True,
            unique_class_prefix="site-123-abc",
        )

        self.api_token = ApiToken.objects.create(
            name="CF Token",
            service="cloudflare",
            token_value="test-token-123",
        )

        self.cf_token = CloudflareToken.objects.create(
            api_token=self.api_token,
            name="My CF Token",
            account_id="account123",
            zone_id="zone123",
        )

    def test_deployment_creation(self):
        """Test deployment creation"""
        deployment = Deployment.objects.create(
            site=self.site,
            cloudflare_token=self.cf_token,
            status="pending",
        )

        self.assertEqual(deployment.site, self.site)
        self.assertEqual(deployment.cloudflare_token, self.cf_token)
        self.assertEqual(deployment.status, "pending")
        self.assertIsNotNone(deployment.created_at)

    def test_deployment_status_choices(self):
        """Test deployment status choices"""
        statuses = ["pending", "building", "success", "failed"]

        for status in statuses:
            deployment = Deployment.objects.create(
                site=self.site,
                cloudflare_token=self.cf_token,
                status=status,
            )
            self.assertEqual(deployment.status, status)

    def test_deployment_template_snapshot_auto_creation(self):
        """Test template snapshot is automatically created on save"""
        deployment = Deployment.objects.create(
            site=self.site,
            cloudflare_token=self.cf_token,
            status="pending",
        )

        # Template snapshot should be automatically created
        self.assertIsNotNone(deployment.template_snapshot)
        self.assertIsInstance(deployment.template_snapshot, dict)

        # Verify snapshot contents
        self.assertIn("template", deployment.template_snapshot)
        self.assertIn("footprint", deployment.template_snapshot)
        self.assertIn("variables", deployment.template_snapshot)
        self.assertIn("colors", deployment.template_snapshot)
        self.assertIn("settings", deployment.template_snapshot)

        # Verify template data
        self.assertEqual(deployment.template_snapshot["template"]["id"], self.template.id)
        self.assertEqual(
            deployment.template_snapshot["template"]["name"], "Test Template"
        )
        self.assertEqual(
            deployment.template_snapshot["template"]["version"], "1.0.0"
        )

        # Verify footprint data
        self.assertEqual(
            deployment.template_snapshot["footprint"]["id"], self.footprint.id
        )
        self.assertEqual(
            deployment.template_snapshot["footprint"]["cms_type"], "wordpress"
        )

        # Verify variables
        self.assertEqual(
            deployment.template_snapshot["variables"], {"meta_title": "Example Site"}
        )

        # Verify colors
        self.assertEqual(
            deployment.template_snapshot["colors"], {"primary": "#FF0000"}
        )

    def test_deployment_build_information(self):
        """Test deployment build information fields"""
        deployment = Deployment.objects.create(
            site=self.site,
            cloudflare_token=self.cf_token,
            status="success",
            git_commit_hash="abc123def456",
            build_log="Build successful\nAll files generated",
            deployed_url="https://example.pages.dev",
            build_time_seconds=45,
            file_count=25,
            total_size_bytes=524288,  # 512 KB
        )

        self.assertEqual(deployment.git_commit_hash, "abc123def456")
        self.assertIn("Build successful", deployment.build_log)
        self.assertEqual(deployment.deployed_url, "https://example.pages.dev")
        self.assertEqual(deployment.build_time_seconds, 45)
        self.assertEqual(deployment.file_count, 25)
        self.assertEqual(deployment.total_size_bytes, 524288)

    def test_deployment_generated_files(self):
        """Test generated_files JSON field"""
        deployment = Deployment.objects.create(
            site=self.site,
            cloudflare_token=self.cf_token,
            status="success",
            generated_files=[
                "index.html",
                "about.html",
                "contact.html",
                "assets/css/style.css",
                "assets/js/script.js",
                "assets/images/logo.png",
            ],
        )

        self.assertIsInstance(deployment.generated_files, list)
        self.assertEqual(len(deployment.generated_files), 6)
        self.assertIn("index.html", deployment.generated_files)
        self.assertIn("assets/css/style.css", deployment.generated_files)

    def test_deployment_unique_identifiers(self):
        """Test unique_identifiers JSON field"""
        deployment = Deployment.objects.create(
            site=self.site,
            cloudflare_token=self.cf_token,
            status="success",
            unique_identifiers={
                "class_prefix": "site-123-abc",
                "image_dimensions": {
                    "mobile": 480,
                    "desktop": 800,
                },
                "build_id": "build-789",
            },
        )

        self.assertIsInstance(deployment.unique_identifiers, dict)
        self.assertEqual(
            deployment.unique_identifiers["class_prefix"], "site-123-abc"
        )
        self.assertIn("image_dimensions", deployment.unique_identifiers)

    def test_deployment_is_complete_property(self):
        """Test is_complete property"""
        pending = Deployment.objects.create(
            site=self.site,
            cloudflare_token=self.cf_token,
            status="pending",
        )
        building = Deployment.objects.create(
            site=self.site,
            cloudflare_token=self.cf_token,
            status="building",
        )
        success = Deployment.objects.create(
            site=self.site,
            cloudflare_token=self.cf_token,
            status="success",
        )
        failed = Deployment.objects.create(
            site=self.site,
            cloudflare_token=self.cf_token,
            status="failed",
        )

        self.assertFalse(pending.is_complete)
        self.assertFalse(building.is_complete)
        self.assertTrue(success.is_complete)
        self.assertTrue(failed.is_complete)

    def test_deployment_duration_property(self):
        """Test duration property calculation"""
        deployment = Deployment.objects.create(
            site=self.site,
            cloudflare_token=self.cf_token,
            status="success",
        )

        # Without completed_at, duration should be None
        self.assertIsNone(deployment.duration)

        # Set completed_at
        deployment.completed_at = timezone.now()
        deployment.save()

        # Duration should be calculated
        duration = deployment.duration
        self.assertIsNotNone(duration)
        self.assertGreaterEqual(duration, 0)

    def test_deployment_completion_timestamp(self):
        """Test completed_at timestamp"""
        deployment = Deployment.objects.create(
            site=self.site,
            cloudflare_token=self.cf_token,
            status="pending",
        )

        self.assertIsNone(deployment.completed_at)

        # Mark as complete
        deployment.status = "success"
        deployment.completed_at = timezone.now()
        deployment.save()

        self.assertIsNotNone(deployment.completed_at)

    def test_deployment_ordering(self):
        """Test deployments are ordered by created_at desc"""
        import time

        deployment1 = Deployment.objects.create(
            site=self.site,
            cloudflare_token=self.cf_token,
            status="success",
        )
        time.sleep(0.1)

        deployment2 = Deployment.objects.create(
            site=self.site,
            cloudflare_token=self.cf_token,
            status="success",
        )
        time.sleep(0.1)

        deployment3 = Deployment.objects.create(
            site=self.site,
            cloudflare_token=self.cf_token,
            status="pending",
        )

        deployments = list(Deployment.objects.all())
        self.assertEqual(deployments[0], deployment3)  # Most recent first
        self.assertEqual(deployments[1], deployment2)
        self.assertEqual(deployments[2], deployment1)

    def test_deployment_str_representation(self):
        """Test string representation"""
        deployment = Deployment.objects.create(
            site=self.site,
            cloudflare_token=self.cf_token,
            status="success",
        )

        str_repr = str(deployment)
        self.assertIn("example.com", str_repr)
        self.assertIn("success", str_repr)

    def test_deployment_site_relationship(self):
        """Test deployment-site relationship"""
        deployment1 = Deployment.objects.create(
            site=self.site,
            cloudflare_token=self.cf_token,
            status="success",
        )
        deployment2 = Deployment.objects.create(
            site=self.site,
            cloudflare_token=self.cf_token,
            status="failed",
        )

        self.assertEqual(self.site.deployments.count(), 2)
        self.assertIn(deployment1, self.site.deployments.all())
        self.assertIn(deployment2, self.site.deployments.all())

    def test_deployment_deletion_cascade(self):
        """Test that deleting site cascades to deployments"""
        Deployment.objects.create(
            site=self.site,
            cloudflare_token=self.cf_token,
            status="success",
        )
        Deployment.objects.create(
            site=self.site,
            cloudflare_token=self.cf_token,
            status="failed",
        )

        site_id = self.site.id
        self.site.delete()

        # Deployments should be deleted
        self.assertEqual(Deployment.objects.filter(site_id=site_id).count(), 0)

    def test_deployment_cloudflare_token_protect(self):
        """Test that cloudflare token cannot be deleted if deployments exist"""
        deployment = Deployment.objects.create(
            site=self.site,
            cloudflare_token=self.cf_token,
            status="success",
        )

        # This should raise an error
        with self.assertRaises(Exception):
            self.cf_token.delete()

    def test_deployment_without_footprint(self):
        """Test deployment for site without footprint"""
        site_no_footprint = Site.objects.create(
            user=self.user,
            domain="no-footprint.com",
            brand_name="No Footprint",
            template=self.template,
        )

        deployment = Deployment.objects.create(
            site=site_no_footprint,
            cloudflare_token=self.cf_token,
            status="pending",
        )

        # Snapshot should still be created
        self.assertIsNotNone(deployment.template_snapshot)
        self.assertIsNone(deployment.template_snapshot["footprint"])


class DeploymentViewSetTestCase(TestCase):
    """Test DeploymentViewSet API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )

        self.template = Template.objects.create(
            name="Test Template",
            html_content="<html>{{brand_name}}</html>",
            css_content="body { color: #000; }",
            type="sectional",
            version="1.0.0",
        )

        self.site = Site.objects.create(
            user=self.user,
            domain="example.com",
            brand_name="Example",
            template=self.template,
        )

        self.api_token = ApiToken.objects.create(
            name="CF Token",
            service="cloudflare",
            token_value="test-token-123",
        )

        self.cf_token = CloudflareToken.objects.create(
            api_token=self.api_token,
            name="My CF Token",
            account_id="account123",
            zone_id="zone123",
        )

        self.deployment = Deployment.objects.create(
            site=self.site,
            cloudflare_token=self.cf_token,
            status="success",
        )

    def test_trigger_deployment_success(self):
        """Test successful deployment trigger"""
        from django.test import Client
        from rest_framework.test import APIClient
        from rest_framework_simplejwt.tokens import RefreshToken
        from unittest.mock import patch
        
        client = APIClient()
        
        # Get JWT token
        refresh = RefreshToken.for_user(self.user)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Mock the Celery task to prevent it from running
        with patch('deployment.tasks.deploy_site_async.delay') as mock_task:
            # Trigger deployment
            response = client.post(f'/api/deployments/{self.deployment.id}/trigger/')
            
            self.assertEqual(response.status_code, 201)
            self.assertIn('deployment_id', response.data)
            self.assertEqual(response.data['message'], 'Deployment triggered successfully')
            
            # Check that a new deployment was created
            new_deployment = Deployment.objects.get(id=response.data['deployment_id'])
            self.assertEqual(new_deployment.site, self.site)
            self.assertEqual(new_deployment.cloudflare_token, self.cf_token)
            self.assertEqual(new_deployment.status, 'pending')
            
            # Verify the task was called
            mock_task.assert_called_once_with(new_deployment.id, self.user.id)

    def test_trigger_deployment_already_in_progress(self):
        """Test triggering deployment when one is already in progress"""
        from django.test import Client
        from rest_framework.test import APIClient
        from rest_framework_simplejwt.tokens import RefreshToken
        
        # Create a deployment that's already in progress
        in_progress_deployment = Deployment.objects.create(
            site=self.site,
            cloudflare_token=self.cf_token,
            status="building",
        )
        
        client = APIClient()
        
        # Get JWT token
        refresh = RefreshToken.for_user(self.user)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Try to trigger deployment
        response = client.post(f'/api/deployments/{in_progress_deployment.id}/trigger/')
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'Deployment already in progress')

    def test_get_deployment_logs(self):
        """Test getting deployment logs"""
        from django.test import Client
        from rest_framework.test import APIClient
        from rest_framework_simplejwt.tokens import RefreshToken
        
        # Set some build log
        self.deployment.build_log = "Build started\nCompiling assets\nDeployment complete"
        self.deployment.save()
        
        client = APIClient()
        
        # Get JWT token
        refresh = RefreshToken.for_user(self.user)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Get logs
        response = client.get(f'/api/deployments/{self.deployment.id}/logs/')
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('logs', response.data)
        self.assertIn('status', response.data)
        self.assertEqual(len(response.data['logs']), 3)
        self.assertEqual(response.data['logs'][0], 'Build started')
        self.assertEqual(response.data['logs'][1], 'Compiling assets')
        self.assertEqual(response.data['logs'][2], 'Deployment complete')

    def test_cancel_deployment_success(self):
        """Test successful deployment cancellation"""
        from django.test import Client
        from rest_framework.test import APIClient
        from rest_framework_simplejwt.tokens import RefreshToken
        
        # Create a pending deployment
        pending_deployment = Deployment.objects.create(
            site=self.site,
            cloudflare_token=self.cf_token,
            status="pending",
        )
        
        client = APIClient()
        
        # Get JWT token
        refresh = RefreshToken.for_user(self.user)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Cancel deployment
        response = client.post(f'/api/deployments/{pending_deployment.id}/cancel/')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['message'], 'Deployment cancelled')
        
        # Check that deployment was cancelled
        pending_deployment.refresh_from_db()
        self.assertEqual(pending_deployment.status, 'failed')
        self.assertEqual(pending_deployment.build_log, 'Cancelled by user')

    def test_cancel_deployment_not_pending(self):
        """Test cancelling deployment that's not pending"""
        from django.test import Client
        from rest_framework.test import APIClient
        from rest_framework_simplejwt.tokens import RefreshToken
        
        client = APIClient()
        
        # Get JWT token
        refresh = RefreshToken.for_user(self.user)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Try to cancel a completed deployment
        response = client.post(f'/api/deployments/{self.deployment.id}/cancel/')
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'Cannot cancel deployment in current status')