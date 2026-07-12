import csv
from io import StringIO

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, Sum
from django.http import HttpResponse
from rest_framework import generics, permissions, status, serializers, views, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from core.models import Company, Customer, Employee, Invoice, InvoiceItem, Product, Supplier
from core.serializers import (
    CompanySerializer,
    CustomerSerializer,
    EmailVerificationConfirmSerializer,
    EmailVerificationRequestSerializer,
    EmployeeSerializer,
    InvoiceSerializer,
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    ProductSerializer,
    SupplierSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


class RefreshView(TokenRefreshView):
    pass


class LogoutView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return Response({'detail': 'Logged out.'}, status=status.HTTP_200_OK)


class PasswordResetRequestView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token_data = serializer.save()
        return Response({
            'detail': 'Password reset token generated.',
            'email': token_data['email'],
            'token': token_data['token'],
        })


class EmailVerificationRequestView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = EmailVerificationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token_data = serializer.save()
        return Response({
            'detail': 'Email verification token generated.',
            'email': token_data['email'],
            'token': token_data['token'],
        })


class EmailVerificationConfirmView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = EmailVerificationConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Email verified successfully.'})


class PasswordResetConfirmView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Password has been reset.'})


class CompanyCreateView(generics.CreateAPIView):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        if getattr(self.request.user, 'owned_company', None) is not None:
            raise serializers.ValidationError({'detail': 'User already has a company.'})
        serializer.save(owner=self.request.user)


class CompanyMeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        company = getattr(request.user, 'owned_company', None)
        if not company:
            raise NotFound({'detail': 'Company not found.'})
        serializer = CompanySerializer(company)
        return Response(serializer.data)


class DashboardView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        company = getattr(request.user, 'owned_company', None)
        if not company:
            return Response({'category': None, 'products': 0, 'customers': 0, 'suppliers': 0, 'low_stock': 0, 'revenue': 0})
        summary = {
            'category': company.category,
            'products': Product.objects.filter(company=company).count(),
            'customers': Customer.objects.filter(company=company).count(),
            'suppliers': Supplier.objects.filter(company=company).count(),
            'low_stock': Product.objects.filter(company=company, stock_qty__lt=10).count(),
            'revenue': float(Invoice.objects.filter(company=company, status='confirmed').aggregate(Sum('total'))['total__sum'] or 0),
        }
        return Response(summary)


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(company=self.request.user.owned_company)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.owned_company)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if Invoice.objects.filter(company=request.user.owned_company, items__product=instance).exists():
            return Response({'detail': 'This product is referenced by invoices and cannot be deleted.'}, status=400)
        instance.soft_delete()
        return Response({'detail': 'Product deleted.'}, status=204)


class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Customer.objects.filter(company=self.request.user.owned_company)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.owned_company)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if Invoice.objects.filter(company=request.user.owned_company, customer=instance).exists():
            return Response({'detail': 'This customer has invoices and cannot be deleted.'}, status=400)
        instance.soft_delete()
        return Response({'detail': 'Customer deleted.'}, status=204)


class SupplierViewSet(viewsets.ModelViewSet):
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Supplier.objects.filter(company=self.request.user.owned_company)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.owned_company)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.soft_delete()
        return Response({'detail': 'Supplier deleted.'}, status=204)


class EmployeeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Employee.objects.filter(company=self.request.user.owned_company)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.owned_company)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({'detail': 'Employee deleted.'}, status=204)


class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Invoice.objects.filter(company=self.request.user.owned_company)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.owned_company)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status == 'confirmed':
            return Response({'detail': 'Invoice already confirmed.'}, status=400)
        with transaction.atomic():
            for item in invoice.items.all():
                product = item.product
                if item.qty > product.stock_qty:
                    return Response({'detail': f'Not enough stock for {product.name}.'}, status=400)
                product.stock_qty -= item.qty
                product.save(update_fields=['stock_qty'])
            invoice.status = 'confirmed'
            invoice.save(update_fields=['status'])
        return Response({'detail': 'Invoice confirmed.'})

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        invoices = self.get_queryset()
        buffer = StringIO()
        writer = csv.writer(buffer)
        writer.writerow(['id', 'customer', 'status', 'total', 'created_at'])
        for invoice in invoices:
            writer.writerow([invoice.id, invoice.customer.name, invoice.status, invoice.total, invoice.created_at])
        response = HttpResponse(buffer.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="invoices.csv"'
        return response
