import os
from datetime import timedelta


def _database_url():
    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        raise RuntimeError(
            "DATABASE_URL is not set. Copy .env.example to .env and set it, e.g. "
            "postgresql://postgres:<password>@localhost:5432/chatgenius"
        )
    # Some providers hand out the legacy 'postgres://' scheme; SQLAlchemy needs 'postgresql://'
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


def _csv(name, default=""):
    return [v.strip() for v in os.getenv(name, default).split(",") if v.strip()]


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-key")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)
    SQLALCHEMY_DATABASE_URI = _database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Comma-separated list of allowed browser origins (frontend URLs)
    CORS_ORIGINS = _csv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174",
    )

    UPLOAD_FOLDER = os.getenv(
        "UPLOAD_FOLDER",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads")),
    )

    # AI (Google Gemini). GOOGLE_API_KEY and GEMINI_API_KEY are both accepted.
    GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
