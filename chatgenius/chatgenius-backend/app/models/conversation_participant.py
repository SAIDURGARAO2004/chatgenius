from app.extensions import db
from datetime import datetime

class ConversationParticipant(db.Model):
    id = db.Column(db.BigInteger, primary_key=True)
    conversation_id = db.Column(db.BigInteger, db.ForeignKey('conversation.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    is_pinned = db.Column(db.Boolean, default=False)
    is_archived = db.Column(db.Boolean, default=False)
    last_read_at = db.Column(db.DateTime, default=datetime.utcnow)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    conversation = db.relationship('Conversation', backref=db.backref('participants', lazy=True, cascade="all, delete-orphan"))
    user = db.relationship('User', backref=db.backref('conversations_joined', lazy=True))
