import os
from dotenv import load_dotenv

load_dotenv()

from app import create_app
from app.extensions import socketio

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    debug = os.getenv("FLASK_ENV", "development") == "development"
    print(f"Starting ChatGenius backend on http://127.0.0.1:{port}")
    socketio.run(app, host="0.0.0.0", port=port, debug=debug,
                 use_reloader=False, allow_unsafe_werkzeug=True)
