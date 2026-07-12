import requests
import re

base='http://127.0.0.1:8000/api'
token=requests.post(base+'/auth/login/', json={'email':'phase1@example.com','password':'StrongPass1!'}).json()['access']
headers={'Authorization':f'Bearer {token}'}
resp=requests.post(base+'/invoices/128/confirm/', headers=headers, timeout=10)
text=resp.text
m=re.search(r'<pre class="exception_value">(.*?)</pre>', text, re.S)
print(resp.status_code)
print(m.group(1) if m else text[:4000])
