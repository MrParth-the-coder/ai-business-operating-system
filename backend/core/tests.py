from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from core.models import AIChatLog, Company, Customer, Employee, Invoice, InvoiceItem, Notification, Product, User
from django.utils import timezone
from core.serializers import RegisterSerializer


class AuthAndInvoiceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(email='owner@example.com', password='StrongPass!1', name='Owner', role='owner', email_verified=True)
        self.company = Company.objects.create(name='Test Company', owner=self.owner, category='retail', currency='USD')
        self.customer = Customer.objects.create(company=self.company, name='Alice', phone='12345', email='alice@example.com')
        self.product = Product.objects.create(company=self.company, name='Widget', price=Decimal('10.00'), stock_qty=3, low_stock_threshold=2)
        self.client.force_authenticate(user=self.owner)

    def test_register_serializer_requires_strong_password(self):
        serializer = RegisterSerializer(data={
            'email': 'new@example.com',
            'name': 'New User',
            'phone': '555',
            'password': 'weakpass',
            'password_confirm': 'weakpass',
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_confirm_invoice_decrements_stock_and_records_purchase_history(self):
        invoice = Invoice.objects.create(company=self.company, customer=self.customer, subtotal=Decimal('20.00'), tax=Decimal('2.00'), total=Decimal('22.00'), status='draft')
        InvoiceItem.objects.create(invoice=invoice, product=self.product, qty=2, unit_price=self.product.price, line_total=Decimal('20.00'))

        response = self.client.post(f'/api/invoices/{invoice.id}/confirm/', {}, content_type='application/json')

        self.assertEqual(response.status_code, 200)
        self.product.refresh_from_db()
        self.customer.refresh_from_db()
        self.assertEqual(self.product.stock_qty, 1)
        self.assertEqual(self.customer.purchase_history[-1]['qty'], 2)

    def test_confirm_invoice_creates_notification_and_reports_endpoint(self):
        invoice = Invoice.objects.create(company=self.company, customer=self.customer, subtotal=Decimal('20.00'), tax=Decimal('2.00'), total=Decimal('22.00'), status='draft')
        InvoiceItem.objects.create(invoice=invoice, product=self.product, qty=1, unit_price=self.product.price, line_total=Decimal('10.00'))

        confirm_response = self.client.post(f'/api/invoices/{invoice.id}/confirm/', {}, content_type='application/json')
        self.assertEqual(confirm_response.status_code, 200)
        self.assertTrue(Notification.objects.filter(company=self.company, type='invoice_created').exists())

        report_response = self.client.get('/api/reports/')
        self.assertEqual(report_response.status_code, 200)
        self.assertEqual(report_response.json()['sales']['invoice_count'], 1)

    def test_company_creation_for_owner_without_existing_company(self):
        owner = User.objects.create_user(email='owner-no-company@example.com', password='StrongPass!1', name='Owner', role='owner', email_verified=True)
        self.client.force_authenticate(user=owner)
        response = self.client.post('/api/companies/', {'name': 'New Company', 'category': 'retail', 'currency': 'USD'}, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['name'], 'New Company')

    def test_ai_chat_creates_log_and_returns_summary(self):
        response = self.client.post('/api/ai/chat/', {'question': 'How are my sales doing?'}, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertIn('sales', response.json()['answer'].lower())
        self.assertTrue(AIChatLog.objects.filter(company=self.company, user=self.owner).exists())

    def test_ai_chat_falls_back_when_gemini_key_missing(self):
        response = self.client.post('/api/ai/chat/', {'question': 'Give me an inventory summary'}, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertIn('low-stock', response.json()['answer'].lower())

    def test_predictions_endpoint_returns_company_scoped_results(self):
        response = self.client.get('/api/predictions/')

        self.assertEqual(response.status_code, 200)
        self.assertIn('sales_forecast', response.json())
        self.assertIn('customer_segmentation', response.json())
        self.assertIn('product_demand', response.json())

    def test_owner_and_employee_permissions_are_enforced(self):
        employee_user = User.objects.create_user(email='employee@example.com', password='StrongPass!1', name='Employee', role='employee', email_verified=True)
        Employee.objects.create(company=self.company, user=employee_user, assigned_permissions=['customers'])

        self.client.force_authenticate(user=self.owner)
        owner_response = self.client.get('/api/products/')
        self.assertEqual(owner_response.status_code, 200)

        self.client.force_authenticate(user=employee_user)
        permitted_response = self.client.get('/api/customers/')
        self.assertEqual(permitted_response.status_code, 200)

        denied_response = self.client.get('/api/products/')
        self.assertEqual(denied_response.status_code, 403)

    def test_analytics_endpoints_require_permission(self):
        employee_user = User.objects.create_user(email='analytics@example.com', password='StrongPass!1', name='Analyst', role='employee', email_verified=True)
        Employee.objects.create(company=self.company, user=employee_user, assigned_permissions=['reports'])

        self.client.force_authenticate(user=employee_user)
        reports_response = self.client.get('/api/reports/')
        self.assertEqual(reports_response.status_code, 200)

        predictions_response = self.client.get('/api/predictions/')
        self.assertEqual(predictions_response.status_code, 403)

    def test_company_me_endpoint_exposes_employee_permissions(self):
        employee_user = User.objects.create_user(email='employee-profile@example.com', password='StrongPass!1', name='Employee', role='employee', email_verified=True)
        Employee.objects.create(company=self.company, user=employee_user, assigned_permissions=['customers', 'products'])

        self.client.force_authenticate(user=employee_user)
        response = self.client.get('/api/companies/me/')

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()['is_owner'])
        self.assertIn('customers', response.json()['permissions'])
        self.assertIn('products', response.json()['permissions'])

    def test_reports_support_date_range_and_notifications_mark_read(self):
        invoice = Invoice.objects.create(company=self.company, customer=self.customer, subtotal=Decimal('20.00'), tax=Decimal('2.00'), total=Decimal('22.00'), status='confirmed', created_at=timezone.now())
        InvoiceItem.objects.create(invoice=invoice, product=self.product, qty=1, unit_price=self.product.price, line_total=Decimal('10.00'))
        notification = Notification.objects.create(company=self.company, type='invoice_created', source_record_id=invoice.id, is_read=False)

        response = self.client.get('/api/reports/?start_date=2024-01-01&end_date=2030-12-31')
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.json()['sales']['invoice_count'], 1)

        read_response = self.client.post('/api/notifications/', {'id': notification.id}, format='json')
        self.assertEqual(read_response.status_code, 200)
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)
