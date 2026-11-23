import requests
import json

# Test the backend API on new port
API_URL = "http://localhost:5001"

print("Testing ChatGenius Backend API on Port 5001...")
print("=" * 50)

# Test AI Chat endpoint
try:
    print("\nTesting AI Chat endpoint with Google Gemini...")
    response = requests.post(
        f"{API_URL}/ai/chat",
        json={"message": "Say hello in one sentence"},
        headers={"Content-Type": "application/json"},
        timeout=30
    )
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✓ SUCCESS!")
        print(f"AI Response: {data.get('reply', 'No reply')}")
    else:
        print(f"✗ Error: {response.text}")
except Exception as e:
    print(f"✗ AI Chat Failed: {e}")

print("\n" + "=" * 50)
print("Testing complete!")
