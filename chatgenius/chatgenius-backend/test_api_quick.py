import requests
import json

print("Testing ChatGenius Backend API...")
print("=" * 50)

# Test 1: Check if backend is running
try:
    response = requests.get("http://localhost:5000/")
    print(f"✓ Backend is running (Status: {response.status_code})")
except Exception as e:
    print(f"✗ Backend connection failed: {e}")
    exit(1)

# Test 2: Test chat endpoint
print("\nTesting /ai/chat endpoint...")
try:
    response = requests.post(
        "http://localhost:5000/ai/chat",
        headers={"Content-Type": "application/json"},
        json={"message": "hello"},
        timeout=30
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Chat API working! Reply: {data.get('reply', 'No reply')}")
    else:
        print(f"✗ Chat API returned error: {response.status_code}")
except requests.exceptions.Timeout:
    print("✗ Request timed out - API is taking too long to respond")
except Exception as e:
    print(f"✗ Chat API failed: {e}")

print("\n" + "=" * 50)
print("Test complete!")
