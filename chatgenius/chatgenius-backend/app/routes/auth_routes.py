from flask import Blueprint, request, jsonify
from app.extensions import db, bcrypt
from app.models.user import User
from flask_jwt_extended import create_access_token

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


# REGISTER USER
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json

    existing_user = User.query.filter_by(email=data["email"]).first()
    if existing_user:
        return jsonify(error="User already exists"), 400

    hashed = bcrypt.generate_password_hash(data["password"]).decode("utf-8")

    user = User(
        username=data["username"],
        email=data["email"],
        password_hash=hashed,
        is_online=False
    )

    db.session.add(user)
    db.session.commit()

    return jsonify(message="User registered successfully")


# LOGIN USER (AUTO CREATE USER IF NOT EXISTS)
# LOGIN USER
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json

    user = User.query.filter_by(email=data["email"]).first()

    if not user:
        return jsonify(error="User not found"), 404

    if not bcrypt.check_password_hash(user.password_hash, data["password"]):
        return jsonify(error="Invalid credentials"), 401

    user.is_online = True
    db.session.commit()

    # ✅ FIX HERE
    token = create_access_token(identity=str(user.id))

    return jsonify({
        "message": "Login successful",
        "access_token": token,
        "user_id": user.id,
        "username": user.username
    })