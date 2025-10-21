from rest_framework import serializers
from .models import Prompt

class PromptSerializer(serializers.ModelSerializer):
    """Full prompt serializer"""
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    is_text_prompt = serializers.BooleanField(read_only=True)
    is_image_prompt = serializers.BooleanField(read_only=True)
    usage_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Prompt
        fields = [
            'id', 'name', 'description', 'type', 'type_display',
            'block_type', 'ai_model', 'temperature', 'max_tokens',
            'prompt_text', 'system_prompt', 'is_active',
            'is_text_prompt', 'is_image_prompt', 'usage_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_temperature(self, value):
        """Validate temperature range"""
        if not 0 <= value <= 1:
            raise serializers.ValidationError(
                "Temperature must be between 0.0 and 1.0"
            )
        return value
    
    def validate_max_tokens(self, value):
        """Validate max_tokens"""
        if value and value < 1:
            raise serializers.ValidationError(
                "Max tokens must be greater than 0"
            )
        return value
    
    def validate_prompt_text(self, value):
        """Check for common variable placeholders"""
        if not value.strip():
            raise serializers.ValidationError("Prompt text cannot be empty")
        return value


class PromptListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = Prompt
        fields = [
            'id', 'name', 'type', 'type_display',
            'block_type', 'ai_model', 'is_active'
        ]


class PromptTestSerializer(serializers.Serializer):
    """Serializer for testing prompts"""
    prompt_id = serializers.IntegerField()
    test_variables = serializers.JSONField(
        help_text='Test variables: {keywords: "...", brand_name: "...", etc.}'
    )
    
    def validate_prompt_id(self, value):
        try:
            Prompt.objects.get(id=value, is_active=True)
        except Prompt.DoesNotExist:
            raise serializers.ValidationError("Prompt not found or inactive")
        return value
