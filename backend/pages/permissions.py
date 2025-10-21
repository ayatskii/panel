from rest_framework import permissions


class IsPageOwnerOrAdmin(permissions.BasePermission):
    """
    Permission to only allow owners of a page's site or admin to access it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin can access everything
        if request.user.is_admin:
            return True
        
        # Owner can access their site's pages
        return obj.site.user == request.user
