import requests
import re

base='http://127.0.0.1:8000/api'
token=requests.post(base+'/auth/login/', json={'email':'phase1@example.com','password':'StrongPass1!'}).json()['access']
headers={'Authorization':f'Bearer {token}'}
payload={'customer':21,'items':[{'product':25,'qty':1,'unit_price':'25.00','line_total':'25.00'}]}
resp=requests.post(base+'/invoices/', json=payload, headers=headers, timeout=10)
text=resp.text
m=re.search(r'<pre class="exception_value">(.*?)</pre>', text, re.S)
print('EXCEPTION')
print(m.group(1) if m else 'none')
print('---TRACEBACK---')
for frame in re.finditer(r'<li class="frame".*?>(.*?)</li>', text, re.S):
    print(frame.group(1)[:4000])
    print('---')
