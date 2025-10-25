# Panel CMS - Developer Implementation Guide

**Quick Start Guide for Feature Implementation**

This guide provides practical instructions for developers implementing features from the roadmap.

---

## 🚀 Getting Started

### Prerequisites
```bash
# Backend
Python 3.10+
PostgreSQL 14+
Redis 6+

# Frontend
Node.js 18+
npm 9+

# Tools
Git
Docker (optional but recommended)
```

### Initial Setup
```bash
# Clone repository
git clone https://github.com/yourorg/panel-cms.git
cd panel-cms

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser

# Frontend setup
cd ../frontend
npm install

# Start development servers
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Celery (when needed)
cd backend
celery -A panel worker -l info
```

---

## 📐 Architecture Overview

### Backend Structure
```
backend/
├── panel/              # Main project settings
├── users/              # User authentication
├── sites/              # Site management
├── pages/              # Page and block management
├── media/              # Media library
├── templates/          # Template system
├── deployment/         # Deployment logic
├── analytics/          # Analytics tracking
├── prompts/            # AI prompts
└── integrations/       # External services
```

### Frontend Structure
```
frontend/src/
├── components/         # React components
│   ├── auth/          # Authentication
│   ├── blocks/        # Page blocks
│   ├── common/        # Shared components
│   ├── media/         # Media library
│   └── ...
├── pages/             # Page components
├── store/             # Redux state management
│   ├── api/          # RTK Query APIs
│   └── slices/       # Redux slices
├── types/             # TypeScript types
└── utils/             # Utility functions
```

---

## 🛠️ Common Implementation Patterns

### Pattern 1: Adding a New Model

**Step 1: Create the Model**
```python
# backend/yourapp/models.py
from django.db import models

class YourModel(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'your_table_name'
        verbose_name = 'Your Model'
        verbose_name_plural = 'Your Models'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return self.name
```

**Step 2: Create Migration**
```bash
python manage.py makemigrations
python manage.py migrate
```

**Step 3: Create Serializer**
```python
# backend/yourapp/serializers.py
from rest_framework import serializers
from .models import YourModel

class YourModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = YourModel
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
```

**Step 4: Create ViewSet**
```python
# backend/yourapp/views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import YourModel
from .serializers import YourModelSerializer

class YourModelViewSet(viewsets.ModelViewSet):
    queryset = YourModel.objects.all()
    serializer_class = YourModelSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['name']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name']
```

**Step 5: Register URLs**
```python
# backend/yourapp/urls.py (or panel/urls.py)
from rest_framework.routers import DefaultRouter
from .views import YourModelViewSet

router = DefaultRouter()
router.register(r'your-models', YourModelViewSet, basename='yourmodel')

urlpatterns = router.urls
```

**Step 6: Create Frontend API Service**
```typescript
// frontend/src/store/api/yourModelsApi.ts
import { apiSlice } from './apiSlice'

export interface YourModel {
  id: number
  name: string
  description: string
  created_at: string
  updated_at: string
}

export const yourModelsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getYourModels: builder.query<YourModel[], void>({
      query: () => '/your-models/',
      providesTags: ['YourModel'],
    }),
    
    getYourModel: builder.query<YourModel, number>({
      query: (id) => `/your-models/${id}/`,
      providesTags: (result, error, id) => [{ type: 'YourModel', id }],
    }),
    
    createYourModel: builder.mutation<YourModel, Partial<YourModel>>({
      query: (data) => ({
        url: '/your-models/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['YourModel'],
    }),
    
    updateYourModel: builder.mutation<YourModel, { id: number; data: Partial<YourModel> }>({
      query: ({ id, data }) => ({
        url: `/your-models/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'YourModel', id }],
    }),
    
    deleteYourModel: builder.mutation<void, number>({
      query: (id) => ({
        url: `/your-models/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['YourModel'],
    }),
  }),
})

export const {
  useGetYourModelsQuery,
  useGetYourModelQuery,
  useCreateYourModelMutation,
  useUpdateYourModelMutation,
  useDeleteYourModelMutation,
} = yourModelsApi
```

**Step 7: Add to apiSlice Tags**
```typescript
// frontend/src/store/api/apiSlice.ts
export const apiSlice = createApi({
  // ...
  tagTypes: [
    'Site',
    'Page',
    'Media',
    'YourModel',  // Add your new tag
    // ...
  ],
  // ...
})
```

---

### Pattern 2: Adding a New Block Component

**Step 1: Create Block Component**
```typescript
// frontend/src/components/blocks/YourBlock.tsx
import { Box, Typography, TextField } from '@mui/material'

export interface YourBlockContent {
  title?: string
  content?: string
  // ... other fields
}

interface YourBlockProps {
  content: YourBlockContent
  isEditing: boolean
  onChange?: (content: YourBlockContent) => void
}

const YourBlock = ({ content, isEditing, onChange }: YourBlockProps) => {
  if (isEditing) {
    return (
      <Box sx={{ p: 3, border: '2px dashed', borderColor: 'primary.main', borderRadius: 1 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Your Block Settings</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Title"
            fullWidth
            value={content.title || ''}
            onChange={(e) => onChange?.({ ...content, title: e.target.value })}
          />
          <TextField
            label="Content"
            fullWidth
            multiline
            rows={4}
            value={content.content || ''}
            onChange={(e) => onChange?.({ ...content, content: e.target.value })}
          />
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 4 }}>
      {content.title && (
        <Typography variant="h4" sx={{ mb: 2 }}>
          {content.title}
        </Typography>
      )}
      <Typography variant="body1">
        {content.content || 'Your content here'}
      </Typography>
    </Box>
  )
}

export default YourBlock
```

**Step 2: Update PageBuilderPage**
```typescript
// frontend/src/pages/pages/PageBuilderPage.tsx

// Import your block
import YourBlock from '@/components/blocks/YourBlock'
import type { YourBlockContent } from '@/components/blocks/YourBlock'

// Add to BLOCK_TYPES array
const BLOCK_TYPES = [
  // ... existing blocks
  { 
    type: 'your_block', 
    label: 'Your Block', 
    defaultContent: { title: 'Title', content: 'Content' } 
  },
]

// Add to renderBlock function
const renderBlock = (block: PageBlock) => {
  // ... existing cases
  
  case 'your_block':
    return <YourBlock
      content={block.content as YourBlockContent}
      isEditing={isEditing}
      onChange={(content) => handleUpdateBlock(block.id, content as Record<string, unknown>)}
    />
}
```

**Step 3: Add to Backend Block Choices**
```python
# backend/pages/models.py
class PageBlock(models.Model):
    BLOCK_TYPE_CHOICES = [
        # ... existing choices
        ('your_block', 'Your Block'),
    ]
```

**Step 4: Update Backend Block Rendering**
```python
# backend/deployment/builder.py
def _render_block(self, block) -> str:
    # ... existing block rendering
    
    elif block.block_type == 'your_block':
        return f'''
        <section class="your-block">
            <h2>{content.get('title', '')}</h2>
            <div class="your-block-content">
                {content.get('content', '')}
            </div>
        </section>
        '''
```

---

### Pattern 3: Adding a Custom API Endpoint

**Backend: Add Custom Action**
```python
# backend/yourapp/views.py
from rest_framework.decorators import action
from rest_framework.response import Response

class YourViewSet(viewsets.ModelViewSet):
    # ... existing code
    
    @action(detail=True, methods=['post'])
    def custom_action(self, request, pk=None):
        """
        Custom action description
        
        POST /api/your-models/{id}/custom-action/
        Body: { "param": "value" }
        """
        obj = self.get_object()
        param = request.data.get('param')
        
        # Your logic here
        result = obj.do_something(param)
        
        return Response({
            'message': 'Action completed',
            'result': result
        })
    
    @action(detail=False, methods=['get'])
    def list_custom(self, request):
        """
        Custom list action
        
        GET /api/your-models/list-custom/?filter=value
        """
        filter_value = request.query_params.get('filter')
        queryset = self.get_queryset().filter(custom_field=filter_value)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
```

**Frontend: Add to API Service**
```typescript
// frontend/src/store/api/yourModelsApi.ts
export const yourModelsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ... existing endpoints
    
    customAction: builder.mutation<CustomActionResult, { id: number; param: string }>({
      query: ({ id, param }) => ({
        url: `/your-models/${id}/custom-action/`,
        method: 'POST',
        body: { param },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'YourModel', id }],
    }),
    
    listCustom: builder.query<YourModel[], string>({
      query: (filter) => `/your-models/list-custom/?filter=${filter}`,
      providesTags: ['YourModel'],
    }),
  }),
})

export const {
  useCustomActionMutation,
  useListCustomQuery,
} = yourModelsApi
```

---

### Pattern 4: Creating a Service Class

**Backend Service**
```python
# backend/yourapp/services/your_service.py
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class YourService:
    """
    Service class for complex business logic
    """
    
    def __init__(self, instance=None):
        self.instance = instance
    
    def process_data(self, data: Dict) -> Dict:
        """
        Process data with complex logic
        
        Args:
            data: Input data dictionary
            
        Returns:
            Processed data dictionary
            
        Raises:
            ValueError: If data is invalid
        """
        try:
            # Validate
            if not self._validate_data(data):
                raise ValueError("Invalid data")
            
            # Process
            result = self._do_processing(data)
            
            # Log
            logger.info(f"Processed data: {result}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing data: {e}")
            raise
    
    def _validate_data(self, data: Dict) -> bool:
        """Private validation method"""
        return 'required_field' in data
    
    def _do_processing(self, data: Dict) -> Dict:
        """Private processing method"""
        # Your complex logic here
        return {
            'processed': True,
            'original': data
        }
    
    @classmethod
    def batch_process(cls, items: List) -> List[Dict]:
        """
        Process multiple items
        
        Args:
            items: List of items to process
            
        Returns:
            List of processed results
        """
        results = []
        for item in items:
            service = cls(item)
            results.append(service.process_data(item.data))
        return results
```

**Usage in Views**
```python
# backend/yourapp/views.py
from .services.your_service import YourService

@action(detail=True, methods=['post'])
def process(self, request, pk=None):
    obj = self.get_object()
    service = YourService(obj)
    
    try:
        result = service.process_data(request.data)
        return Response(result)
    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
```

---

### Pattern 5: Adding a Celery Task

**Step 1: Create Task**
```python
# backend/yourapp/tasks.py
from celery import shared_task
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def your_async_task(self, param1, param2):
    """
    Async task description
    
    Args:
        param1: First parameter
        param2: Second parameter
        
    Returns:
        Result dictionary
    """
    try:
        # Your long-running task here
        result = do_something_slow(param1, param2)
        
        logger.info(f"Task completed: {result}")
        return {'status': 'success', 'result': result}
        
    except Exception as e:
        logger.error(f"Task failed: {e}")
        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))

@shared_task
def cleanup_old_data():
    """
    Periodic cleanup task
    
    Run daily via Celery Beat
    """
    from django.utils import timezone
    from datetime import timedelta
    
    cutoff_date = timezone.now() - timedelta(days=30)
    deleted_count = YourModel.objects.filter(
        created_at__lt=cutoff_date,
        is_temporary=True
    ).delete()[0]
    
    logger.info(f"Cleaned up {deleted_count} old records")
    return deleted_count
```

**Step 2: Configure Celery Beat (if periodic)**
```python
# backend/panel/celery.py
from celery.schedules import crontab

app.conf.beat_schedule = {
    'cleanup-old-data': {
        'task': 'yourapp.tasks.cleanup_old_data',
        'schedule': crontab(hour=2, minute=0),  # Run at 2 AM daily
    },
}
```

**Step 3: Use in Views**
```python
# backend/yourapp/views.py
from .tasks import your_async_task

@action(detail=True, methods=['post'])
def start_processing(self, request, pk=None):
    obj = self.get_object()
    
    # Start async task
    task = your_async_task.delay(
        param1=obj.id,
        param2=request.data.get('param2')
    )
    
    return Response({
        'message': 'Processing started',
        'task_id': task.id
    })

@action(detail=False, methods=['get'])
def check_task(self, request):
    """Check task status"""
    from celery.result import AsyncResult
    
    task_id = request.query_params.get('task_id')
    task = AsyncResult(task_id)
    
    return Response({
        'state': task.state,
        'result': task.result if task.ready() else None
    })
```

---

## 🎨 Frontend Best Practices

### Component Structure
```typescript
// Good component structure
import { useState, useEffect } from 'react'
import { Box, Typography, Button } from '@mui/material'
import type { YourType } from '@/types'

interface YourComponentProps {
  data: YourType
  onAction?: (id: number) => void
}

const YourComponent = ({ data, onAction }: YourComponentProps) => {
  // State
  const [localState, setLocalState] = useState<string>('')
  
  // Effects
  useEffect(() => {
    // Side effects
  }, [data])
  
  // Handlers
  const handleClick = () => {
    onAction?.(data.id)
  }
  
  // Early returns
  if (!data) {
    return <Typography>No data</Typography>
  }
  
  // Main render
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">{data.name}</Typography>
      <Button onClick={handleClick}>Action</Button>
    </Box>
  )
}

export default YourComponent
```

### Form Handling
```typescript
import { useState } from 'react'
import { Box, TextField, Button } from '@mui/material'
import toast from 'react-hot-toast'
import { useCreateYourModelMutation } from '@/store/api/yourModelsApi'

const YourForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  
  const [createModel, { isLoading }] = useCreateYourModelMutation()
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await createModel(formData).unwrap()
      toast.success('Created successfully')
      setFormData({ name: '', description: '' })
    } catch (error) {
      toast.error('Failed to create')
    }
  }
  
  return (
    <Box component="form" onSubmit={handleSubmit}>
      <TextField
        name="name"
        label="Name"
        value={formData.name}
        onChange={handleChange}
        required
        fullWidth
        margin="normal"
      />
      <TextField
        name="description"
        label="Description"
        value={formData.description}
        onChange={handleChange}
        multiline
        rows={4}
        fullWidth
        margin="normal"
      />
      <Button
        type="submit"
        variant="contained"
        disabled={isLoading}
        fullWidth
      >
        {isLoading ? 'Creating...' : 'Create'}
      </Button>
    </Box>
  )
}

export default YourForm
```

---

## 🧪 Testing

### Backend Unit Test
```python
# backend/yourapp/tests.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import YourModel

User = get_user_model()

class YourModelTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.model = YourModel.objects.create(
            name='Test',
            description='Test description'
        )
    
    def test_model_str(self):
        """Test string representation"""
        self.assertEqual(str(self.model), 'Test')
    
    def test_model_creation(self):
        """Test model can be created"""
        self.assertIsNotNone(self.model.id)
        self.assertEqual(self.model.name, 'Test')
```

### Frontend Component Test
```typescript
// frontend/src/components/__tests__/YourComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import YourComponent from '../YourComponent'

describe('YourComponent', () => {
  it('renders data correctly', () => {
    const data = { id: 1, name: 'Test' }
    render(<YourComponent data={data} />)
    
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
  
  it('calls onAction when button clicked', () => {
    const data = { id: 1, name: 'Test' }
    const mockAction = jest.fn()
    
    render(<YourComponent data={data} onAction={mockAction} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(mockAction).toHaveBeenCalledWith(1)
  })
})
```

---

## 📚 Useful Commands

### Backend
```bash
# Create migration
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run tests
python manage.py test

# Run specific test
python manage.py test yourapp.tests.YourTestCase

# Shell
python manage.py shell

# Collect static files
python manage.py collectstatic

# Create app
python manage.py startapp yourapp
```

### Frontend
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Type check
npm run type-check

# Lint
npm run lint

# Format
npm run format
```

### Database
```bash
# PostgreSQL backup
pg_dump -U postgres panel_db > backup.sql

# PostgreSQL restore
psql -U postgres panel_db < backup.sql

# Reset database
python manage.py flush
```

### Docker
```bash
# Build containers
docker-compose build

# Start containers
docker-compose up

# Stop containers
docker-compose down

# View logs
docker-compose logs -f

# Run command in container
docker-compose exec backend python manage.py migrate
```

---

## 🐛 Debugging Tips

### Backend Debugging
```python
# Use Django Debug Toolbar (if installed)
# Add to MIDDLEWARE in settings.py

# Use pdb for breakpoints
import pdb; pdb.set_trace()

# Use logging
import logging
logger = logging.getLogger(__name__)
logger.debug('Debug message')
logger.info('Info message')
logger.error('Error message')
```

### Frontend Debugging
```typescript
// Use React DevTools browser extension

// Console logging
console.log('Value:', value)
console.table(array)
console.dir(object)

// Debugger statement
debugger;

// Check Redux state
// Use Redux DevTools browser extension
```

---

## 📖 Additional Resources

### Documentation
- Django: https://docs.djangoproject.com/
- Django REST Framework: https://www.django-rest-framework.org/
- React: https://react.dev/
- TypeScript: https://www.typescriptlang.org/docs/
- Material-UI: https://mui.com/material-ui/getting-started/
- Redux Toolkit: https://redux-toolkit.js.org/

### Code Style
- Backend: Follow PEP 8, use Black formatter
- Frontend: Follow Airbnb style guide, use Prettier
- Git commits: Use conventional commits

### Getting Help
- Check IMPLEMENTATION_PLAN.md for feature details
- Check CURRENT_STATUS.md for what's implemented
- Check ROADMAP.md for timeline
- Review existing code for patterns
- Ask team members

---

**Happy coding! 🚀**

