from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date
from analytics.models import Analytics, PageView
from sites.models import Site
from templates.models import Template
from decimal import Decimal

User = get_user_model()


class AnalyticsModelTestCase(TestCase):
    """Test Analytics model"""

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

    def test_analytics_creation(self):
        """Test analytics record creation"""
        analytics = Analytics.objects.create(
            site=self.site,
            date=date(2025, 1, 15),
            visitors=1000,
            pageviews=3500,
            bounce_rate=Decimal("45.50"),
            avg_session_duration=180,
            traffic_source="organic",
            conversions=25,
            revenue=Decimal("125.50"),
        )

        self.assertEqual(analytics.site, self.site)
        self.assertEqual(analytics.visitors, 1000)
        self.assertEqual(analytics.pageviews, 3500)
        self.assertEqual(analytics.bounce_rate, Decimal("45.50"))
        self.assertEqual(analytics.avg_session_duration, 180)
        self.assertEqual(analytics.traffic_source, "organic")
        self.assertEqual(analytics.conversions, 25)
        self.assertEqual(analytics.revenue, Decimal("125.50"))

    def test_analytics_default_values(self):
        """Test analytics default values"""
        analytics = Analytics.objects.create(
            site=self.site, date=date(2025, 1, 15), traffic_source="direct"
        )

        self.assertEqual(analytics.visitors, 0)
        self.assertEqual(analytics.pageviews, 0)
        self.assertEqual(analytics.conversions, 0)
        self.assertEqual(analytics.revenue, Decimal("0.00"))

    def test_analytics_traffic_sources(self):
        """Test different traffic sources"""
        sources = ["organic", "direct", "referral", "social", "paid"]

        for source in sources:
            analytics = Analytics.objects.create(
                site=self.site,
                date=date(2025, 1, 15),
                traffic_source=source,
                visitors=100,
            )
            self.assertEqual(analytics.traffic_source, source)

    def test_analytics_conversion_rate_property(self):
        """Test conversion_rate property calculation"""
        # Case 1: Normal conversion rate
        analytics1 = Analytics.objects.create(
            site=self.site,
            date=date(2025, 1, 15),
            visitors=1000,
            conversions=50,
        )
        self.assertEqual(analytics1.conversion_rate, 5.0)  # 50/1000 * 100 = 5%

        # Case 2: Zero visitors (should return 0.0)
        analytics2 = Analytics.objects.create(
            site=self.site,
            date=date(2025, 1, 16),
            visitors=0,
            conversions=0,
        )
        self.assertEqual(analytics2.conversion_rate, 0.0)

        # Case 3: High conversion rate
        analytics3 = Analytics.objects.create(
            site=self.site,
            date=date(2025, 1, 17),
            visitors=100,
            conversions=25,
        )
        self.assertEqual(analytics3.conversion_rate, 25.0)  # 25%

    def test_analytics_unique_together_constraint(self):
        """Test unique_together constraint for site, date, traffic_source"""
        Analytics.objects.create(
            site=self.site,
            date=date(2025, 1, 15),
            traffic_source="organic",
            visitors=100,
        )

        # Creating duplicate should raise error
        with self.assertRaises(Exception):
            Analytics.objects.create(
                site=self.site,
                date=date(2025, 1, 15),
                traffic_source="organic",
                visitors=200,
            )

    def test_analytics_multiple_sources_same_date(self):
        """Test multiple traffic sources on same date"""
        analytics1 = Analytics.objects.create(
            site=self.site,
            date=date(2025, 1, 15),
            traffic_source="organic",
            visitors=500,
        )
        analytics2 = Analytics.objects.create(
            site=self.site,
            date=date(2025, 1, 15),
            traffic_source="direct",
            visitors=300,
        )
        analytics3 = Analytics.objects.create(
            site=self.site,
            date=date(2025, 1, 15),
            traffic_source="social",
            visitors=200,
        )

        # All should be created successfully
        self.assertEqual(
            Analytics.objects.filter(site=self.site, date=date(2025, 1, 15)).count(), 3
        )

    def test_analytics_str_representation(self):
        """Test string representation"""
        analytics = Analytics.objects.create(
            site=self.site,
            date=date(2025, 1, 15),
            traffic_source="organic",
        )
        expected = "example.com - 2025-01-15"
        self.assertEqual(str(analytics), expected)

    def test_analytics_bounce_rate_decimal(self):
        """Test bounce rate as decimal"""
        analytics = Analytics.objects.create(
            site=self.site,
            date=date(2025, 1, 15),
            bounce_rate=Decimal("67.89"),
        )

        self.assertIsInstance(analytics.bounce_rate, Decimal)
        self.assertEqual(analytics.bounce_rate, Decimal("67.89"))

    def test_analytics_avg_session_duration(self):
        """Test average session duration in seconds"""
        analytics = Analytics.objects.create(
            site=self.site,
            date=date(2025, 1, 15),
            avg_session_duration=240,  # 4 minutes
        )

        self.assertEqual(analytics.avg_session_duration, 240)

    def test_analytics_revenue_tracking(self):
        """Test revenue tracking"""
        analytics = Analytics.objects.create(
            site=self.site,
            date=date(2025, 1, 15),
            conversions=10,
            revenue=Decimal("250.75"),
        )

        self.assertEqual(analytics.revenue, Decimal("250.75"))
        self.assertEqual(analytics.conversions, 10)

    def test_analytics_deletion_protect(self):
        """Test that deleting site is protected when analytics exist"""
        from django.db.models.deletion import ProtectedError
        
        Analytics.objects.create(
            site=self.site,
            date=date(2025, 1, 15),
            traffic_source="organic",
        )
        Analytics.objects.create(
            site=self.site,
            date=date(2025, 1, 16),
            traffic_source="direct",
        )

        # Site deletion should be prevented by PROTECT (preserves analytics data)
        with self.assertRaises(ProtectedError):
            self.site.delete()


class PageViewModelTestCase(TestCase):
    """Test PageView model"""

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

    def test_pageview_creation(self):
        """Test page view creation"""
        pageview = PageView.objects.create(
            site=self.site,
            page_slug="about",
        )

        self.assertEqual(pageview.site, self.site)
        self.assertEqual(pageview.page_slug, "about")
        self.assertIsNotNone(pageview.timestamp)

    def test_pageview_multiple_views(self):
        """Test multiple page views"""
        PageView.objects.create(site=self.site, page_slug="home")
        PageView.objects.create(site=self.site, page_slug="about")
        PageView.objects.create(site=self.site, page_slug="contact")
        PageView.objects.create(site=self.site, page_slug="home")  # Duplicate slug

        self.assertEqual(PageView.objects.filter(site=self.site).count(), 4)
        self.assertEqual(
            PageView.objects.filter(site=self.site, page_slug="home").count(), 2
        )

    def test_pageview_timestamp_auto_created(self):
        """Test timestamp is automatically created"""
        pageview = PageView.objects.create(
            site=self.site,
            page_slug="blog",
        )

        self.assertIsNotNone(pageview.timestamp)
        self.assertLessEqual(pageview.timestamp, timezone.now())

    def test_pageview_deletion_cascade(self):
        """Test that deleting site cascades to page views"""
        PageView.objects.create(site=self.site, page_slug="home")
        PageView.objects.create(site=self.site, page_slug="about")

        site_id = self.site.id
        self.site.delete()

        # Page views should be deleted
        self.assertEqual(PageView.objects.filter(site_id=site_id).count(), 0)

    def test_pageview_index_performance(self):
        """Test that index exists for efficient queries"""
        # Create multiple page views
        for i in range(100):
            PageView.objects.create(
                site=self.site,
                page_slug=f"page-{i % 10}",  # 10 different pages
            )

        # Query should use index (this is more of a documentation test)
        pageviews = PageView.objects.filter(
            site=self.site, page_slug="page-0"
        ).order_by("-timestamp")

        self.assertGreater(pageviews.count(), 0)
