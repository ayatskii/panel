import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from .services.realtime_analytics_service import realtime_analytics_service

logger = logging.getLogger(__name__)
User = get_user_model()


class AnalyticsConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time analytics updates
    """
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.site_id = self.scope['url_route']['kwargs']['site_id']
        self.user = self.scope['user']
        
        # Check if user is authenticated
        if isinstance(self.user, AnonymousUser):
            await self.close()
            return
        
        # Check if user has access to this site
        if not await self.check_site_access():
            await self.close()
            return
        
        # Join analytics group for this site
        self.group_name = f"analytics_{self.site_id}_{self.user.id}"
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send initial data
        await self.send_initial_data()
        
        logger.info(f"User {self.user.id} connected to analytics for site {self.site_id}")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
        
        logger.info(f"User {self.user.id} disconnected from analytics for site {self.site_id}")
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'get_metrics':
                await self.send_realtime_metrics()
            elif message_type == 'get_live_visitors':
                await self.send_live_visitors()
            elif message_type == 'get_alerts':
                await self.send_alerts()
            elif message_type == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Unknown message type'
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Internal server error'
            }))
    
    async def realtime_update(self, event):
        """Handle real-time update broadcasts"""
        await self.send(text_data=json.dumps({
            'type': 'realtime_update',
            'data': event['data']
        }))
    
    async def analytics_alert(self, event):
        """Handle analytics alert broadcasts"""
        await self.send(text_data=json.dumps({
            'type': 'alert',
            'data': event['data']
        }))
    
    async def send_initial_data(self):
        """Send initial analytics data when client connects"""
        try:
            # Get real-time metrics
            metrics = await database_sync_to_async(
                realtime_analytics_service.get_realtime_metrics
            )(self.site_id)
            
            # Get live visitors
            live_visitors = await database_sync_to_async(
                realtime_analytics_service.get_live_visitors
            )(self.site_id)
            
            # Get alerts
            alerts = await database_sync_to_async(
                realtime_analytics_service.get_realtime_alerts
            )(self.site_id)
            
            await self.send(text_data=json.dumps({
                'type': 'initial_data',
                'data': {
                    'metrics': metrics,
                    'live_visitors': live_visitors,
                    'alerts': alerts,
                    'site_id': self.site_id
                }
            }))
            
        except Exception as e:
            logger.error(f"Error sending initial data: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Failed to load initial data'
            }))
    
    async def send_realtime_metrics(self):
        """Send current real-time metrics"""
        try:
            metrics = await database_sync_to_async(
                realtime_analytics_service.get_realtime_metrics
            )(self.site_id)
            
            await self.send(text_data=json.dumps({
                'type': 'metrics_update',
                'data': metrics
            }))
            
        except Exception as e:
            logger.error(f"Error sending real-time metrics: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Failed to get metrics'
            }))
    
    async def send_live_visitors(self):
        """Send current live visitors"""
        try:
            live_visitors = await database_sync_to_async(
                realtime_analytics_service.get_live_visitors
            )(self.site_id)
            
            await self.send(text_data=json.dumps({
                'type': 'live_visitors_update',
                'data': live_visitors
            }))
            
        except Exception as e:
            logger.error(f"Error sending live visitors: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Failed to get live visitors'
            }))
    
    async def send_alerts(self):
        """Send current alerts"""
        try:
            alerts = await database_sync_to_async(
                realtime_analytics_service.get_realtime_alerts
            )(self.site_id)
            
            await self.send(text_data=json.dumps({
                'type': 'alerts_update',
                'data': alerts
            }))
            
        except Exception as e:
            logger.error(f"Error sending alerts: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Failed to get alerts'
            }))
    
    @database_sync_to_async
    def check_site_access(self):
        """Check if user has access to the site"""
        try:
            from sites.models import Site
            
            # Check if user is admin or site owner
            if self.user.is_staff:
                return True
            
            # Check if user owns the site
            site = Site.objects.get(id=self.site_id)
            return site.owner == self.user
            
        except Exception as e:
            logger.error(f"Error checking site access: {e}")
            return False


class GlobalAnalyticsConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for global analytics (admin only)
    """
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.user = self.scope['user']
        
        # Check if user is admin
        if isinstance(self.user, AnonymousUser) or not self.user.is_staff:
            await self.close()
            return
        
        # Join global analytics group
        self.group_name = "global_analytics"
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send initial global data
        await self.send_initial_global_data()
        
        logger.info(f"Admin user {self.user.id} connected to global analytics")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
        
        logger.info(f"Admin user {self.user.id} disconnected from global analytics")
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'get_global_metrics':
                await self.send_global_metrics()
            elif message_type == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Unknown message type'
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
        except Exception as e:
            logger.error(f"Error handling global analytics WebSocket message: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Internal server error'
            }))
    
    async def global_update(self, event):
        """Handle global update broadcasts"""
        await self.send(text_data=json.dumps({
            'type': 'global_update',
            'data': event['data']
        }))
    
    async def send_initial_global_data(self):
        """Send initial global analytics data"""
        try:
            global_metrics = await database_sync_to_async(
                self.get_global_metrics
            )()
            
            await self.send(text_data=json.dumps({
                'type': 'initial_global_data',
                'data': global_metrics
            }))
            
        except Exception as e:
            logger.error(f"Error sending initial global data: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Failed to load global data'
            }))
    
    async def send_global_metrics(self):
        """Send current global metrics"""
        try:
            global_metrics = await database_sync_to_async(
                self.get_global_metrics
            )()
            
            await self.send(text_data=json.dumps({
                'type': 'global_metrics_update',
                'data': global_metrics
            }))
            
        except Exception as e:
            logger.error(f"Error sending global metrics: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Failed to get global metrics'
            }))
    
    def get_global_metrics(self):
        """Get global analytics metrics"""
        from django.db.models import Count
        from sites.models import Site
        from pages.models import Page
        from analytics.models import PageView
        from users.models import User
        from django.utils import timezone
        
        now = timezone.now()
        last_24_hours = now - timezone.timedelta(hours=24)
        
        return {
            'total_sites': Site.objects.count(),
            'total_pages': Page.objects.count(),
            'total_users': User.objects.count(),
            'total_pageviews_24h': PageView.objects.filter(
                timestamp__gte=last_24_hours
            ).count(),
            'active_sites_24h': Site.objects.filter(
                pages__pageviews__timestamp__gte=last_24_hours
            ).distinct().count(),
            'new_users_24h': User.objects.filter(
                date_joined__gte=last_24_hours
            ).count(),
        }
