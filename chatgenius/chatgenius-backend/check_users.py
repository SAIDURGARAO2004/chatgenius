import sys
import os

# Add project root to sys.path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

from app import create_app
from app.models.user import User

def check():
    app = create_app()
    with app.app_context():
        try:
            count = User.query.count()
            print(f"Users in DB: {count}")
            if count > 0:
                user = User.query.first()
                print(f"Sample user: {user.username} ({user.email})")
        except Exception as e:
            print(f"Error checking users: {e}")

if __name__ == "__main__":
    check()
