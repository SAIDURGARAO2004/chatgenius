import warnings
warnings.filterwarnings('ignore', category=FutureWarning)

import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

try:
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if api_key:
        print(f"API Key found: {api_key[:20]}...")
    else:
        print("No API key found in environment")
    
    # Configure Gemini
    genai.configure(api_key=api_key)
    print("✓ API configured")
    
    # Create model: prefer configured model, otherwise list available models
    preferred = os.getenv("GEMINI_MODEL") or os.getenv("GEMINI_PREFERRED_MODEL") or "gemini-1.5-flash"
    selected_model = preferred
    try:
        # List models and pick one that supports generateContent if preferred isn't available
        for m in genai.list_models():
            methods = getattr(m, 'supported_generation_methods', []) or []
            if selected_model == m.name and 'generateContent' in methods:
                selected_model = m.name
                break
        else:
            # pick first model that supports generateContent
            for m in genai.list_models():
                methods = getattr(m, 'supported_generation_methods', []) or []
                if 'generateContent' in methods:
                    selected_model = m.name
                    break

    except Exception:
        # If listing fails, fall back to preferred
        selected_model = preferred

    print(f"Using Gemini model: {selected_model}")

    model = genai.GenerativeModel(selected_model)
    print("✓ Model created")

    # Generate content
    print("\nSending request to Gemini...")
    response = model.generate_content("Say hello in one sentence")
    print("✓ Response received")
    
    print(f"\n🤖 AI Response: {response.text}")
    print("\n✅ SUCCESS! Google Gemini AI is working!")
    
except Exception as e:
    print(f"\n❌ ERROR: {type(e).__name__}")
    print(f"Message: {str(e)}")
    import traceback
    traceback.print_exc()
