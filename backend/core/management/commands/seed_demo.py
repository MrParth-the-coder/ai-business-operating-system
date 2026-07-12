from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal
import random

from django.core.management.base import BaseCommand
from django.db import transaction

from core.models import AIChatLog, Company, Customer, Employee, Invoice, InvoiceItem, Notification, Product, Supplier, User


class Command(BaseCommand):
    help = 'Create demo companies, users, products, customers, invoices, and notifications for each business category.'

    def handle(self, *args, **options):
        random.seed(42)
        categories = ['retail', 'medical', 'education', 'restaurant']
        for category in categories:
            owner = User.objects.create_user(
                email=f'{category}_owner@example.com',
                password='demo1234',
                name=f'{category.title()} Owner',
                role='owner',
                is_active=True,
            )
            company = Company.objects.create(
                name=f'{category.title()} Demo Co',
                owner=owner,
                category=category,
                currency='USD',
                is_active=True,
            )
            employee = User.objects.create_user(
                email=f'{category}_employee@example.com',
                password='demo1234',
                name=f'{category.title()} Employee',
                role='employee',
                is_active=True,
            )
            Employee.objects.create(company=company, user=employee, assigned_permissions=['products', 'customers', 'invoices'])

            products = []
            for index in range(6):
                product = Product.objects.create(
                    company=company,
                    name=f'{category.title()} Product {index + 1}',
                    category=category,
                    price=Decimal(str(10 + index * 2.5)),
                    stock_qty=max(5, 40 - index * 5),
                    low_stock_threshold=10,
                    is_active=True,
                )
                products.append(product)

            suppliers = []
            for index in range(3):
                supplier = Supplier.objects.create(
                    company=company,
                    name=f'{category.title()} Supplier {index + 1}',
                    phone=f'07000000{index + 1}',
                    product_category=category,
                    is_active=True,
                )
                suppliers.append(supplier)

            customers = []
            for index in range(5):
                customer = Customer.objects.create(
                    company=company,
                    name=f'{category.title()} Customer {index + 1}',
                    phone=f'08000000{index + 1}',
                    email=f'{category}{index + 1}@example.com',
                    is_active=True,
                )
                customers.append(customer)

            today = date.today()
            for day_offset in range(30):
                sale_date = today - timedelta(days=29 - day_offset)
                customer = random.choice(customers)
                product = random.choice(products)
                qty = random.randint(1, 3)
                unit_price = product.price
                line_total = unit_price * qty
                invoice = Invoice.objects.create(
                    company=company,
                    customer=customer,
                    subtotal=line_total,
                    tax=line_total * Decimal('0.1'),
                    total=line_total * Decimal('1.1'),
                    status='confirmed',
                )
                InvoiceItem.objects.create(
                    invoice=invoice,
                    product=product,
                    qty=qty,
                    unit_price=unit_price,
                    line_total=line_total,
                )
                Notification.objects.create(
                    company=company,
                    type='invoice_created' if random.choice([True, False]) else 'low_stock',
                    source_record_id=invoice.id,
                    is_read=False,
                )
                AIChatLog.objects.create(
                    company=company,
                    user=owner,
                    question=f'How did sales perform for {sale_date}?',
                    answer='Sales are trending steadily.',
                )

        self.stdout.write(self.style.SUCCESS('Demo data seeded successfully.'))
