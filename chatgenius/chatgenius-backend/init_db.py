import os
import sys

# Add project root to sys.path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

from flask import Flask
from app.config import Config
from app.extensions import db

def init():
    print("=" * 60)
    print("PostgreSQL Database Initialization (Direct Metadata)")
    print("=" * 60)
    
    app = Flask(__name__)
    app.config.from_object(Config)
    
    db.init_app(app)
    
    with app.app_context():
        # IMPORT ALL MODELS HERE so they are registered with metadata
        from app.models.user import User
        from app.models.message import Message
        from app.models.conversation import Conversation
        from app.models.reaction import Reaction
        from app.models.conversation_participant import ConversationParticipant
        from app.models.ai_conversation import AIConversation
        from app.models.file_upload import FileUpload
        
        try:
            print("\n🔨 Dropping all tables...")
            db.metadata.drop_all(db.engine)
            
            print("\n🔨 Creating all tables via Metadata...")
            db.metadata.create_all(db.engine)
            
            print("✅ Success!")
            
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            print("\n📋 Tables in DB:")
            for table in inspector.get_table_names():
                print(f"   - {table}")
                
        except Exception as e:
            print(f"\n❌ Failed: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    init()
