import csv
import json
import os
from io import StringIO
from urllib import request as urllib_request

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, Sum
from django.utils import timezone
from django.http import HttpResponse
from rest_framework import generics, permissions, status, serializers, views, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from core.models import AIChatLog, Company, Customer, Employee, Invoice, InvoiceItem, MLPrediction, Notification, Product, Supplier
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


def has_permission(user, permission_name):
    if not user or not getattr(user, 'is_authenticated', False):
        return False
    if getattr(user, 'is_superuser', False):
        return True
    if getattr(user, 'role', None) == 'owner':
        return True
    employee = getattr(user, 'employee_profile', None)
    if employee is None:
        return False
    return permission_name in (employee.assigned_permissions or [])


class PermissionRequiredMixin:
    required_permission = None

    def check_permissions(self, request):
        super().check_permissions(request)
        if self.required_permission and not has_permission(request.user, self.required_permission):
            self.permission_denied(request, message='You do not have permission to access this module.')


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


class AIChatView(PermissionRequiredMixin, views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    required_permission = 'ai'

    def _fetch_context(self, company):
        products = Product.objects.filter(company=company).values('name', 'stock_qty', 'price', 'low_stock_threshold')
        customers = Customer.objects.filter(company=company).values('name', 'email', 'phone', 'is_active')
        invoices = Invoice.objects.filter(company=company, status='confirmed').select_related('customer').prefetch_related('items').order_by('-created_at')[:10]
        revenue = float(Invoice.objects.filter(company=company, status='confirmed').aggregate(Sum('total'))['total__sum'] or 0)
        low_stock = [item['name'] for item in products if item['stock_qty'] <= item['low_stock_threshold']]
        recent_sales = []
        for invoice in invoices:
            recent_sales.append({
                'id': invoice.id,
                'customer': invoice.customer.name,
                'total': float(invoice.total),
                'date': invoice.created_at.date().isoformat(),
            })

        return {
            'company_name': company.name,
            'products': list(products),
            'customers': list(customers),
            'recent_sales': recent_sales,
            'revenue': revenue,
            'low_stock_count': len(low_stock),
            'low_stock_products': low_stock,
        }

    def _call_gemini(self, question, context):
        api_key = os.environ.get('GOOGLE_GEMINI_API_KEY', '').strip()
        if not api_key:
            return None

        prompt = (
            'You are an assistant for an AI business operations app. Answer using only the provided company data. '
            'Do not invent values. If the data is insufficient, say so clearly.\n\n'
            f'Question: {question}\n\nContext: {json.dumps(context, default=str)}'
        )
        payload = {
            'contents': [{
                'parts': [{'text': prompt}],
            }],
        }
        req = urllib_request.Request(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + api_key,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST',
        )
        try:
            with urllib_request.urlopen(req, timeout=10) as response:
                result = json.loads(response.read().decode('utf-8'))
                candidates = result.get('candidates') or []
                if not candidates:
                    return None
                text = candidates[0].get('content', {}).get('parts', [{}])[0].get('text')
                return text or None
        except Exception:
            return None

    def get(self, request):
        company = getattr(request.user, 'owned_company', None)
        if not company:
            return Response([])
        logs = AIChatLog.objects.filter(company=company).order_by('-created_at')[:8]
        payload = [{
            'id': item.id,
            'question': item.question,
            'answer': item.answer,
            'created_at': item.created_at.isoformat(),
        } for item in logs]
        return Response(payload)

    def post(self, request):
        company = getattr(request.user, 'owned_company', None)
        if not company:
            return Response({'detail': 'Company not found.'}, status=status.HTTP_404_NOT_FOUND)

        question = (request.data.get('question') or '').strip()
        if not question:
            return Response({'detail': 'Question is required.'}, status=status.HTTP_400_BAD_REQUEST)

        context = self._fetch_context(company)
        answer = self._call_gemini(question, context)
        if not answer:
            lower_question = question.lower()
            if 'sales' in lower_question:
                answer = f"Based on your company data, confirmed sales total ${context['revenue']:.2f} across {len(context['recent_sales'])} recent invoice(s)."
            elif 'stock' in lower_question or 'inventory' in lower_question:
                answer = f"You currently have {context['low_stock_count']} low-stock product(s): {', '.join(context['low_stock_products']) or 'none'}."
            elif 'customer' in lower_question:
                top_customer = max(context['customers'], key=lambda item: item.get('name', ''), default=None)
                answer = f"You have {len(context['customers'])} customer record(s). The latest customer entry is {top_customer['name'] if top_customer else 'none'}."
            else:
                answer = f"Your company has {len(context['products'])} product(s), {len(context['customers'])} customer record(s), and ${context['revenue']:.2f} in confirmed sales."

        AIChatLog.objects.create(company=company, user=request.user, question=question, answer=answer)
        return Response({'answer': answer, 'summary': context})


class CompanyCreateView(generics.CreateAPIView):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        if getattr(request.user, 'owned_company', None) is not None:
            return Response({'detail': 'User already has a company.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class CompanyMeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        company = getattr(request.user, 'owned_company', None)
        if not company:
            employee = getattr(request.user, 'employee_profile', None)
            company = getattr(employee, 'company', None)
        if not company:
            raise NotFound({'detail': 'Company not found.'})
        serializer = CompanySerializer(company)
        payload = serializer.data
        employee = getattr(request.user, 'employee_profile', None)
        payload['is_owner'] = getattr(request.user, 'role', None) == 'owner' or getattr(request.user, 'is_superuser', False)
        payload['permissions'] = list(employee.assigned_permissions or []) if employee else []
        return Response(payload)


class DashboardView(PermissionRequiredMixin, views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    required_permission = 'dashboard'

    def get(self, request):
        company = getattr(request.user, 'owned_company', None)
        if not company:
            return Response({'category': None, 'products': 0, 'customers': 0, 'suppliers': 0, 'low_stock': 0, 'revenue': 0, 'orders': 0, 'employees': 0})
        summary = {
            'category': company.category,
            'products': Product.objects.filter(company=company).count(),
            'customers': Customer.objects.filter(company=company).count(),
            'suppliers': Supplier.objects.filter(company=company).count(),
            'employees': Employee.objects.filter(company=company).count(),
            'low_stock': Product.objects.filter(company=company, stock_qty__lt=10).count(),
            'revenue': float(Invoice.objects.filter(company=company, status='confirmed').aggregate(Sum('total'))['total__sum'] or 0),
            'orders': Invoice.objects.filter(company=company, status='confirmed').count(),
        }
        if company.category == 'medical':
            summary['expiry'] = 0
        if company.category == 'education':
            summary['students'] = summary['customers']
            summary['teachers'] = summary['employees']
            summary['courses'] = summary['products']
        if company.category == 'restaurant':
            summary['orders'] = summary['orders']
        return Response(summary)


class PredictionsView(PermissionRequiredMixin, views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    required_permission = 'predictions'

    def _get_sales_history(self, company):
        invoices = Invoice.objects.filter(company=company, status='confirmed').order_by('created_at')
        by_day = {}
        for invoice in invoices:
            day = invoice.created_at.date().isoformat()
            by_day[day] = by_day.get(day, 0) + float(invoice.total)
        return by_day

    def _get_sales_forecast(self, company):
        history = self._get_sales_history(company)
        if len(history) < 30:
            return {'status': 'not_enough_data', 'message': 'Not enough sales history yet. At least 30 days of confirmed invoices are required.'}

        sorted_days = sorted(history.items())
        values = [value for _, value in sorted_days]
        if len(values) < 2:
            return {'status': 'not_enough_data', 'message': 'Not enough sales history yet.'}
        trend = values[-1] - values[0]
        forecast = values[-1] + (trend / max(1, len(values) - 1))
        return {'status': 'ready', 'forecast': round(forecast, 2), 'days_analyzed': len(values)}

    def _get_customer_segments(self, company):
        customers = Customer.objects.filter(company=company).values_list('name', flat=True)
        segments = {
            'vip': [customers[0]] if customers else [],
            'regular': list(customers[1:3]) if len(customers) > 1 else [],
            'new': list(customers[3:]) if len(customers) > 3 else [],
        }
        return {'status': 'ready', 'segments': segments}

    def _get_demand_prediction(self, company):
        products = Product.objects.filter(company=company).values('name', 'stock_qty', 'price')
        tiers = []
        for product in products:
            if product['stock_qty'] <= 5:
                tier = 'high'
            elif product['stock_qty'] <= 15:
                tier = 'medium'
            else:
                tier = 'low'
            tiers.append({'name': product['name'], 'tier': tier})
        return {'status': 'ready', 'products': tiers}

    def get(self, request):
        company = getattr(request.user, 'owned_company', None)
        if not company:
            return Response({'sales_forecast': {'status': 'not_enough_data', 'message': 'No company found.'}, 'customer_segmentation': {'status': 'ready', 'segments': {'vip': [], 'regular': [], 'new': []}}, 'product_demand': {'status': 'ready', 'products': []}})

        forecast = self._get_sales_forecast(company)
        segmentation = self._get_customer_segments(company)
        demand = self._get_demand_prediction(company)

        payload = {
            'sales_forecast': forecast,
            'customer_segmentation': segmentation,
            'product_demand': demand,
        }

        MLPrediction.objects.filter(company=company).delete()
        MLPrediction.objects.create(company=company, type='sales_forecast', payload=forecast)
        MLPrediction.objects.create(company=company, type='segment', payload=segmentation)
        MLPrediction.objects.create(company=company, type='demand', payload=demand)
        return Response(payload)


class ReportsView(PermissionRequiredMixin, views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    required_permission = 'reports'

    def get(self, request):
        company = getattr(request.user, 'owned_company', None)
        if not company:
            return Response({'sales': {'revenue': 0, 'invoice_count': 0}, 'inventory': {'items': 0, 'low_stock': 0}, 'customers': {'total': 0, 'active': 0}, 'date_range': None})

        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        queryset = Invoice.objects.filter(company=company, status='confirmed')

        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)

        confirmed_invoices = queryset
        sales_total = confirmed_invoices.aggregate(total=Sum('total'))['total'] or 0
        sales_payload = {
            'revenue': float(sales_total),
            'invoice_count': confirmed_invoices.count(),
        }
        inventory_payload = {
            'items': Product.objects.filter(company=company).count(),
            'low_stock': Product.objects.filter(company=company, stock_qty__lt=10).count(),
        }
        customers_payload = {
            'total': Customer.objects.filter(company=company).count(),
            'active': Customer.objects.filter(company=company, is_active=True).count(),
        }
        return Response({'sales': sales_payload, 'inventory': inventory_payload, 'customers': customers_payload, 'date_range': {'start_date': start_date, 'end_date': end_date}})


class NotificationsView(PermissionRequiredMixin, views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    required_permission = 'notifications'

    def get(self, request):
        company = getattr(request.user, 'owned_company', None)
        if not company:
            return Response([])
        cutoff = timezone.now() - timezone.timedelta(days=30)
        Notification.objects.filter(company=company, created_at__lt=cutoff).delete()
        notifications = Notification.objects.filter(company=company).order_by('-created_at')
        payload = [{
            'id': item.id,
            'type': item.type,
            'is_read': item.is_read,
            'created_at': item.created_at.isoformat(),
            'message': 'New invoice created' if item.type == 'invoice_created' else 'Low stock alert',
        } for item in notifications]
        return Response(payload)

    def post(self, request):
        notification_id = request.data.get('id')
        if not notification_id:
            return Response({'detail': 'Notification id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        notification = Notification.objects.filter(id=notification_id, company=request.user.owned_company).first()
        if not notification:
            return Response({'detail': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response({'detail': 'Notification marked as read.'})


class ProductViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    required_permission = 'products'

    def get_queryset(self):
        company = getattr(self.request.user, 'owned_company', None)
        if company is None:
            return Product.objects.none()
        return Product.objects.filter(company=company)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.owned_company)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if Invoice.objects.filter(company=request.user.owned_company, items__product=instance).exists():
            return Response({'detail': 'This product is referenced by invoices and cannot be deleted.'}, status=400)
        instance.soft_delete()
        return Response({'detail': 'Product deleted.'}, status=204)


class CustomerViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    required_permission = 'customers'

    def get_queryset(self):
        company = getattr(self.request.user, 'owned_company', None)
        if company is None:
            return Customer.objects.none()
        return Customer.objects.filter(company=company)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.owned_company)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if Invoice.objects.filter(company=request.user.owned_company, customer=instance).exists():
            return Response({'detail': 'This customer has invoices and cannot be deleted.'}, status=400)
        instance.soft_delete()
        return Response({'detail': 'Customer deleted.'}, status=204)


class SupplierViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated]
    required_permission = 'suppliers'

    def get_queryset(self):
        company = getattr(self.request.user, 'owned_company', None)
        if company is None:
            return Supplier.objects.none()
        return Supplier.objects.filter(company=company)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.owned_company)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.soft_delete()
        return Response({'detail': 'Supplier deleted.'}, status=204)


class EmployeeViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]
    required_permission = 'employees'

    def get_queryset(self):
        company = getattr(self.request.user, 'owned_company', None)
        if company is None:
            return Employee.objects.none()
        return Employee.objects.filter(company=company)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.owned_company)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({'detail': 'Employee deleted.'}, status=204)


class InvoiceViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    required_permission = 'invoices'

    def get_queryset(self):
        company = getattr(self.request.user, 'owned_company', None)
        if company is None:
            return Invoice.objects.none()
        return Invoice.objects.filter(company=company)

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
            customer = invoice.customer
            customer.purchase_history = list(customer.purchase_history or []) + [{
                'invoice_id': invoice.id,
                'date': invoice.created_at.isoformat(),
                'total': str(invoice.total),
                'qty': sum(item.qty for item in invoice.items.all()),
            }]
            customer.save(update_fields=['purchase_history'])
            Notification.objects.create(company=invoice.company, type='invoice_created', source_record_id=invoice.id, is_read=False)
            for item in invoice.items.all():
                if item.product.stock_qty < item.product.low_stock_threshold:
                    Notification.objects.create(company=invoice.company, type='low_stock', source_record_id=item.product.id, is_read=False)
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
