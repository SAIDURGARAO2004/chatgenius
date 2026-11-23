import os
import base64
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load key from .env
load_dotenv()

def get_gemini_keys():
    # Priority on GOOGLE_API_KEY as per latest .env state
    key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    return [key] if key else []

def ask_gemini(user_message, history=None, file_bytes=None, mime_type=None):
    keys = get_gemini_keys()
    if not keys:
        return "⚠️ API Key missing! Set GOOGLE_API_KEY in .env."

    # Strip @ai tag
    if user_message and user_message.lower().startswith("@ai"):
        user_message = user_message[3:].strip()

    try:
        client = genai.Client(api_key=keys[0])
        
        contents = []
        
        # 1. Process History (Ensure alternating roles and no empty content)
        if history:
            for msg in history:
                role = "user" if msg.get('role') == 'user' else "model"
                content_text = msg.get('content', '').strip()
                
                if not content_text:
                    continue
                
                # Ensure roles alternate
                if contents and contents[-1].role == role:
                    contents[-1].parts.append(types.Part(text=content_text))
                else:
                    contents.append(types.Content(
                        role=role,
                        parts=[types.Part(text=content_text)]
                    ))
        
        # 2. Process Current Input (Text + Multi-modal)
        current_parts = []
        if file_bytes:
            try:
                # Decode base64 bytes if provided
                image_data = base64.b64decode(file_bytes)
                current_parts.append(types.Part(
                    inline_data=types.Blob(
                        data=image_data,
                        mime_type=mime_type or 'image/jpeg'
                    )
                ))
            except Exception as e:
                print(f"Error decoding image: {e}")

        if user_message:
            current_parts.append(types.Part(text=user_message))
        elif not current_parts:
            current_parts.append(types.Part(text="Hello"))

        # Append current input, merging with last history item if it was also a user role
        if contents and contents[-1].role == "user":
            contents[-1].parts.extend(current_parts)
        else:
            contents.append(types.Content(role="user", parts=current_parts))

        # 3. Call Gemini (Using gemini-2.5-flash which is the latest stable version in 2026)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction="You are a helpful, friendly AI assistant. Respond naturally like a human in a chat."
            )
        )
        
        if response and response.text:
            return response.text.strip()
            
        # Check for blocked responses
        if response and hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if candidate.finish_reason != 'STOP':
                return f"⚠️ Response blocked by safety filters (Reason: {candidate.finish_reason})."

        return "⚠️ Empty response from AI."

    except Exception as e:
        print(f"🔥 Gemini Error: {e}")
        error_msg = str(e)
        if "429" in error_msg:
            return "🆘 Gemini API Error: Rate limit exceeded or quota exhausted."
        if "401" in error_msg or "403" in error_msg:
            return "🆘 Gemini API Error: Invalid API Key or permission denied."
        return f"🆘 Gemini API Error: {error_msg}"

def generate_image_gemini(prompt):
    return None

def get_ai_history(conversation_id, limit=20):
    try:
        from app.models.message import Message
        # Fetch recent messages from this conversation
        # Note: conversation_id might be a string or int depending on where it's called from
        msgs = Message.query.filter_by(conversation_id=conversation_id)\
            .order_by(Message.created_at.desc())\
            .limit(limit).all()
        
        history = []
        # Reverse to get chronological order
        for m in reversed(msgs):
            # Map DB roles to Gemini roles
            # In our system: message_type 'ai_text' is model, others are user
            role = "user" if m.message_type != "ai_text" else "model"
            history.append({"role": role, "content": m.content})
        return history
    except Exception as e:
        print(f"DB History error: {e}")
        return []