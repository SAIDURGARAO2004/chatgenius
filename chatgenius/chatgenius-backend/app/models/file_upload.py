from app.extensions import db
from datetime import datetime

class FileUpload(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    message_id = db.Column(db.BigInteger, db.ForeignKey('message.id'), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50))
    file_name = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    message = db.relationship('Message', backref=db.backref('attachments', lazy=True, cascade="all, delete-orphan"))
