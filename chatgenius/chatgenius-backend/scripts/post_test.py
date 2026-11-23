import requests
try:
    r = requests.post('http://localhost:5000/ai/chat', json={'message':'Test POST fallback behavior'}, timeout=30)
    print(r.status_code)
    print(r.text)
except Exception as e:
    print('ERROR', e)
