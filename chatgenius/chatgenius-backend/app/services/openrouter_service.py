import os
import requests

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

def ask_openrouter(prompt):
    headers = {
        "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",  # required by OpenRouter
        "X-Title": "ChatGenius"
    }

    payload = {
        "model": "openai/gpt-3.5-turbo",
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    response = requests.post(OPENROUTER_URL, json=payload, headers=headers)

    if response.status_code != 200:
        raise Exception(response.text)

    return response.json()["choices"][0]["message"]["content"]
