import requests
import django

base = 'http://127.0.0.1:8000/api'

token = requests.post(base + '/auth/login/', json={'email': 'phase1@example.com', 'password': 'StrongPass1!'}).json()['access']
headers = {'Authorization': f'Bearer {token}'}

django.setup()
from core.models import Company, Product, Customer

company = Company.objects.get(owner__email='phase1@example.com')
product = Product.objects.filter(company=company).first()
customer = Customer.objects.filter(company=company).first()

payload = {
    'customer': customer.id,
    'items': [{
        'product': product.id,
        'qty': 1,
        'unit_price': str(product.price),
        'line_total': str(product.price),
    }],
}

create_resp = requests.post(base + '/invoices/', json=payload, headers=headers)
print('create', create_resp.status_code, create_resp.text)
invoice_id = create_resp.json()['id']
confirm_resp = requests.post(base + f'/invoices/{invoice_id}/confirm/', headers=headers)
print('confirm', confirm_resp.status_code, confirm_resp.text)
product.refresh_from_db()
print('stock', product.stock_qty)
