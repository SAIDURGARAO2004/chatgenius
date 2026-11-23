from .auth_routes import auth_bp
from .ai_routes import ai_bp
from .conversation_routes import conversation_bp
from .message_routes import message_bp
from .user_routes import user_bp
from .group_routes import group_bp
from .reaction_routes import reaction_bp

def register_routes(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(conversation_bp)
    app.register_blueprint(message_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(group_bp)
    app.register_blueprint(reaction_bp)