from django.urls import path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.routers import DefaultRouter

from core.views import (
    AIChatView,
    CompanyCreateView,
    CompanyMeView,
    CustomerViewSet,
    DashboardView,
    EmailVerificationConfirmView,
    EmailVerificationRequestView,
    EmployeeViewSet,
    InvoiceViewSet,
    LoginView,
    LogoutView,
    NotificationsView,
    PasswordResetConfirmView,
    PredictionsView,
    PasswordResetRequestView,
    ProductViewSet,
    RefreshView,
    RegisterView,
    ReportsView,
    SupplierViewSet,
)

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request, format=None):
    return Response({
        'register': reverse('register', request=request, format=format),
        'login': reverse('login', request=request, format=format),
        'refresh': reverse('refresh', request=request, format=format),
        'logout': reverse('logout', request=request, format=format),
        'companies': reverse('company-create', request=request, format=format),
        'company-me': reverse('company-me', request=request, format=format),
        'dashboard': reverse('dashboard', request=request, format=format),
        'ai-chat': reverse('ai-chat', request=request, format=format),
        'predictions': reverse('predictions', request=request, format=format),
        'products': reverse('products-list', request=request, format=format),
        'customers': reverse('customers-list', request=request, format=format),
        'suppliers': reverse('suppliers-list', request=request, format=format),
        'employees': reverse('employees-list', request=request, format=format),
        'invoices': reverse('invoices-list', request=request, format=format),
    })

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='products')
router.register(r'customers', CustomerViewSet, basename='customers')
router.register(r'suppliers', SupplierViewSet, basename='suppliers')
router.register(r'employees', EmployeeViewSet, basename='employees')
router.register(r'invoices', InvoiceViewSet, basename='invoices')

urlpatterns = [
    path('', api_root, name='api-root'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh/', RefreshView.as_view(), name='refresh'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/password-reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('auth/password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('auth/verify-email/', EmailVerificationRequestView.as_view(), name='email-verify-request'),
    path('auth/verify-email/confirm/', EmailVerificationConfirmView.as_view(), name='email-verify-confirm'),
    path('companies/', CompanyCreateView.as_view(), name='company-create'),
    path('companies/me/', CompanyMeView.as_view(), name='company-me'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('ai/chat/', AIChatView.as_view(), name='ai-chat'),
    path('reports/', ReportsView.as_view(), name='reports'),
    path('notifications/', NotificationsView.as_view(), name='notifications'),
    path('predictions/', PredictionsView.as_view(), name='predictions'),
]

urlpatterns += router.urls
