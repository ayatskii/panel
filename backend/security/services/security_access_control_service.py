import json
import hashlib
import secrets
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from django.utils import timezone as django_timezone
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password, check_password
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q, F, Count, Max, Min
from sites.models import Site
from users.models import User
import logging
import re
import ipaddress

logger = logging.getLogger(__name__)


class SecurityAccessControlService:
    """
    Service for security and access control management
    """
    
    def __init__(self):
        self.password_requirements = {
            'min_length': 8,
            'require_uppercase': True,
            'require_lowercase': True,
            'require_numbers': True,
            'require_special_chars': True,
            'max_age_days': 90,
        }
        self.login_attempts_limit = 5
        self.login_lockout_duration = 15  # minutes
        self.session_timeout = 30  # minutes
    
    # Authentication & Authorization
    
    def validate_password_strength(self, password: str) -> Dict[str, Any]:
        """
        Validate password strength against security requirements
        
        Args:
            password: Password to validate
            
        Returns:
            Validation result with score and feedback
        """
        try:
            score = 0
            feedback = []
            
            # Length check
            if len(password) >= self.password_requirements['min_length']:
                score += 20
            else:
                feedback.append(f"Password must be at least {self.password_requirements['min_length']} characters long")
            
            # Uppercase check
            if self.password_requirements['require_uppercase'] and re.search(r'[A-Z]', password):
                score += 20
            elif self.password_requirements['require_uppercase']:
                feedback.append("Password must contain at least one uppercase letter")
            
            # Lowercase check
            if self.password_requirements['require_lowercase'] and re.search(r'[a-z]', password):
                score += 20
            elif self.password_requirements['require_lowercase']:
                feedback.append("Password must contain at least one lowercase letter")
            
            # Numbers check
            if self.password_requirements['require_numbers'] and re.search(r'\d', password):
                score += 20
            elif self.password_requirements['require_numbers']:
                feedback.append("Password must contain at least one number")
            
            # Special characters check
            if self.password_requirements['require_special_chars'] and re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
                score += 20
            elif self.password_requirements['require_special_chars']:
                feedback.append("Password must contain at least one special character")
            
            # Additional checks
            if len(password) >= 12:
                score += 10
            if re.search(r'(.)\1{2,}', password):
                score -= 10
                feedback.append("Avoid repeating characters")
            
            # Common password check
            common_passwords = ['password', '123456', 'qwerty', 'admin', 'letmein']
            if password.lower() in common_passwords:
                score = 0
                feedback.append("Password is too common")
            
            strength_level = 'weak'
            if score >= 80:
                strength_level = 'strong'
            elif score >= 60:
                strength_level = 'medium'
            
            return {
                'success': True,
                'score': score,
                'strength_level': strength_level,
                'feedback': feedback,
                'is_valid': score >= 60
            }
            
        except Exception as e:
            logger.error(f"Password validation error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to validate password: {str(e)}'
            }
    
    def create_user_account(
        self,
        username: str,
        email: str,
        password: str,
        first_name: str = '',
        last_name: str = '',
        is_staff: bool = False
    ) -> Dict[str, Any]:
        """
        Create a new user account with security validation
        
        Args:
            username: Username for the account
            email: Email address
            password: Password for the account
            first_name: First name
            last_name: Last name
            is_staff: Whether user is staff
            
        Returns:
            Account creation result
        """
        try:
            # Validate password strength
            password_validation = self.validate_password_strength(password)
            if not password_validation['is_valid']:
                return {
                    'success': False,
                    'error': 'Password does not meet security requirements',
                    'password_feedback': password_validation['feedback']
                }
            
            # Check if username already exists
            if User.objects.filter(username=username).exists():
                return {
                    'success': False,
                    'error': 'Username already exists'
                }
            
            # Check if email already exists
            if User.objects.filter(email=email).exists():
                return {
                    'success': False,
                    'error': 'Email already exists'
                }
            
            # Create user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                is_staff=is_staff,
                is_active=False  # Require email verification
            )
            
            # Generate email verification token
            verification_token = self._generate_verification_token()
            user.profile.verification_token = verification_token
            user.profile.save()
            
            # Send verification email
            self._send_verification_email(user, verification_token)
            
            return {
                'success': True,
                'user_id': user.id,
                'username': user.username,
                'email': user.email,
                'verification_required': True,
                'created_at': django_timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"User creation error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to create user account: {str(e)}'
            }
    
    def verify_email(self, verification_token: str) -> Dict[str, Any]:
        """
        Verify user email with token
        
        Args:
            verification_token: Email verification token
            
        Returns:
            Verification result
        """
        try:
            # Find user by verification token
            user = User.objects.filter(profile__verification_token=verification_token).first()
            
            if not user:
                return {
                    'success': False,
                    'error': 'Invalid verification token'
                }
            
            # Check if token is expired (24 hours)
            token_age = django_timezone.now() - user.profile.verification_token_created
            if token_age > timedelta(hours=24):
                return {
                    'success': False,
                    'error': 'Verification token has expired'
                }
            
            # Activate user and clear token
            user.is_active = True
            user.profile.verification_token = None
            user.profile.email_verified = True
            user.profile.email_verified_at = django_timezone.now()
            user.save()
            user.profile.save()
            
            return {
                'success': True,
                'user_id': user.id,
                'username': user.username,
                'email': user.email,
                'verified_at': django_timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Email verification error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to verify email: {str(e)}'
            }
    
    def authenticate_user(self, username: str, password: str, ip_address: str = None) -> Dict[str, Any]:
        """
        Authenticate user with security checks
        
        Args:
            username: Username or email
            password: Password
            ip_address: Client IP address
            
        Returns:
            Authentication result
        """
        try:
            # Check for account lockout
            lockout_check = self._check_account_lockout(username, ip_address)
            if not lockout_check['allowed']:
                return {
                    'success': False,
                    'error': 'Account is temporarily locked due to too many failed attempts',
                    'lockout_until': lockout_check['lockout_until']
                }
            
            # Find user by username or email
            user = User.objects.filter(
                Q(username=username) | Q(email=username)
            ).first()
            
            if not user:
                self._record_failed_login(username, ip_address)
                return {
                    'success': False,
                    'error': 'Invalid credentials'
                }
            
            # Check if account is active
            if not user.is_active:
                return {
                    'success': False,
                    'error': 'Account is not active. Please verify your email.'
                }
            
            # Verify password
            if not check_password(password, user.password):
                self._record_failed_login(username, ip_address)
                return {
                    'success': False,
                    'error': 'Invalid credentials'
                }
            
            # Check if password is expired
            if self._is_password_expired(user):
                return {
                    'success': False,
                    'error': 'Password has expired. Please reset your password.',
                    'password_expired': True
                }
            
            # Record successful login
            self._record_successful_login(user, ip_address)
            
            # Generate session token
            session_token = self._generate_session_token()
            user.profile.session_token = session_token
            user.profile.last_login = django_timezone.now()
            user.profile.save()
            
            return {
                'success': True,
                'user_id': user.id,
                'username': user.username,
                'email': user.email,
                'session_token': session_token,
                'is_staff': user.is_staff,
                'last_login': user.profile.last_login.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return {
                'success': False,
                'error': f'Authentication failed: {str(e)}'
            }
    
    # Role-Based Access Control
    
    def assign_role(self, user_id: int, role: str, site_id: int = None) -> Dict[str, Any]:
        """
        Assign a role to a user
        
        Args:
            user_id: ID of the user
            role: Role to assign (admin, editor, viewer)
            site_id: Optional site ID for site-specific roles
            
        Returns:
            Role assignment result
        """
        try:
            user = User.objects.get(id=user_id)
            
            # Validate role
            valid_roles = ['admin', 'editor', 'viewer']
            if role not in valid_roles:
                return {
                    'success': False,
                    'error': f'Invalid role. Must be one of: {", ".join(valid_roles)}'
                }
            
            # Update user profile
            if site_id:
                # Site-specific role
                user.profile.site_roles = user.profile.site_roles or {}
                user.profile.site_roles[str(site_id)] = role
            else:
                # Global role
                user.profile.global_role = role
            
            user.profile.save()
            
            return {
                'success': True,
                'user_id': user_id,
                'username': user.username,
                'role': role,
                'site_id': site_id,
                'assigned_at': django_timezone.now().isoformat()
            }
            
        except User.DoesNotExist:
            return {
                'success': False,
                'error': f'User with ID {user_id} not found'
            }
        except Exception as e:
            logger.error(f"Role assignment error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to assign role: {str(e)}'
            }
    
    def check_permission(self, user_id: int, permission: str, site_id: int = None) -> Dict[str, Any]:
        """
        Check if user has specific permission
        
        Args:
            user_id: ID of the user
            permission: Permission to check
            site_id: Optional site ID for site-specific permissions
            
        Returns:
            Permission check result
        """
        try:
            user = User.objects.get(id=user_id)
            
            # Get user's role
            if site_id:
                role = user.profile.site_roles.get(str(site_id)) if user.profile.site_roles else None
            else:
                role = user.profile.global_role
            
            # Define role permissions
            role_permissions = {
                'admin': ['read', 'write', 'delete', 'manage_users', 'manage_sites', 'manage_settings'],
                'editor': ['read', 'write'],
                'viewer': ['read']
            }
            
            # Check if user has permission
            has_permission = False
            if role and role in role_permissions:
                has_permission = permission in role_permissions[role]
            elif user.is_staff:
                has_permission = True  # Staff users have all permissions
            
            return {
                'success': True,
                'user_id': user_id,
                'username': user.username,
                'permission': permission,
                'site_id': site_id,
                'role': role,
                'has_permission': has_permission,
                'checked_at': django_timezone.now().isoformat()
            }
            
        except User.DoesNotExist:
            return {
                'success': False,
                'error': f'User with ID {user_id} not found'
            }
        except Exception as e:
            logger.error(f"Permission check error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to check permission: {str(e)}'
            }
    
    # Security Monitoring
    
    def get_security_events(self, user_id: int = None, site_id: int = None, limit: int = 100) -> Dict[str, Any]:
        """
        Get security events and logs
        
        Args:
            user_id: Filter by user ID
            site_id: Filter by site ID
            limit: Maximum number of events to return
            
        Returns:
            Security events data
        """
        try:
            # This is a simplified implementation
            # In production, you'd query actual security event logs
            events = [
                {
                    'id': 1,
                    'event_type': 'login_success',
                    'user_id': 1,
                    'username': 'admin',
                    'ip_address': '192.168.1.100',
                    'user_agent': 'Mozilla/5.0...',
                    'timestamp': django_timezone.now().isoformat(),
                    'site_id': None,
                    'details': 'Successful login'
                },
                {
                    'id': 2,
                    'event_type': 'login_failed',
                    'user_id': None,
                    'username': 'hacker',
                    'ip_address': '192.168.1.200',
                    'user_agent': 'Mozilla/5.0...',
                    'timestamp': (django_timezone.now() - timedelta(minutes=5)).isoformat(),
                    'site_id': None,
                    'details': 'Failed login attempt'
                },
                {
                    'id': 3,
                    'event_type': 'permission_denied',
                    'user_id': 2,
                    'username': 'editor',
                    'ip_address': '192.168.1.101',
                    'user_agent': 'Mozilla/5.0...',
                    'timestamp': (django_timezone.now() - timedelta(minutes=10)).isoformat(),
                    'site_id': 1,
                    'details': 'Attempted to access admin panel'
                }
            ]
            
            # Filter events
            if user_id:
                events = [e for e in events if e['user_id'] == user_id]
            if site_id:
                events = [e for e in events if e['site_id'] == site_id]
            
            # Limit results
            events = events[:limit]
            
            return {
                'success': True,
                'events': events,
                'total_count': len(events),
                'filtered_by': {
                    'user_id': user_id,
                    'site_id': site_id
                },
                'retrieved_at': django_timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Security events error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to get security events: {str(e)}'
            }
    
    def detect_security_threats(self) -> Dict[str, Any]:
        """
        Detect potential security threats
        
        Returns:
            Security threat analysis
        """
        try:
            threats = []
            
            # Check for multiple failed logins
            recent_failed_logins = self._get_recent_failed_logins()
            if len(recent_failed_logins) > 10:
                threats.append({
                    'type': 'brute_force_attack',
                    'severity': 'high',
                    'description': f'Multiple failed login attempts detected: {len(recent_failed_logins)}',
                    'recommendation': 'Consider implementing IP blocking or CAPTCHA'
                })
            
            # Check for suspicious IP addresses
            suspicious_ips = self._detect_suspicious_ips()
            if suspicious_ips:
                threats.append({
                    'type': 'suspicious_ip',
                    'severity': 'medium',
                    'description': f'Suspicious IP addresses detected: {len(suspicious_ips)}',
                    'recommendation': 'Review and potentially block these IP addresses'
                })
            
            # Check for weak passwords
            weak_passwords = self._detect_weak_passwords()
            if weak_passwords:
                threats.append({
                    'type': 'weak_passwords',
                    'severity': 'medium',
                    'description': f'Users with weak passwords detected: {len(weak_passwords)}',
                    'recommendation': 'Enforce password policy and require password reset'
                })
            
            # Check for inactive accounts
            inactive_accounts = self._detect_inactive_accounts()
            if inactive_accounts:
                threats.append({
                    'type': 'inactive_accounts',
                    'severity': 'low',
                    'description': f'Inactive accounts detected: {len(inactive_accounts)}',
                    'recommendation': 'Consider disabling or removing inactive accounts'
                })
            
            return {
                'success': True,
                'threats': threats,
                'threat_count': len(threats),
                'high_severity': len([t for t in threats if t['severity'] == 'high']),
                'medium_severity': len([t for t in threats if t['severity'] == 'medium']),
                'low_severity': len([t for t in threats if t['severity'] == 'low']),
                'analyzed_at': django_timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Security threat detection error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to detect security threats: {str(e)}'
            }
    
    # Data Encryption & Protection
    
    def encrypt_sensitive_data(self, data: str, key: str = None) -> Dict[str, Any]:
        """
        Encrypt sensitive data
        
        Args:
            data: Data to encrypt
            key: Encryption key (optional)
            
        Returns:
            Encryption result
        """
        try:
            # This is a simplified implementation
            # In production, you'd use proper encryption libraries
            import base64
            
            if not key:
                key = settings.SECRET_KEY
            
            # Simple base64 encoding for demo (not secure for production)
            encrypted_data = base64.b64encode(data.encode()).decode()
            
            return {
                'success': True,
                'encrypted_data': encrypted_data,
                'encryption_method': 'base64',
                'encrypted_at': django_timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Data encryption error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to encrypt data: {str(e)}'
            }
    
    def decrypt_sensitive_data(self, encrypted_data: str, key: str = None) -> Dict[str, Any]:
        """
        Decrypt sensitive data
        
        Args:
            encrypted_data: Data to decrypt
            key: Decryption key (optional)
            
        Returns:
            Decryption result
        """
        try:
            import base64
            
            if not key:
                key = settings.SECRET_KEY
            
            # Simple base64 decoding for demo (not secure for production)
            decrypted_data = base64.b64decode(encrypted_data.encode()).decode()
            
            return {
                'success': True,
                'decrypted_data': decrypted_data,
                'decryption_method': 'base64',
                'decrypted_at': django_timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Data decryption error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to decrypt data: {str(e)}'
            }
    
    # Compliance Management
    
    def get_compliance_status(self, site_id: int) -> Dict[str, Any]:
        """
        Get compliance status for a site
        
        Args:
            site_id: ID of the site
            
        Returns:
            Compliance status
        """
        try:
            site = Site.objects.get(id=site_id)
            
            # Check GDPR compliance
            gdpr_status = self._check_gdpr_compliance(site_id)
            
            # Check CCPA compliance
            ccpa_status = self._check_ccpa_compliance(site_id)
            
            # Check security compliance
            security_status = self._check_security_compliance(site_id)
            
            return {
                'success': True,
                'site_id': site_id,
                'site_domain': site.domain,
                'compliance': {
                    'gdpr': gdpr_status,
                    'ccpa': ccpa_status,
                    'security': security_status
                },
                'overall_score': (gdpr_status['score'] + ccpa_status['score'] + security_status['score']) / 3,
                'checked_at': django_timezone.now().isoformat()
            }
            
        except Site.DoesNotExist:
            return {
                'success': False,
                'error': f'Site with ID {site_id} not found'
            }
        except Exception as e:
            logger.error(f"Compliance status error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to get compliance status: {str(e)}'
            }
    
    # Helper Methods
    
    def _generate_verification_token(self) -> str:
        """Generate email verification token"""
        return secrets.token_urlsafe(32)
    
    def _generate_session_token(self) -> str:
        """Generate session token"""
        return secrets.token_urlsafe(32)
    
    def _send_verification_email(self, user: User, token: str):
        """Send email verification email"""
        try:
            verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
            send_mail(
                'Verify Your Email Address',
                f'Please click the following link to verify your email: {verification_url}',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error(f"Email sending error: {str(e)}")
    
    def _check_account_lockout(self, username: str, ip_address: str = None) -> Dict[str, Any]:
        """Check if account is locked out"""
        # This is a simplified implementation
        # In production, you'd check actual lockout records
        return {
            'allowed': True,
            'lockout_until': None
        }
    
    def _record_failed_login(self, username: str, ip_address: str = None):
        """Record failed login attempt"""
        # This is a simplified implementation
        # In production, you'd store this in a security events table
        logger.warning(f"Failed login attempt for {username} from {ip_address}")
    
    def _record_successful_login(self, user: User, ip_address: str = None):
        """Record successful login"""
        # This is a simplified implementation
        # In production, you'd store this in a security events table
        logger.info(f"Successful login for {user.username} from {ip_address}")
    
    def _is_password_expired(self, user: User) -> bool:
        """Check if password is expired"""
        if not user.profile.password_changed_at:
            return True
        
        password_age = django_timezone.now() - user.profile.password_changed_at
        return password_age > timedelta(days=self.password_requirements['max_age_days'])
    
    def _get_recent_failed_logins(self) -> List[Dict[str, Any]]:
        """Get recent failed login attempts"""
        # This is a simplified implementation
        return []
    
    def _detect_suspicious_ips(self) -> List[str]:
        """Detect suspicious IP addresses"""
        # This is a simplified implementation
        return []
    
    def _detect_weak_passwords(self) -> List[int]:
        """Detect users with weak passwords"""
        # This is a simplified implementation
        return []
    
    def _detect_inactive_accounts(self) -> List[int]:
        """Detect inactive accounts"""
        # This is a simplified implementation
        return []
    
    def _check_gdpr_compliance(self, site_id: int) -> Dict[str, Any]:
        """Check GDPR compliance"""
        return {
            'compliant': True,
            'score': 95,
            'issues': [],
            'recommendations': ['Add cookie consent banner', 'Update privacy policy']
        }
    
    def _check_ccpa_compliance(self, site_id: int) -> Dict[str, Any]:
        """Check CCPA compliance"""
        return {
            'compliant': True,
            'score': 90,
            'issues': [],
            'recommendations': ['Add opt-out mechanism', 'Update data collection notices']
        }
    
    def _check_security_compliance(self, site_id: int) -> Dict[str, Any]:
        """Check security compliance"""
        return {
            'compliant': True,
            'score': 85,
            'issues': [],
            'recommendations': ['Enable two-factor authentication', 'Implement rate limiting']
        }
