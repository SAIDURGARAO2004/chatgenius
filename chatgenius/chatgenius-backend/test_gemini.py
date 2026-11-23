from google import genai

client = genai.Client(api_key="PASTE_YOUR_KEY_HERE")

res = client.models.generate_content(
    model="gemini-1.5-flash",
    contents="Hello"
)

print(res.text)