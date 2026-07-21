from __future__ import annotations

from datetime import timedelta
import json

from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class CompanyScopedManager(models.Manager):
    """Filter records by the requesting user's company when used in a viewset."""

    def get_queryset(self):
        qs = super().get_queryset()
        request = getattr(_thread_locals, 'request', None)
        if request is None or not getattr(request, 'user', None) or not request.user.is_authenticated:
            return qs
        user = request.user
        if getattr(user, 'is_superuser', False):
            return qs
        if hasattr(user, 'company'):
            return qs.filter(company=user.company)
        return qs.none()


_thread_locals = type('_thread_locals', (), {})()


def set_request_context(request):
    _thread_locals.request = request


def clear_request_context():
    if hasattr(_thread_locals, 'request'):
        del _thread_locals.request


class SoftDeleteModel(models.Model):
    is_active = models.BooleanField(default=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    def soft_delete(self):
        self.is_active = False
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_active', 'deleted_at'])


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'system_admin')
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('system_admin', 'System Admin'),
        ('owner', 'Owner'),
        ('employee', 'Employee'),
    ]

    email = models.EmailField(unique=True)
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=30, blank=True)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='employee')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    failed_login_attempts = models.PositiveIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.email


class Company(models.Model):
    CATEGORY_CHOICES = [
        ('retail', 'Retail'),
        ('medical', 'Medical'),
        ('education', 'Education'),
        ('restaurant', 'Restaurant'),
    ]

    name = models.CharField(max_length=200)
    owner = models.OneToOneField(settings.AUTH_USER_MODEL, related_name='owned_company', on_delete=models.CASCADE)
    owner_name = models.CharField(max_length=200, blank=True)
    owner_email = models.EmailField(blank=True)
    owner_phone = models.CharField(max_length=30, blank=True)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    logo = models.FileField(upload_to='logos/', blank=True, null=True)
    currency = models.CharField(max_length=10, default='USD')
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)
    billing_terms = models.TextField(blank=True, default='Payment due within 15 days. Thank you for your business!')
    address = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Role(models.Model):
    company = models.ForeignKey(Company, related_name='roles', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    permissions = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']


class Product(SoftDeleteModel):
    company = models.ForeignKey(Company, related_name='products', on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    stock_qty = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=10)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    supplier = models.ForeignKey('Supplier', on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CompanyScopedManager()

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    def is_low_stock(self):
        return self.stock_qty < self.low_stock_threshold


class Customer(SoftDeleteModel):
    company = models.ForeignKey(Company, related_name='customers', on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=30)
    email = models.EmailField(blank=True)
    purchase_history = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CompanyScopedManager()

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Supplier(SoftDeleteModel):
    company = models.ForeignKey(Company, related_name='suppliers', on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=30)
    product_category = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CompanyScopedManager()

    class Meta:
        ordering = ['name']


class Employee(models.Model):
    company = models.ForeignKey(Company, related_name='employees', on_delete=models.CASCADE)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name='employee_profile', on_delete=models.CASCADE)
    assigned_permissions = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = CompanyScopedManager()

    class Meta:
        ordering = ['user__name']


class Invoice(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('unpaid', 'Unpaid'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
    ]

    company = models.ForeignKey(Company, related_name='invoices', on_delete=models.CASCADE)
    customer = models.ForeignKey(Customer, related_name='invoices', on_delete=models.PROTECT)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='unpaid')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CompanyScopedManager()

    class Meta:
        ordering = ['-created_at']


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, related_name='invoice_items', on_delete=models.PROTECT)
    qty = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    line_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        ordering = ['id']


class Notification(models.Model):
    TYPE_CHOICES = [
        ('low_stock', 'Low Stock'),
        ('invoice_created', 'Invoice Created'),
    ]

    company = models.ForeignKey(Company, related_name='notifications', on_delete=models.CASCADE)
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    source_record_id = models.PositiveIntegerField(default=0)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = CompanyScopedManager()

    class Meta:
        ordering = ['-created_at']


class AIChatLog(models.Model):
    company = models.ForeignKey(Company, related_name='ai_chat_logs', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='ai_chat_logs', on_delete=models.CASCADE)
    question = models.TextField()
    answer = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    objects = CompanyScopedManager()

    class Meta:
        ordering = ['-created_at']


class MLPrediction(models.Model):
    TYPE_CHOICES = [
        ('sales_forecast', 'Sales Forecast'),
        ('segment', 'Segment'),
        ('demand', 'Demand'),
    ]

    company = models.ForeignKey(Company, related_name='ml_predictions', on_delete=models.CASCADE)
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = CompanyScopedManager()

    class Meta:
        ordering = ['-created_at']


class AuditLog(models.Model):
    ACTION_TYPES = [
        ('PRODUCT_CREATED', 'Product Created'),
        ('PRODUCT_RESTOCKED', 'Product Restocked'),
        ('CUSTOMER_CREATED', 'Customer Created'),
        ('SUPPLIER_CREATED', 'Supplier Created'),
        ('INVOICE_CREATED', 'Invoice Created'),
        ('INVOICE_STATUS', 'Invoice Status Updated'),
        ('EMPLOYEE_ADDED', 'Employee Added'),
        ('BULK_IMPORT', 'Bulk Import Executed'),
        ('COMPANY_UPDATED', 'Company Details Updated'),
        ('GENERAL', 'General Event'),
    ]

    company = models.ForeignKey(Company, related_name='audit_logs', on_delete=models.CASCADE, null=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='audit_logs', on_delete=models.CASCADE)
    action = models.CharField(max_length=200)
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES, default='GENERAL')
    description = models.TextField(blank=True)
    ip_address = models.CharField(max_length=45, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    objects = CompanyScopedManager()

    class Meta:
        ordering = ['-timestamp']

    @classmethod
    def log(cls, request, action, action_type='GENERAL', description=''):
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return None
        company = getattr(user, 'company', None)
        ip = ''
        ua = ''
        if request:
            x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded:
                ip = x_forwarded.split(',')[0].strip()
            else:
                ip = request.META.get('REMOTE_ADDR', '')
            ua = request.META.get('HTTP_USER_AGENT', '')
        return cls.objects.create(
            company=company,
            user=user,
            action=action,
            action_type=action_type,
            description=description,
            ip_address=ip,
            user_agent=ua
        )
