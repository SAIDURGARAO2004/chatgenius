from app.extensions import db
from datetime import datetime

class Conversation(db.Model):
    id = db.Column(db.BigInteger, primary_key=True)
    type = db.Column(db.String(20))  # direct / group
    name = db.Column(db.String(100))
    description = db.Column(db.String(255))
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    last_message_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    creator = db.relationship('User', backref=db.backref('created_conversations', lazy=True))
    messages = db.relationship('Message', backref='conversation', lazy=True, cascade="all, delete-orphan")
