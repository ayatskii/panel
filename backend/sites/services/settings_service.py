import logging
from typing import Dict, Any, List, Optional
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import URLValidator
from ..models import Language, AffiliateLink

logger = logging.getLogger(__name__)


class SettingsService:
    """Service for managing application settings"""
    
    def __init__(self):
        self.url_validator = URLValidator()
    
    def get_languages(self) -> List[Dict[str, Any]]:
        """Get all active languages"""
        try:
            languages = Language.objects.filter(is_active=True).order_by('name')
            return [
                {
                    'id': lang.id,
                    'code': lang.code,
                    'name': lang.name,
                    'is_active': lang.is_active
                }
                for lang in languages
            ]
        except Exception as e:
            logger.error(f"Failed to get languages: {e}")
            return []
    
    def add_language(self, code: str, name: str) -> Dict[str, Any]:
        """Add a new language"""
        try:
            # Validate language code format (e.g., en-EN, fr-FR)
            if not self._validate_language_code(code):
                return {'success': False, 'error': 'Invalid language code format. Use format like en-EN, fr-FR'}
            
            # Check if language already exists
            if Language.objects.filter(code=code).exists():
                return {'success': False, 'error': 'Language code already exists'}
            
            language = Language.objects.create(code=code, name=name)
            
            return {
                'success': True,
                'language': {
                    'id': language.id,
                    'code': language.code,
                    'name': language.name,
                    'is_active': language.is_active
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to add language: {e}")
            return {'success': False, 'error': str(e)}
    
    def update_language(self, language_id: int, **kwargs) -> Dict[str, Any]:
        """Update a language"""
        try:
            language = Language.objects.get(id=language_id)
            
            if 'code' in kwargs:
                if not self._validate_language_code(kwargs['code']):
                    return {'success': False, 'error': 'Invalid language code format'}
                
                # Check if new code already exists
                if Language.objects.filter(code=kwargs['code']).exclude(id=language_id).exists():
                    return {'success': False, 'error': 'Language code already exists'}
            
            for field, value in kwargs.items():
                if hasattr(language, field):
                    setattr(language, field, value)
            
            language.save()
            
            return {
                'success': True,
                'language': {
                    'id': language.id,
                    'code': language.code,
                    'name': language.name,
                    'is_active': language.is_active
                }
            }
            
        except Language.DoesNotExist:
            return {'success': False, 'error': 'Language not found'}
        except Exception as e:
            logger.error(f"Failed to update language: {e}")
            return {'success': False, 'error': str(e)}
    
    def delete_language(self, language_id: int) -> Dict[str, Any]:
        """Delete a language"""
        try:
            language = Language.objects.get(id=language_id)
            language.delete()
            
            return {'success': True, 'message': 'Language deleted successfully'}
            
        except Language.DoesNotExist:
            return {'success': False, 'error': 'Language not found'}
        except Exception as e:
            logger.error(f"Failed to delete language: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_affiliate_links(self) -> List[Dict[str, Any]]:
        """Get all affiliate links"""
        try:
            links = AffiliateLink.objects.all().order_by('-created_at')
            return [
                {
                    'id': link.id,
                    'name': link.name,
                    'url': link.url,
                    'description': link.description,
                    'click_tracking': link.click_tracking,
                    'created_at': link.created_at.isoformat(),
                    'updated_at': link.updated_at.isoformat()
                }
                for link in links
            ]
        except Exception as e:
            logger.error(f"Failed to get affiliate links: {e}")
            return []
    
    def add_affiliate_link(self, name: str, url: str, description: str = '', click_tracking: bool = True) -> Dict[str, Any]:
        """Add a new affiliate link"""
        try:
            # Validate URL
            self.url_validator(url)
            
            # Check if link with same name already exists
            if AffiliateLink.objects.filter(name=name).exists():
                return {'success': False, 'error': 'Affiliate link with this name already exists'}
            
            link = AffiliateLink.objects.create(
                name=name,
                url=url,
                description=description,
                click_tracking=click_tracking
            )
            
            return {
                'success': True,
                'link': {
                    'id': link.id,
                    'name': link.name,
                    'url': link.url,
                    'description': link.description,
                    'click_tracking': link.click_tracking,
                    'created_at': link.created_at.isoformat(),
                    'updated_at': link.updated_at.isoformat()
                }
            }
            
        except ValidationError:
            return {'success': False, 'error': 'Invalid URL format'}
        except Exception as e:
            logger.error(f"Failed to add affiliate link: {e}")
            return {'success': False, 'error': str(e)}
    
    def update_affiliate_link(self, link_id: int, **kwargs) -> Dict[str, Any]:
        """Update an affiliate link"""
        try:
            link = AffiliateLink.objects.get(id=link_id)
            
            if 'url' in kwargs:
                self.url_validator(kwargs['url'])
            
            if 'name' in kwargs:
                # Check if new name already exists
                if AffiliateLink.objects.filter(name=kwargs['name']).exclude(id=link_id).exists():
                    return {'success': False, 'error': 'Affiliate link with this name already exists'}
            
            for field, value in kwargs.items():
                if hasattr(link, field):
                    setattr(link, field, value)
            
            link.save()
            
            return {
                'success': True,
                'link': {
                    'id': link.id,
                    'name': link.name,
                    'url': link.url,
                    'description': link.description,
                    'click_tracking': link.click_tracking,
                    'created_at': link.created_at.isoformat(),
                    'updated_at': link.updated_at.isoformat()
                }
            }
            
        except AffiliateLink.DoesNotExist:
            return {'success': False, 'error': 'Affiliate link not found'}
        except ValidationError:
            return {'success': False, 'error': 'Invalid URL format'}
        except Exception as e:
            logger.error(f"Failed to update affiliate link: {e}")
            return {'success': False, 'error': str(e)}
    
    def delete_affiliate_link(self, link_id: int) -> Dict[str, Any]:
        """Delete an affiliate link"""
        try:
            link = AffiliateLink.objects.get(id=link_id)
            link.delete()
            
            return {'success': True, 'message': 'Affiliate link deleted successfully'}
            
        except AffiliateLink.DoesNotExist:
            return {'success': False, 'error': 'Affiliate link not found'}
        except Exception as e:
            logger.error(f"Failed to delete affiliate link: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_ai_settings(self) -> Dict[str, Any]:
        """Get AI-related settings"""
        return {
            'openai_api_key_configured': bool(getattr(settings, 'OPENAI_API_KEY', None)),
            'anthropic_api_key_configured': bool(getattr(settings, 'ANTHROPIC_API_KEY', None)),
            'default_ai_model': getattr(settings, 'DEFAULT_AI_MODEL', 'gpt-3.5-turbo'),
            'available_models': [
                {'id': 'gpt-3.5-turbo', 'name': 'GPT-3.5 Turbo', 'provider': 'OpenAI'},
                {'id': 'gpt-4', 'name': 'GPT-4', 'provider': 'OpenAI'},
                {'id': 'claude-3-sonnet', 'name': 'Claude 3 Sonnet', 'provider': 'Anthropic'},
                {'id': 'claude-3-opus', 'name': 'Claude 3 Opus', 'provider': 'Anthropic'},
            ]
        }
    
    def get_cloudflare_settings(self) -> Dict[str, Any]:
        """Get Cloudflare-related settings"""
        return {
            'cloudflare_api_token_configured': bool(getattr(settings, 'CLOUDFLARE_API_TOKEN', None)),
            'cloudflare_account_id_configured': bool(getattr(settings, 'CLOUDFLARE_ACCOUNT_ID', None)),
            'default_ssl_mode': 'flexible',
            'available_ssl_modes': [
                {'id': 'off', 'name': 'Off'},
                {'id': 'flexible', 'name': 'Flexible'},
                {'id': 'full', 'name': 'Full'},
                {'id': 'strict', 'name': 'Strict'},
            ]
        }
    
    def get_git_settings(self) -> Dict[str, Any]:
        """Get Git-related settings"""
        return {
            'git_username': getattr(settings, 'GIT_USERNAME', 'panel-bot'),
            'git_email': getattr(settings, 'GIT_EMAIL', 'panel@example.com'),
            'git_remote_url_configured': bool(getattr(settings, 'GIT_REMOTE_URL', None)),
        }
    
    def get_application_settings(self) -> Dict[str, Any]:
        """Get general application settings"""
        return {
            'site_name': getattr(settings, 'SITE_NAME', 'Website Management Panel'),
            'debug_mode': getattr(settings, 'DEBUG', False),
            'allowed_hosts': getattr(settings, 'ALLOWED_HOSTS', []),
            'timezone': getattr(settings, 'TIME_ZONE', 'UTC'),
            'language_code': getattr(settings, 'LANGUAGE_CODE', 'en'),
        }
    
    def get_all_settings(self) -> Dict[str, Any]:
        """Get all settings in one call"""
        return {
            'languages': self.get_languages(),
            'affiliate_links': self.get_affiliate_links(),
            'ai_settings': self.get_ai_settings(),
            'cloudflare_settings': self.get_cloudflare_settings(),
            'git_settings': self.get_git_settings(),
            'application_settings': self.get_application_settings(),
        }
    
    def _validate_language_code(self, code: str) -> bool:
        """Validate language code format (e.g., en-EN, fr-FR)"""
        import re
        pattern = r'^[a-z]{2}-[A-Z]{2}$'
        return bool(re.match(pattern, code))
    
    def bulk_update_languages(self, languages_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Bulk update languages from text input"""
        try:
            results = []
            errors = []
            
            for lang_data in languages_data:
                if 'code' in lang_data and 'name' in lang_data:
                    result = self.add_language(lang_data['code'], lang_data['name'])
                    if result['success']:
                        results.append(result['language'])
                    else:
                        errors.append(f"{lang_data['code']}: {result['error']}")
            
            return {
                'success': len(errors) == 0,
                'results': results,
                'errors': errors,
                'total_processed': len(languages_data),
                'successful': len(results),
                'failed': len(errors)
            }
            
        except Exception as e:
            logger.error(f"Failed to bulk update languages: {e}")
            return {'success': False, 'error': str(e)}
    
    def parse_languages_from_text(self, text: str) -> List[Dict[str, str]]:
        """Parse languages from text input (one per line)"""
        # Common language code to name mapping
        LANGUAGE_NAMES = {
            'en': 'English',
            'fr': 'French',
            'de': 'German',
            'es': 'Spanish',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'zh': 'Chinese',
            'ja': 'Japanese',
            'ko': 'Korean',
            'ar': 'Arabic',
            'hi': 'Hindi',
            'nl': 'Dutch',
            'pl': 'Polish',
            'tr': 'Turkish',
        }
        
        languages = []
        lines = text.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if line:
                # Try to parse format: "Language Name (code)" or "code - Language Name"
                if '(' in line and ')' in line:
                    # Format: "English (en-EN)"
                    name_part = line.split('(')[0].strip()
                    code_part = line.split('(')[1].split(')')[0].strip()
                    languages.append({'name': name_part, 'code': code_part})
                elif ' - ' in line:
                    # Format: "en-EN - English"
                    parts = line.split(' - ', 1)
                    if len(parts) == 2:
                        languages.append({'name': parts[1].strip(), 'code': parts[0].strip()})
                else:
                    # Assume it's just a language code - generate a readable name
                    code = line
                    # If it matches the language code pattern (e.g., en-EN), format it nicely
                    if self._validate_language_code(code):
                        # Extract language part and get name from mapping
                        lang_part = code.split('-')[0].lower()
                        name = LANGUAGE_NAMES.get(lang_part, f"Language ({lang_part.upper()})")
                    else:
                        # Use the code as-is for name if it doesn't match pattern
                        name = code
                    languages.append({'name': name, 'code': code})
        
        return languages


# Singleton instance
settings_service = SettingsService()
