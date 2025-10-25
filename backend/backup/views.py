from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services.backup_recovery_service import BackupRecoveryService


class BackupRecoveryViewSet(viewsets.ViewSet):
    """
    ViewSet for backup and recovery management
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def create_database_backup(self, request):
        """Create a database backup"""
        backup_name = request.data.get('backup_name')
        
        try:
            backup_service = BackupRecoveryService()
            
            result = backup_service.create_database_backup(backup_name)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to create database backup: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def restore_database_backup(self, request):
        """Restore a database backup"""
        backup_name = request.data.get('backup_name')
        
        if not backup_name:
            return Response(
                {'error': 'backup_name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            backup_service = BackupRecoveryService()
            
            result = backup_service.restore_database_backup(backup_name)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to restore database backup: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def create_filesystem_backup(self, request):
        """Create a filesystem backup"""
        backup_name = request.data.get('backup_name')
        include_media = request.data.get('include_media', True)
        
        try:
            backup_service = BackupRecoveryService()
            
            result = backup_service.create_filesystem_backup(backup_name, include_media)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to create filesystem backup: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def restore_filesystem_backup(self, request):
        """Restore a filesystem backup"""
        backup_name = request.data.get('backup_name')
        
        if not backup_name:
            return Response(
                {'error': 'backup_name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            backup_service = BackupRecoveryService()
            
            result = backup_service.restore_filesystem_backup(backup_name)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to restore filesystem backup: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def create_complete_backup(self, request):
        """Create a complete backup (database + filesystem)"""
        backup_name = request.data.get('backup_name')
        
        try:
            backup_service = BackupRecoveryService()
            
            result = backup_service.create_complete_backup(backup_name)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to create complete backup: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def restore_complete_backup(self, request):
        """Restore a complete backup"""
        backup_name = request.data.get('backup_name')
        
        if not backup_name:
            return Response(
                {'error': 'backup_name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            backup_service = BackupRecoveryService()
            
            result = backup_service.restore_complete_backup(backup_name)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to restore complete backup: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def list_backups(self, request):
        """List all available backups"""
        backup_type = request.query_params.get('backup_type')
        
        try:
            backup_service = BackupRecoveryService()
            
            result = backup_service.list_backups(backup_type)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to list backups: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['delete'])
    def delete_backup(self, request):
        """Delete a backup"""
        backup_name = request.data.get('backup_name')
        
        if not backup_name:
            return Response(
                {'error': 'backup_name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            backup_service = BackupRecoveryService()
            
            result = backup_service.delete_backup(backup_name)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to delete backup: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def cleanup_old_backups(self, request):
        """Clean up old backups based on retention policy"""
        try:
            backup_service = BackupRecoveryService()
            
            result = backup_service.cleanup_old_backups()
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to cleanup old backups: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def upload_to_cloud(self, request):
        """Upload backup to cloud storage"""
        backup_name = request.data.get('backup_name')
        cloud_provider = request.data.get('cloud_provider', 's3')
        
        if not backup_name:
            return Response(
                {'error': 'backup_name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            backup_service = BackupRecoveryService()
            
            result = backup_service.upload_backup_to_cloud(backup_name, cloud_provider)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to upload backup to cloud: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def download_from_cloud(self, request):
        """Download backup from cloud storage"""
        backup_name = request.data.get('backup_name')
        cloud_provider = request.data.get('cloud_provider', 's3')
        
        if not backup_name:
            return Response(
                {'error': 'backup_name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            backup_service = BackupRecoveryService()
            
            result = backup_service.download_backup_from_cloud(backup_name, cloud_provider)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to download backup from cloud: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def schedule_backup(self, request):
        """Schedule a backup"""
        backup_type = request.data.get('backup_type')
        schedule_time = request.data.get('schedule_time')
        backup_name = request.data.get('backup_name')
        
        if not all([backup_type, schedule_time]):
            return Response(
                {'error': 'backup_type and schedule_time are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            backup_service = BackupRecoveryService()
            
            result = backup_service.schedule_backup(backup_type, schedule_time, backup_name)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to schedule backup: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def get_backup_schedule(self, request):
        """Get backup schedule"""
        try:
            backup_service = BackupRecoveryService()
            
            result = backup_service.get_backup_schedule()
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get backup schedule: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def get_backup_analytics(self, request):
        """Get backup analytics and statistics"""
        try:
            backup_service = BackupRecoveryService()
            
            result = backup_service.get_backup_analytics()
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get backup analytics: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
