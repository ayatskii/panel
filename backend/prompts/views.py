from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Prompt
from .serializers import PromptSerializer, PromptListSerializer, PromptTestSerializer
from users.permissions import IsAdminUser


class PromptViewSet(viewsets.ModelViewSet):
    """CRUD for AI prompts, support test/run endpoints"""
    queryset = Prompt.objects.all()
    serializer_class = PromptSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['type', 'block_type', 'ai_model', 'is_active']
    search_fields = ['name', 'description', 'prompt_text']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return PromptListSerializer
        return PromptSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """Test a prompt with sample variables"""
        prompt = self.get_object()
        serializer = PromptTestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        from .services.ai_service import AIContentService
        ai_service = AIContentService()
        result = ai_service.generate_content(prompt, data['test_variables'])
        return Response({'result': result})
    
    @action(detail=False, methods=['get'])
    def by_block_type(self, request):
        """Get prompts filtered by block type (for UI dropdowns)"""
        block_type = request.query_params.get('block_type')
        prompts = Prompt.objects.filter(block_type=block_type)
        serializer = PromptListSerializer(prompts, many=True)
        return Response(serializer.data)
