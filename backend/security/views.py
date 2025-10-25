from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services.security_access_control_service import SecurityAccessControlService


class SecurityAccessControlViewSet(viewsets.ViewSet):
    """
    ViewSet for security and access control
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def validate_password(self, request):
        """Validate password strength"""
        password = request.data.get('password')
        
        if not password:
            return Response(
                {'error': 'password is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            security_service = SecurityAccessControlService()
            
            result = security_service.validate_password_strength(password)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to validate password: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def create_user(self, request):
        """Create a new user account"""
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        is_staff = request.data.get('is_staff', False)
        
        if not all([username, email, password]):
            return Response(
                {'error': 'username, email, and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            security_service = SecurityAccessControlService()
            
            result = security_service.create_user_account(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                is_staff=is_staff
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to create user: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def verify_email(self, request):
        """Verify user email with token"""
        verification_token = request.data.get('verification_token')
        
        if not verification_token:
            return Response(
                {'error': 'verification_token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            security_service = SecurityAccessControlService()
            
            result = security_service.verify_email(verification_token)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to verify email: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def authenticate(self, request):
        """Authenticate user with security checks"""
        username = request.data.get('username')
        password = request.data.get('password')
        ip_address = request.META.get('REMOTE_ADDR')
        
        if not all([username, password]):
            return Response(
                {'error': 'username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            security_service = SecurityAccessControlService()
            
            result = security_service.authenticate_user(
                username=username,
                password=password,
                ip_address=ip_address
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Authentication failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def assign_role(self, request):
        """Assign a role to a user"""
        user_id = request.data.get('user_id')
        role = request.data.get('role')
        site_id = request.data.get('site_id')
        
        if not all([user_id, role]):
            return Response(
                {'error': 'user_id and role are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            security_service = SecurityAccessControlService()
            
            result = security_service.assign_role(
                user_id=int(user_id),
                role=role,
                site_id=int(site_id) if site_id else None
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to assign role: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def check_permission(self, request):
        """Check if user has specific permission"""
        user_id = request.data.get('user_id')
        permission = request.data.get('permission')
        site_id = request.data.get('site_id')
        
        if not all([user_id, permission]):
            return Response(
                {'error': 'user_id and permission are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            security_service = SecurityAccessControlService()
            
            result = security_service.check_permission(
                user_id=int(user_id),
                permission=permission,
                site_id=int(site_id) if site_id else None
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to check permission: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def get_security_events(self, request):
        """Get security events and logs"""
        user_id = request.query_params.get('user_id')
        site_id = request.query_params.get('site_id')
        limit = int(request.query_params.get('limit', 100))
        
        try:
            security_service = SecurityAccessControlService()
            
            result = security_service.get_security_events(
                user_id=int(user_id) if user_id else None,
                site_id=int(site_id) if site_id else None,
                limit=limit
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get security events: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def detect_threats(self, request):
        """Detect potential security threats"""
        try:
            security_service = SecurityAccessControlService()
            
            result = security_service.detect_security_threats()
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to detect threats: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def encrypt_data(self, request):
        """Encrypt sensitive data"""
        data = request.data.get('data')
        key = request.data.get('key')
        
        if not data:
            return Response(
                {'error': 'data is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            security_service = SecurityAccessControlService()
            
            result = security_service.encrypt_sensitive_data(data, key)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to encrypt data: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def decrypt_data(self, request):
        """Decrypt sensitive data"""
        encrypted_data = request.data.get('encrypted_data')
        key = request.data.get('key')
        
        if not encrypted_data:
            return Response(
                {'error': 'encrypted_data is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            security_service = SecurityAccessControlService()
            
            result = security_service.decrypt_sensitive_data(encrypted_data, key)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to decrypt data: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def get_compliance_status(self, request):
        """Get compliance status for a site"""
        site_id = request.query_params.get('site_id')
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            security_service = SecurityAccessControlService()
            
            result = security_service.get_compliance_status(int(site_id))
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get compliance status: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
