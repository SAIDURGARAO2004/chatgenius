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
            user = User.query.filter_by(email='spike@gmail.com').first()
            if user:
                print(f"User EXISTS: {user.username} ({user.email})")
            else:
                print("User NOT FOUND: spike@gmail.com")
        except Exception as e:
            print(f"Error checking user: {e}")

if __name__ == "__main__":
    check()
