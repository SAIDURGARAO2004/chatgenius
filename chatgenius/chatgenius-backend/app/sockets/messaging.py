import time
from flask_socketio import emit, join_room
from flask_jwt_extended import decode_token
from app.services.ai_service import ask_gemini  # Ensure this import is correct

def register_message_events(socketio):

    @socketio.on("join_conversation")
    def join(data):
        # 1. Join room using string ID for 100% sync reliability
        room_id = str(data.get("conversation_id"))
        join_room(room_id)
        print(f"✅ Socket Joined Room: {room_id}")

    @socketio.on("send_message")
    def handle_send_message(data):
        room_id = str(data.get("conversation_id"))
        user_text = data.get("text", "")

        # 2. Emit the user's message to EVERYONE in the room instantly (WhatsApp style)
        emit("new_message", data, room=room_id)
        print(f"📩 User Message Broadcasted to Room: {room_id}")

        # 3. AI Trigger Logic: Check for @ai in Group or Private Chat
        if "@ai" in user_text.lower():
            print(f"🤖 AI Triggered in Room: {room_id}")

            # Send 'Typing...' status to the group so users see the dots
            emit("ai_typing", {"conversation_id": room_id, "is_typing": True}, room=room_id)

            try:
                # Clean the prompt (remove @ai tag)
                clean_prompt = user_text.replace("@ai", "").strip()
                
                # Call our simplified ask_gemini function with history context
                from app.services.ai_service import get_ai_history
                history = get_ai_history(room_id)
                ai_reply = ask_gemini(clean_prompt, history=history)

                # Prepare AI message payload
                ai_msg_data = {
                    "conversation_id": room_id,
                    "text": ai_reply,
                    "sender_name": "ChatGenius",
                    "role": "model",
                    "message_type": "ai_text",
                    "id": int(time.time() * 1000) # Generate unique ID
                }

                # Stop Typing status
                emit("ai_typing", {"conversation_id": room_id, "is_typing": False}, room=room_id)

                # Send AI message to everyone in the room
                emit("new_message", ai_msg_data, room=room_id)
                print(f"✅ AI Response Sent to Room: {room_id}")

            except Exception as e:
                print(f"❌ AI Error in Sockets: {e}")
                emit("ai_typing", {"conversation_id": room_id, "is_typing": False}, room=room_id)

    @socketio.on("add_reaction")
    def add_reaction(data):
        room_id = str(data.get("conversation_id"))
        emit("reaction_added", data, room=room_id)

    @socketio.on("remove_reaction")
    def remove_reaction(data):
        room_id = str(data.get("conversation_id"))
        emit("reaction_removed", data, room=room_id)