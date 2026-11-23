import psycopg2
import os

DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:7777@localhost:5432/ChatGenius")

def test_db():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    cur.execute("SELECT id, type, name FROM conversation LIMIT 5;")
    rows = cur.fetchall()
    print("Conversations:", rows)
    
    cur.execute("SELECT id, content FROM message LIMIT 5;")
    msg_rows = cur.fetchall()
    print("Messages:", msg_rows)
    cur.close()
    conn.close()

if __name__ == "__main__":
    test_db()
