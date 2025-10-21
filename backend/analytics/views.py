from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Avg
from .models import Analytics
from .serializers import AnalyticsSerializer, AnalyticsSummarySerializer
from users.permissions import IsOwnerOrAdmin
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import PageView
from sites.models import Site

class AnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only, supports filtering and summary endpoints"""
    serializer_class = AnalyticsSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['site', 'traffic_source', 'date']
    ordering_fields = ['date', 'visitors', 'pageviews']
    ordering = ['-date']
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Analytics.objects.select_related('site')
        return Response(Analytics.objects.filter(site__user=user).select_related('site'))
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Site analytics summary for a date range."""
        site_id = request.query_params.get('site')
        start_date = request.query_params.get('start')
        end_date = request.query_params.get('end')
        queryset = self.get_queryset()
        if site_id:
            queryset = queryset.filter(site_id=site_id)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        data = queryset.aggregate(
            total_visitors=Sum('visitors'),
            total_pageviews=Sum('pageviews'),
            avg_bounce_rate=Avg('bounce_rate'),
            total_conversions=Sum('conversions'),
            total_revenue=Sum('revenue')
        )
        data['date_range'] = {'start': start_date, 'end': end_date}
        return Response(data)

    @action(detail=False, methods=['get'])
    def traffic_sources(self, request):
        """Get visitor and pageview counts by traffic source."""
        site_id = request.query_params.get('site')
        queryset = self.get_queryset()
        if site_id:
            queryset = queryset.filter(site_id=site_id)
        groups = queryset.values('traffic_source').annotate(
            visitors_total=Sum('visitors'),
            pageviews_total=Sum('pageviews')
        )
        return Response(list(groups))

@api_view(['POST'])
@permission_classes([AllowAny])
def track_view(request):
    site_id = request.data.get('site_id')
    page_slug = request.data.get('page_slug')
    try:
        site = Site.objects.get(id=site_id)
        PageView.objects.create(site=site, page_slug=page_slug)
        return Response({'success': True}, status=status.HTTP_201_CREATED)
    except Site.DoesNotExist:
        return Response({'error': 'Invalid site'}, status=status.HTTP_400_BAD_REQUEST)