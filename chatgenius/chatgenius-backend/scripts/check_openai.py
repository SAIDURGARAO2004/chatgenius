import requests
import os

key = os.getenv('OPENAI_API_KEY')
if not key:
    # try to load from .env in backend folder
    try:
        with open('.env', 'r') as f:
            for line in f:
                if line.strip().startswith('OPENAI_API_KEY='):
                    key = line.strip().split('=', 1)[1]
                    break
    except Exception:
        pass
    if not key:
        print('No OPENAI_API_KEY in environment or .env')
        exit(1)

url = 'https://api.openai.com/v1/chat/completions'
headers = {'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'}
model = os.getenv('OPENAI_MODEL')
if not model:
    try:
        with open('.env','r') as f:
            for line in f:
                if line.strip().startswith('OPENAI_MODEL='):
                    model = line.strip().split('=',1)[1]
                    break
    except Exception:
        pass
if not model:
    model = 'gpt-3.5-turbo'

payload = {
    'model': model,
    'messages': [
        {'role': 'system', 'content': 'You are a concise, factual assistant. Always answer directly and do NOT ask clarifying questions.'},
        {'role': 'user', 'content': 'Give a one-line definition of cricket.'}
    ],
    'temperature': 0.0,
}

try:
    r = requests.post(url, headers=headers, json=payload, timeout=20)
    print('status', r.status_code)
    print(r.text)
except Exception as e:
    print('ERROR', e)
