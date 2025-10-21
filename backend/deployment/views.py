from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Deployment
from .serializers import DeploymentSerializer
from users.permissions import IsOwnerOrAdmin

class DeploymentViewSet(viewsets.ModelViewSet):
    """Read-only; lists and inspects deployments"""
    serializer_class = DeploymentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['site', 'status']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Deployment.objects.select_related('site', 'cloudflare_token')
        return Response(Deployment.objects.filter(site__user=user).select_related('site', 'cloudflare_token'))

    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        """Retrieve build logs for a deployment."""
        dep = self.get_object()
        return Response({
            'build_log': dep.build_log,
            'status': dep.status
        })

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a pending deployment."""
        dep = self.get_object()
        if dep.status == 'pending':
            dep.status = 'failed'
            dep.build_log = 'Cancelled by user'
            dep.save()
            return Response({'message': 'Deployment cancelled'}, status=200)
        else:
            return Response(
                {'error': 'Cannot cancel deployment in current status'},
                status=400
            )
