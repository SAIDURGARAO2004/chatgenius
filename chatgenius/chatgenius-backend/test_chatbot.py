"""
Simple test to verify the chatbot is working
"""
import requests
import time

BASE_URL = "http://localhost:5000"

print("=" * 60)
print("CHATBOT FUNCTIONALITY TEST")
print("=" * 60)

# Test messages
test_messages = [
    "hello",
    "how are you",
    "tell me a joke",
    "what can you do",
    "thank you"
]

print("\nSending test messages to chatbot...\n")

for i, message in enumerate(test_messages, 1):
    print(f"\n[{i}/5] User: {message}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/ai/chat",
            json={"message": message},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            reply = data.get("reply", "No reply")
            print(f"    AI: {reply[:100]}{'...' if len(reply) > 100 else ''}")
            print(f"    Status: ✓ SUCCESS")
        else:
            print(f"    Status: ✗ ERROR {response.status_code}")
            print(f"    Response: {response.text}")
    except Exception as e:
        print(f"    Status: ✗ FAILED - {str(e)}")
    
    time.sleep(0.5)  # Small delay between requests

print("\n" + "=" * 60)
print("TEST COMPLETE!")
print("=" * 60)
print("\nIf all 5 messages show '✓ SUCCESS', your chatbot is working!")
