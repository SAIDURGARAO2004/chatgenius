from app.extensions import db
from datetime import datetime

class AIConversation(db.Model):
    id = db.Column(db.BigInteger, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    chat_history = db.Column(db.JSON, default=list)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('ai_conversations', lazy=True))
