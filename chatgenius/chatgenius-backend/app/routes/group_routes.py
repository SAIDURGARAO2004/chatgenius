from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.conversation import Conversation
from app.models.conversation_participant import ConversationParticipant

group_bp = Blueprint("group", __name__, url_prefix="/api/groups")

# TEMP in-memory store (later DB)
# GROUPS = {}

@group_bp.route("", methods=["POST"])
@jwt_required()
def create_group():
    data = request.json
    user_id = get_jwt_identity()
    
    group = Conversation(
        type="group",
        name=data.get("title", "Group Chat"),
        description=data.get("description"),
        creator_id=user_id
    )
    db.session.add(group)
    db.session.flush()
    
    # Add creator as a participant
    participant = ConversationParticipant(
        conversation_id=group.id,
        user_id=user_id
    )
    db.session.add(participant)
    
    # Add other members if provided
    members = data.get("members", [])
    for member_id in members:
        if member_id != user_id:
            p = ConversationParticipant(
                conversation_id=group.id,
                user_id=member_id
            )
            db.session.add(p)
            
    db.session.commit()
    return jsonify({"id": group.id, "success": True}), 201

@group_bp.route("/<int:group_id>", methods=["GET"])
@jwt_required()
def get_group(group_id):
    group = Conversation.query.filter_by(id=group_id, type="group").first()
    if not group:
        return jsonify({"error": "Group not found"}), 404

    return jsonify({
        "id": group.id,
        "title": group.name,
        "description": group.description,
        "creator_id": group.creator_id,
        "created_at": group.created_at.isoformat()
    })

@group_bp.route("/<int:group_id>", methods=["PUT"])
@jwt_required()
def update_group(group_id):
    data = request.json
    group = Conversation.query.filter_by(id=group_id, type="group").first()
    if not group:
        return jsonify({"error": "Group not found"}), 404

    group.name = data.get("title", group.name)
    db.session.commit()
    
    # Emit socket event for real-time name update
    try:
        from app.extensions import socketio
        socketio.emit("group_updated", {
            "id": group.id,
            "title": group.name
        }, room=str(group_id))
    except Exception as e:
        print(f"Socket emit error: {e}")
    
    return jsonify({
        "id": group.id,
        "title": group.name,
        "success": True
    })