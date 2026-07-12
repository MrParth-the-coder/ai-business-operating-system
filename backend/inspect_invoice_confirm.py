import requests
import django

base='http://127.0.0.1:8000/api'
token=requests.post(base+'/auth/login/', json={'email':'phase1@example.com','password':'StrongPass1!'}).json()['access']
headers={'Authorization':f'Bearer {token}'}

django.setup()
from core.models import Invoice

invoice=Invoice.objects.filter(company__owner__email='phase1@example.com').order_by('-id').first()
print('invoice', invoice.id, invoice.status)
resp=requests.post(base+f'/invoices/{invoice.id}/confirm/', headers=headers)
print('status', resp.status_code)
print(resp.text)
