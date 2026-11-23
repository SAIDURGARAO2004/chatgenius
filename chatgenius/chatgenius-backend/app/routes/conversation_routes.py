from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.conversation import Conversation
from app.models.conversation_participant import ConversationParticipant
from app.models.user import User

conversation_bp = Blueprint("conversation", __name__, url_prefix="/api/conversations")

@conversation_bp.route("", methods=["POST"])
@jwt_required()
def create_conversation():
    data = request.json
    user_id = get_jwt_identity()
    
    conv_type = data.get("type", "direct")
    name = data.get("name")
    participant_ids = data.get("participant_ids", [])
    
    # Ensure current user is a participant
    if user_id not in participant_ids:
        participant_ids.append(user_id)
        
    conversation = Conversation(
        type=conv_type,
        name=name,
        creator_id=user_id
    )
    db.session.add(conversation)
    db.session.flush() # Get conversation ID
    
    for p_id in participant_ids:
        participant = ConversationParticipant(
            conversation_id=conversation.id,
            user_id=p_id
        )
        db.session.add(participant)
        
    db.session.commit()
    return jsonify({"id": conversation.id, "message": "Conversation created"}), 201

@conversation_bp.route("", methods=["GET"])
@jwt_required()
def get_user_conversations():
    user_id = get_jwt_identity()
    
    # Join with participants to find conversations involving this user
    conversations = (
        db.session.query(Conversation)
        .join(ConversationParticipant)
        .filter(ConversationParticipant.user_id == user_id)
        .all()
    )
    
    results = []
    for conv in conversations:
        results.append({
            "id": conv.id,
            "type": conv.type,
            "name": conv.name,
            "created_at": conv.created_at.isoformat()
        })
        
    return jsonify(results)

@conversation_bp.route("/<int:conv_id>", methods=["PUT"])
@jwt_required()
def rename_conversation(conv_id):
    user_id = get_jwt_identity()
    data = request.json
    new_name = data.get("name")
    
    if not new_name:
        return jsonify({"error": "Name is required"}), 400
        
    # Check if user is a participant
    participant = ConversationParticipant.query.filter_by(
        conversation_id=conv_id, 
        user_id=user_id
    ).first()
    
    if not participant:
        return jsonify({"error": "Unauthorized"}), 403
        
    conv = Conversation.query.get(conv_id)
    if not conv:
        return jsonify({"error": "Conversation not found"}), 404
        
    conv.name = new_name
    db.session.commit()
    
    return jsonify({"message": "Conversation renamed"})

@conversation_bp.route("/<int:conv_id>", methods=["DELETE"])
@jwt_required()
def delete_conversation(conv_id):
    user_id = get_jwt_identity()
    
    # Secure: only creator or participant? 
    # Let's say any participant can "leave", but only creator can delete?
    # For this simple app, let's allow any participant to delete for themselves, 
    # but actual DB delete only if they are a participant.
    
    participant = ConversationParticipant.query.filter_by(
        conversation_id=conv_id, 
        user_id=user_id
    ).first()
    
    if not participant:
        return jsonify({"error": "Unauthorized"}), 403
        
    # In a more complex app, we'd just remove the participant.
    # Here, let's just delete the conversation if it's direct/ai to keep it simple.
    conv = Conversation.query.get(conv_id)
    if not conv:
        return jsonify({"error": "Conversation not found"}), 404
        
    db.session.delete(conv)
    db.session.commit()
    
    return jsonify({"message": "Conversation deleted"})

@conversation_bp.route("/join", methods=["POST"])
@jwt_required()
def join_conversation():
    user_id = get_jwt_identity()
    data = request.json or {}
    conv_id = data.get("conversation_id")

    print("Received conv_id:", conv_id)

    if not conv_id:
        return jsonify({"error": "Missing conversation_id"}), 400

    try:
        conv_id = int(conv_id)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid conversation_id type"}), 400

    conv = Conversation.query.get(conv_id)
    if not conv:
        return jsonify({"error": "Conversation not found"}), 404

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
        db.session.commit()

    return jsonify({"success": True, "message": "Joined successfully"})
