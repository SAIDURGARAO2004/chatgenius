import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Test Google API Key
api_key = os.getenv("GOOGLE_API_KEY")
print(f"API Key: {api_key}")
print(f"API Key length: {len(api_key) if api_key else 0}")

# Try importing and testing
try:
    import google.generativeai as genai
    print("✓ google.generativeai imported successfully")
    
    genai.configure(api_key=api_key)
    print("✓ API configured")
    
    # List available models
    print("\nAttempting to list models...")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"  - {m.name}")
            break
    
    # Try generating content
    print("\nTesting content generation...")
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content("Hello")
    print(f"✓ Success! Response: {response.text}")
    
except Exception as e:
    print(f"\n✗ Error: {e}")
    import traceback
    traceback.print_exc()
