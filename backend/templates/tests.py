from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from templates.models import (
    Template,
    TemplateFootprint,
    TemplateVariable,
    TemplateSection,
    TemplateAsset,
)


class TemplateModelTestCase(TestCase):
    """Test Template model and its relationships"""

    def setUp(self):
        """Set up test data"""
        self.template = Template.objects.create(
            name="Test Template",
            description="A test template",
            type="sectional",
            version="1.0.0",
            html_content="<html>{{brand_name}}</html>",
            css_content=":root { --primary: #000; }",
            js_content="console.log('test');",
            css_output_type="external",
            js_output_type="defer",
            menu_html="<nav></nav>",
            footer_menu_html="<footer></footer>",
            faq_block_html="<section></section>",
            available_blocks=["hero", "article", "cta"],
            css_framework="tailwind",
            supports_color_customization=True,
            color_variables={"primary": "#000", "secondary": "#fff"},
            supports_page_speed=True,
        )

    def test_template_creation(self):
        """Test template is created with correct attributes"""
        self.assertEqual(self.template.name, "Test Template")
        self.assertEqual(self.template.type, "sectional")
        self.assertEqual(self.template.version, "1.0.0")
        self.assertEqual(self.template.css_framework, "tailwind")
        self.assertTrue(self.template.supports_color_customization)
        self.assertTrue(self.template.supports_page_speed)

    def test_template_type_choices(self):
        """Test template type choices"""
        monolithic = Template.objects.create(
            name="Monolithic Template",
            type="monolithic",
            html_content="<html></html>",
            css_content="body {}",
        )
        self.assertTrue(monolithic.is_monolithic)
        self.assertFalse(monolithic.is_sectional)
        self.assertTrue(self.template.is_sectional)
        self.assertFalse(self.template.is_monolithic)

    def test_template_output_types(self):
        """Test CSS and JS output type choices"""
        self.assertEqual(self.template.css_output_type, "external")
        self.assertEqual(self.template.js_output_type, "defer")

        # Test other output types
        template2 = Template.objects.create(
            name="Template 2",
            html_content="<html></html>",
            css_content="body {}",
            css_output_type="inline",
            js_output_type="async",
        )
        self.assertEqual(template2.css_output_type, "inline")
        self.assertEqual(template2.js_output_type, "async")

    def test_template_color_variables(self):
        """Test color variables JSON field"""
        self.assertIsInstance(self.template.color_variables, dict)
        self.assertEqual(self.template.color_variables["primary"], "#000")
        self.assertEqual(self.template.color_variables["secondary"], "#fff")

    def test_template_available_blocks(self):
        """Test available blocks JSON field"""
        self.assertIsInstance(self.template.available_blocks, list)
        self.assertIn("hero", self.template.available_blocks)
        self.assertIn("article", self.template.available_blocks)
        self.assertIn("cta", self.template.available_blocks)

    def test_template_str_representation(self):
        """Test string representation"""
        expected = "Test Template (Sectional - Modular Components)"
        self.assertEqual(str(self.template), expected)


class TemplateFootprintTestCase(TestCase):
    """Test TemplateFootprint model"""

    def setUp(self):
        """Set up test data"""
        self.template = Template.objects.create(
            name="Test Template",
            html_content="<html></html>",
            css_content="body {}",
        )

    def test_footprint_creation(self):
        """Test footprint creation with all CMS types"""
        # WordPress footprint
        wp_footprint = TemplateFootprint.objects.create(
            template=self.template,
            name="WordPress Theme",
            cms_type="wordpress",
            theme_path="wp-content/themes/{{theme_name}}",
            assets_path="assets",
            images_path="assets/images",
            css_path="assets/css",
            js_path="assets/js",
            generate_php_files=True,
            php_files_config={
                "functions.php": "<?php // Functions",
                "header.php": "<?php // Header",
            },
            path_variables={"theme_name": "my-theme", "domain": "example.com"},
        )

        self.assertEqual(wp_footprint.cms_type, "wordpress")
        self.assertTrue(wp_footprint.generate_php_files)
        self.assertIsInstance(wp_footprint.php_files_config, dict)
        self.assertEqual(len(wp_footprint.php_files_config), 2)

    def test_footprint_cms_types(self):
        """Test all CMS type options"""
        cms_types = ["wordpress", "joomla", "drupal", "custom", "none"]

        for i, cms_type in enumerate(cms_types):
            footprint = TemplateFootprint.objects.create(
                template=self.template,
                name=f"{cms_type.title()} Footprint {i}",
                cms_type=cms_type,
            )
            self.assertEqual(footprint.cms_type, cms_type)

    def test_footprint_path_variables(self):
        """Test path variables JSON field"""
        footprint = TemplateFootprint.objects.create(
            template=self.template,
            name="Test Footprint",
            cms_type="wordpress",
            path_variables={
                "theme_name": "my-theme",
                "domain": "example.com",
                "author": "John Doe",
            },
        )

        self.assertIsInstance(footprint.path_variables, dict)
        self.assertEqual(footprint.path_variables["theme_name"], "my-theme")
        self.assertEqual(footprint.path_variables["domain"], "example.com")

    def test_footprint_unique_together(self):
        """Test unique_together constraint"""
        TemplateFootprint.objects.create(
            template=self.template, name="Unique Footprint", cms_type="wordpress"
        )

        # This should raise an error
        with self.assertRaises(Exception):
            TemplateFootprint.objects.create(
                template=self.template,
                name="Unique Footprint",
                cms_type="joomla",
            )

    def test_footprint_str_representation(self):
        """Test string representation"""
        footprint = TemplateFootprint.objects.create(
            template=self.template, name="WP Theme", cms_type="wordpress"
        )
        expected = "Test Template - WP Theme (wordpress)"
        self.assertEqual(str(footprint), expected)


class TemplateVariableTestCase(TestCase):
    """Test TemplateVariable model"""

    def setUp(self):
        """Set up test data"""
        self.template = Template.objects.create(
            name="Test Template",
            html_content="<html></html>",
            css_content="body {}",
        )

    def test_variable_creation(self):
        """Test variable creation"""
        variable = TemplateVariable.objects.create(
            template=self.template,
            name="brand_name",
            variable_type="brand",
            default_value="My Brand",
            description="The brand name displayed in header",
            is_required=True,
        )

        self.assertEqual(variable.name, "brand_name")
        self.assertEqual(variable.variable_type, "brand")
        self.assertEqual(variable.default_value, "My Brand")
        self.assertTrue(variable.is_required)

    def test_variable_types(self):
        """Test all variable type options"""
        variable_types = ["meta", "brand", "content", "style", "script"]

        for var_type in variable_types:
            variable = TemplateVariable.objects.create(
                template=self.template,
                name=f"{var_type}_variable",
                variable_type=var_type,
            )
            self.assertEqual(variable.variable_type, var_type)

    def test_variable_placeholder_property(self):
        """Test placeholder property"""
        variable = TemplateVariable.objects.create(
            template=self.template, name="brand_name", variable_type="brand"
        )

        self.assertEqual(variable.placeholder, "{{brand_name}}")

    def test_variable_unique_together(self):
        """Test unique_together constraint"""
        TemplateVariable.objects.create(
            template=self.template, name="test_var", variable_type="meta"
        )

        # This should raise an error
        with self.assertRaises(Exception):
            TemplateVariable.objects.create(
                template=self.template, name="test_var", variable_type="brand"
            )

    def test_variable_str_representation(self):
        """Test string representation"""
        variable = TemplateVariable.objects.create(
            template=self.template, name="brand_name", variable_type="brand"
        )
        expected = "Test Template - {{ brand_name }}"
        self.assertEqual(str(variable), expected)


class TemplateSectionTestCase(TestCase):
    """Test TemplateSection model"""

    def setUp(self):
        """Set up test data"""
        self.template = Template.objects.create(
            name="Test Template",
            html_content="<html></html>",
            css_content="body {}",
            type="sectional",
        )

    def test_section_creation(self):
        """Test section creation"""
        section = TemplateSection.objects.create(
            template=self.template,
            name="Header Section",
            section_type="header",
            html_content="<header></header>",
            css_content="header { background: #000; }",
            order_index=1,
            is_required=True,
            is_customizable=True,
        )

        self.assertEqual(section.name, "Header Section")
        self.assertEqual(section.section_type, "header")
        self.assertTrue(section.is_required)
        self.assertTrue(section.is_customizable)
        self.assertEqual(section.order_index, 1)

    def test_section_types(self):
        """Test all section type options"""
        section_types = [
            "header",
            "menu",
            "hero",
            "content",
            "sidebar",
            "footer",
            "footer_menu",
            "custom",
        ]

        for i, section_type in enumerate(section_types):
            section = TemplateSection.objects.create(
                template=self.template,
                name=f"{section_type.title()} Section",
                section_type=section_type,
                html_content=f"<section>{section_type}</section>",
                order_index=i,
            )
            self.assertEqual(section.section_type, section_type)

    def test_section_ordering(self):
        """Test section ordering"""
        section1 = TemplateSection.objects.create(
            template=self.template,
            name="Section 1",
            section_type="header",
            html_content="<header></header>",
            order_index=2,
        )
        section2 = TemplateSection.objects.create(
            template=self.template,
            name="Section 2",
            section_type="footer",
            html_content="<footer></footer>",
            order_index=1,
        )

        sections = list(self.template.sections.all())
        self.assertEqual(sections[0], section2)  # Lower order_index comes first
        self.assertEqual(sections[1], section1)

    def test_section_unique_together(self):
        """Test unique_together constraint"""
        TemplateSection.objects.create(
            template=self.template,
            name="Unique Section",
            section_type="header",
            html_content="<header></header>",
        )

        # This should raise an error
        with self.assertRaises(Exception):
            TemplateSection.objects.create(
                template=self.template,
                name="Unique Section",
                section_type="footer",
                html_content="<footer></footer>",
            )

    def test_section_str_representation(self):
        """Test string representation"""
        section = TemplateSection.objects.create(
            template=self.template,
            name="Hero Section",
            section_type="hero",
            html_content="<section></section>",
        )
        expected = "Test Template - Hero Section"
        self.assertEqual(str(section), expected)


class TemplateAssetTestCase(TestCase):
    """Test TemplateAsset model"""

    def setUp(self):
        """Set up test data"""
        self.template = Template.objects.create(
            name="Test Template",
            html_content="<html></html>",
            css_content="body {}",
        )

    def test_asset_creation(self):
        """Test asset creation"""
        # Create a simple SVG file
        svg_content = b'<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>'
        svg_file = SimpleUploadedFile("logo.svg", svg_content, content_type="image/svg+xml")

        asset = TemplateAsset.objects.create(
            template=self.template,
            name="Logo",
            asset_type="logo",
            file=svg_file,
            file_path_variable="logo_url",
            auto_generate_formats=False,
        )

        self.assertEqual(asset.name, "Logo")
        self.assertEqual(asset.asset_type, "logo")
        self.assertEqual(asset.file_path_variable, "logo_url")
        self.assertFalse(asset.auto_generate_formats)

    def test_asset_types(self):
        """Test all asset type options"""
        asset_types = ["logo", "favicon", "image", "font", "icon"]

        for asset_type in asset_types:
            # Create a dummy file
            file_content = b"dummy content"
            file = SimpleUploadedFile(f"{asset_type}.file", file_content)

            asset = TemplateAsset.objects.create(
                template=self.template,
                name=f"{asset_type.title()} Asset",
                asset_type=asset_type,
                file=file,
                file_path_variable=f"{asset_type}_url",
            )
            self.assertEqual(asset.asset_type, asset_type)

    def test_asset_auto_generate_formats(self):
        """Test auto_generate_formats flag for favicons"""
        svg_content = b'<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>'
        svg_file = SimpleUploadedFile("favicon.svg", svg_content)

        asset = TemplateAsset.objects.create(
            template=self.template,
            name="Favicon",
            asset_type="favicon",
            file=svg_file,
            file_path_variable="favicon_url",
            auto_generate_formats=True,
        )

        self.assertTrue(asset.auto_generate_formats)

    def test_asset_str_representation(self):
        """Test string representation"""
        file_content = b"dummy content"
        file = SimpleUploadedFile("logo.svg", file_content)

        asset = TemplateAsset.objects.create(
            template=self.template,
            name="Logo",
            asset_type="logo",
            file=file,
            file_path_variable="logo_url",
        )
        expected = "Test Template - Logo"
        self.assertEqual(str(asset), expected)


class TemplateRelationshipTestCase(TestCase):
    """Test relationships between Template and related models"""

    def setUp(self):
        """Set up test data"""
        self.template = Template.objects.create(
            name="Complete Template",
            html_content="<html>{{brand_name}}</html>",
            css_content="body {}",
            type="sectional",
        )

    def test_template_with_all_relationships(self):
        """Test template with footprints, variables, sections, and assets"""
        # Create footprint
        footprint = TemplateFootprint.objects.create(
            template=self.template, name="WordPress", cms_type="wordpress"
        )

        # Create variables
        var1 = TemplateVariable.objects.create(
            template=self.template, name="brand_name", variable_type="brand"
        )
        var2 = TemplateVariable.objects.create(
            template=self.template, name="title", variable_type="meta"
        )

        # Create sections
        section1 = TemplateSection.objects.create(
            template=self.template,
            name="Header",
            section_type="header",
            html_content="<header></header>",
            order_index=1,
        )
        section2 = TemplateSection.objects.create(
            template=self.template,
            name="Footer",
            section_type="footer",
            html_content="<footer></footer>",
            order_index=2,
        )

        # Create assets
        file_content = b"dummy"
        asset = TemplateAsset.objects.create(
            template=self.template,
            name="Logo",
            asset_type="logo",
            file=SimpleUploadedFile("logo.svg", file_content),
            file_path_variable="logo_url",
        )

        # Test relationships
        self.assertEqual(self.template.footprints.count(), 1)
        self.assertEqual(self.template.variables.count(), 2)
        self.assertEqual(self.template.sections.count(), 2)
        self.assertEqual(self.template.assets.count(), 1)

        # Test related queries
        self.assertEqual(footprint.template, self.template)
        self.assertEqual(var1.template, self.template)
        self.assertEqual(section1.template, self.template)
        self.assertEqual(asset.template, self.template)

    def test_template_deletion_cascades(self):
        """Test that deleting template cascades to related objects"""
        # Create related objects
        TemplateFootprint.objects.create(
            template=self.template, name="WP", cms_type="wordpress"
        )
        TemplateVariable.objects.create(
            template=self.template, name="brand", variable_type="brand"
        )
        TemplateSection.objects.create(
            template=self.template,
            name="Header",
            section_type="header",
            html_content="<header></header>",
        )
        file_content = b"dummy"
        TemplateAsset.objects.create(
            template=self.template,
            name="Logo",
            asset_type="logo",
            file=SimpleUploadedFile("logo.svg", file_content),
            file_path_variable="logo_url",
        )

        template_id = self.template.id

        # Delete template
        self.template.delete()

        # Verify cascading deletion
        self.assertEqual(TemplateFootprint.objects.filter(template_id=template_id).count(), 0)
        self.assertEqual(TemplateVariable.objects.filter(template_id=template_id).count(), 0)
        self.assertEqual(TemplateSection.objects.filter(template_id=template_id).count(), 0)
        self.assertEqual(TemplateAsset.objects.filter(template_id=template_id).count(), 0)
