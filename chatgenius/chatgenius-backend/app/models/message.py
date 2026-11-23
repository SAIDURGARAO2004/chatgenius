from app.extensions import db
from datetime import datetime

class Message(db.Model):
    id = db.Column(db.BigInteger, primary_key=True)
    conversation_id = db.Column(db.BigInteger, db.ForeignKey('conversation.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text)
    message_type = db.Column(db.String(20), default="text")
    parent_id = db.Column(db.BigInteger, db.ForeignKey('message.id'))
    is_pinned = db.Column(db.Boolean, default=False)
    msg_metadata = db.Column(db.JSON, default=dict)  # Extra info (dimensions, file size, etc)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    replies = db.relationship('Message', backref=db.backref('parent', remote_side="Message.id"), lazy=True)

    @property
    def reactions_list(self):
        from app.models.reaction import Reaction
        return [{"user_id": r.user_id, "emoji": r.emoji} for r in self.reactions]
