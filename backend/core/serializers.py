import re
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from core.models import Company, Customer, Employee, Invoice, InvoiceItem, Product, Supplier

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['email', 'name', 'phone', 'password', 'password_confirm']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        password = attrs['password']
        if len(password) < 8:
            raise serializers.ValidationError({'password': 'Password must be at least 8 characters.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        user.role = 'owner'
        user.email_verified = True
        user.save(update_fields=['role', 'email_verified'])
        return user


class LoginSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        return token

    def validate(self, attrs):
        email = attrs.get(self.username_field)
        password = attrs.get('password')
        user = None
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            pass

        if user and user.locked_until and user.locked_until > timezone.now():
            raise AuthenticationFailed('Account locked. Try again later.')

        if user and not user.email_verified:
            raise AuthenticationFailed('Email not verified. Please verify your account before logging in.')

        authenticated_user = authenticate(username=email, password=password)
        if authenticated_user is None:
            if user:
                user.failed_login_attempts = user.failed_login_attempts + 1
                if user.failed_login_attempts >= 5:
                    user.locked_until = timezone.now() + timedelta(minutes=15)
                user.save(update_fields=['failed_login_attempts', 'locked_until'])
            raise AuthenticationFailed('Invalid email or password.')

        if authenticated_user.failed_login_attempts or authenticated_user.locked_until:
            authenticated_user.failed_login_attempts = 0
            authenticated_user.locked_until = None
            authenticated_user.save(update_fields=['failed_login_attempts', 'locked_until'])

        return super().validate(attrs)


class EmailVerificationRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('No account found with this email.')
        return value

    def save(self):
        user = User.objects.get(email__iexact=self.validated_data['email'])
        token = PasswordResetTokenGenerator().make_token(user)
        return {'email': user.email, 'token': token}


class EmailVerificationConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    token = serializers.CharField()

    def save(self):
        user = User.objects.get(email__iexact=self.validated_data['email'])
        token = self.validated_data['token']
        if not PasswordResetTokenGenerator().check_token(user, token):
            raise serializers.ValidationError({'token': 'Invalid or expired token.'})
        user.email_verified = True
        user.save(update_fields=['email_verified'])
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('No account found with this email.')
        return value

    def save(self):
        user = User.objects.get(email__iexact=self.validated_data['email'])
        token = PasswordResetTokenGenerator().make_token(user)
        return {'email': user.email, 'token': token}


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return attrs

    def save(self):
        user = User.objects.get(email__iexact=self.validated_data['email'])
        token = self.validated_data['token']
        if not PasswordResetTokenGenerator().check_token(user, token):
            raise serializers.ValidationError({'token': 'Invalid or expired token.'})
        password = self.validated_data['password']
        validate_password(password)
        user.set_password(password)
        user.failed_login_attempts = 0
        user.locked_until = None
        user.save(update_fields=['password', 'failed_login_attempts', 'locked_until'])
        return user


class CompanySerializer(serializers.ModelSerializer):
    logo = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Company
        fields = ['id', 'name', 'category', 'currency', 'logo']

    def validate_category(self, value):
        company = getattr(self.context['request'].user, 'owned_company', None)
        if company and company.invoices.filter(status='confirmed').exists() and value != company.category:
            raise serializers.ValidationError('Category cannot be changed once invoices exist.')
        return value

    def validate_logo(self, file):
        if file is None:
            return file
        if file.size > 2 * 1024 * 1024:
            raise serializers.ValidationError('Logo must be smaller than 2MB.')
        valid_types = ['image/png', 'image/jpeg']
        if file.content_type not in valid_types:
            raise serializers.ValidationError('Logo must be a PNG or JPG image.')
        return file


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'price', 'stock_qty', 'low_stock_threshold', 'is_active']

    def validate_stock_qty(self, value):
        if value < 0:
            raise serializers.ValidationError('Stock cannot be negative.')
        return value


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'phone', 'email', 'is_active']

    def validate_phone(self, value):
        if self.instance is None and Customer.objects.filter(phone=value, company=self.context['request'].user.owned_company).exists():
            raise serializers.ValidationError('Phone already exists for this company.')
        return value


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'phone', 'product_category', 'is_active']


class EmployeeSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = Employee
        fields = ['id', 'email', 'password', 'assigned_permissions']

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data.pop('email'),
            password=validated_data.pop('password'),
            role='employee',
            name=validated_data.pop('email').split('@')[0],
        )
        employee = Employee.objects.create(user=user, company=self.context['request'].user.owned_company, **validated_data)
        return employee


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ['product', 'qty', 'unit_price', 'line_total']


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True)

    class Meta:
        model = Invoice
        fields = ['id', 'customer', 'status', 'subtotal', 'tax', 'total', 'created_at', 'items']
        read_only_fields = ['id', 'status', 'subtotal', 'tax', 'total', 'created_at']

    def validate(self, attrs):
        request = self.context['request']
        company = request.user.owned_company
        items = attrs.get('items', [])
        for item in items:
            product = Product.objects.get(id=item['product'].id, company=company)
            if item['qty'] > product.stock_qty:
                raise serializers.ValidationError({'detail': f'Not enough stock for {product.name}.'})
        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        invoice = Invoice.objects.create(company=self.context['request'].user.owned_company, customer=validated_data['customer'], status='draft')
        for item_data in items_data:
            product = Product.objects.get(id=item_data['product'].id, company=self.context['request'].user.owned_company)
            InvoiceItem.objects.create(invoice=invoice, product=product, qty=item_data['qty'], unit_price=product.price, line_total=product.price * item_data['qty'])
        invoice.subtotal = sum((item.line_total for item in invoice.items.all()), start=0)
        invoice.tax = invoice.subtotal * Decimal('0.1')
        invoice.total = invoice.subtotal + invoice.tax
        invoice.save()
        return invoice
