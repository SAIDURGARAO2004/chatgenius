"""
Test script to verify Gemini API connectivity and quota status
"""
from google import genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ GOOGLE_API_KEY not found in environment")
    exit(1)

print(f"✓ API Key found: {api_key[:20]}...")
print("\nTesting Gemini API...")
print("=" * 60)

try:
    client = genai.Client(api_key=api_key)
    
    # Test 1: Simple chat
    print("\n1. Testing simple chat...")
    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents="Say hello in one sentence"
    )
    print(f"✓ Chat works! Response: {response.text}")
    
    # Test 2: Multiple requests to check quota
    print("\n2. Testing multiple requests (checking quota)...")
    for i in range(5):
        try:
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=f"Count to {i+1}"
            )
            print(f"  Request {i+1}/5: ✓ Success")
        except Exception as e:
            print(f"  Request {i+1}/5: ✗ Failed - {str(e)[:100]}")
            if "quota" in str(e).lower() or "rate" in str(e).lower():
                print("\n⚠️  QUOTA/RATE LIMIT DETECTED!")
                print("This is likely why you're seeing 'only 2 chats' limitation.")
                break
    
    print("\n" + "=" * 60)
    print("✓ Gemini API is working!")
    print("\nNote: Free tier limits:")
    print("  - Gemini 1.5 Flash: 15 requests/minute, 1500 requests/day")
    print("  - If you hit the limit, the app will use mock responses")
    
except Exception as e:
    print(f"\n❌ Gemini API Error: {e}")
    print("\nThis error will cause the app to use mock AI responses.")
