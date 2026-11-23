"""Production entry point:  gunicorn -k eventlet -w 1 wsgi:app"""
from app import create_app

app = create_app()
