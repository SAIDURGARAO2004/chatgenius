from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate

db = SQLAlchemy()
jwt = JWTManager()
socketio = SocketIO()
bcrypt = Bcrypt()
migrate = Migrate()
cors = CORS()  # configured in create_app() from the CORS_ORIGINS env variable
