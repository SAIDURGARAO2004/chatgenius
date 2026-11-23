from app.extensions import db
from datetime import datetime

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    full_name = db.Column(db.String(100))
    avatar_url = db.Column(db.String(255))
    theme_preference = db.Column(db.String(20), default="dark")
    
    # For Year Review and registration tracking
    registration_year = db.Column(db.Integer, default=lambda: datetime.utcnow().year)
    registration_date = db.Column(db.DateTime, default=datetime.utcnow)

    is_online = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    messages = db.relationship('Message', backref='sender', lazy=True)