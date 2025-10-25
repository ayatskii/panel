"""
Image optimization utilities for generating responsive variants
"""
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import os


# Image variant sizes (max width/height, maintains aspect ratio)
THUMBNAIL_SIZE = (300, 300)
MEDIUM_SIZE = (800, 800)
LARGE_SIZE = (1920, 1920)

# Quality settings
JPEG_QUALITY = 85
WEBP_QUALITY = 80


def generate_image_variants(image_file, original_filename):
    """
    Generate optimized image variants (thumbnail, medium, large, webp)
    
    Args:
        image_file: Django UploadedFile object
        original_filename: Original filename
        
    Returns:
        dict: {
            'thumbnail': InMemoryUploadedFile,
            'medium': InMemoryUploadedFile,
            'large': InMemoryUploadedFile,
            'webp': InMemoryUploadedFile
        }
    """
    try:
        # Open the image
        img = Image.open(image_file)
        
        # Convert RGBA to RGB if needed (for JPEG compatibility)
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        
        # Get file extension
        name, ext = os.path.splitext(original_filename)
        ext = ext.lower()
        
        # Determine format
        if ext in ['.jpg', '.jpeg']:
            format_type = 'JPEG'
        elif ext == '.png':
            format_type = 'PNG'
        else:
            format_type = 'JPEG'  # Default
        
        variants = {}
        
        # Generate thumbnail
        variants['thumbnail'] = _resize_image(
            img.copy(), THUMBNAIL_SIZE, f"{name}_thumb{ext}", format_type
        )
        
        # Generate medium
        variants['medium'] = _resize_image(
            img.copy(), MEDIUM_SIZE, f"{name}_medium{ext}", format_type
        )
        
        # Generate large
        variants['large'] = _resize_image(
            img.copy(), LARGE_SIZE, f"{name}_large{ext}", format_type
        )
        
        # Generate WebP version
        variants['webp'] = _convert_to_webp(
            img.copy(), f"{name}.webp"
        )
        
        return variants
        
    except Exception as e:
        print(f"Error generating image variants: {e}")
        return None


def _resize_image(img, max_size, filename, format_type):
    """
    Resize image maintaining aspect ratio
    
    Args:
        img: PIL Image object
        max_size: tuple (max_width, max_height)
        filename: output filename
        format_type: 'JPEG' or 'PNG'
        
    Returns:
        InMemoryUploadedFile
    """
    # Calculate new size maintaining aspect ratio
    img.thumbnail(max_size, Image.Resampling.LANCZOS)
    
    # Save to BytesIO
    output = BytesIO()
    
    if format_type == 'JPEG':
        img.save(output, format='JPEG', quality=JPEG_QUALITY, optimize=True)
        content_type = 'image/jpeg'
    else:
        img.save(output, format='PNG', optimize=True)
        content_type = 'image/png'
    
    output.seek(0)
    
    # Create InMemoryUploadedFile
    return InMemoryUploadedFile(
        output,
        'ImageField',
        filename,
        content_type,
        output.getbuffer().nbytes,
        None
    )


def _convert_to_webp(img, filename):
    """
    Convert image to WebP format
    
    Args:
        img: PIL Image object
        filename: output filename
        
    Returns:
        InMemoryUploadedFile
    """
    # Resize to large size for WebP (it compresses well)
    img.thumbnail(LARGE_SIZE, Image.Resampling.LANCZOS)
    
    # Save as WebP
    output = BytesIO()
    img.save(output, format='WEBP', quality=WEBP_QUALITY, method=6)
    output.seek(0)
    
    # Create InMemoryUploadedFile
    return InMemoryUploadedFile(
        output,
        'ImageField',
        filename,
        'image/webp',
        output.getbuffer().nbytes,
        None
    )


def should_optimize(mime_type):
    """
    Check if the file type should be optimized
    
    Args:
        mime_type: File MIME type
        
    Returns:
        bool: True if should optimize
    """
    # Optimize images but skip SVG (vector format)
    return mime_type.startswith('image/') and mime_type != 'image/svg+xml'

