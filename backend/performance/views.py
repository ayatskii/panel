from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services.performance_optimization_service import PerformanceOptimizationService


class PerformanceOptimizationViewSet(viewsets.ViewSet):
    """
    ViewSet for performance optimization
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def get_cache_stats(self, request):
        """Get cache statistics"""
        try:
            performance_service = PerformanceOptimizationService()
            
            result = performance_service.get_cache_stats()
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get cache stats: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def invalidate_cache(self, request):
        """Invalidate cache entries"""
        pattern = request.data.get('pattern', '')
        
        try:
            performance_service = PerformanceOptimizationService()
            
            result = performance_service.invalidate_cache_pattern(pattern)
            
            return Response({
                'success': True,
                'invalidated_count': result,
                'pattern': pattern
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to invalidate cache: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def optimize_database(self, request):
        """Optimize database queries for a site"""
        site_id = request.data.get('site_id')
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            performance_service = PerformanceOptimizationService()
            
            result = performance_service.optimize_database_queries(int(site_id))
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to optimize database: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def optimize_images(self, request):
        """Optimize images for a site"""
        site_id = request.data.get('site_id')
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            performance_service = PerformanceOptimizationService()
            
            result = performance_service.optimize_images(int(site_id))
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to optimize images: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def compress_image(self, request):
        """Compress a specific image"""
        media_id = request.data.get('media_id')
        quality = request.data.get('quality', 85)
        
        if not media_id:
            return Response(
                {'error': 'media_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            performance_service = PerformanceOptimizationService()
            
            result = performance_service.compress_image(int(media_id), int(quality))
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to compress image: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def get_cdn_performance(self, request):
        """Get CDN performance metrics"""
        site_id = request.query_params.get('site_id')
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            performance_service = PerformanceOptimizationService()
            
            result = performance_service.get_cdn_performance(int(site_id))
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get CDN performance: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def optimize_cdn(self, request):
        """Optimize CDN settings for a site"""
        site_id = request.data.get('site_id')
        settings = request.data.get('settings', {})
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            performance_service = PerformanceOptimizationService()
            
            result = performance_service.optimize_cdn_settings(int(site_id), settings)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to optimize CDN: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def get_system_performance(self, request):
        """Get system performance metrics"""
        try:
            performance_service = PerformanceOptimizationService()
            
            result = performance_service.get_system_performance()
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get system performance: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def get_recommendations(self, request):
        """Get performance recommendations for a site"""
        site_id = request.query_params.get('site_id')
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            performance_service = PerformanceOptimizationService()
            
            result = performance_service.get_performance_recommendations(int(site_id))
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get recommendations: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def run_performance_test(self, request):
        """Run performance tests for a site"""
        site_id = request.data.get('site_id')
        test_type = request.data.get('test_type', 'full')
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            performance_service = PerformanceOptimizationService()
            
            result = performance_service.run_performance_test(int(site_id), test_type)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to run performance test: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
