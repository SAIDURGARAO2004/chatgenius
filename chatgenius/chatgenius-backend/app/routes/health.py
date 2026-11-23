from flask import send_from_directory, Blueprint
import os

static_bp = Blueprint("static", __name__)

@static_bp.route("/favicon.ico")
def favicon():
    return send_from_directory(
        os.path.join(os.getcwd(), "app", "static"),
        "favicon.ico",
        mimetype="image/vnd.microsoft.icon"
    )
