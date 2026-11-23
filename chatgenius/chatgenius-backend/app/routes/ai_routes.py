SYSTEM_INSTRUCTION = """
You are a helpful, friendly AI assistant.
Respond naturally like a human in a chat.
Handle both complex questions and simple casual messages.
Keep responses short and friendly when appropriate.
"""

from flask import Blueprint, request, jsonify, current_app, session
import time
import base64
import mimetypes
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.ai_conversation import AIConversation
from app.services.ai_service import ask_gemini, generate_image_gemini
import io

ai_bp = Blueprint("ai", __name__)


@ai_bp.route("/ai/clear_history", methods=["POST", "OPTIONS"])
def clear_history():
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
    session.pop("chat_history", None)
    session.modified = True
    return jsonify({"success": True}), 200

# ================= CHAT =================
@ai_bp.route("/ai/chat", methods=["POST"])
@jwt_required(optional=True)
def ai_chat():
    try:
        user_id = get_jwt_identity()
        
        # Determine if we are handling multipart (files) or JSON (text only)
        if request.content_type and request.content_type.startswith("multipart/form-data"):
            user_msg = request.form.get("message", "")
            chatId = request.form.get("conversation_id")
            files = request.files.getlist("files")
        else:
            data = request.get_json() or {}
            user_msg = data.get("message", "")
            chatId = data.get("conversation_id")
            files = []

        if not chatId:
            return jsonify({"error": "conversation_id required"}), 400

        # Fetch history from DATABASE for real context
        from app.services.ai_service import get_ai_history
        history = get_ai_history(chatId)

        file_bytes = None
        mime_type = None

        # If a file is provided, prioritize FIRST file for multimodal analysis
        if files:
            f = files[0]
            if f.filename:
                file_bytes = base64.b64encode(f.read()).decode('utf-8')
                import mimetypes
                mime_type = mimetypes.guess_type(f.filename)[0] or 'application/octet-stream'

        # Generate AI reply
        reply = ask_gemini(user_msg, history=history, file_bytes=file_bytes, mime_type=mime_type)

        # Persist reply to database ONLY if user is logged in
        if user_id:
            _persist_ai_chat(user_id, chatId, user_msg, reply)

        return jsonify({"reply": reply})

    except Exception as e:
        current_app.logger.error(f"Chat error: {e}")
        return jsonify({"error": str(e)}), 500


# ================= SAVE CHAT =================
def _persist_ai_chat(user_id, conversation_id, user_msg, ai_reply):
    try:
        from app.models.message import Message
        
        # 1. Save to the main Message table (Official)
        # Check if user msg already exists (might have been saved by frontend)
        # To avoid duplicates, we can check for recent identical content or just save the reply
        
        # Actually, the user message is saved by frontend via POST /api/messages.
        # We only need to save the AI reply.
        
        ai_msg = Message(
            conversation_id=conversation_id,
            sender_id=user_id, # Or a system/ai user id if we had one, but currently we use user_id to link
            content=ai_reply,
            message_type="ai_text"
        )
        db.session.add(ai_msg)
        
        # 2. Update AIConversation (Session history)
        ai_conv = AIConversation.query.filter_by(user_id=user_id).first()
        if not ai_conv:
            ai_conv = AIConversation(user_id=user_id, chat_history=[])
            db.session.add(ai_conv)
        
        history = list(ai_conv.chat_history)
        history.append({"role": "user", "content": user_msg, "timestamp": time.time()})
        history.append({"role": "assistant", "content": ai_reply, "timestamp": time.time()})
        
        if len(history) > 100:
            history = history[-100:]
            
        ai_conv.chat_history = history
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"DB error: {e}")