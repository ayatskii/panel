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
        return Deployment.objects.filter(site__user=user).select_related('site', 'cloudflare_token')

    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        """Retrieve build logs for a deployment."""
        dep = self.get_object()
        # Convert build_log string to array of lines for frontend compatibility
        logs = dep.build_log.split('\n') if dep.build_log else []
        return Response({
            'logs': logs,
            'status': dep.status
        })

    @action(detail=True, methods=['post'])
    def trigger(self, request, pk=None):
        """Trigger a new deployment for this deployment's site."""
        from .tasks import deploy_site_async
        
        dep = self.get_object()
        
        # Check if deployment is already in progress
        if dep.status in ['pending', 'building']:
            return Response(
                {'error': 'Deployment already in progress'},
                status=400
            )
        
        # Create a new deployment for the same site
        new_deployment = Deployment.objects.create(
            site=dep.site,
            cloudflare_token=dep.cloudflare_token,
            status='pending'
        )
        
        # Trigger the deployment task
        deploy_site_async.delay(new_deployment.id, request.user.id)
        
        return Response({
            'message': 'Deployment triggered successfully',
            'deployment_id': new_deployment.id
        }, status=201)

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
