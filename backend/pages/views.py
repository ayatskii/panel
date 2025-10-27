from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Prefetch
from django.utils import timezone
from .models import Page, PageBlock, SwiperPreset
from .serializers import (
    PageListSerializer,
    PageDetailSerializer,
    PageCreateSerializer,
    PageBlockSerializer,
    SwiperPresetSerializer
)
from .permissions import IsPageOwnerOrAdmin
from .services.advanced_ai_service import advanced_ai_service
from .services.content_workflow_service import content_workflow_service
from .services.enhanced_content_generation_service import enhanced_content_generation_service
from users.permissions import IsAdminUser


class PageViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for pages
    - Users can only access pages from their sites
    - Admin can access all pages
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter pages based on user and site"""
        user = self.request.user
        queryset = Page.objects.select_related('site').prefetch_related('blocks')
        
        # Filter by site if provided
        site_id = self.request.query_params.get('site')
        if site_id:
            queryset = queryset.filter(site_id=site_id)
        
        # Add block count for list view
        if self.action == 'list':
            queryset = queryset.annotate(blocks_count=Count('blocks'))
        
        # Filter by user
        if not user.is_admin:
            queryset = queryset.filter(site__user=user)
        
        return queryset.order_by('site', 'order', '-created_at')
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return PageListSerializer
        elif self.action == 'create':
            return PageCreateSerializer
        return PageDetailSerializer
    
    def get_permissions(self):
        """Set permissions for different actions"""
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsPageOwnerOrAdmin()]
        return [IsAuthenticated()]
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate a page with all its blocks"""
        page = self.get_object()
        
        # Create duplicate page
        new_page = Page.objects.create(
            site=page.site,
            title=f"{page.title} (Copy)",
            slug=f"{page.slug}-copy",
            meta_description=page.meta_description,
            h1_tag=page.h1_tag,
            use_h1_in_hero=page.use_h1_in_hero,
            canonical_url=page.canonical_url,
            keywords=page.keywords,
            lsi_phrases=page.lsi_phrases,
            order=page.order + 1,
            is_published=False
        )
        
        # Duplicate all blocks
        for block in page.blocks.all():
            PageBlock.objects.create(
                page=new_page,
                block_type=block.block_type,
                order_index=block.order_index,
                content_data=block.content_data,
                prompt=block.prompt
            )
        
        serializer = PageDetailSerializer(new_page)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a page"""
        page = self.get_object()
        page.is_published = True
        page.published_at = timezone.now()
        page.save()
        
        return Response({
            'message': 'Page published successfully',
            'is_published': True
        })
    
    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        """Unpublish a page"""
        page = self.get_object()
        page.is_published = False
        page.save()
        
        return Response({
            'message': 'Page unpublished successfully',
            'is_published': False
        })
    
    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """Reorder pages"""
        page_orders = request.data.get('pages', [])
        # Expected format: [{"id": 1, "order": 0}, {"id": 2, "order": 1}]
        
        for item in page_orders:
            Page.objects.filter(id=item['id']).update(order=item['order'])
        
        return Response({'message': 'Pages reordered successfully'})
    
    @action(detail=True, methods=['post'])
    def generate_content(self, request, pk=None):
        """Generate AI content for page blocks"""
        page = self.get_object()
        
        block_types = request.data.get('block_types', [])
        prompt_ids = request.data.get('prompt_ids', {})
        model = request.data.get('model')
        
        if not block_types:
            return Response(
                {'error': 'block_types is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Prepare context for AI generation
            context = {
                'brand_name': page.site.brand_name,
                'keywords': page.keywords_list,
                'lsi_phrases': page.lsi_phrases_list,
                'page_title': page.title,
                'domain': page.site.domain,
                'language': page.site.language_code,
                'affiliate_link': page.site.affiliate_link.url if page.site.affiliate_link else '#',
                'background_image': '',
                'default_image': '',
                'button_text': 'Learn More',
                'cta_text': 'Get Started'
            }
            
            generated_content = {}
            
            for block_type in block_types:
                prompt_id = prompt_ids.get(block_type)
                result = advanced_ai_service.generate_block_content(
                    block_type=block_type,
                    context=context,
                    prompt_id=prompt_id,
                    model=model
                )
                generated_content[block_type] = result
            
            return Response({
                'message': 'Content generated successfully',
                'content': generated_content
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate content: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def generate_meta(self, request, pk=None):
        """Generate AI meta content (title, description, H1)"""
        page = self.get_object()
        
        try:
            context = {
                'brand_name': page.site.brand_name,
                'keywords': page.keywords_list,
                'lsi_phrases': page.lsi_phrases_list,
                'page_title': page.title,
                'domain': page.site.domain,
                'language': page.site.language_code
            }
            
            # Generate meta title
            title_prompt = f"Generate an SEO-optimized meta title (max 60 characters) for a page about {', '.join(context['keywords'])} for {context['brand_name']}. Include primary keywords naturally."
            meta_title = advanced_ai_service._call_ai_api(title_prompt, max_tokens=50)
            
            # Generate meta description
            desc_prompt = f"Generate an SEO-optimized meta description (max 160 characters) for a page about {', '.join(context['keywords'])} for {context['brand_name']}. Make it compelling and include a call-to-action."
            meta_description = advanced_ai_service._call_ai_api(desc_prompt, max_tokens=80)
            
            # Generate H1
            h1_prompt = f"Generate an SEO-optimized H1 heading for a page about {', '.join(context['keywords'])} for {context['brand_name']}. Make it engaging and include primary keywords."
            h1_tag = advanced_ai_service._call_ai_api(h1_prompt, max_tokens=50)
            
            return Response({
                'title': meta_title.strip(),
                'meta_description': meta_description.strip(),
                'h1_tag': h1_tag.strip()
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate meta content: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def start_workflow(self, request, pk=None):
        """Start a content generation workflow for the page"""
        page = self.get_object()
        
        workflow_config = request.data.get('config', {})
        
        try:
            result = content_workflow_service.create_generation_workflow(
                page_id=page.id,
                workflow_config=workflow_config
            )
            
            if result.get('success'):
                return Response({
                    'message': 'Workflow started successfully',
                    'workflow': result['workflow']
                })
            else:
                return Response(
                    {'error': result.get('error', 'Failed to start workflow')}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            return Response(
                {'error': f'Failed to start workflow: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def workflow_status(self, request):
        """Get workflow status"""
        workflow_id = request.query_params.get('workflow_id')
        
        if not workflow_id:
            return Response(
                {'error': 'workflow_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            status_info = content_workflow_service.get_workflow_status(workflow_id)
            return Response(status_info)
        except Exception as e:
            return Response(
                {'error': f'Failed to get workflow status: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def cancel_workflow(self, request):
        """Cancel a workflow"""
        workflow_id = request.data.get('workflow_id')
        
        if not workflow_id:
            return Response(
                {'error': 'workflow_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = content_workflow_service.cancel_workflow(workflow_id)
            return Response(result)
        except Exception as e:
            return Response(
                {'error': f'Failed to cancel workflow: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def generate_enhanced_content(self, request, pk=None):
        """Generate enhanced content for a page with AI integration"""
        page = self.get_object()
        block_types = request.data.get('block_types', [])
        prompts = request.data.get('prompts', {})
        
        if not block_types:
            return Response(
                {'error': 'block_types is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = enhanced_content_generation_service.generate_content_for_page(
                page, block_types, prompts
            )
            return Response(result)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate enhanced content: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def get_available_prompts(self, request):
        """Get available prompts for content generation"""
        block_type = request.query_params.get('block_type')
        
        if not block_type:
            return Response(
                {'error': 'block_type parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            prompts = enhanced_content_generation_service.get_available_prompts(block_type)
            return Response({
                'success': True,
                'block_type': block_type,
                'prompts': prompts
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get available prompts: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def get_block_types(self, request):
        """Get available block types for content generation"""
        try:
            block_types = enhanced_content_generation_service.BLOCK_TYPES
            return Response({
                'success': True,
                'block_types': block_types
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get block types: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PageBlockViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for page blocks
    """
    queryset = PageBlock.objects.select_related('page', 'swiper_preset')
    serializer_class = PageBlockSerializer
    permission_classes = [IsAuthenticated, IsPageOwnerOrAdmin]
    
    def get_queryset(self):
        """Filter blocks by page if provided"""
        queryset = super().get_queryset()
        page_id = self.request.query_params.get('page')
        
        if page_id:
            queryset = queryset.filter(page_id=page_id)
        
        # Filter by user
        if not self.request.user.is_admin:
            queryset = queryset.filter(page__site__user=self.request.user)
        
        return queryset.order_by('order')
    
    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """Reorder blocks within a page"""
        block_orders = request.data.get('blocks', [])
        # Expected format: [{"id": 1, "order": 0}, {"id": 2, "order": 1}]
        
        for item in block_orders:
            PageBlock.objects.filter(id=item['id']).update(order=item['order'])
        
        return Response({'message': 'Blocks reordered successfully'})

    @action(detail=False, methods=['post'])
    def check_duplicates(self, request):
        """Check for duplicate meta titles and descriptions within a site"""
        site_id = request.data.get('site_id')
        title = request.data.get('title', '').strip()
        meta_description = request.data.get('meta_description', '').strip()
        exclude_id = request.data.get('exclude_id')  # For editing existing pages
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Build queryset for the site
        queryset = Page.objects.filter(site_id=site_id)
        
        # Exclude current page if editing
        if exclude_id:
            queryset = queryset.exclude(id=exclude_id)
        
        duplicates = {
            'title_duplicates': [],
            'description_duplicates': [],
            'has_duplicates': False
        }
        
        # Check for duplicate titles
        if title:
            title_duplicates = queryset.filter(title__iexact=title).values(
                'id', 'title', 'slug', 'created_at'
            )
            duplicates['title_duplicates'] = list(title_duplicates)
        
        # Check for duplicate meta descriptions
        if meta_description:
            desc_duplicates = queryset.filter(meta_description__iexact=meta_description).values(
                'id', 'title', 'slug', 'created_at'
            )
            duplicates['description_duplicates'] = list(desc_duplicates)
        
        # Check if any duplicates found
        duplicates['has_duplicates'] = (
            len(duplicates['title_duplicates']) > 0 or 
            len(duplicates['description_duplicates']) > 0
        )
        
        return Response(duplicates, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def generate_meta(self, request):
        """Generate AI-powered meta tags for a page"""
        from .services.meta_generator import MetaGeneratorService
        
        page_title = request.data.get('page_title', '').strip()
        page_content = request.data.get('page_content', '')
        keywords = request.data.get('keywords', '').strip()
        site_domain = request.data.get('site_domain', '').strip()
        target_audience = request.data.get('target_audience', '').strip()
        
        if not page_title:
            return Response(
                {'error': 'page_title is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            meta_generator = MetaGeneratorService()
            
            generated_meta = meta_generator.generate_meta_tags(
                page_title=page_title,
                page_content=page_content,
                keywords=keywords,
                site_domain=site_domain,
                target_audience=target_audience
            )
            
            return Response({
                'success': True,
                'meta_tags': generated_meta
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate meta tags: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def analyze_seo(self, request):
        """Analyze SEO potential of page content"""
        from .services.meta_generator import MetaGeneratorService
        
        page_title = request.data.get('page_title', '').strip()
        page_content = request.data.get('page_content', '')
        current_meta = request.data.get('current_meta', {})
        
        if not page_title:
            return Response(
                {'error': 'page_title is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            meta_generator = MetaGeneratorService()
            
            # Extract content text
            content_text = meta_generator._extract_text_from_content(page_content)
            
            # Analyze SEO potential
            analysis = meta_generator.analyze_seo_potential(
                page_title=page_title,
                content=content_text,
                current_meta=current_meta
            )
            
            return Response({
                'success': True,
                'analysis': analysis
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to analyze SEO: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def research_lsi_keywords(self, request):
        """Research LSI keywords for a primary keyword"""
        from .services.lsi_keyword_service import LSIKeywordService
        
        primary_keyword = request.data.get('primary_keyword', '').strip()
        content = request.data.get('content', '').strip()
        industry = request.data.get('industry', '').strip()
        target_audience = request.data.get('target_audience', '').strip()
        max_keywords = request.data.get('max_keywords', 20)
        
        if not primary_keyword:
            return Response(
                {'error': 'primary_keyword is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lsi_service = LSIKeywordService()
            
            result = lsi_service.research_lsi_keywords(
                primary_keyword=primary_keyword,
                content=content,
                industry=industry,
                target_audience=target_audience,
                max_keywords=max_keywords
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to research LSI keywords: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def analyze_keyword_density(self, request):
        """Analyze keyword density in content"""
        from .services.lsi_keyword_service import LSIKeywordService
        
        content = request.data.get('content', '').strip()
        target_keywords = request.data.get('target_keywords', [])
        
        if not content or not target_keywords:
            return Response(
                {'error': 'content and target_keywords are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lsi_service = LSIKeywordService()
            
            result = lsi_service.analyze_keyword_density(
                content=content,
                target_keywords=target_keywords
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to analyze keyword density: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def analyze_competitor(self, request):
        """Analyze a competitor website"""
        from .services.competitor_analysis_service import CompetitorAnalysisService
        
        competitor_url = request.data.get('competitor_url', '').strip()
        target_keywords = request.data.get('target_keywords', [])
        analysis_depth = request.data.get('analysis_depth', 'basic')
        
        if not competitor_url:
            return Response(
                {'error': 'competitor_url is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            competitor_service = CompetitorAnalysisService()
            
            result = competitor_service.analyze_competitor(
                competitor_url=competitor_url,
                target_keywords=target_keywords,
                analysis_depth=analysis_depth
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to analyze competitor: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def compare_competitors(self, request):
        """Compare multiple competitor websites"""
        from .services.competitor_analysis_service import CompetitorAnalysisService
        
        competitor_urls = request.data.get('competitor_urls', [])
        target_keywords = request.data.get('target_keywords', [])
        
        if not competitor_urls or len(competitor_urls) < 2:
            return Response(
                {'error': 'At least 2 competitor URLs are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            competitor_service = CompetitorAnalysisService()
            
            result = competitor_service.compare_competitors(
                competitor_urls=competitor_urls,
                target_keywords=target_keywords
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to compare competitors: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def generate_sitemap(self, request):
        """Generate XML sitemap for a site"""
        from .services.sitemap_service import SitemapService
        
        site_id = request.data.get('site_id')
        include_images = request.data.get('include_images', True)
        include_media = request.data.get('include_media', True)
        priority_boost = request.data.get('priority_boost', {})
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            sitemap_service = SitemapService()
            
            result = sitemap_service.generate_sitemap(
                site_id=site_id,
                include_images=include_images,
                include_media=include_media,
                priority_boost=priority_boost
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate sitemap: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def generate_robots_txt(self, request):
        """Generate robots.txt file for a site"""
        from .services.sitemap_service import SitemapService
        
        site_id = request.data.get('site_id')
        custom_rules = request.data.get('custom_rules', [])
        sitemap_url = request.data.get('sitemap_url')
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            sitemap_service = SitemapService()
            
            result = sitemap_service.generate_robots_txt(
                site_id=site_id,
                custom_rules=custom_rules,
                sitemap_url=sitemap_url
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate robots.txt: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def generate_sitemap_index(self, request):
        """Generate sitemap index file"""
        from .services.sitemap_service import SitemapService
        
        site_id = request.data.get('site_id')
        sitemap_types = request.data.get('sitemap_types', ['pages', 'images', 'media'])
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            sitemap_service = SitemapService()
            
            result = sitemap_service.generate_sitemap_index(
                site_id=site_id,
                sitemap_types=sitemap_types
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate sitemap index: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def validate_sitemap(self, request):
        """Validate sitemap XML content"""
        from .services.sitemap_service import SitemapService
        
        xml_content = request.data.get('xml_content', '')
        
        if not xml_content:
            return Response(
                {'error': 'xml_content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            sitemap_service = SitemapService()
            
            result = sitemap_service.validate_sitemap(xml_content)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to validate sitemap: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def get_sitemap_stats(self, request):
        """Get sitemap statistics for a site"""
        from .services.sitemap_service import SitemapService
        
        site_id = request.query_params.get('site_id')
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            sitemap_service = SitemapService()
            
            result = sitemap_service.get_sitemap_stats(int(site_id))
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get sitemap stats: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def generate_schema(self, request, pk=None):
        """Generate Schema.org structured data for a page"""
        from .services.schema_service import SchemaService
        
        page = self.get_object()
        schema_type = request.data.get('schema_type', 'WebPage')
        include_breadcrumbs = request.data.get('include_breadcrumbs', True)
        include_organization = request.data.get('include_organization', True)
        
        try:
            schema_service = SchemaService()
            
            result = schema_service.generate_page_schema(
                page=page,
                schema_type=schema_type,
                include_breadcrumbs=include_breadcrumbs,
                include_organization=include_organization
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate schema: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def get_schema_recommendations(self, request, pk=None):
        """Get schema recommendations for a page"""
        from .services.schema_service import SchemaService
        
        page = self.get_object()
        
        try:
            schema_service = SchemaService()
            
            result = schema_service.get_schema_recommendations(page)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get schema recommendations: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def generate_website_schema(self, request):
        """Generate website-level schema"""
        from .services.schema_service import SchemaService
        
        site_id = request.data.get('site_id')
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from sites.models import Site
            site = Site.objects.get(id=site_id)
            
            schema_service = SchemaService()
            
            result = schema_service.generate_website_schema(site)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Site.DoesNotExist:
            return Response(
                {'error': f'Site with ID {site_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to generate website schema: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def validate_schema(self, request):
        """Validate Schema.org structured data"""
        from .services.schema_service import SchemaService
        
        schema_data = request.data.get('schema_data', {})
        
        if not schema_data:
            return Response(
                {'error': 'schema_data is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            schema_service = SchemaService()
            
            result = schema_service.validate_schema(schema_data)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to validate schema: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def schedule_publication(self, request, pk=None):
        """Schedule a page for future publication"""
        from .services.content_automation_service import ContentAutomationService
        
        page = self.get_object()
        scheduled_date = request.data.get('scheduled_date')
        user_id = request.user.id
        
        if not scheduled_date:
            return Response(
                {'error': 'scheduled_date is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            scheduled_datetime = datetime.fromisoformat(scheduled_date.replace('Z', '+00:00'))
            
            automation_service = ContentAutomationService()
            
            result = automation_service.schedule_page_publication(
                page_id=page.id,
                scheduled_date=scheduled_datetime,
                user_id=user_id
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except ValueError:
            return Response(
                {'error': 'Invalid scheduled_date format. Use ISO format.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to schedule publication: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def cancel_scheduled_publication(self, request, pk=None):
        """Cancel a scheduled page publication"""
        from .services.content_automation_service import ContentAutomationService
        
        page = self.get_object()
        
        try:
            automation_service = ContentAutomationService()
            
            result = automation_service.cancel_scheduled_publication(page.id)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to cancel scheduled publication: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def get_scheduled_pages(self, request):
        """Get all scheduled pages"""
        from .services.content_automation_service import ContentAutomationService
        
        site_id = request.query_params.get('site_id')
        user_id = request.query_params.get('user_id')
        status = request.query_params.get('status', 'scheduled')
        
        try:
            automation_service = ContentAutomationService()
            
            result = automation_service.get_scheduled_pages(
                site_id=int(site_id) if site_id else None,
                user_id=int(user_id) if user_id else None,
                status=status
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get scheduled pages: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def process_scheduled_publications(self, request):
        """Process all scheduled publications that are due"""
        from .services.content_automation_service import ContentAutomationService
        
        try:
            automation_service = ContentAutomationService()
            
            result = automation_service.process_scheduled_publications()
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to process scheduled publications: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def create_content_template(self, request):
        """Create a content template"""
        from .services.content_automation_service import ContentAutomationService
        
        name = request.data.get('name')
        description = request.data.get('description', '')
        blocks = request.data.get('blocks', [])
        site_id = request.data.get('site_id')
        user_id = request.user.id
        
        if not name:
            return Response(
                {'error': 'name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            automation_service = ContentAutomationService()
            
            result = automation_service.create_content_template(
                name=name,
                description=description,
                blocks=blocks,
                user_id=user_id,
                site_id=int(site_id) if site_id else None
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to create content template: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def apply_content_template(self, request, pk=None):
        """Apply a content template to a page"""
        from .services.content_automation_service import ContentAutomationService
        
        page = self.get_object()
        template_id = request.data.get('template_id')
        user_id = request.user.id
        
        if not template_id:
            return Response(
                {'error': 'template_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            automation_service = ContentAutomationService()
            
            result = automation_service.apply_content_template(
                template_id=template_id,
                page_id=page.id,
                user_id=user_id
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to apply content template: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def bulk_update_pages(self, request):
        """Bulk update multiple pages"""
        from .services.content_automation_service import ContentAutomationService
        
        page_ids = request.data.get('page_ids', [])
        updates = request.data.get('updates', {})
        user_id = request.user.id
        
        if not page_ids:
            return Response(
                {'error': 'page_ids is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            automation_service = ContentAutomationService()
            
            result = automation_service.bulk_update_pages(
                page_ids=page_ids,
                updates=updates,
                user_id=user_id
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to bulk update pages: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def create_automated_workflow(self, request):
        """Create an automated workflow"""
        from .services.content_automation_service import ContentAutomationService
        
        name = request.data.get('name')
        description = request.data.get('description', '')
        triggers = request.data.get('triggers', [])
        actions = request.data.get('actions', [])
        site_id = request.data.get('site_id')
        user_id = request.user.id
        
        if not name:
            return Response(
                {'error': 'name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            automation_service = ContentAutomationService()
            
            result = automation_service.create_automated_workflow(
                name=name,
                description=description,
                triggers=triggers,
                actions=actions,
                user_id=user_id,
                site_id=int(site_id) if site_id else None
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to create automated workflow: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def get_automation_analytics(self, request):
        """Get automation analytics"""
        from .services.content_automation_service import ContentAutomationService
        
        site_id = request.query_params.get('site_id')
        period_days = int(request.query_params.get('period_days', 30))
        
        try:
            automation_service = ContentAutomationService()
            
            result = automation_service.get_automation_analytics(
                site_id=int(site_id) if site_id else None,
                period_days=period_days
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get automation analytics: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def generate_content(self, request, pk=None):
        """Generate AI content for a specific block"""
        block = self.get_object()
        
        prompt_id = request.data.get('prompt_id')
        model = request.data.get('model')
        
        try:
            # Prepare context for AI generation
            context = {
                'brand_name': block.page.site.brand_name,
                'keywords': block.page.keywords_list,
                'lsi_phrases': block.page.lsi_phrases_list,
                'page_title': block.page.title,
                'domain': block.page.site.domain,
                'language': block.page.site.language_code,
                'affiliate_link': block.page.site.affiliate_link.url if block.page.site.affiliate_link else '#',
                'background_image': '',
                'default_image': '',
                'button_text': 'Learn More',
                'cta_text': 'Get Started'
            }
            
            # Generate content for the block type
            result = advanced_ai_service.generate_block_content(
                block_type=block.block_type,
                context=context,
                prompt_id=prompt_id,
                model=model
            )
            
            return Response({
                'message': 'Content generated successfully',
                'content': result
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate content: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def regenerate_content(self, request, pk=None):
        """Regenerate AI content for a specific block and update it"""
        block = self.get_object()
        
        prompt_id = request.data.get('prompt_id')
        model = request.data.get('model')
        
        try:
            # Prepare context for AI generation
            context = {
                'brand_name': block.page.site.brand_name,
                'keywords': block.page.keywords_list,
                'lsi_phrases': block.page.lsi_phrases_list,
                'page_title': block.page.title,
                'domain': block.page.site.domain,
                'language': block.page.site.language_code,
                'affiliate_link': block.page.site.affiliate_link.url if block.page.site.affiliate_link else '#',
                'background_image': '',
                'default_image': '',
                'button_text': 'Learn More',
                'cta_text': 'Get Started'
            }
            
            # Generate content for the block type
            result = advanced_ai_service.generate_block_content(
                block_type=block.block_type,
                context=context,
                prompt_id=prompt_id,
                model=model
            )
            
            # Update the block with generated content
            if block.block_type == 'hero':
                block.content_data.update({
                    'title': result.get('title', ''),
                    'subtitle': result.get('subtitle', ''),
                    'cta_text': result.get('cta_text', ''),
                    'buttons': result.get('buttons', [])
                })
            elif block.block_type == 'article':
                block.content_data.update({
                    'title': result.get('title', ''),
                    'text': result.get('text', ''),
                    'alignment': result.get('alignment', 'left')
                })
            elif block.block_type == 'faq':
                block.content_data.update({
                    'title': result.get('title', ''),
                    'faqs': result.get('faqs', [])
                })
            elif block.block_type == 'swiper':
                block.content_data.update({
                    'title': result.get('title', ''),
                    'slides': result.get('slides', []),
                    'button_text': result.get('button_text', 'Learn More')
                })
            elif block.block_type == 'cta':
                block.content_data.update({
                    'title': result.get('title', ''),
                    'description': result.get('description', ''),
                    'buttons': result.get('buttons', [])
                })
            else:
                # Generic content update
                block.content_data.update(result)
            
            block.save()
            
            return Response({
                'message': 'Content regenerated and updated successfully',
                'content': block.content_data
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to regenerate content: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def regenerate_content(self, request, pk=None):
        """Regenerate content for a specific block using AI"""
        block = self.get_object()
        prompt_id = request.data.get('prompt_id')
        
        if not prompt_id:
            return Response(
                {'error': 'prompt_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = enhanced_content_generation_service.regenerate_block_content(
                block, prompt_id
            )
            return Response(result)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to regenerate block content: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SwiperPresetViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for swiper presets
    """
    queryset = SwiperPreset.objects.all().order_by('name')
    serializer_class = SwiperPresetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Only admin can create/update/delete presets"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminUser()]
        return [IsAuthenticated()]
    
    @action(detail=True, methods=['post'])
    def apply_to_block(self, request, pk=None):
        """Apply this preset to a specific swiper block"""
        preset = self.get_object()
        block_id = request.data.get('block_id')
        
        if not block_id:
            return Response(
                {'error': 'block_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            block = PageBlock.objects.get(id=block_id)
            
            if block.block_type != 'swiper':
                return Response(
                    {'error': 'Block must be of type swiper'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update block content with preset data
            block.content_data.update({
                'title': f"Featured {preset.name}",
                'slides': preset.games_data,
                'button_text': preset.button_text
            })
            
            # Set the preset reference
            block.swiper_preset = preset
            block.save()
            
            return Response({
                'message': 'Preset applied successfully',
                'content': block.content_data
            })
            
        except PageBlock.DoesNotExist:
            return Response(
                {'error': 'Block not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to apply preset: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def create_from_ai(self, request):
        """Create a new swiper preset using AI generation"""
        name = request.data.get('name')
        keywords = request.data.get('keywords', [])
        game_count = request.data.get('game_count', 6)
        button_text = request.data.get('button_text', 'Play Now')
        model = request.data.get('model')
        
        if not name:
            return Response(
                {'error': 'name is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Prepare context for AI generation
            context = {
                'brand_name': 'Gaming Platform',
                'keywords': keywords,
                'lsi_phrases': [],
                'page_title': name,
                'domain': 'example.com',
                'language': 'English',
                'button_text': button_text
            }
            
            # Generate swiper content using AI
            result = advanced_ai_service.generate_block_content(
                block_type='swiper',
                context=context,
                model=model
            )
            
            # Create the preset
            preset = SwiperPreset.objects.create(
                name=name,
                games_data=result.get('slides', []),
                button_text=button_text
            )
            
            return Response({
                'message': 'Swiper preset created successfully',
                'preset': SwiperPresetSerializer(preset).data
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to create preset: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate an existing swiper preset"""
        preset = self.get_object()
        
        try:
            # Create a duplicate with a new name
            new_name = f"{preset.name} (Copy)"
            counter = 1
            while SwiperPreset.objects.filter(name=new_name).exists():
                new_name = f"{preset.name} (Copy {counter})"
                counter += 1
            
            duplicate = SwiperPreset.objects.create(
                name=new_name,
                games_data=preset.games_data,
                button_text=preset.button_text,
                affiliate_link=preset.affiliate_link
            )
            
            return Response({
                'message': 'Preset duplicated successfully',
                'preset': SwiperPresetSerializer(duplicate).data
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to duplicate preset: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get available preset categories"""
        # This could be enhanced to group presets by category
        categories = [
            {'id': 'slots', 'name': 'Slot Games', 'count': 0},
            {'id': 'table', 'name': 'Table Games', 'count': 0},
            {'id': 'live', 'name': 'Live Casino', 'count': 0},
            {'id': 'sports', 'name': 'Sports Betting', 'count': 0},
            {'id': 'new', 'name': 'New Games', 'count': 0},
            {'id': 'popular', 'name': 'Popular Games', 'count': 0},
        ]
        
        return Response({'categories': categories})
