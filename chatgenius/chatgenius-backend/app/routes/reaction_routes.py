from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..models.reaction import Reaction

reaction_bp = Blueprint("reaction", __name__)


@reaction_bp.route("/api/messages/<string:message_id>/react", methods=["POST"])
@jwt_required()
def add_reaction(message_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        # 🔥 Validate input
        if not data or "emoji" not in data:
            return jsonify({"error": "Emoji is required"}), 400

        emoji = data.get("emoji")

        # 🔥 Convert safely
        try:
            message_id_int = int(message_id)
            user_id_int = int(user_id)
        except ValueError:
            return jsonify({"error": "Invalid ID format"}), 400

        # 🔥 Optional: prevent duplicate reaction (same user + same message)
        existing = Reaction.query.filter_by(
            message_id=message_id_int,
            user_id=user_id_int
        ).first()

        if existing:
            # update emoji instead of inserting new row
            existing.emoji = emoji
            db.session.commit()
            
            # 🔥 EMIT via SocketIO
            try:
                from app.extensions import socketio
                from app.models.message import Message
                msg = Message.query.get(message_id_int)
                if msg:
                    socketio.emit("reaction_added", {
                        "message_id": message_id_int,
                        "emoji": emoji,
                        "user_id": user_id_int,
                        "conversation_id": msg.conversation_id
                    }, room=msg.conversation_id)
            except Exception:
                pass

            return jsonify({"msg": "Reaction updated"}), 200

        # 🔥 Create new reaction
        reaction = Reaction(
            message_id=message_id_int,
            user_id=user_id_int,
            emoji=emoji
        )

        db.session.add(reaction)
        db.session.commit()

        # 🔥 EMIT via SocketIO
        try:
            from app.extensions import socketio
            from app.models.message import Message
            msg = Message.query.get(message_id_int)
            if msg:
                socketio.emit("reaction_added", {
                    "message_id": message_id_int,
                    "emoji": emoji,
                    "user_id": user_id_int,
                    "conversation_id": msg.conversation_id
                }, room=msg.conversation_id)
        except Exception:
            pass

        return jsonify({"msg": "Reaction saved"}), 201

    except Exception as e:
        print("Reaction Error:", e)
        return jsonify({"error": "Internal server error"}), 500