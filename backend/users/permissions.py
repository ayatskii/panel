from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin
    

class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_admin:
            return True
        
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        if obj == request.user:
            return True
        
        return False
    
class IsSiteOwnerOrAdmin(permissions.BasePermission):
    """
    Permission for site-related objects (Site, Page, PageBlock, etc.)
    Checks if user owns the site or is admin
    """
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_admin:
            return True
        
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        if hasattr(obj, 'site'):
            return obj.site.user == request.user

        if hasattr(obj, 'page') and hasattr(obj.page, 'site'):
            return obj.page.site.user == request.user
        
        return False


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permission allowing read access to all, write access to owners/admins only
    Used for public-viewable but owner-editable content
    """
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if request.user.is_admin:
            return True
        
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False


class IsAuthenticatedOrReadOnly(permissions.BasePermission):
    """
    Permission allowing read access to anyone, write access to authenticated users
    Can be used for publicly viewable templates, etc.
    """
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return request.user and request.user.is_authenticated