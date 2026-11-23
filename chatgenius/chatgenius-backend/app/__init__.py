import os
from dotenv import load_dotenv
from flask import Flask, send_from_directory

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, "..", ".env"))

from .config import Config  # noqa: E402  (must come after load_dotenv)
from .extensions import db, jwt, socketio, cors, bcrypt, migrate  # noqa: E402


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    origins = app.config["CORS_ORIGINS"]

    # init extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(
        app,
        resources={r"/*": {
            "origins": origins,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        }},
        supports_credentials=True,
    )
    socketio.init_app(app, cors_allowed_origins=origins)

    # models must be imported so db.create_all() sees every table
    from . import models  # noqa: F401

    from .routes import register_routes
    register_routes(app)

    from .sockets import register_socket_events
    register_socket_events(socketio)

    @app.route("/")
    def index():
        return {"status": "ok", "service": "ChatGenius API"}

    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    with app.app_context():
        os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
        db.create_all()

    return app
