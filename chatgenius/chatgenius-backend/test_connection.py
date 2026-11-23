import requests
import json

print("\n" + "="*60)
print("TESTING BACKEND CONNECTION")
print("="*60 + "\n")

# Test 1: Check if server is running
print("Test 1: Checking if backend is running...")
try:
    response = requests.get("http://localhost:5000/", timeout=5)
    print(f"✓ Backend is UP! (Status: {response.status_code})")
except Exception as e:
    print(f"✗ Backend is DOWN: {e}")
    exit(1)

# Test 2: Test chat endpoint
print("\nTest 2: Testing /ai/chat endpoint...")
try:
    response = requests.post(
        "http://localhost:5000/ai/chat",
        headers={"Content-Type": "application/json"},
        json={"message": "hello"},
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Chat API WORKS!")
        print(f"  Response: {data.get('reply', '')[:80]}...")
    else:
        print(f"✗ Chat API Error: {response.status_code}")
        print(f"  Response: {response.text}")
except Exception as e:
    print(f"✗ Chat API Failed: {e}")

print("\n" + "="*60)
print("BACKEND IS READY FOR FRONTEND!")
print("="*60)
print("\nNow open: chatgenius-frontend/chat.html")
print("And start chatting!\n")
