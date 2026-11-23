from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.message import Message
from app.models.conversation import Conversation
from app.models.conversation_participant import ConversationParticipant
from datetime import datetime

message_bp = Blueprint("message", __name__, url_prefix="/api/messages")


@message_bp.route("", methods=["POST"])
@jwt_required()
def send_message():
    import os
    import uuid
    from flask import current_app
    from app.models.file_upload import FileUpload

    if request.content_type and request.content_type.startswith("multipart/form-data"):
        data = request.form
        files = request.files.getlist("files")
    else:
        data = request.get_json() or {}
        files = []

    user_id = get_jwt_identity()
    
    conv_id = data.get("conversation_id")
    content = data.get("content")
    msg_type = data.get("type", "text")
    parent_id = data.get("parent_id")
    
    if not conv_id or not content:
        return jsonify({"error": "Missing conversation_id or content"}), 400

    conv = Conversation.query.get(conv_id)
    if not conv:
        conv = Conversation(id=conv_id, type="direct", name="New Chat")
        db.session.add(conv)
        db.session.flush()

    participant = ConversationParticipant.query.filter_by(
        conversation_id=conv_id, 
        user_id=user_id
    ).first()
    
    if not participant:
        participant = ConversationParticipant(
            conversation_id=conv_id,
            user_id=user_id
        )
        db.session.add(participant)
        
    message = Message(
        conversation_id=conv_id,
        sender_id=user_id,
        content=content,
        message_type=msg_type,
        parent_id=parent_id
    )
    db.session.add(message)
    db.session.flush()
    
    conv.last_message_at = datetime.utcnow()
        
    if files:
        upload_dir = current_app.config["UPLOAD_FOLDER"]
        os.makedirs(upload_dir, exist_ok=True)
        for f in files:
            if f.filename:
                safe_filename = f"{uuid.uuid4()}_{secure_filename(f.filename) or 'file'}"
                file_path = os.path.join(upload_dir, safe_filename)
                f.save(file_path)
                
                file_url = f"/uploads/{safe_filename}"
                
                file_record = FileUpload(
                    message_id=message.id,
                    file_path=file_url,
                    file_type=f.filename.split('.')[-1] if '.' in f.filename else 'unknown',
                    file_name=f.filename
                )
                db.session.add(file_record)

    db.session.commit()
    
    # Trigger AI response ONLY for group chats with @ai prefix
    # Normal (1-to-1) chats are handles by the frontend via /ai/chat call
    clean_content = content.strip().lower()
    if (conv.type == "group" and clean_content.startswith("@ai")):
        try:
            from app.services.ai_service import ask_gemini, get_ai_history
            from flask_socketio import emit
            from app.extensions import socketio
            
            # Fetch history from DB
            conv_id_int = int(conv_id)
            history = get_ai_history(conv_id_int)
            current_app.logger.info(f"Triggering AI for conversation {conv_id_int}")
            
            # If multimodal (was saved above)
            file_bytes = None
            mime_type = None
            if files:
                # Use the last file saved
                with open(file_path, "rb") as f:
                    import base64
                    file_bytes = base64.b64encode(f.read()).decode('utf-8')
                    import mimetypes
                    mime_type = mimetypes.guess_type(files[0].filename)[0] or "application/octet-stream"

            # 1. EMIT TYPING INDICATOR via SocketIO
            room_id = str(conv_id)
            socketio.emit("ai_typing", {"conversation_id": conv_id, "is_typing": True}, room=room_id)

            # 2. GENERATE AI REPLY
            reply = ask_gemini(content, history=history, file_bytes=file_bytes, mime_type=mime_type)
            
            # Robust verification
            if not reply or not reply.strip():
                reply = "⚠️ AI failed to generate a response. Please try again with @ai later."
            
            print(f"DEBUG BACKEND: Sending AI Reply to Group -> {reply}")

            # 3. PERSIST AI MESSAGE
            ai_message = Message(
                conversation_id=conv_id,
                sender_id=user_id, # Linking to user or a specific AI ID
                content=reply,
                message_type="ai_text"
            )
            db.session.add(ai_message)
            db.session.commit()

            # 4. EMIT AI MESSAGE via SocketIO
            ai_payload = {
                "id": ai_message.id,
                "text": ai_message.content,
                "user_id": ai_message.sender_id,
                "username": "ChatGenius",
                "conversation_id": ai_message.conversation_id,
                "created_at": ai_message.created_at.isoformat(),
                "type": "ai_text",
                "role": "ai"
            }
            socketio.emit("new_message", ai_payload, room=room_id)
            socketio.emit("ai_typing", {"conversation_id": conv_id, "is_typing": False}, room=room_id)
            current_app.logger.info(f"AI response emitted to room {room_id}")

        except Exception as e:
            current_app.logger.error(f"AI auto-trigger failed: {e}")
            import traceback
            current_app.logger.error(traceback.format_exc())
            
            import time
            socketio.emit("new_message", {
                "id": int(time.time() * 1000),
                "text": "❌ AI response failed to generate. Check backend logs.",
                "role": "ai",
                "conversation_id": conv_id,
                "message_type": "ai_text"
            }, room=str(conv_id))

    from app.models.user import User
    sender_obj = User.query.get(user_id)
    
    user_payload = {
        "id": message.id,
        "text": message.content,
        "user_id": message.sender_id,
        "username": sender_obj.username if sender_obj else "Unknown",
        "conversation_id": message.conversation_id,
        "created_at": message.created_at.isoformat(),
        "role": "user"
    }

    # Emit user message as well for real-time synchronization
    from app.extensions import socketio
    socketio.emit("new_message", user_payload, room=str(conv_id))

    return jsonify(user_payload), 201


@message_bp.route("/conversation/<int:conv_id>", methods=["GET"])
@jwt_required()
def get_messages(conv_id):
    user_id = get_jwt_identity()

    participant = ConversationParticipant.query.filter_by(
        conversation_id=conv_id, 
        user_id=user_id
    ).first()
    
    if not participant:
        conv = Conversation.query.get(conv_id)
        if not conv:
            return jsonify([])
        return jsonify({"error": "Unauthorized"}), 403

    messages = Message.query.filter_by(
        conversation_id=conv_id
    ).order_by(Message.created_at.asc()).all()
    
    results = []
    for msg in messages:
        results.append({
            "id": msg.id,
            "user_id": msg.sender_id,
            "username": msg.sender.username if msg.sender else "Unknown",
            "conversation_id": msg.conversation_id,
            "text": msg.content,
            "type": msg.message_type,
            "created_at": msg.created_at.isoformat(),
            "role": "ai" if msg.message_type == "ai_text" else "user",
            "reactions": [r.get("emoji") for r in msg.reactions_list],
            "attachments": [{"name": f.file_name, "url": f.file_path} for f in msg.attachments]
        })
        
    return jsonify(results)