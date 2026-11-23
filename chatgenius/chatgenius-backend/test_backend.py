import requests
import json

# Test the backend API
API_URL = "http://localhost:5000"

print("Testing ChatGenius Backend API...")
print("=" * 50)

# Test 1: Health check
try:
    response = requests.get(f"{API_URL}/api/health")
    print(f"\n✓ Health Check: {response.status_code}")
    if response.status_code == 200:
        print(f"  Response: {response.json()}")
except Exception as e:
    print(f"\n✗ Health Check Failed: {e}")

# Test 2: AI Chat endpoint
try:
    print("\n\nTesting AI Chat endpoint...")
    response = requests.post(
        f"{API_URL}/ai/chat",
        json={"message": "Hello, who are you?"},
        headers={"Content-Type": "application/json"}
    )
    print(f"✓ AI Chat: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  AI Response: {data.get('reply', 'No reply')}")
    else:
        print(f"  Error: {response.text}")
except Exception as e:
    print(f"\n✗ AI Chat Failed: {e}")

print("\n" + "=" * 50)
print("Testing complete!")
