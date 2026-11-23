import sys
import os

# Ensure backend package is importable when running from scripts/
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app import create_app

app = create_app()

with app.test_client() as client:
    resp = client.post('/ai/chat', json={'message': 'Endpoint test: say hi in one sentence'})
    print('STATUS', resp.status_code)
    print('DATA', resp.get_data(as_text=True))
