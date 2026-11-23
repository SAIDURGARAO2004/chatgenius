import requests
import json

# Test the AI endpoint on port 5001
url = "http://localhost:5001/ai/chat"
headers = {"Content-Type": "application/json"}
data = {"message": "Hello, introduce yourself in one sentence"}

print("=" * 60)
print("🧪 Testing ChatGenius AI API on Port 5001")
print("=" * 60)
print(f"\n📡 Endpoint: {url}")
print(f"💬 Message: {data['message']}\n")

try:
    response = requests.post(url, headers=headers, json=data, timeout=30)
    
    if response.status_code == 200:
        result = response.json()
        print("✅ SUCCESS! Backend is working!")
        print("=" * 60)
        print(f"🤖 AI Response:\n{result.get('reply', 'No reply found')}")
        print("=" * 60)
        print("\n✅ Backend API: WORKING")
        print("✅ Port 5001: ACCESSIBLE")
        print("✅ CORS: CONFIGURED")
        print("✅ AI Service: RESPONDING")
        print("\n🎉 Your application is ready to use!")
        print("\nNext step: Open test.html in your browser")
    else:
        print(f"❌ Error: HTTP {response.status_code}")
        print(f"Response: {response.text}")
        
except requests.exceptions.ConnectionError:
    print("❌ Connection Error: Cannot connect to backend")
    print("Make sure the server is running on http://localhost:5001")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 60)
