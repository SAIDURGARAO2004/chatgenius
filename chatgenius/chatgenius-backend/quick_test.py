import requests
import json

print("Testing Google Gemini API...")
print("=" * 50)

try:
    response = requests.post(
        "http://localhost:5001/ai/chat",
        json={"message": "Say hello in 5 words"},
        headers={"Content-Type": "application/json"},
        timeout=30
    )
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✓ SUCCESS!")
        print(f"AI Response: {data.get('reply')}")
    else:
        print(f"\n✗ Error Response:")
        print(response.text[:500])
        
except Exception as e:
    print(f"\n✗ Request Failed: {e}")

print("=" * 50)
