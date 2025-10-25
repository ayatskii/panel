from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from media.models import Media, MediaFolder

User = get_user_model()


class MediaFolderModelTestCase(TestCase):
    """Test MediaFolder model"""

    def test_folder_creation(self):
        """Test folder creation"""
        folder = MediaFolder.objects.create(name="Images")

        self.assertEqual(folder.name, "Images")
        self.assertIsNone(folder.parent_folder)
        self.assertIsNotNone(folder.created_at)

    def test_nested_folder_structure(self):
        """Test nested folder hierarchy"""
        parent = MediaFolder.objects.create(name="Assets")
        child1 = MediaFolder.objects.create(name="Images", parent_folder=parent)
        child2 = MediaFolder.objects.create(name="Videos", parent_folder=parent)
        grandchild = MediaFolder.objects.create(name="Logos", parent_folder=child1)

        self.assertEqual(child1.parent_folder, parent)
        self.assertEqual(child2.parent_folder, parent)
        self.assertEqual(grandchild.parent_folder, child1)

    def test_folder_full_path_property(self):
        """Test full_path property"""
        parent = MediaFolder.objects.create(name="Assets")
        child = MediaFolder.objects.create(name="Images", parent_folder=parent)
        grandchild = MediaFolder.objects.create(name="Logos", parent_folder=child)

        self.assertEqual(parent.full_path, "Assets")
        self.assertEqual(child.full_path, "Assets/Images")
        self.assertEqual(grandchild.full_path, "Assets/Images/Logos")

    def test_folder_str_representation(self):
        """Test string representation"""
        parent = MediaFolder.objects.create(name="Documents")
        child = MediaFolder.objects.create(name="PDFs", parent_folder=parent)

        self.assertEqual(str(parent), "Documents")
        self.assertEqual(str(child), "Documents/PDFs")

    def test_folder_deletion_cascades(self):
        """Test that deleting parent folder cascades to children"""
        parent = MediaFolder.objects.create(name="Parent")
        child1 = MediaFolder.objects.create(name="Child1", parent_folder=parent)
        child2 = MediaFolder.objects.create(name="Child2", parent_folder=parent)

        parent_id = parent.id
        parent.delete()

        # Children should be deleted
        self.assertEqual(
            MediaFolder.objects.filter(parent_folder_id=parent_id).count(), 0
        )


class MediaModelTestCase(TestCase):
    """Test Media model"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

    def test_media_creation(self):
        """Test media creation"""
        file = SimpleUploadedFile("test.jpg", b"file content", content_type="image/jpeg")

        media = Media.objects.create(
            filename="test.jpg",
            original_name="test.jpg",
            file=file,
            file_path="/media/2025/01/test.jpg",
            file_size=1024,
            mime_type="image/jpeg",
            alt_text="Test image",
            width=800,
            height=600,
            uploaded_by=self.user,
        )

        self.assertEqual(media.filename, "test.jpg")
        self.assertEqual(media.original_name, "test.jpg")
        self.assertEqual(media.file_size, 1024)
        self.assertEqual(media.mime_type, "image/jpeg")
        self.assertEqual(media.width, 800)
        self.assertEqual(media.height, 600)
        self.assertEqual(media.uploaded_by, self.user)

    def test_media_with_folder(self):
        """Test media in folder"""
        folder = MediaFolder.objects.create(name="Images")
        file = SimpleUploadedFile("photo.jpg", b"content", content_type="image/jpeg")

        media = Media.objects.create(
            folder=folder,
            filename="photo.jpg",
            original_name="photo.jpg",
            file=file,
            file_path="/media/2025/01/photo.jpg",
            file_size=2048,
            mime_type="image/jpeg",
            uploaded_by=self.user,
        )

        self.assertEqual(media.folder, folder)
        self.assertIn(media, folder.files.all())

    def test_media_image_dimensions(self):
        """Test image dimensions"""
        file = SimpleUploadedFile("image.png", b"content", content_type="image/png")

        media = Media.objects.create(
            filename="image.png",
            original_name="image.png",
            file=file,
            file_path="/media/image.png",
            file_size=5000,
            mime_type="image/png",
            width=1920,
            height=1080,
            uploaded_by=self.user,
        )

        self.assertEqual(media.width, 1920)
        self.assertEqual(media.height, 1080)

    def test_media_is_image_property(self):
        """Test is_image property"""
        image = Media.objects.create(
            filename="image.jpg",
            original_name="image.jpg",
            file=SimpleUploadedFile("image.jpg", b"content"),
            file_path="/media/image.jpg",
            file_size=1000,
            mime_type="image/jpeg",
            uploaded_by=self.user,
        )

        video = Media.objects.create(
            filename="video.mp4",
            original_name="video.mp4",
            file=SimpleUploadedFile("video.mp4", b"content"),
            file_path="/media/video.mp4",
            file_size=5000,
            mime_type="video/mp4",
            uploaded_by=self.user,
        )

        self.assertTrue(image.is_image)
        self.assertFalse(video.is_image)

    def test_media_is_svg_property(self):
        """Test is_svg property"""
        svg = Media.objects.create(
            filename="logo.svg",
            original_name="logo.svg",
            file=SimpleUploadedFile("logo.svg", b"<svg></svg>"),
            file_path="/media/logo.svg",
            file_size=500,
            mime_type="image/svg+xml",
            uploaded_by=self.user,
        )

        jpg = Media.objects.create(
            filename="photo.jpg",
            original_name="photo.jpg",
            file=SimpleUploadedFile("photo.jpg", b"content"),
            file_path="/media/photo.jpg",
            file_size=2000,
            mime_type="image/jpeg",
            uploaded_by=self.user,
        )

        self.assertTrue(svg.is_svg)
        self.assertFalse(jpg.is_svg)

    def test_media_size_kb_property(self):
        """Test size_kb property"""
        media = Media.objects.create(
            filename="file.jpg",
            original_name="file.jpg",
            file=SimpleUploadedFile("file.jpg", b"content"),
            file_path="/media/file.jpg",
            file_size=2048,  # 2 KB
            mime_type="image/jpeg",
            uploaded_by=self.user,
        )

        self.assertEqual(media.size_kb, 2.0)

    def test_media_size_mb_property(self):
        """Test size_mb property"""
        media = Media.objects.create(
            filename="large.jpg",
            original_name="large.jpg",
            file=SimpleUploadedFile("large.jpg", b"content"),
            file_path="/media/large.jpg",
            file_size=5242880,  # 5 MB
            mime_type="image/jpeg",
            uploaded_by=self.user,
        )

        self.assertEqual(media.size_mb, 5.0)

    def test_media_mime_types(self):
        """Test various MIME types"""
        image = Media.objects.create(
            filename="image.png",
            original_name="image.png",
            file=SimpleUploadedFile("image.png", b"content"),
            file_path="/media/image.png",
            file_size=1000,
            mime_type="image/png",
            uploaded_by=self.user,
        )

        video = Media.objects.create(
            filename="video.mp4",
            original_name="video.mp4",
            file=SimpleUploadedFile("video.mp4", b"content"),
            file_path="/media/video.mp4",
            file_size=5000,
            mime_type="video/mp4",
            uploaded_by=self.user,
        )

        pdf = Media.objects.create(
            filename="document.pdf",
            original_name="document.pdf",
            file=SimpleUploadedFile("document.pdf", b"content"),
            file_path="/media/document.pdf",
            file_size=3000,
            mime_type="application/pdf",
            uploaded_by=self.user,
        )

        self.assertTrue(image.is_image)
        self.assertFalse(video.is_image)
        self.assertFalse(pdf.is_image)

    def test_media_str_representation(self):
        """Test string representation"""
        media = Media.objects.create(
            filename="myfile.jpg",
            original_name="My Photo.jpg",
            file=SimpleUploadedFile("myfile.jpg", b"content"),
            file_path="/media/myfile.jpg",
            file_size=1000,
            mime_type="image/jpeg",
            uploaded_by=self.user,
        )

        self.assertEqual(str(media), "My Photo.jpg")

    def test_media_user_relationship(self):
        """Test media-user relationship"""
        file1 = SimpleUploadedFile("file1.jpg", b"content")
        file2 = SimpleUploadedFile("file2.jpg", b"content")

        media1 = Media.objects.create(
            filename="file1.jpg",
            original_name="file1.jpg",
            file=file1,
            file_path="/media/file1.jpg",
            file_size=1000,
            mime_type="image/jpeg",
            uploaded_by=self.user,
        )

        media2 = Media.objects.create(
            filename="file2.jpg",
            original_name="file2.jpg",
            file=file2,
            file_path="/media/file2.jpg",
            file_size=1000,
            mime_type="image/jpeg",
            uploaded_by=self.user,
        )

        self.assertEqual(self.user.uploaded_media.count(), 2)
        self.assertIn(media1, self.user.uploaded_media.all())
        self.assertIn(media2, self.user.uploaded_media.all())

    def test_media_deletion_protect_user(self):
        """Test that deleting user is protected if media exists"""
        media = Media.objects.create(
            filename="file.jpg",
            original_name="file.jpg",
            file=SimpleUploadedFile("file.jpg", b"content"),
            file_path="/media/file.jpg",
            file_size=1000,
            mime_type="image/jpeg",
            uploaded_by=self.user,
        )

        # This should raise an error because media exists
        with self.assertRaises(Exception):
            self.user.delete()

    def test_media_alt_text(self):
        """Test alt text for images"""
        media = Media.objects.create(
            filename="landscape.jpg",
            original_name="landscape.jpg",
            file=SimpleUploadedFile("landscape.jpg", b"content"),
            file_path="/media/landscape.jpg",
            file_size=1000,
            mime_type="image/jpeg",
            alt_text="Beautiful mountain landscape at sunset",
            uploaded_by=self.user,
        )

        self.assertEqual(media.alt_text, "Beautiful mountain landscape at sunset")


class MediaTagModelTestCase(TestCase):
    """Test MediaTag model"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

    def test_tag_creation(self):
        """Test creating a tag"""
        from media.models import MediaTag
        tag = MediaTag.objects.create(name="nature", color="#4CAF50")
        
        self.assertEqual(tag.name, "nature")
        self.assertEqual(tag.color, "#4CAF50")
        self.assertIsNotNone(tag.created_at)

    def test_tag_name_unique(self):
        """Test that tag names are unique"""
        from media.models import MediaTag
        MediaTag.objects.create(name="landscape")
        
        with self.assertRaises(Exception):
            MediaTag.objects.create(name="landscape")

    def test_tag_name_lowercase(self):
        """Test that tag names are converted to lowercase"""
        from media.models import MediaTag
        tag = MediaTag.objects.create(name="NATURE")
        
        self.assertEqual(tag.name, "nature")

    def test_media_with_tags(self):
        """Test adding tags to media"""
        from media.models import MediaTag
        
        tag1 = MediaTag.objects.create(name="nature")
        tag2 = MediaTag.objects.create(name="landscape")
        
        media = Media.objects.create(
            filename="photo.jpg",
            original_name="photo.jpg",
            file=SimpleUploadedFile("photo.jpg", b"content"),
            file_path="/media/photo.jpg",
            file_size=1000,
            mime_type="image/jpeg",
            uploaded_by=self.user,
        )
        
        media.tags.add(tag1, tag2)
        
        self.assertEqual(media.tags.count(), 2)
        self.assertIn(tag1, media.tags.all())
        self.assertIn(tag2, media.tags.all())

    def test_tag_media_count(self):
        """Test counting media with a specific tag"""
        from media.models import MediaTag
        
        tag = MediaTag.objects.create(name="featured")
        
        media1 = Media.objects.create(
            filename="file1.jpg",
            original_name="file1.jpg",
            file=SimpleUploadedFile("file1.jpg", b"content"),
            file_path="/media/file1.jpg",
            file_size=1000,
            mime_type="image/jpeg",
            uploaded_by=self.user,
        )
        
        media2 = Media.objects.create(
            filename="file2.jpg",
            original_name="file2.jpg",
            file=SimpleUploadedFile("file2.jpg", b"content"),
            file_path="/media/file2.jpg",
            file_size=1000,
            mime_type="image/jpeg",
            uploaded_by=self.user,
        )
        
        media1.tags.add(tag)
        media2.tags.add(tag)
        
        self.assertEqual(tag.media_files.count(), 2)

    def test_filter_media_by_tag(self):
        """Test filtering media by tag"""
        from media.models import MediaTag
        
        tag_nature = MediaTag.objects.create(name="nature")
        tag_city = MediaTag.objects.create(name="city")
        
        media1 = Media.objects.create(
            filename="forest.jpg",
            original_name="forest.jpg",
            file=SimpleUploadedFile("forest.jpg", b"content"),
            file_path="/media/forest.jpg",
            file_size=1000,
            mime_type="image/jpeg",
            uploaded_by=self.user,
        )
        media1.tags.add(tag_nature)
        
        media2 = Media.objects.create(
            filename="building.jpg",
            original_name="building.jpg",
            file=SimpleUploadedFile("building.jpg", b"content"),
            file_path="/media/building.jpg",
            file_size=1000,
            mime_type="image/jpeg",
            uploaded_by=self.user,
        )
        media2.tags.add(tag_city)
        
        nature_media = Media.objects.filter(tags=tag_nature)
        city_media = Media.objects.filter(tags=tag_city)
        
        self.assertEqual(nature_media.count(), 1)
        self.assertEqual(city_media.count(), 1)
        self.assertIn(media1, nature_media)
        self.assertIn(media2, city_media)

    def test_media_multiple_tags(self):
        """Test media with multiple tags"""
        from media.models import MediaTag
        
        tag1 = MediaTag.objects.create(name="nature")
        tag2 = MediaTag.objects.create(name="landscape")
        tag3 = MediaTag.objects.create(name="sunset")
        
        media = Media.objects.create(
            filename="sunset.jpg",
            original_name="sunset.jpg",
            file=SimpleUploadedFile("sunset.jpg", b"content"),
            file_path="/media/sunset.jpg",
            file_size=1000,
            mime_type="image/jpeg",
            uploaded_by=self.user,
        )
        
        media.tags.set([tag1, tag2, tag3])
        
        self.assertEqual(media.tags.count(), 3)
        self.assertIn(tag1, media.tags.all())
        self.assertIn(tag2, media.tags.all())
        self.assertIn(tag3, media.tags.all())