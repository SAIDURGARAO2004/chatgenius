import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("Testing app creation...")
    from app import create_app
    app = create_app()
    print("App created successfully.")
    
    print("Testing model imports...")
    from app.models import User, Message, Conversation, Reaction, ConversationParticipant, AIConversation, FileUpload
    print("All models imported successfully.")
    
except Exception as e:
    import traceback
    traceback.print_exc()
    sys.exit(1)
