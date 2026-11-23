import sys
import os

print("Debug: Starting test_routes_init.py")
try:
    project_root = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, project_root)
    
    from app.config import Config
    from app.extensions import db
    from flask import Flask
    
    app = Flask(__name__)
    app.config.from_object(Config)
    
    db.init_app(app)
    print("Debug: db.init_app(app) successful.")
    
    print("Debug: Testing route imports...")
    from app.routes import register_routes
    register_routes(app)
    print("Debug: register_routes(app) successful.")
    
    from app.routes.group_routes import group_bp
    app.register_blueprint(group_bp)
    print("Debug: group_routes registration successful.")
    
except Exception as e:
    import traceback
    traceback.print_exc()
