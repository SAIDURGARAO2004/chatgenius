import os
from google import genai
import sys

def list_models():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("No API Key")
        return
    
    try:
        client = genai.Client(api_key=api_key)
        print("Attempting to list models...")
        for m in client.models.list():
            print(f"Model ID: {m.name}, Name: {m.display_name}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_models()
