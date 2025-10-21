from rest_framework import permissions


class IsMediaOwnerOrAdmin(permissions.BasePermission):
    """
    Permission to only allow owners of media or admin to access it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin can access everything
        if request.user.is_admin:
            return True
        
        # Owner can access their own media
        return obj.user == request.user
