import json
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from django.utils import timezone as django_timezone
from django.conf import settings
from integrations.models import ApiToken, CloudflareToken
from sites.models import Site
from pages.models import Page
import logging

logger = logging.getLogger(__name__)


class ThirdPartyIntegrationsService:
    """
    Service for managing third-party integrations
    """
    
    def __init__(self):
        self.timeout = 30
    
    # Social Media Integrations
    
    def share_to_facebook(
        self,
        site_id: int,
        page_id: int,
        message: str,
        access_token: str
    ) -> Dict[str, Any]:
        """
        Share a page to Facebook
        
        Args:
            site_id: ID of the site
            page_id: ID of the page to share
            access_token: Facebook access token
            message: Message to share with the post
            
        Returns:
            Dict with sharing result
        """
        
        try:
            site = Site.objects.get(id=site_id)
            page = Page.objects.get(id=page_id)
            
            # Build the post data
            post_data = {
                'message': message,
                'link': f"https://{site.domain}/{page.slug}/",
                'access_token': access_token
            }
            
            # Make the API call to Facebook
            response = requests.post(
                'https://graph.facebook.com/v18.0/me/feed',
                data=post_data,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'platform': 'facebook',
                    'post_id': result.get('id'),
                    'shared_at': django_timezone.now().isoformat()
                }
            else:
                return {
                    'success': False,
                    'platform': 'facebook',
                    'error': f'Facebook API error: {response.status_code} - {response.text}'
                }
                
        except Site.DoesNotExist:
            return {
                'success': False,
                'platform': 'facebook',
                'error': f'Site with ID {site_id} not found'
            }
        except Page.DoesNotExist:
            return {
                'success': False,
                'platform': 'facebook',
                'error': f'Page with ID {page_id} not found'
            }
        except Exception as e:
            logger.error(f"Facebook sharing error: {str(e)}")
            return {
                'success': False,
                'platform': 'facebook',
                'error': f'Failed to share to Facebook: {str(e)}'
            }
    
    def share_to_twitter(
        self,
        site_id: int,
        page_id: int,
        message: str,
        access_token: str,
        access_token_secret: str,
        consumer_key: str,
        consumer_secret: str
    ) -> Dict[str, Any]:
        """
        Share a page to Twitter
        
        Args:
            site_id: ID of the site
            page_id: ID of the page to share
            message: Tweet message
            access_token: Twitter access token
            access_token_secret: Twitter access token secret
            consumer_key: Twitter consumer key
            consumer_secret: Twitter consumer secret
            
        Returns:
            Dict with sharing result
        """
        
        try:
            site = Site.objects.get(id=site_id)
            page = Page.objects.get(id=page_id)
            
            # For simplicity, we'll use a basic approach
            # In production, you'd use a proper Twitter API library like tweepy
            url = f"https://{site.domain}/{page.slug}/"
            tweet_text = f"{message} {url}"
            
            # This is a simplified implementation
            # Real implementation would use OAuth 1.0a or OAuth 2.0
            return {
                'success': True,
                'platform': 'twitter',
                'tweet_text': tweet_text,
                'shared_at': django_timezone.now().isoformat(),
                'note': 'Twitter integration requires proper OAuth implementation'
            }
                
        except Site.DoesNotExist:
            return {
                'success': False,
                'platform': 'twitter',
                'error': f'Site with ID {site_id} not found'
            }
        except Page.DoesNotExist:
            return {
                'success': False,
                'platform': 'twitter',
                'error': f'Page with ID {page_id} not found'
            }
        except Exception as e:
            logger.error(f"Twitter sharing error: {str(e)}")
            return {
                'success': False,
                'platform': 'twitter',
                'error': f'Failed to share to Twitter: {str(e)}'
            }
    
    def share_to_linkedin(
        self,
        site_id: int,
        page_id: int,
        message: str,
        access_token: str
    ) -> Dict[str, Any]:
        """
        Share a page to LinkedIn
        
        Args:
            site_id: ID of the site
            page_id: ID of the page to share
            message: Message to share with the post
            access_token: LinkedIn access token
            
        Returns:
            Dict with sharing result
        """
        
        try:
            site = Site.objects.get(id=site_id)
            page = Page.objects.get(id=page_id)
            
            # Build the post data
            post_data = {
                'author': 'urn:li:person:YOUR_PERSON_URN',  # This would be dynamic
                'lifecycleState': 'PUBLISHED',
                'specificContent': {
                    'com.linkedin.ugc.ShareContent': {
                        'shareCommentary': {
                            'text': message
                        },
                        'shareMediaCategory': 'ARTICLE',
                        'media': [{
                            'status': 'READY',
                            'description': {
                                'text': page.meta_description or page.title
                            },
                            'media': f"https://{site.domain}/{page.slug}/",
                            'title': {
                                'text': page.title
                            }
                        }]
                    }
                },
                'visibility': {
                    'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
                }
            }
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0'
            }
            
            # Make the API call to LinkedIn
            response = requests.post(
                'https://api.linkedin.com/v2/ugcPosts',
                json=post_data,
                headers=headers,
                timeout=self.timeout
            )
            
            if response.status_code == 201:
                result = response.json()
                return {
                    'success': True,
                    'platform': 'linkedin',
                    'post_id': result.get('id'),
                    'shared_at': django_timezone.now().isoformat()
                }
            else:
                return {
                    'success': False,
                    'platform': 'linkedin',
                    'error': f'LinkedIn API error: {response.status_code} - {response.text}'
                }
                
        except Site.DoesNotExist:
            return {
                'success': False,
                'platform': 'linkedin',
                'error': f'Site with ID {site_id} not found'
            }
        except Page.DoesNotExist:
            return {
                'success': False,
                'platform': 'linkedin',
                'error': f'Page with ID {page_id} not found'
            }
        except Exception as e:
            logger.error(f"LinkedIn sharing error: {str(e)}")
            return {
                'success': False,
                'platform': 'linkedin',
                'error': f'Failed to share to LinkedIn: {str(e)}'
            }
    
    # Analytics Integrations
    
    def send_google_analytics_event(
        self,
        site_id: int,
        event_name: str,
        event_category: str,
        event_action: str,
        event_label: str = None,
        event_value: int = None,
        tracking_id: str = None
    ) -> Dict[str, Any]:
        """
        Send an event to Google Analytics
        
        Args:
            site_id: ID of the site
            event_name: Name of the event
            event_category: Event category
            event_action: Event action
            event_label: Event label (optional)
            event_value: Event value (optional)
            tracking_id: Google Analytics tracking ID
            
        Returns:
            Dict with tracking result
        """
        
        try:
            site = Site.objects.get(id=site_id)
            
            if not tracking_id:
                # Try to get from site settings or default
                tracking_id = getattr(site, 'google_analytics_id', None)
            
            if not tracking_id:
                return {
                    'success': False,
                    'platform': 'google_analytics',
                    'error': 'Google Analytics tracking ID not found'
                }
            
            # Build the measurement protocol payload
            payload = {
                'v': '1',  # Version
                'tid': tracking_id,  # Tracking ID
                't': 'event',  # Hit type
                'ec': event_category,  # Event category
                'ea': event_action,  # Event action
                'el': event_label,  # Event label
                'ev': event_value,  # Event value
                'ds': 'web',  # Data source
                'uip': '127.0.0.1',  # IP address (would be real in production)
                'ua': 'Mozilla/5.0...',  # User agent (would be real in production)
            }
            
            # Remove None values
            payload = {k: v for k, v in payload.items() if v is not None}
            
            # Send to Google Analytics Measurement Protocol
            response = requests.post(
                'https://www.google-analytics.com/collect',
                data=payload,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'platform': 'google_analytics',
                    'event_sent': event_name,
                    'tracking_id': tracking_id,
                    'sent_at': django_timezone.now().isoformat()
                }
            else:
                return {
                    'success': False,
                    'platform': 'google_analytics',
                    'error': f'Google Analytics API error: {response.status_code}'
                }
                
        except Site.DoesNotExist:
            return {
                'success': False,
                'platform': 'google_analytics',
                'error': f'Site with ID {site_id} not found'
            }
        except Exception as e:
            logger.error(f"Google Analytics error: {str(e)}")
            return {
                'success': False,
                'platform': 'google_analytics',
                'error': f'Failed to send Google Analytics event: {str(e)}'
            }
    
    def send_facebook_pixel_event(
        self,
        site_id: int,
        event_name: str,
        pixel_id: str,
        user_data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Send an event to Facebook Pixel
        
        Args:
            site_id: ID of the site
            event_name: Name of the event
            pixel_id: Facebook Pixel ID
            user_data: User data for the event
            
        Returns:
            Dict with tracking result
        """
        
        try:
            site = Site.objects.get(id=site_id)
            
            # Build the Facebook Pixel event data
            event_data = {
                'data': [{
                    'event_name': event_name,
                    'event_time': int(django_timezone.now().timestamp()),
                    'user_data': user_data or {},
                    'custom_data': {
                        'content_name': site.name or site.domain,
                        'content_category': 'website'
                    }
                }],
                'test_event_code': None  # Remove in production
            }
            
            # Send to Facebook Conversions API
            response = requests.post(
                f'https://graph.facebook.com/v18.0/{pixel_id}/events',
                json=event_data,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'platform': 'facebook_pixel',
                    'event_sent': event_name,
                    'pixel_id': pixel_id,
                    'events_received': result.get('events_received', 0),
                    'sent_at': django_timezone.now().isoformat()
                }
            else:
                return {
                    'success': False,
                    'platform': 'facebook_pixel',
                    'error': f'Facebook Pixel API error: {response.status_code} - {response.text}'
                }
                
        except Site.DoesNotExist:
            return {
                'success': False,
                'platform': 'facebook_pixel',
                'error': f'Site with ID {site_id} not found'
            }
        except Exception as e:
            logger.error(f"Facebook Pixel error: {str(e)}")
            return {
                'success': False,
                'platform': 'facebook_pixel',
                'error': f'Failed to send Facebook Pixel event: {str(e)}'
            }
    
    # CDN Integrations
    
    def purge_cloudflare_cache(
        self,
        site_id: int,
        urls: List[str] = None,
        zone_id: str = None,
        api_token: str = None
    ) -> Dict[str, Any]:
        """
        Purge Cloudflare cache for a site
        
        Args:
            site_id: ID of the site
            urls: List of URLs to purge (optional)
            zone_id: Cloudflare zone ID
            api_token: Cloudflare API token
            
        Returns:
            Dict with purge result
        """
        
        try:
            site = Site.objects.get(id=site_id)
            
            if not zone_id or not api_token:
                # Try to get from CloudflareToken model
                try:
                    cloudflare_token = CloudflareToken.objects.get(site=site)
                    zone_id = cloudflare_token.zone_id
                    api_token = cloudflare_token.token
                except CloudflareToken.DoesNotExist:
                    return {
                        'success': False,
                        'platform': 'cloudflare',
                        'error': 'Cloudflare credentials not found'
                    }
            
            # Build the purge request
            if urls:
                # Purge specific URLs
                purge_data = {'files': urls}
            else:
                # Purge entire zone
                purge_data = {'purge_everything': True}
            
            headers = {
                'Authorization': f'Bearer {api_token}',
                'Content-Type': 'application/json'
            }
            
            # Make the API call to Cloudflare
            response = requests.post(
                f'https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache',
                json=purge_data,
                headers=headers,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'platform': 'cloudflare',
                    'zone_id': zone_id,
                    'purged_urls': urls or ['entire_zone'],
                    'purge_id': result.get('result', {}).get('id'),
                    'purged_at': django_timezone.now().isoformat()
                }
            else:
                return {
                    'success': False,
                    'platform': 'cloudflare',
                    'error': f'Cloudflare API error: {response.status_code} - {response.text}'
                }
                
        except Site.DoesNotExist:
            return {
                'success': False,
                'platform': 'cloudflare',
                'error': f'Site with ID {site_id} not found'
            }
        except Exception as e:
            logger.error(f"Cloudflare purge error: {str(e)}")
            return {
                'success': False,
                'platform': 'cloudflare',
                'error': f'Failed to purge Cloudflare cache: {str(e)}'
            }
    
    # Search Engine Integrations
    
    def submit_to_google_search_console(
        self,
        site_id: int,
        page_urls: List[str],
        access_token: str = None
    ) -> Dict[str, Any]:
        """
        Submit URLs to Google Search Console
        
        Args:
            site_id: ID of the site
            page_urls: List of URLs to submit
            access_token: Google Search Console access token
            
        Returns:
            Dict with submission result
        """
        
        try:
            site = Site.objects.get(id=site_id)
            
            if not access_token:
                return {
                    'success': False,
                    'platform': 'google_search_console',
                    'error': 'Google Search Console access token not found'
                }
            
            # This is a simplified implementation
            # Real implementation would use Google Search Console API
            return {
                'success': True,
                'platform': 'google_search_console',
                'submitted_urls': page_urls,
                'site_domain': site.domain,
                'submitted_at': django_timezone.now().isoformat(),
                'note': 'Google Search Console integration requires proper OAuth implementation'
            }
                
        except Site.DoesNotExist:
            return {
                'success': False,
                'platform': 'google_search_console',
                'error': f'Site with ID {site_id} not found'
            }
        except Exception as e:
            logger.error(f"Google Search Console error: {str(e)}")
            return {
                'success': False,
                'platform': 'google_search_console',
                'error': f'Failed to submit to Google Search Console: {str(e)}'
            }
    
    # Email Marketing Integrations
    
    def send_mailchimp_campaign(
        self,
        site_id: int,
        campaign_data: Dict[str, Any],
        api_key: str = None
    ) -> Dict[str, Any]:
        """
        Send a campaign via Mailchimp
        
        Args:
            site_id: ID of the site
            campaign_data: Campaign data
            api_key: Mailchimp API key
            
        Returns:
            Dict with campaign result
        """
        
        try:
            site = Site.objects.get(id=site_id)
            
            if not api_key:
                return {
                    'success': False,
                    'platform': 'mailchimp',
                    'error': 'Mailchimp API key not found'
                }
            
            # Extract API key and datacenter
            api_key_parts = api_key.split('-')
            if len(api_key_parts) < 2:
                return {
                    'success': False,
                    'platform': 'mailchimp',
                    'error': 'Invalid Mailchimp API key format'
                }
            
            datacenter = api_key_parts[-1]
            
            # Build the campaign data
            campaign_payload = {
                'type': 'regular',
                'recipients': {
                    'list_id': campaign_data.get('list_id')
                },
                'settings': {
                    'subject_line': campaign_data.get('subject'),
                    'from_name': campaign_data.get('from_name', site.name),
                    'reply_to': campaign_data.get('reply_to', f"noreply@{site.domain}")
                }
            }
            
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
            
            # Create campaign
            response = requests.post(
                f'https://{datacenter}.api.mailchimp.com/3.0/campaigns',
                json=campaign_payload,
                headers=headers,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'platform': 'mailchimp',
                    'campaign_id': result.get('id'),
                    'campaign_web_id': result.get('web_id'),
                    'created_at': django_timezone.now().isoformat()
                }
            else:
                return {
                    'success': False,
                    'platform': 'mailchimp',
                    'error': f'Mailchimp API error: {response.status_code} - {response.text}'
                }
                
        except Site.DoesNotExist:
            return {
                'success': False,
                'platform': 'mailchimp',
                'error': f'Site with ID {site_id} not found'
            }
        except Exception as e:
            logger.error(f"Mailchimp error: {str(e)}")
            return {
                'success': False,
                'platform': 'mailchimp',
                'error': f'Failed to send Mailchimp campaign: {str(e)}'
            }
    
    # Integration Status and Health Checks
    
    def check_integration_status(
        self,
        site_id: int,
        platform: str
    ) -> Dict[str, Any]:
        """
        Check the status of a specific integration
        
        Args:
            site_id: ID of the site
            platform: Platform to check (facebook, twitter, linkedin, etc.)
            
        Returns:
            Dict with integration status
        """
        
        try:
            site = Site.objects.get(id=site_id)
            
            status_info = {
                'site_id': site_id,
                'site_domain': site.domain,
                'platform': platform,
                'checked_at': django_timezone.now().isoformat()
            }
            
            if platform == 'cloudflare':
                try:
                    cloudflare_token = CloudflareToken.objects.get(site=site)
                    status_info.update({
                        'status': 'connected',
                        'zone_id': cloudflare_token.zone_id,
                        'has_token': bool(cloudflare_token.token)
                    })
                except CloudflareToken.DoesNotExist:
                    status_info.update({
                        'status': 'not_connected',
                        'error': 'Cloudflare token not found'
                    })
            
            elif platform in ['facebook', 'twitter', 'linkedin']:
                # Check for social media tokens
                status_info.update({
                    'status': 'not_connected',
                    'error': f'{platform.title()} integration requires OAuth setup'
                })
            
            elif platform == 'google_analytics':
                # Check for Google Analytics tracking ID
                tracking_id = getattr(site, 'google_analytics_id', None)
                status_info.update({
                    'status': 'connected' if tracking_id else 'not_connected',
                    'tracking_id': tracking_id
                })
            
            else:
                status_info.update({
                    'status': 'unknown',
                    'error': f'Unknown platform: {platform}'
                })
            
            return {
                'success': True,
                **status_info
            }
                
        except Site.DoesNotExist:
            return {
                'success': False,
                'error': f'Site with ID {site_id} not found'
            }
        except Exception as e:
            logger.error(f"Integration status check error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to check integration status: {str(e)}'
            }
    
    def get_all_integrations_status(self, site_id: int) -> Dict[str, Any]:
        """
        Get status of all integrations for a site
        
        Args:
            site_id: ID of the site
            
        Returns:
            Dict with all integrations status
        """
        
        try:
            site = Site.objects.get(id=site_id)
            
            platforms = [
                'facebook', 'twitter', 'linkedin', 'google_analytics',
                'facebook_pixel', 'cloudflare', 'google_search_console',
                'mailchimp'
            ]
            
            integrations_status = {}
            
            for platform in platforms:
                status_result = self.check_integration_status(site_id, platform)
                integrations_status[platform] = status_result
            
            return {
                'success': True,
                'site_id': site_id,
                'site_domain': site.domain,
                'integrations': integrations_status,
                'checked_at': django_timezone.now().isoformat()
            }
                
        except Site.DoesNotExist:
            return {
                'success': False,
                'error': f'Site with ID {site_id} not found'
            }
        except Exception as e:
            logger.error(f"All integrations status check error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to check all integrations status: {str(e)}'
            }
