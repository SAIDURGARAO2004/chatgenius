"""Quick API test"""
import requests

try:
    response = requests.get('http://127.0.0.1:5000/api/auth/register', timeout=2)
    print(f"✅ Backend API is responding!")
    print(f"Status: {response.status_code}")
except Exception as e:
    print(f"Testing backend... {e}")
