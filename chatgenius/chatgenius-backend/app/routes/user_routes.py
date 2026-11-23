from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.user import User

user_bp = Blueprint("user", __name__, url_prefix="/api/users")


@user_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():

    user_id = int(get_jwt_identity())# ✅ FIX
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "theme_preference": user.theme_preference,
        "registration_year": user.registration_year,
        "is_online": user.is_online
    })


@user_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():

    user_id = int(get_jwt_identity())   # ✅ FIX
    user = User.query.get(user_id)

    data = request.json

    if "full_name" in data:
        user.full_name = data["full_name"]

    if "theme_preference" in data:
        user.theme_preference = data["theme_preference"]

    db.session.commit()

    return jsonify({"message": "Profile updated"})


@user_bp.route("/search", methods=["GET"])
@jwt_required()
def search_users():

    query = request.args.get("q", "")

    users = User.query.filter(
        User.username.ilike(f"%{query}%")
    ).limit(10).all()

    return jsonify([
        {
            "id": u.id,
            "username": u.username,
            "email": u.email
        }
        for u in users
    ])
