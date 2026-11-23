import requests
import json

# Test the AI endpoint
url = "http://localhost:8080/ai/chat"
headers = {"Content-Type": "application/json"}
data = {"message": "Hello, introduce yourself in one sentence"}

print("🧪 Testing ChatGenius AI API...")
print(f"📡 Sending request to: {url}")
print(f"💬 Message: {data['message']}\n")

try:
    response = requests.post(url, headers=headers, json=data, timeout=30)
    
    if response.status_code == 200:
        result = response.json()
        print("✅ SUCCESS! AI responded:")
        print(f"🤖 {result.get('reply', 'No reply found')}\n")
        print("=" * 60)
        print("✅ Backend is working correctly!")
        print("✅ Google Gemini AI is responding!")
        print("✅ CORS is configured properly!")
        print("=" * 60)
    else:
        print(f"❌ Error: HTTP {response.status_code}")
        print(f"Response: {response.text}")
        
except requests.exceptions.ConnectionError:
    print("❌ Connection Error: Cannot connect to backend server")
    print("Make sure the server is running on http://localhost:8080")
except requests.exceptions.Timeout:
    print("❌ Timeout: Server took too long to respond")
except Exception as e:
    print(f"❌ Error: {e}")
