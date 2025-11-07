from rest_framework import serializers
from .models import Page, PageBlock, SwiperPreset


class PageBlockSerializer(serializers.ModelSerializer):
    """Serializer for page blocks"""
    block_type_display = serializers.CharField(
        source='get_block_type_display',
        read_only=True
    )
    prompt_name = serializers.CharField(
        source='prompt.name',
        read_only=True,
        allow_null=True
    )
    is_hero = serializers.BooleanField(read_only=True)
    is_article = serializers.BooleanField(read_only=True)
    is_cta = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = PageBlock
        fields = [
            'id', 'page', 'block_type', 'block_type_display',
            'content_data', 'order_index', 'prompt', 'prompt_name',
            'open_article_tag', 'close_article_tag',
            'is_hero', 'is_article', 'is_cta',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_content_data(self, value):
        """Validate content_data based on block_type"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("content_data must be a JSON object")
        return value
    
    def validate_order_index(self, value):
        """Ensure order_index is non-negative"""
        if value < 0:
            raise serializers.ValidationError("order_index must be non-negative")
        return value


class PageBlockListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for block lists"""
    block_type_display = serializers.CharField(
        source='get_block_type_display',
        read_only=True
    )
    
    class Meta:
        model = PageBlock
        fields = [
            'id', 'block_type', 'block_type_display',
            'order_index', 'updated_at'
        ]


class PageSerializer(serializers.ModelSerializer):
    """Full page serializer with blocks"""
    blocks = PageBlockSerializer(many=True, read_only=True)
    block_count = serializers.IntegerField(read_only=True)
    site_domain = serializers.CharField(source='site.domain', read_only=True)
    site_brand = serializers.CharField(source='site.brand_name', read_only=True)
    full_url = serializers.CharField(read_only=True)
    keywords_list = serializers.ListField(read_only=True)
    lsi_phrases_list = serializers.ListField(read_only=True)
    
    class Meta:
        model = Page
        fields = [
            'id', 'site', 'site_domain', 'site_brand',
            'slug', 'title', 'meta_description', 'h1_tag',
            'use_h1_in_hero', 'canonical_url', 'custom_head_html',
            'keywords', 'keywords_list', 'lsi_phrases', 'lsi_phrases_list',
            'blocks', 'block_count', 'full_url',
            'is_published', 'published_at',
            'order', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'published_at']
    
    def validate_slug(self, value):
        """Validate slug format"""
        import re
        if not re.match(r'^[a-z0-9-]*$', value):
            raise serializers.ValidationError(
                "Slug can only contain lowercase letters, numbers, and hyphens"
            )
        if value.startswith('-') or value.endswith('-'):
            raise serializers.ValidationError(
                "Slug cannot start or end with a hyphen"
            )
        return value
    
    def validate_title(self, value):
        """Validate meta title length for SEO"""
        if value and len(value) > 60:
            raise serializers.ValidationError(
                f"Meta title should be max 60 characters (currently {len(value)}). "
                "Longer titles may be truncated in search results."
            )
        if value and len(value) < 30:
            raise serializers.ValidationError(
                f"Meta title should be at least 30 characters (currently {len(value)}) for better SEO."
            )
        return value
    
    def validate_meta_description(self, value):
        """Validate meta description length for SEO"""
        if value and len(value) > 160:
            raise serializers.ValidationError(
                f"Meta description should be max 160 characters (currently {len(value)}). "
                "Longer descriptions may be truncated in search results."
            )
        if value and len(value) < 50:
            raise serializers.ValidationError(
                f"Meta description should be at least 50 characters (currently {len(value)}) for better SEO."
            )
        return value
    
    def validate_h1_tag(self, value):
        """Validate H1 tag length"""
        if value and len(value) > 70:
            raise serializers.ValidationError(
                f"H1 tag should be max 70 characters (currently {len(value)}) for best SEO practice."
            )
        return value
    
    def validate(self, data):
        """Validate slug uniqueness within site"""
        site = data.get('site', self.instance.site if self.instance else None)
        slug = data.get('slug', self.instance.slug if self.instance else None)
        
        if site and slug:
            qs = Page.objects.filter(site=site, slug=slug)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            
            if qs.exists():
                raise serializers.ValidationError({
                    'slug': f"Page with slug '{slug}' already exists for this site"
                })
        
        return data


class PageListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for page lists"""
    site_domain = serializers.CharField(source='site.domain', read_only=True)
    block_count = serializers.IntegerField(read_only=True)
    full_url = serializers.CharField(read_only=True)
    
    class Meta:
        model = Page
        fields = [
            'id', 'site', 'site_domain', 'slug',
            'title', 'block_count', 'full_url',
            'is_published', 'published_at',
            'order', 'created_at', 'updated_at'
        ]


class PageCreateSerializer(serializers.ModelSerializer):
    """Serializer for page creation"""
    
    class Meta:
        model = Page
        fields = [
            'site', 'slug', 'title', 'meta_description',
            'h1_tag', 'use_h1_in_hero', 'keywords', 'lsi_phrases'
        ]
    
    def validate_slug(self, value):
        """Validate slug format"""
        import re
        if not re.match(r'^[a-z0-9-]*$', value):
            raise serializers.ValidationError(
                "Slug can only contain lowercase letters, numbers, and hyphens"
            )
        return value


class SwiperPresetSerializer(serializers.ModelSerializer):
    """Serializer for swiper presets"""
    affiliate_link_name = serializers.CharField(
        source='affiliate_link.name',
        read_only=True,
        allow_null=True
    )
    game_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = SwiperPreset
        fields = [
            'id', 'name', 'games_data', 'button_text',
            'affiliate_link', 'affiliate_link_name', 'game_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_games_data(self, value):
        """Validate games_data structure"""
        if not isinstance(value, list):
            raise serializers.ValidationError("games_data must be a list")
        
        if len(value) == 0:
            raise serializers.ValidationError("games_data cannot be empty")

        for i, game in enumerate(value):
            if not isinstance(game, dict):
                raise serializers.ValidationError(
                    f"Game at index {i} must be an object"
                )

            required_fields = ['name', 'image']
            for field in required_fields:
                if field not in game:
                    raise serializers.ValidationError(
                        f"Game at index {i} missing required field: {field}"
                    )
        
        return value


class SwiperPresetListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for preset lists"""
    game_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = SwiperPreset
        fields = ['id', 'name', 'game_count', 'button_text', 'created_at']


class PageDetailSerializer(serializers.ModelSerializer):
    """Full page serializer with blocks"""
    site_domain = serializers.CharField(source='site.domain', read_only=True)
    blocks = PageBlockSerializer(many=True, read_only=True)
    
    class Meta:
        model = Page
        fields = [
            'id', 'site', 'site_domain', 'title', 'slug',
            'meta_description', 'h1_tag', 'use_h1_in_hero',
            'canonical_url', 'custom_head_html',
            'keywords', 'lsi_phrases',
            'order', 'is_published', 'blocks',
            'created_at', 'updated_at', 'published_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'published_at']
    
    def validate_slug(self, value):
        """Validate slug uniqueness within site"""
        site = self.initial_data.get('site', 
                                     self.instance.site_id if self.instance else None)
        
        page_id = self.instance.id if self.instance else None
        queryset = Page.objects.filter(site_id=site, slug=value)
        
        if page_id:
            queryset = queryset.exclude(id=page_id)
        
        if queryset.exists():
            raise serializers.ValidationError("A page with this slug already exists on this site")
        
        return value
