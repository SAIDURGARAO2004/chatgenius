from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.conversation_participant import ConversationParticipant

app = create_app()
with app.app_context():
    print(f"Total Users: {User.query.count()}")
    print(f"Total Conversations: {Conversation.query.count()}")
    print(f"Total Participants: {ConversationParticipant.query.count()}")
    print(f"Total Messages: {Message.query.count()}")
    
    print("\nRecent Conversations:")
    for c in Conversation.query.limit(5).all():
        print(f"ID: {c.id}, Name: {c.name}, Type: {c.type}, Creator ID: {c.creator_id}")
        
    print("\nRecent Messages:")
    for m in Message.query.limit(5).all():
        print(f"ID: {m.id}, ConvID: {m.conversation_id}, SenderID: {m.sender_id}, Content: {m.content[:50]}...")
