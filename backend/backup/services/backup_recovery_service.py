import os
import json
import shutil
import zipfile
import hashlib
import subprocess
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from django.utils import timezone as django_timezone
from django.conf import settings
from django.core.management import call_command
from django.db import connection
from sites.models import Site
from pages.models import Page, PageBlock
from media.models import Media, MediaFolder
import logging
import tempfile
import boto3
from botocore.exceptions import ClientError
# import schedule  # Unused for now
# import threading  # Unused for now
# import time  # Unused for now

logger = logging.getLogger(__name__)


class BackupRecoveryService:
    """
    Service for backup and recovery management
    """
    
    def __init__(self):
        self.backup_dir = getattr(settings, 'BACKUP_DIR', '/tmp/backups')
        self.retention_days = getattr(settings, 'BACKUP_RETENTION_DAYS', 30)
        self.max_backups = getattr(settings, 'MAX_BACKUPS', 10)
        self.aws_s3_bucket = getattr(settings, 'AWS_S3_BACKUP_BUCKET', None)
        self.aws_access_key = getattr(settings, 'AWS_ACCESS_KEY_ID', None)
        self.aws_secret_key = getattr(settings, 'AWS_SECRET_ACCESS_KEY', None)
        
        # Ensure backup directory exists
        os.makedirs(self.backup_dir, exist_ok=True)
    
    # Database Backup
    
    def create_database_backup(self, backup_name: str = None) -> Dict[str, Any]:
        """
        Create a database backup
        
        Args:
            backup_name: Optional custom backup name
            
        Returns:
            Backup creation result
        """
        try:
            if not backup_name:
                backup_name = f"db_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            backup_path = os.path.join(self.backup_dir, f"{backup_name}.sql")
            
            # Get database configuration
            db_config = settings.DATABASES['default']
            db_name = db_config['NAME']
            db_user = db_config['USER']
            db_password = db_config['PASSWORD']
            db_host = db_config['HOST']
            db_port = db_config['PORT']
            
            # Create database dump
            if db_config['ENGINE'] == 'django.db.backends.postgresql':
                # PostgreSQL backup
                env = os.environ.copy()
                if db_password:
                    env['PGPASSWORD'] = db_password
                
                cmd = [
                    'pg_dump',
                    '-h', db_host or 'localhost',
                    '-p', str(db_port or 5432),
                    '-U', db_user,
                    '-d', db_name,
                    '-f', backup_path,
                    '--no-password'
                ]
                
                result = subprocess.run(cmd, env=env, capture_output=True, text=True)
                
                if result.returncode != 0:
                    return {
                        'success': False,
                        'error': f'Database backup failed: {result.stderr}'
                    }
            
            elif db_config['ENGINE'] == 'django.db.backends.mysql':
                # MySQL backup
                cmd = [
                    'mysqldump',
                    '-h', db_host or 'localhost',
                    '-P', str(db_port or 3306),
                    '-u', db_user,
                    f'-p{db_password}' if db_password else '',
                    db_name
                ]
                
                with open(backup_path, 'w') as f:
                    result = subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, text=True)
                
                if result.returncode != 0:
                    return {
                        'success': False,
                        'error': f'Database backup failed: {result.stderr}'
                    }
            
            else:
                # SQLite backup
                shutil.copy2(db_name, backup_path)
            
            # Calculate backup size and checksum
            backup_size = os.path.getsize(backup_path)
            backup_checksum = self._calculate_checksum(backup_path)
            
            # Create backup metadata
            metadata = {
                'backup_name': backup_name,
                'backup_type': 'database',
                'backup_path': backup_path,
                'backup_size': backup_size,
                'backup_checksum': backup_checksum,
                'created_at': django_timezone.now().isoformat(),
                'database_engine': db_config['ENGINE'],
                'database_name': db_name,
                'status': 'completed'
            }
            
            # Save metadata
            metadata_path = os.path.join(self.backup_dir, f"{backup_name}_metadata.json")
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            return {
                'success': True,
                'backup_name': backup_name,
                'backup_path': backup_path,
                'backup_size': backup_size,
                'backup_checksum': backup_checksum,
                'created_at': metadata['created_at'],
                'backup_type': 'database'
            }
            
        except Exception as e:
            logger.error(f"Database backup error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to create database backup: {str(e)}'
            }
    
    def restore_database_backup(self, backup_name: str) -> Dict[str, Any]:
        """
        Restore a database backup
        
        Args:
            backup_name: Name of the backup to restore
            
        Returns:
            Restore result
        """
        try:
            backup_path = os.path.join(self.backup_dir, f"{backup_name}.sql")
            metadata_path = os.path.join(self.backup_dir, f"{backup_name}_metadata.json")
            
            # Check if backup exists
            if not os.path.exists(backup_path):
                return {
                    'success': False,
                    'error': f'Backup file not found: {backup_path}'
                }
            
            # Load metadata
            if os.path.exists(metadata_path):
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
            else:
                return {
                    'success': False,
                    'error': 'Backup metadata not found'
                }
            
            # Verify backup integrity
            if not self._verify_backup_integrity(backup_path, metadata.get('backup_checksum')):
                return {
                    'success': False,
                    'error': 'Backup integrity check failed'
                }
            
            # Get database configuration
            db_config = settings.DATABASES['default']
            db_name = db_config['NAME']
            db_user = db_config['USER']
            db_password = db_config['PASSWORD']
            db_host = db_config['HOST']
            db_port = db_config['PORT']
            
            # Restore database
            if db_config['ENGINE'] == 'django.db.backends.postgresql':
                # PostgreSQL restore
                env = os.environ.copy()
                if db_password:
                    env['PGPASSWORD'] = db_password
                
                cmd = [
                    'psql',
                    '-h', db_host or 'localhost',
                    '-p', str(db_port or 5432),
                    '-U', db_user,
                    '-d', db_name,
                    '-f', backup_path,
                    '--no-password'
                ]
                
                result = subprocess.run(cmd, env=env, capture_output=True, text=True)
                
                if result.returncode != 0:
                    return {
                        'success': False,
                        'error': f'Database restore failed: {result.stderr}'
                    }
            
            elif db_config['ENGINE'] == 'django.db.backends.mysql':
                # MySQL restore
                cmd = [
                    'mysql',
                    '-h', db_host or 'localhost',
                    '-P', str(db_port or 3306),
                    '-u', db_user,
                    f'-p{db_password}' if db_password else '',
                    db_name
                ]
                
                with open(backup_path, 'r') as f:
                    result = subprocess.run(cmd, stdin=f, stderr=subprocess.PIPE, text=True)
                
                if result.returncode != 0:
                    return {
                        'success': False,
                        'error': f'Database restore failed: {result.stderr}'
                    }
            
            else:
                # SQLite restore
                shutil.copy2(backup_path, db_name)
            
            return {
                'success': True,
                'backup_name': backup_name,
                'restored_at': django_timezone.now().isoformat(),
                'backup_type': 'database'
            }
            
        except Exception as e:
            logger.error(f"Database restore error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to restore database backup: {str(e)}'
            }
    
    # File System Backup
    
    def create_filesystem_backup(self, backup_name: str = None, include_media: bool = True) -> Dict[str, Any]:
        """
        Create a filesystem backup
        
        Args:
            backup_name: Optional custom backup name
            include_media: Whether to include media files
            
        Returns:
            Backup creation result
        """
        try:
            if not backup_name:
                backup_name = f"fs_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            backup_path = os.path.join(self.backup_dir, f"{backup_name}.zip")
            
            # Create temporary directory for backup
            with tempfile.TemporaryDirectory() as temp_dir:
                # Backup Django project files
                project_root = settings.BASE_DIR
                project_backup_dir = os.path.join(temp_dir, 'project')
                shutil.copytree(project_root, project_backup_dir, ignore=shutil.ignore_patterns(
                    '*.pyc', '__pycache__', '.git', 'node_modules', '.env', '*.log'
                ))
                
                # Backup media files if requested
                if include_media and hasattr(settings, 'MEDIA_ROOT'):
                    media_backup_dir = os.path.join(temp_dir, 'media')
                    if os.path.exists(settings.MEDIA_ROOT):
                        shutil.copytree(settings.MEDIA_ROOT, media_backup_dir)
                
                # Create backup metadata
                metadata = {
                    'backup_name': backup_name,
                    'backup_type': 'filesystem',
                    'created_at': django_timezone.now().isoformat(),
                    'include_media': include_media,
                    'project_root': str(project_root),
                    'media_root': str(getattr(settings, 'MEDIA_ROOT', '')),
                    'status': 'completed'
                }
                
                # Save metadata
                metadata_path = os.path.join(temp_dir, 'backup_metadata.json')
                with open(metadata_path, 'w') as f:
                    json.dump(metadata, f, indent=2)
                
                # Create zip archive
                with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for root, dirs, files in os.walk(temp_dir):
                        for file in files:
                            file_path = os.path.join(root, file)
                            arcname = os.path.relpath(file_path, temp_dir)
                            zipf.write(file_path, arcname)
                
                # Calculate backup size and checksum
                backup_size = os.path.getsize(backup_path)
                backup_checksum = self._calculate_checksum(backup_path)
                
                # Update metadata with size and checksum
                metadata['backup_size'] = backup_size
                metadata['backup_checksum'] = backup_checksum
                metadata['backup_path'] = backup_path
                
                # Save final metadata
                final_metadata_path = os.path.join(self.backup_dir, f"{backup_name}_metadata.json")
                with open(final_metadata_path, 'w') as f:
                    json.dump(metadata, f, indent=2)
                
                return {
                    'success': True,
                    'backup_name': backup_name,
                    'backup_path': backup_path,
                    'backup_size': backup_size,
                    'backup_checksum': backup_checksum,
                    'created_at': metadata['created_at'],
                    'backup_type': 'filesystem',
                    'include_media': include_media
                }
            
        except Exception as e:
            logger.error(f"Filesystem backup error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to create filesystem backup: {str(e)}'
            }
    
    def restore_filesystem_backup(self, backup_name: str) -> Dict[str, Any]:
        """
        Restore a filesystem backup
        
        Args:
            backup_name: Name of the backup to restore
            
        Returns:
            Restore result
        """
        try:
            backup_path = os.path.join(self.backup_dir, f"{backup_name}.zip")
            metadata_path = os.path.join(self.backup_dir, f"{backup_name}_metadata.json")
            
            # Check if backup exists
            if not os.path.exists(backup_path):
                return {
                    'success': False,
                    'error': f'Backup file not found: {backup_path}'
                }
            
            # Load metadata
            if os.path.exists(metadata_path):
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
            else:
                return {
                    'success': False,
                    'error': 'Backup metadata not found'
                }
            
            # Verify backup integrity
            if not self._verify_backup_integrity(backup_path, metadata.get('backup_checksum')):
                return {
                    'success': False,
                    'error': 'Backup integrity check failed'
                }
            
            # Create temporary directory for extraction
            with tempfile.TemporaryDirectory() as temp_dir:
                # Extract backup
                with zipfile.ZipFile(backup_path, 'r') as zipf:
                    zipf.extractall(temp_dir)
                
                # Restore project files
                project_backup_dir = os.path.join(temp_dir, 'project')
                if os.path.exists(project_backup_dir):
                    project_root = settings.BASE_DIR
                    # Backup current project
                    current_backup = f"{project_root}_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                    shutil.move(project_root, current_backup)
                    # Restore from backup
                    shutil.move(project_backup_dir, project_root)
                
                # Restore media files if included
                if metadata.get('include_media', False):
                    media_backup_dir = os.path.join(temp_dir, 'media')
                    if os.path.exists(media_backup_dir) and hasattr(settings, 'MEDIA_ROOT'):
                        if os.path.exists(settings.MEDIA_ROOT):
                            shutil.rmtree(settings.MEDIA_ROOT)
                        shutil.move(media_backup_dir, settings.MEDIA_ROOT)
            
            return {
                'success': True,
                'backup_name': backup_name,
                'restored_at': django_timezone.now().isoformat(),
                'backup_type': 'filesystem'
            }
            
        except Exception as e:
            logger.error(f"Filesystem restore error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to restore filesystem backup: {str(e)}'
            }
    
    # Complete Backup
    
    def create_complete_backup(self, backup_name: str = None) -> Dict[str, Any]:
        """
        Create a complete backup (database + filesystem)
        
        Args:
            backup_name: Optional custom backup name
            
        Returns:
            Backup creation result
        """
        try:
            if not backup_name:
                backup_name = f"complete_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # Create database backup
            db_result = self.create_database_backup(f"{backup_name}_db")
            if not db_result['success']:
                return db_result
            
            # Create filesystem backup
            fs_result = self.create_filesystem_backup(f"{backup_name}_fs")
            if not fs_result['success']:
                return fs_result
            
            # Create complete backup metadata
            metadata = {
                'backup_name': backup_name,
                'backup_type': 'complete',
                'created_at': django_timezone.now().isoformat(),
                'database_backup': db_result['backup_name'],
                'filesystem_backup': fs_result['backup_name'],
                'total_size': db_result['backup_size'] + fs_result['backup_size'],
                'status': 'completed'
            }
            
            # Save metadata
            metadata_path = os.path.join(self.backup_dir, f"{backup_name}_metadata.json")
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            return {
                'success': True,
                'backup_name': backup_name,
                'database_backup': db_result['backup_name'],
                'filesystem_backup': fs_result['backup_name'],
                'total_size': metadata['total_size'],
                'created_at': metadata['created_at'],
                'backup_type': 'complete'
            }
            
        except Exception as e:
            logger.error(f"Complete backup error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to create complete backup: {str(e)}'
            }
    
    def restore_complete_backup(self, backup_name: str) -> Dict[str, Any]:
        """
        Restore a complete backup
        
        Args:
            backup_name: Name of the backup to restore
            
        Returns:
            Restore result
        """
        try:
            metadata_path = os.path.join(self.backup_dir, f"{backup_name}_metadata.json")
            
            # Load metadata
            if not os.path.exists(metadata_path):
                return {
                    'success': False,
                    'error': 'Backup metadata not found'
                }
            
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            # Restore database backup
            db_result = self.restore_database_backup(metadata['database_backup'])
            if not db_result['success']:
                return db_result
            
            # Restore filesystem backup
            fs_result = self.restore_filesystem_backup(metadata['filesystem_backup'])
            if not fs_result['success']:
                return fs_result
            
            return {
                'success': True,
                'backup_name': backup_name,
                'restored_at': django_timezone.now().isoformat(),
                'backup_type': 'complete'
            }
            
        except Exception as e:
            logger.error(f"Complete restore error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to restore complete backup: {str(e)}'
            }
    
    # Backup Management
    
    def list_backups(self, backup_type: str = None) -> Dict[str, Any]:
        """
        List all available backups
        
        Args:
            backup_type: Filter by backup type (database, filesystem, complete)
            
        Returns:
            List of backups
        """
        try:
            backups = []
            
            # Scan backup directory
            for filename in os.listdir(self.backup_dir):
                if filename.endswith('_metadata.json'):
                    metadata_path = os.path.join(self.backup_dir, filename)
                    
                    try:
                        with open(metadata_path, 'r') as f:
                            metadata = json.load(f)
                        
                        # Filter by type if specified
                        if backup_type and metadata.get('backup_type') != backup_type:
                            continue
                        
                        # Check if backup file exists
                        backup_name = metadata['backup_name']
                        backup_file = None
                        
                        if metadata['backup_type'] == 'database':
                            backup_file = os.path.join(self.backup_dir, f"{backup_name}.sql")
                        elif metadata['backup_type'] == 'filesystem':
                            backup_file = os.path.join(self.backup_dir, f"{backup_name}.zip")
                        elif metadata['backup_type'] == 'complete':
                            # For complete backups, check if both components exist
                            db_backup = os.path.join(self.backup_dir, f"{metadata['database_backup']}.sql")
                            fs_backup = os.path.join(self.backup_dir, f"{metadata['filesystem_backup']}.zip")
                            if os.path.exists(db_backup) and os.path.exists(fs_backup):
                                backup_file = f"Complete backup (DB: {metadata['database_backup']}, FS: {metadata['filesystem_backup']})"
                        
                        if backup_file and os.path.exists(backup_file):
                            backups.append({
                                'backup_name': backup_name,
                                'backup_type': metadata['backup_type'],
                                'backup_size': metadata.get('backup_size', 0),
                                'created_at': metadata['created_at'],
                                'status': metadata.get('status', 'unknown'),
                                'backup_file': backup_file
                            })
                    
                    except (json.JSONDecodeError, KeyError) as e:
                        logger.warning(f"Invalid metadata file {filename}: {str(e)}")
                        continue
            
            # Sort by creation date (newest first)
            backups.sort(key=lambda x: x['created_at'], reverse=True)
            
            return {
                'success': True,
                'backups': backups,
                'total_count': len(backups),
                'filtered_by': backup_type
            }
            
        except Exception as e:
            logger.error(f"List backups error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to list backups: {str(e)}'
            }
    
    def delete_backup(self, backup_name: str) -> Dict[str, Any]:
        """
        Delete a backup
        
        Args:
            backup_name: Name of the backup to delete
            
        Returns:
            Delete result
        """
        try:
            metadata_path = os.path.join(self.backup_dir, f"{backup_name}_metadata.json")
            
            # Load metadata
            if not os.path.exists(metadata_path):
                return {
                    'success': False,
                    'error': 'Backup metadata not found'
                }
            
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            deleted_files = []
            
            # Delete backup files
            if metadata['backup_type'] == 'database':
                backup_file = os.path.join(self.backup_dir, f"{backup_name}.sql")
                if os.path.exists(backup_file):
                    os.remove(backup_file)
                    deleted_files.append(backup_file)
            
            elif metadata['backup_type'] == 'filesystem':
                backup_file = os.path.join(self.backup_dir, f"{backup_name}.zip")
                if os.path.exists(backup_file):
                    os.remove(backup_file)
                    deleted_files.append(backup_file)
            
            elif metadata['backup_type'] == 'complete':
                # Delete database backup
                db_backup = os.path.join(self.backup_dir, f"{metadata['database_backup']}.sql")
                if os.path.exists(db_backup):
                    os.remove(db_backup)
                    deleted_files.append(db_backup)
                
                # Delete filesystem backup
                fs_backup = os.path.join(self.backup_dir, f"{metadata['filesystem_backup']}.zip")
                if os.path.exists(fs_backup):
                    os.remove(fs_backup)
                    deleted_files.append(fs_backup)
            
            # Delete metadata file
            if os.path.exists(metadata_path):
                os.remove(metadata_path)
                deleted_files.append(metadata_path)
            
            return {
                'success': True,
                'backup_name': backup_name,
                'deleted_files': deleted_files,
                'deleted_at': django_timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Delete backup error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to delete backup: {str(e)}'
            }
    
    def cleanup_old_backups(self) -> Dict[str, Any]:
        """
        Clean up old backups based on retention policy
        
        Returns:
            Cleanup result
        """
        try:
            # Get all backups
            backups_result = self.list_backups()
            if not backups_result['success']:
                return backups_result
            
            backups = backups_result['backups']
            deleted_backups = []
            
            # Sort by creation date (oldest first)
            backups.sort(key=lambda x: x['created_at'])
            
            # Delete backups older than retention period
            cutoff_date = django_timezone.now() - timedelta(days=self.retention_days)
            
            for backup in backups:
                backup_date = datetime.fromisoformat(backup['created_at'].replace('Z', '+00:00'))
                
                if backup_date < cutoff_date:
                    delete_result = self.delete_backup(backup['backup_name'])
                    if delete_result['success']:
                        deleted_backups.append(backup['backup_name'])
            
            # Keep only the most recent backups if we exceed max_backups
            if len(backups) - len(deleted_backups) > self.max_backups:
                remaining_backups = [b for b in backups if b['backup_name'] not in deleted_backups]
                remaining_backups.sort(key=lambda x: x['created_at'], reverse=True)
                
                for backup in remaining_backups[self.max_backups:]:
                    delete_result = self.delete_backup(backup['backup_name'])
                    if delete_result['success']:
                        deleted_backups.append(backup['backup_name'])
            
            return {
                'success': True,
                'deleted_backups': deleted_backups,
                'deleted_count': len(deleted_backups),
                'cleanup_date': django_timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Cleanup old backups error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to cleanup old backups: {str(e)}'
            }
    
    # Cloud Storage
    
    def upload_backup_to_cloud(self, backup_name: str, cloud_provider: str = 's3') -> Dict[str, Any]:
        """
        Upload backup to cloud storage
        
        Args:
            backup_name: Name of the backup to upload
            cloud_provider: Cloud provider (s3, gcs, azure)
            
        Returns:
            Upload result
        """
        try:
            if cloud_provider == 's3':
                return self._upload_to_s3(backup_name)
            else:
                return {
                    'success': False,
                    'error': f'Unsupported cloud provider: {cloud_provider}'
                }
            
        except Exception as e:
            logger.error(f"Cloud upload error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to upload backup to cloud: {str(e)}'
            }
    
    def download_backup_from_cloud(self, backup_name: str, cloud_provider: str = 's3') -> Dict[str, Any]:
        """
        Download backup from cloud storage
        
        Args:
            backup_name: Name of the backup to download
            cloud_provider: Cloud provider (s3, gcs, azure)
            
        Returns:
            Download result
        """
        try:
            if cloud_provider == 's3':
                return self._download_from_s3(backup_name)
            else:
                return {
                    'success': False,
                    'error': f'Unsupported cloud provider: {cloud_provider}'
                }
            
        except Exception as e:
            logger.error(f"Cloud download error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to download backup from cloud: {str(e)}'
            }
    
    # Backup Scheduling
    
    def schedule_backup(self, backup_type: str, schedule_time: str, backup_name: str = None) -> Dict[str, Any]:
        """
        Schedule a backup
        
        Args:
            backup_type: Type of backup (database, filesystem, complete)
            schedule_time: Schedule time (e.g., 'daily', 'weekly', 'monthly')
            backup_name: Optional custom backup name
            
        Returns:
            Schedule result
        """
        try:
            # This is a simplified implementation
            # In production, you'd use a proper task scheduler like Celery
            
            schedule_config = {
                'backup_type': backup_type,
                'schedule_time': schedule_time,
                'backup_name': backup_name,
                'created_at': django_timezone.now().isoformat(),
                'status': 'scheduled'
            }
            
            # Save schedule configuration
            schedule_path = os.path.join(self.backup_dir, 'backup_schedule.json')
            schedules = []
            
            if os.path.exists(schedule_path):
                with open(schedule_path, 'r') as f:
                    schedules = json.load(f)
            
            schedules.append(schedule_config)
            
            with open(schedule_path, 'w') as f:
                json.dump(schedules, f, indent=2)
            
            return {
                'success': True,
                'schedule_id': len(schedules) - 1,
                'backup_type': backup_type,
                'schedule_time': schedule_time,
                'scheduled_at': schedule_config['created_at']
            }
            
        except Exception as e:
            logger.error(f"Schedule backup error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to schedule backup: {str(e)}'
            }
    
    def get_backup_schedule(self) -> Dict[str, Any]:
        """
        Get backup schedule
        
        Returns:
            Schedule information
        """
        try:
            schedule_path = os.path.join(self.backup_dir, 'backup_schedule.json')
            
            if not os.path.exists(schedule_path):
                return {
                    'success': True,
                    'schedules': [],
                    'total_count': 0
                }
            
            with open(schedule_path, 'r') as f:
                schedules = json.load(f)
            
            return {
                'success': True,
                'schedules': schedules,
                'total_count': len(schedules)
            }
            
        except Exception as e:
            logger.error(f"Get backup schedule error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to get backup schedule: {str(e)}'
            }
    
    # Backup Analytics
    
    def get_backup_analytics(self) -> Dict[str, Any]:
        """
        Get backup analytics and statistics
        
        Returns:
            Backup analytics
        """
        try:
            # Get all backups
            backups_result = self.list_backups()
            if not backups_result['success']:
                return backups_result
            
            backups = backups_result['backups']
            
            # Calculate statistics
            total_backups = len(backups)
            total_size = sum(backup['backup_size'] for backup in backups)
            
            # Group by type
            by_type = {}
            for backup in backups:
                backup_type = backup['backup_type']
                if backup_type not in by_type:
                    by_type[backup_type] = {'count': 0, 'size': 0}
                by_type[backup_type]['count'] += 1
                by_type[backup_type]['size'] += backup['backup_size']
            
            # Recent backups (last 7 days)
            recent_cutoff = django_timezone.now() - timedelta(days=7)
            recent_backups = [
                backup for backup in backups
                if datetime.fromisoformat(backup['created_at'].replace('Z', '+00:00')) > recent_cutoff
            ]
            
            # Backup frequency
            if len(backups) > 1:
                first_backup = min(backups, key=lambda x: x['created_at'])
                last_backup = max(backups, key=lambda x: x['created_at'])
                
                first_date = datetime.fromisoformat(first_backup['created_at'].replace('Z', '+00:00'))
                last_date = datetime.fromisoformat(last_backup['created_at'].replace('Z', '+00:00'))
                
                days_diff = (last_date - first_date).days
                frequency = len(backups) / max(days_diff, 1)
            else:
                frequency = 0
            
            return {
                'success': True,
                'analytics': {
                    'total_backups': total_backups,
                    'total_size': total_size,
                    'total_size_mb': round(total_size / (1024 * 1024), 2),
                    'by_type': by_type,
                    'recent_backups': len(recent_backups),
                    'backup_frequency': round(frequency, 2),
                    'retention_days': self.retention_days,
                    'max_backups': self.max_backups,
                    'backup_dir': self.backup_dir
                },
                'generated_at': django_timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Backup analytics error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to get backup analytics: {str(e)}'
            }
    
    # Helper Methods
    
    def _calculate_checksum(self, file_path: str) -> str:
        """Calculate SHA256 checksum of a file"""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    def _verify_backup_integrity(self, file_path: str, expected_checksum: str) -> bool:
        """Verify backup file integrity"""
        if not expected_checksum:
            return True
        
        actual_checksum = self._calculate_checksum(file_path)
        return actual_checksum == expected_checksum
    
    def _upload_to_s3(self, backup_name: str) -> Dict[str, Any]:
        """Upload backup to AWS S3"""
        try:
            if not all([self.aws_s3_bucket, self.aws_access_key, self.aws_secret_key]):
                return {
                    'success': False,
                    'error': 'AWS S3 configuration not found'
                }
            
            # Initialize S3 client
            s3_client = boto3.client(
                's3',
                aws_access_key_id=self.aws_access_key,
                aws_secret_access_key=self.aws_secret_key
            )
            
            # Upload backup files
            uploaded_files = []
            
            # Find backup files
            backup_files = []
            for filename in os.listdir(self.backup_dir):
                if filename.startswith(backup_name) and not filename.endswith('_metadata.json'):
                    backup_files.append(filename)
            
            for filename in backup_files:
                file_path = os.path.join(self.backup_dir, filename)
                s3_key = f"backups/{filename}"
                
                s3_client.upload_file(file_path, self.aws_s3_bucket, s3_key)
                uploaded_files.append(s3_key)
            
            # Upload metadata
            metadata_filename = f"{backup_name}_metadata.json"
            metadata_path = os.path.join(self.backup_dir, metadata_filename)
            if os.path.exists(metadata_path):
                s3_key = f"backups/{metadata_filename}"
                s3_client.upload_file(metadata_path, self.aws_s3_bucket, s3_key)
                uploaded_files.append(s3_key)
            
            return {
                'success': True,
                'backup_name': backup_name,
                'uploaded_files': uploaded_files,
                'bucket': self.aws_s3_bucket,
                'uploaded_at': django_timezone.now().isoformat()
            }
            
        except ClientError as e:
            return {
                'success': False,
                'error': f'AWS S3 upload failed: {str(e)}'
            }
    
    def _download_from_s3(self, backup_name: str) -> Dict[str, Any]:
        """Download backup from AWS S3"""
        try:
            if not all([self.aws_s3_bucket, self.aws_access_key, self.aws_secret_key]):
                return {
                    'success': False,
                    'error': 'AWS S3 configuration not found'
                }
            
            # Initialize S3 client
            s3_client = boto3.client(
                's3',
                aws_access_key_id=self.aws_access_key,
                aws_secret_access_key=self.aws_secret_key
            )
            
            # Download backup files
            downloaded_files = []
            
            # List objects in S3 bucket
            response = s3_client.list_objects_v2(
                Bucket=self.aws_s3_bucket,
                Prefix=f"backups/{backup_name}"
            )
            
            if 'Contents' not in response:
                return {
                    'success': False,
                    'error': 'Backup not found in S3'
                }
            
            for obj in response['Contents']:
                s3_key = obj['Key']
                filename = os.path.basename(s3_key)
                local_path = os.path.join(self.backup_dir, filename)
                
                s3_client.download_file(self.aws_s3_bucket, s3_key, local_path)
                downloaded_files.append(local_path)
            
            return {
                'success': True,
                'backup_name': backup_name,
                'downloaded_files': downloaded_files,
                'downloaded_at': django_timezone.now().isoformat()
            }
            
        except ClientError as e:
            return {
                'success': False,
                'error': f'AWS S3 download failed: {str(e)}'
            }
