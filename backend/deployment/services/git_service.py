import os
import tempfile
import shutil
import logging
from typing import Dict, Any, Optional
from git import Repo, Git
from django.conf import settings

logger = logging.getLogger(__name__)


class GitService:
    """Service for Git repository management"""
    
    def __init__(self):
        self.git_username = getattr(settings, 'GIT_USERNAME', 'panel-bot')
        self.git_email = getattr(settings, 'GIT_EMAIL', 'panel@example.com')
        self.git_remote_url = getattr(settings, 'GIT_REMOTE_URL', None)
    
    def create_repository(self, site_domain: str, site_id: int) -> Dict[str, Any]:
        """
        Create a new Git repository for a site
        
        Args:
            site_domain: Domain name of the site
            site_id: ID of the site
            
        Returns:
            Dict with repository information
        """
        try:
            # Create a unique repository name
            repo_name = f"{site_domain.replace('.', '-')}-{site_id}"
            
            # Create temporary directory for the repository
            temp_dir = tempfile.mkdtemp()
            repo_path = os.path.join(temp_dir, repo_name)
            
            # Initialize Git repository
            repo = Repo.init(repo_path)
            
            # Configure Git user
            with repo.config_writer() as git_config:
                git_config.set_value("user", "name", self.git_username)
                git_config.set_value("user", "email", self.git_email)
            
            # Create initial files
            self._create_initial_files(repo_path)
            
            # Initial commit
            repo.index.add(['.'])
            repo.index.commit("Initial commit - Site created")
            
            logger.info(f"Created Git repository for site {site_domain} at {repo_path}")
            
            return {
                'success': True,
                'repo_path': repo_path,
                'repo_name': repo_name,
                'temp_dir': temp_dir
            }
            
        except Exception as e:
            logger.error(f"Failed to create Git repository for {site_domain}: {e}")
            return {'success': False, 'error': str(e)}
    
    def add_files_to_repository(self, repo_path: str, files: Dict[str, str]) -> Dict[str, Any]:
        """
        Add files to the Git repository
        
        Args:
            repo_path: Path to the Git repository
            files: Dict of file paths to content
            
        Returns:
            Dict with operation result
        """
        try:
            repo = Repo(repo_path)
            
            # Write files to repository
            for file_path, content in files.items():
                full_path = os.path.join(repo_path, file_path)
                
                # Create directory if it doesn't exist
                os.makedirs(os.path.dirname(full_path), exist_ok=True)
                
                # Write file content
                with open(full_path, 'w', encoding='utf-8') as f:
                    f.write(content)
            
            # Add all files to Git
            repo.index.add(['.'])
            
            # Commit changes
            commit_message = f"Update site files - {len(files)} files"
            repo.index.commit(commit_message)
            
            logger.info(f"Added {len(files)} files to repository at {repo_path}")
            
            return {'success': True, 'files_added': len(files)}
            
        except Exception as e:
            logger.error(f"Failed to add files to repository: {e}")
            return {'success': False, 'error': str(e)}
    
    def push_to_remote(self, repo_path: str, remote_url: str = None) -> Dict[str, Any]:
        """
        Push repository to remote Git service
        
        Args:
            repo_path: Path to the Git repository
            remote_url: Remote repository URL (optional)
            
        Returns:
            Dict with operation result
        """
        try:
            repo = Repo(repo_path)
            remote_url = remote_url or self.git_remote_url
            
            if not remote_url:
                return {'success': False, 'error': 'No remote URL configured'}
            
            # Add remote origin if it doesn't exist
            try:
                origin = repo.remote('origin')
                origin.set_url(remote_url)
            except:
                origin = repo.create_remote('origin', remote_url)
            
            # Push to remote
            origin.push('main')
            
            logger.info(f"Pushed repository to remote: {remote_url}")
            
            return {'success': True, 'remote_url': remote_url}
            
        except Exception as e:
            logger.error(f"Failed to push to remote: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_commit_hash(self, repo_path: str) -> Optional[str]:
        """
        Get the latest commit hash
        
        Args:
            repo_path: Path to the Git repository
            
        Returns:
            Latest commit hash or None
        """
        try:
            repo = Repo(repo_path)
            return repo.head.commit.hexsha
        except Exception as e:
            logger.error(f"Failed to get commit hash: {e}")
            return None
    
    def cleanup_repository(self, temp_dir: str):
        """
        Clean up temporary repository directory
        
        Args:
            temp_dir: Temporary directory to clean up
        """
        try:
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
                logger.info(f"Cleaned up temporary directory: {temp_dir}")
        except Exception as e:
            logger.error(f"Failed to cleanup directory {temp_dir}: {e}")
    
    def _create_initial_files(self, repo_path: str):
        """Create initial files in the repository"""
        
        # Create .gitignore
        gitignore_content = """# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Temporary folders
tmp/
temp/
"""
        
        with open(os.path.join(repo_path, '.gitignore'), 'w') as f:
            f.write(gitignore_content)
        
        # Create README.md
        readme_content = """# Site Repository

This repository contains the generated files for the website.

## Files

- `index.html` - Homepage
- `styles.css` - Global styles
- `scripts.js` - Global JavaScript (if applicable)
- `_assets/` - Static assets (favicons, images, etc.)

## Deployment

This site is automatically deployed to Cloudflare Pages.
"""
        
        with open(os.path.join(repo_path, 'README.md'), 'w') as f:
            f.write(readme_content)
        
        # Create _assets directory
        assets_dir = os.path.join(repo_path, '_assets')
        os.makedirs(assets_dir, exist_ok=True)
        
        # Create .gitkeep to ensure directory is tracked
        with open(os.path.join(assets_dir, '.gitkeep'), 'w') as f:
            f.write('')


# Singleton instance
git_service = GitService()
