from django.test import TestCase
from django.contrib.auth import get_user_model
from sites.models import Site
from templates.models import Template

User = get_user_model()


class UserManagerTestCase(TestCase):
    """Test custom UserManager"""

    def test_create_user(self):
        """Test creating a regular user"""
        user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        self.assertEqual(user.username, "testuser")
        self.assertEqual(user.email, "test@example.com")
        self.assertEqual(user.role, "user")  # Default role
        self.assertTrue(user.check_password("testpass123"))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_user_without_email(self):
        """Test that creating user without email raises error"""
        with self.assertRaises(ValueError) as context:
            User.objects.create_user(
                username="testuser", email="", password="testpass123"
            )
        self.assertIn("email", str(context.exception).lower())

    def test_create_superuser(self):
        """Test creating a superuser"""
        admin = User.objects.create_superuser(
            username="admin", email="admin@example.com", password="adminpass123"
        )

        self.assertEqual(admin.username, "admin")
        self.assertEqual(admin.email, "admin@example.com")
        self.assertEqual(admin.role, "admin")
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_active)

    def test_create_superuser_with_invalid_is_staff(self):
        """Test that superuser must have is_staff=True"""
        with self.assertRaises(ValueError) as context:
            User.objects.create_superuser(
                username="admin",
                email="admin@example.com",
                password="pass123",
                is_staff=False,
            )
        self.assertIn("is_staff", str(context.exception).lower())

    def test_create_superuser_with_invalid_is_superuser(self):
        """Test that superuser must have is_superuser=True"""
        with self.assertRaises(ValueError) as context:
            User.objects.create_superuser(
                username="admin",
                email="admin@example.com",
                password="pass123",
                is_superuser=False,
            )
        self.assertIn("is_superuser", str(context.exception).lower())

    def test_email_normalization(self):
        """Test that email is normalized"""
        user = User.objects.create_user(
            username="testuser",
            email="test@EXAMPLE.COM",  # Mixed case
            password="testpass123",
        )

        self.assertEqual(user.email, "test@example.com")  # Lowercase


class UserModelTestCase(TestCase):
    """Test User model"""

    def test_user_creation_with_default_role(self):
        """Test user creation with default role"""
        user = User.objects.create_user(
            username="user1", email="user1@example.com", password="pass123"
        )

        self.assertEqual(user.role, "user")
        self.assertFalse(user.is_admin)

    def test_user_creation_with_admin_role(self):
        """Test user creation with admin role"""
        admin = User.objects.create_user(
            username="admin1",
            email="admin1@example.com",
            password="pass123",
            role="admin",
        )

        self.assertEqual(admin.role, "admin")
        self.assertTrue(admin.is_admin)

    def test_user_role_choices(self):
        """Test user role choices"""
        user = User.objects.create_user(
            username="user1", email="user1@example.com", password="pass123", role="user"
        )
        admin = User.objects.create_user(
            username="admin1",
            email="admin1@example.com",
            password="pass123",
            role="admin",
        )

        self.assertEqual(user.role, "user")
        self.assertEqual(admin.role, "admin")

    def test_is_admin_property(self):
        """Test is_admin property"""
        user = User.objects.create_user(
            username="user1", email="user1@example.com", password="pass123", role="user"
        )
        admin = User.objects.create_user(
            username="admin1",
            email="admin1@example.com",
            password="pass123",
            role="admin",
        )

        self.assertFalse(user.is_admin)
        self.assertTrue(admin.is_admin)

    def test_has_site_access_method(self):
        """Test has_site_access method"""
        user1 = User.objects.create_user(
            username="user1", email="user1@example.com", password="pass123"
        )
        user2 = User.objects.create_user(
            username="user2", email="user2@example.com", password="pass123"
        )
        admin = User.objects.create_user(
            username="admin", email="admin@example.com", password="pass123", role="admin"
        )

        template = Template.objects.create(
            name="Template", html_content="<html></html>", css_content="body {}"
        )

        site1 = Site.objects.create(
            user=user1,
            domain="site1.com",
            brand_name="Site 1",
            template=template,
        )

        # User1 has access to their own site
        self.assertTrue(user1.has_site_access(site1))

        # User2 does not have access to user1's site
        self.assertFalse(user2.has_site_access(site1))

        # Admin has access to all sites
        self.assertTrue(admin.has_site_access(site1))

    def test_user_timestamps(self):
        """Test user creation and update timestamps"""
        import time
        
        user = User.objects.create_user(
            username="user1", email="user1@example.com", password="pass123"
        )

        self.assertIsNotNone(user.created_at)
        self.assertIsNotNone(user.updated_at)

        # Update user and check updated_at changes
        original_updated_at = user.updated_at
        time.sleep(0.01)  # Small delay to ensure timestamp changes
        user.username = "user1_updated"
        user.save()

        self.assertGreaterEqual(user.updated_at, original_updated_at)

    def test_user_str_representation(self):
        """Test string representation"""
        user = User.objects.create_user(
            username="testuser", email="test@example.com", password="pass123", role="user"
        )
        admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="pass123",
            role="admin",
        )

        self.assertEqual(str(user), "testuser (user)")
        self.assertEqual(str(admin), "admin (admin)")

    def test_user_password_hashing(self):
        """Test that passwords are hashed"""
        user = User.objects.create_user(
            username="user1", email="user1@example.com", password="plainpassword"
        )

        # Password should not be stored as plain text
        self.assertNotEqual(user.password, "plainpassword")

        # check_password should work
        self.assertTrue(user.check_password("plainpassword"))
        self.assertFalse(user.check_password("wrongpassword"))

    def test_user_sites_relationship(self):
        """Test user-sites relationship"""
        user = User.objects.create_user(
            username="user1", email="user1@example.com", password="pass123"
        )

        template = Template.objects.create(
            name="Template", html_content="<html></html>", css_content="body {}"
        )

        site1 = Site.objects.create(
            user=user,
            domain="site1.com",
            brand_name="Site 1",
            template=template,
        )
        site2 = Site.objects.create(
            user=user,
            domain="site2.com",
            brand_name="Site 2",
            template=template,
        )

        self.assertEqual(user.sites.count(), 2)
        self.assertIn(site1, user.sites.all())
        self.assertIn(site2, user.sites.all())

    def test_user_email_field(self):
        """Test that email is required and stored correctly"""
        user = User.objects.create_user(
            username="user1", email="user1@example.com", password="pass123"
        )

        self.assertEqual(user.email, "user1@example.com")

    def test_multiple_users_different_roles(self):
        """Test creating multiple users with different roles"""
        user1 = User.objects.create_user(
            username="user1", email="user1@example.com", password="pass123", role="user"
        )
        user2 = User.objects.create_user(
            username="user2", email="user2@example.com", password="pass123", role="user"
        )
        admin1 = User.objects.create_user(
            username="admin1",
            email="admin1@example.com",
            password="pass123",
            role="admin",
        )
        admin2 = User.objects.create_superuser(
            username="admin2", email="admin2@example.com", password="pass123"
        )

        # Test role counts
        users = User.objects.filter(role="user")
        admins = User.objects.filter(role="admin")

        self.assertEqual(users.count(), 2)
        self.assertEqual(admins.count(), 2)

        # Test is_admin property
        self.assertFalse(user1.is_admin)
        self.assertFalse(user2.is_admin)
        self.assertTrue(admin1.is_admin)
        self.assertTrue(admin2.is_admin)
