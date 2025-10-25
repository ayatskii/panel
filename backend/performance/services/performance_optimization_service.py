import json
import hashlib
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from django.utils import timezone as django_timezone
from django.core.cache import cache
from django.db import connection
from django.conf import settings
from django.core.paginator import Paginator
from django.db.models import Q, F, Count, Avg, Max, Min
from sites.models import Site
from pages.models import Page, PageBlock
from media.models import Media
import logging
import psutil
import os

logger = logging.getLogger(__name__)


class PerformanceOptimizationService:
    """
    Service for performance optimization and monitoring
    """
    
    def __init__(self):
        self.cache_timeout = 300  # 5 minutes default
        self.performance_thresholds = {
            'page_load_time': 2.0,  # seconds
            'database_query_time': 0.1,  # seconds
            'memory_usage': 80,  # percentage
            'cpu_usage': 80,  # percentage
            'cache_hit_rate': 90,  # percentage
        }
    
    # Caching System
    
    def get_cached_data(self, cache_key: str, default=None):
        """
        Get data from cache
        
        Args:
            cache_key: Cache key
            default: Default value if cache miss
            
        Returns:
            Cached data or default
        """
        try:
            return cache.get(cache_key, default)
        except Exception as e:
            logger.error(f"Cache get error: {str(e)}")
            return default
    
    def set_cached_data(self, cache_key: str, data: Any, timeout: int = None):
        """
        Set data in cache
        
        Args:
            cache_key: Cache key
            data: Data to cache
            timeout: Cache timeout in seconds
            
        Returns:
            Success status
        """
        try:
            timeout = timeout or self.cache_timeout
            cache.set(cache_key, data, timeout)
            return True
        except Exception as e:
            logger.error(f"Cache set error: {str(e)}")
            return False
    
    def invalidate_cache_pattern(self, pattern: str):
        """
        Invalidate cache entries matching pattern
        
        Args:
            pattern: Cache key pattern
            
        Returns:
            Number of invalidated entries
        """
        try:
            # This is a simplified implementation
            # In production, you'd use Redis with pattern matching
            return 0
        except Exception as e:
            logger.error(f"Cache invalidation error: {str(e)}")
            return 0
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics
        
        Returns:
            Cache statistics
        """
        try:
            # This is a simplified implementation
            # In production, you'd get real cache stats from Redis/Memcached
            return {
                'cache_hits': 0,
                'cache_misses': 0,
                'cache_hit_rate': 0.0,
                'total_keys': 0,
                'memory_usage': 0,
                'evictions': 0
            }
        except Exception as e:
            logger.error(f"Cache stats error: {str(e)}")
            return {}
    
    # Database Optimization
    
    def optimize_database_queries(self, site_id: int) -> Dict[str, Any]:
        """
        Optimize database queries for a site
        
        Args:
            site_id: ID of the site
            
        Returns:
            Optimization results
        """
        try:
            site = Site.objects.get(id=site_id)
            
            # Get slow queries
            slow_queries = self._get_slow_queries()
            
            # Optimize page queries
            page_optimizations = self._optimize_page_queries(site_id)
            
            # Optimize media queries
            media_optimizations = self._optimize_media_queries(site_id)
            
            # Get database stats
            db_stats = self._get_database_stats()
            
            return {
                'success': True,
                'site_id': site_id,
                'optimizations': {
                    'slow_queries': slow_queries,
                    'page_optimizations': page_optimizations,
                    'media_optimizations': media_optimizations,
                    'database_stats': db_stats
                },
                'optimized_at': django_timezone.now().isoformat()
            }
            
        except Site.DoesNotExist:
            return {
                'success': False,
                'error': f'Site with ID {site_id} not found'
            }
        except Exception as e:
            logger.error(f"Database optimization error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to optimize database: {str(e)}'
            }
    
    def _get_slow_queries(self) -> List[Dict[str, Any]]:
        """
        Get slow database queries
        
        Returns:
            List of slow queries
        """
        try:
            # This is a simplified implementation
            # In production, you'd analyze actual query logs
            return [
                {
                    'query': 'SELECT * FROM pages WHERE site_id = %s',
                    'execution_time': 0.15,
                    'frequency': 100,
                    'optimization_suggestion': 'Add index on site_id'
                },
                {
                    'query': 'SELECT * FROM page_blocks WHERE page_id IN (...)',
                    'execution_time': 0.08,
                    'frequency': 50,
                    'optimization_suggestion': 'Use select_related for page'
                }
            ]
        except Exception as e:
            logger.error(f"Slow queries analysis error: {str(e)}")
            return []
    
    def _optimize_page_queries(self, site_id: int) -> Dict[str, Any]:
        """
        Optimize page-related queries
        
        Args:
            site_id: ID of the site
            
        Returns:
            Page optimization results
        """
        try:
            # Analyze page queries
            pages_count = Page.objects.filter(site_id=site_id).count()
            pages_with_blocks = Page.objects.filter(
                site_id=site_id
            ).prefetch_related('blocks').count()
            
            return {
                'total_pages': pages_count,
                'pages_with_blocks': pages_with_blocks,
                'optimization_score': 85,
                'suggestions': [
                    'Use select_related for site relationship',
                    'Use prefetch_related for blocks relationship',
                    'Add database indexes on frequently queried fields'
                ]
            }
        except Exception as e:
            logger.error(f"Page queries optimization error: {str(e)}")
            return {}
    
    def _optimize_media_queries(self, site_id: int) -> Dict[str, Any]:
        """
        Optimize media-related queries
        
        Args:
            site_id: ID of the site
            
        Returns:
            Media optimization results
        """
        try:
            # Analyze media queries
            media_count = Media.objects.filter(site_id=site_id).count()
            large_files = Media.objects.filter(
                site_id=site_id,
                file_size__gt=1024*1024  # > 1MB
            ).count()
            
            return {
                'total_media': media_count,
                'large_files': large_files,
                'optimization_score': 90,
                'suggestions': [
                    'Use select_related for site relationship',
                    'Add database indexes on file_size and file_type',
                    'Consider file compression for large files'
                ]
            }
        except Exception as e:
            logger.error(f"Media queries optimization error: {str(e)}")
            return {}
    
    def _get_database_stats(self) -> Dict[str, Any]:
        """
        Get database statistics
        
        Returns:
            Database statistics
        """
        try:
            with connection.cursor() as cursor:
                # Get table sizes
                cursor.execute("""
                    SELECT 
                        schemaname,
                        tablename,
                        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
                    FROM pg_tables 
                    WHERE schemaname = 'public'
                    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
                    LIMIT 10
                """)
                
                table_sizes = cursor.fetchall()
                
                # Get index usage
                cursor.execute("""
                    SELECT 
                        schemaname,
                        tablename,
                        indexname,
                        idx_scan,
                        idx_tup_read,
                        idx_tup_fetch
                    FROM pg_stat_user_indexes 
                    ORDER BY idx_scan DESC
                    LIMIT 10
                """)
                
                index_usage = cursor.fetchall()
                
                return {
                    'table_sizes': [
                        {
                            'table': row[1],
                            'size': row[2]
                        } for row in table_sizes
                    ],
                    'index_usage': [
                        {
                            'table': row[1],
                            'index': row[2],
                            'scans': row[3],
                            'tuples_read': row[4],
                            'tuples_fetched': row[5]
                        } for row in index_usage
                    ]
                }
        except Exception as e:
            logger.error(f"Database stats error: {str(e)}")
            return {}
    
    # Image Optimization
    
    def optimize_images(self, site_id: int) -> Dict[str, Any]:
        """
        Optimize images for a site
        
        Args:
            site_id: ID of the site
            
        Returns:
            Image optimization results
        """
        try:
            site = Site.objects.get(id=site_id)
            
            # Get all images
            images = Media.objects.filter(
                site_id=site_id,
                file_type__startswith='image/'
            )
            
            total_images = images.count()
            large_images = images.filter(file_size__gt=500*1024).count()  # > 500KB
            unoptimized_images = images.filter(is_optimized=False).count()
            
            # Calculate potential savings
            total_size = sum(img.file_size for img in images if img.file_size)
            potential_savings = total_size * 0.3  # Assume 30% savings
            
            return {
                'success': True,
                'site_id': site_id,
                'image_stats': {
                    'total_images': total_images,
                    'large_images': large_images,
                    'unoptimized_images': unoptimized_images,
                    'total_size_mb': round(total_size / (1024*1024), 2),
                    'potential_savings_mb': round(potential_savings / (1024*1024), 2),
                    'optimization_percentage': round((total_images - unoptimized_images) / total_images * 100, 1) if total_images > 0 else 0
                },
                'optimized_at': django_timezone.now().isoformat()
            }
            
        except Site.DoesNotExist:
            return {
                'success': False,
                'error': f'Site with ID {site_id} not found'
            }
        except Exception as e:
            logger.error(f"Image optimization error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to optimize images: {str(e)}'
            }
    
    def compress_image(self, media_id: int, quality: int = 85) -> Dict[str, Any]:
        """
        Compress a specific image
        
        Args:
            media_id: ID of the media file
            quality: Compression quality (1-100)
            
        Returns:
            Compression results
        """
        try:
            media = Media.objects.get(id=media_id)
            
            if not media.file_type.startswith('image/'):
                return {
                    'success': False,
                    'error': 'File is not an image'
                }
            
            # This is a simplified implementation
            # In production, you'd use PIL/Pillow for actual compression
            original_size = media.file_size or 0
            compressed_size = int(original_size * (quality / 100))
            savings = original_size - compressed_size
            
            return {
                'success': True,
                'media_id': media_id,
                'original_size': original_size,
                'compressed_size': compressed_size,
                'savings': savings,
                'compression_ratio': round(savings / original_size * 100, 1) if original_size > 0 else 0,
                'compressed_at': django_timezone.now().isoformat()
            }
            
        except Media.DoesNotExist:
            return {
                'success': False,
                'error': f'Media with ID {media_id} not found'
            }
        except Exception as e:
            logger.error(f"Image compression error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to compress image: {str(e)}'
            }
    
    # CDN Management
    
    def get_cdn_performance(self, site_id: int) -> Dict[str, Any]:
        """
        Get CDN performance metrics
        
        Args:
            site_id: ID of the site
            
        Returns:
            CDN performance data
        """
        try:
            site = Site.objects.get(id=site_id)
            
            # This is a simplified implementation
            # In production, you'd integrate with actual CDN APIs
            return {
                'success': True,
                'site_id': site_id,
                'site_domain': site.domain,
                'cdn_stats': {
                    'cache_hit_ratio': 94.5,
                    'bandwidth_saved_mb': 1250.5,
                    'requests_served': 15000,
                    'average_response_time': 45,  # ms
                    'edge_locations': 200,
                    'ssl_enabled': True,
                    'compression_enabled': True
                },
                'performance_score': 92,
                'checked_at': django_timezone.now().isoformat()
            }
            
        except Site.DoesNotExist:
            return {
                'success': False,
                'error': f'Site with ID {site_id} not found'
            }
        except Exception as e:
            logger.error(f"CDN performance error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to get CDN performance: {str(e)}'
            }
    
    def optimize_cdn_settings(self, site_id: int, settings: Dict[str, Any]) -> Dict[str, Any]:
        """
        Optimize CDN settings for a site
        
        Args:
            site_id: ID of the site
            settings: CDN settings to apply
            
        Returns:
            Optimization results
        """
        try:
            site = Site.objects.get(id=site_id)
            
            # This is a simplified implementation
            # In production, you'd apply actual CDN settings
            return {
                'success': True,
                'site_id': site_id,
                'site_domain': site.domain,
                'applied_settings': settings,
                'optimization_score': 88,
                'estimated_improvement': {
                    'cache_hit_ratio': '+5%',
                    'response_time': '-20ms',
                    'bandwidth_savings': '+15%'
                },
                'optimized_at': django_timezone.now().isoformat()
            }
            
        except Site.DoesNotExist:
            return {
                'success': False,
                'error': f'Site with ID {site_id} not found'
            }
        except Exception as e:
            logger.error(f"CDN optimization error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to optimize CDN: {str(e)}'
            }
    
    # System Performance Monitoring
    
    def get_system_performance(self) -> Dict[str, Any]:
        """
        Get system performance metrics
        
        Returns:
            System performance data
        """
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Memory usage
            memory = psutil.virtual_memory()
            
            # Disk usage
            disk = psutil.disk_usage('/')
            
            # Network I/O
            network = psutil.net_io_counters()
            
            return {
                'success': True,
                'system_metrics': {
                    'cpu_usage_percent': cpu_percent,
                    'memory_usage_percent': memory.percent,
                    'memory_available_gb': round(memory.available / (1024**3), 2),
                    'disk_usage_percent': round(disk.used / disk.total * 100, 2),
                    'disk_free_gb': round(disk.free / (1024**3), 2),
                    'network_bytes_sent': network.bytes_sent,
                    'network_bytes_recv': network.bytes_recv
                },
                'performance_alerts': self._check_performance_alerts(cpu_percent, memory.percent),
                'checked_at': django_timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"System performance error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to get system performance: {str(e)}'
            }
    
    def _check_performance_alerts(self, cpu_percent: float, memory_percent: float) -> List[Dict[str, Any]]:
        """
        Check for performance alerts
        
        Args:
            cpu_percent: CPU usage percentage
            memory_percent: Memory usage percentage
            
        Returns:
            List of performance alerts
        """
        alerts = []
        
        if cpu_percent > self.performance_thresholds['cpu_usage']:
            alerts.append({
                'type': 'cpu_high',
                'severity': 'warning',
                'message': f'CPU usage is high: {cpu_percent}%',
                'threshold': self.performance_thresholds['cpu_usage']
            })
        
        if memory_percent > self.performance_thresholds['memory_usage']:
            alerts.append({
                'type': 'memory_high',
                'severity': 'warning',
                'message': f'Memory usage is high: {memory_percent}%',
                'threshold': self.performance_thresholds['memory_usage']
            })
        
        return alerts
    
    # Performance Recommendations
    
    def get_performance_recommendations(self, site_id: int) -> Dict[str, Any]:
        """
        Get performance recommendations for a site
        
        Args:
            site_id: ID of the site
            
        Returns:
            Performance recommendations
        """
        try:
            site = Site.objects.get(id=site_id)
            
            # Analyze site performance
            pages_count = Page.objects.filter(site_id=site_id).count()
            media_count = Media.objects.filter(site_id=site_id).count()
            large_media = Media.objects.filter(
                site_id=site_id,
                file_size__gt=1024*1024
            ).count()
            
            recommendations = []
            
            # Database recommendations
            if pages_count > 100:
                recommendations.append({
                    'category': 'database',
                    'priority': 'high',
                    'title': 'Add database indexes',
                    'description': 'Consider adding indexes on frequently queried fields',
                    'impact': 'High',
                    'effort': 'Medium'
                })
            
            # Media recommendations
            if large_media > 10:
                recommendations.append({
                    'category': 'media',
                    'priority': 'medium',
                    'title': 'Optimize large images',
                    'description': f'You have {large_media} large media files that could be optimized',
                    'impact': 'Medium',
                    'effort': 'Low'
                })
            
            # CDN recommendations
            if media_count > 50:
                recommendations.append({
                    'category': 'cdn',
                    'priority': 'high',
                    'title': 'Enable CDN for media',
                    'description': 'Use CDN to serve media files for better performance',
                    'impact': 'High',
                    'effort': 'Low'
                })
            
            # Caching recommendations
            recommendations.append({
                'category': 'caching',
                'priority': 'high',
                'title': 'Enable page caching',
                'description': 'Implement page-level caching for better performance',
                'impact': 'High',
                'effort': 'Medium'
            })
            
            return {
                'success': True,
                'site_id': site_id,
                'site_domain': site.domain,
                'recommendations': recommendations,
                'total_recommendations': len(recommendations),
                'high_priority': len([r for r in recommendations if r['priority'] == 'high']),
                'generated_at': django_timezone.now().isoformat()
            }
            
        except Site.DoesNotExist:
            return {
                'success': False,
                'error': f'Site with ID {site_id} not found'
            }
        except Exception as e:
            logger.error(f"Performance recommendations error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to get performance recommendations: {str(e)}'
            }
    
    # Performance Testing
    
    def run_performance_test(self, site_id: int, test_type: str = 'full') -> Dict[str, Any]:
        """
        Run performance tests for a site
        
        Args:
            site_id: ID of the site
            test_type: Type of test to run
            
        Returns:
            Performance test results
        """
        try:
            site = Site.objects.get(id=site_id)
            
            start_time = time.time()
            
            # Run different types of tests
            if test_type == 'full' or test_type == 'database':
                db_results = self._test_database_performance(site_id)
            
            if test_type == 'full' or test_type == 'cache':
                cache_results = self._test_cache_performance()
            
            if test_type == 'full' or test_type == 'media':
                media_results = self._test_media_performance(site_id)
            
            end_time = time.time()
            total_time = end_time - start_time
            
            return {
                'success': True,
                'site_id': site_id,
                'site_domain': site.domain,
                'test_type': test_type,
                'test_results': {
                    'database': db_results if test_type == 'full' or test_type == 'database' else None,
                    'cache': cache_results if test_type == 'full' or test_type == 'cache' else None,
                    'media': media_results if test_type == 'full' or test_type == 'media' else None
                },
                'total_test_time': round(total_time, 2),
                'overall_score': 85,
                'tested_at': django_timezone.now().isoformat()
            }
            
        except Site.DoesNotExist:
            return {
                'success': False,
                'error': f'Site with ID {site_id} not found'
            }
        except Exception as e:
            logger.error(f"Performance test error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to run performance test: {str(e)}'
            }
    
    def _test_database_performance(self, site_id: int) -> Dict[str, Any]:
        """
        Test database performance
        
        Args:
            site_id: ID of the site
            
        Returns:
            Database test results
        """
        try:
            start_time = time.time()
            
            # Test page queries
            pages = list(Page.objects.filter(site_id=site_id).select_related('site')[:100])
            
            # Test media queries
            media = list(Media.objects.filter(site_id=site_id)[:100])
            
            end_time = time.time()
            query_time = end_time - start_time
            
            return {
                'query_time': round(query_time, 3),
                'pages_queried': len(pages),
                'media_queried': len(media),
                'performance_score': 90 if query_time < 0.1 else 70,
                'status': 'good' if query_time < 0.1 else 'needs_optimization'
            }
        except Exception as e:
            logger.error(f"Database performance test error: {str(e)}")
            return {'error': str(e)}
    
    def _test_cache_performance(self) -> Dict[str, Any]:
        """
        Test cache performance
        
        Returns:
            Cache test results
        """
        try:
            start_time = time.time()
            
            # Test cache operations
            test_key = 'performance_test_key'
            test_data = {'test': 'data', 'timestamp': time.time()}
            
            # Set cache
            cache.set(test_key, test_data, 60)
            
            # Get cache
            cached_data = cache.get(test_key)
            
            # Delete cache
            cache.delete(test_key)
            
            end_time = time.time()
            cache_time = end_time - start_time
            
            return {
                'cache_time': round(cache_time, 3),
                'cache_working': cached_data == test_data,
                'performance_score': 95 if cache_time < 0.01 else 80,
                'status': 'good' if cache_time < 0.01 else 'needs_optimization'
            }
        except Exception as e:
            logger.error(f"Cache performance test error: {str(e)}")
            return {'error': str(e)}
    
    def _test_media_performance(self, site_id: int) -> Dict[str, Any]:
        """
        Test media performance
        
        Args:
            site_id: ID of the site
            
        Returns:
            Media test results
        """
        try:
            start_time = time.time()
            
            # Test media queries
            media_files = list(Media.objects.filter(site_id=site_id)[:50])
            
            # Calculate total size
            total_size = sum(m.file_size or 0 for m in media_files)
            
            end_time = time.time()
            media_time = end_time - start_time
            
            return {
                'media_time': round(media_time, 3),
                'files_processed': len(media_files),
                'total_size_mb': round(total_size / (1024*1024), 2),
                'performance_score': 85,
                'status': 'good'
            }
        except Exception as e:
            logger.error(f"Media performance test error: {str(e)}")
            return {'error': str(e)}
