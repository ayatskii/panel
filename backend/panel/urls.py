from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView #type:ignore
from django.urls import include

from users.views import UserViewSet, current_user
from sites.views import SiteViewSet, LanguageViewSet, AffiliateLinkViewSet
from templates.views import TemplateViewSet, TemplateFootprintViewSet
from pages.views import PageViewSet, PageBlockViewSet, SwiperPresetViewSet
from media.views import MediaViewSet, MediaFolderViewSet
from prompts.views import PromptViewSet
from integrations.views import ApiTokenViewSet, CloudflareTokenViewSet
from analytics.views import AnalyticsViewSet, track_view
from deployment.views import DeploymentViewSet

router = DefaultRouter()

router.register(r'users', UserViewSet, basename='user')
router.register(r'sites', SiteViewSet, basename='site')
router.register(r'languages', LanguageViewSet, basename='language')
router.register(r'affiliate-links', AffiliateLinkViewSet, basename='affiliatelink')
router.register(r'templates', TemplateViewSet, basename='template')
router.register(r'template-footprints', TemplateFootprintViewSet, basename='templatefootprint')
router.register(r'pages', PageViewSet, basename='page')
router.register(r'page-blocks', PageBlockViewSet, basename='pageblock')
router.register(r'swiper-presets', SwiperPresetViewSet, basename='swiperpreset')
router.register(r'media', MediaViewSet, basename='media')
router.register(r'media-folders', MediaFolderViewSet, basename='mediafolder')
router.register(r'prompts', PromptViewSet, basename='prompt')
router.register(r'api-tokens', ApiTokenViewSet, basename='apitoken')
router.register(r'cloudflare-tokens', CloudflareTokenViewSet, basename='cloudflaretoken')
router.register(r'analytics', AnalyticsViewSet, basename='analytics')
router.register(r'deployments', DeploymentViewSet, basename='deployment')

urlpatterns = [
    path("admin/", admin.site.urls),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include(router.urls)),
    path('_nested_admin/', include('nested_admin.urls')),
    path('api/users/me/', current_user, name='current_user'),
    path('api/analytics/track/', track_view)
    
]   

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)