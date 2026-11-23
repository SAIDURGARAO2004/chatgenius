import psycopg2
import os

# Database connection details structure from .env file
# DATABASE_URL=postgresql://postgres:7777@localhost:5432/ChatGenius
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:7777@localhost:5432/ChatGenius")

def alter_to_bigint():
    try:
        conn = psycopg2.connect(DB_URL)
        conn.autocommit = True
        cur = conn.cursor()
        
        queries = [
            "ALTER TABLE conversation ALTER COLUMN id TYPE BIGINT;",
            "ALTER TABLE conversation_participant ALTER COLUMN conversation_id TYPE BIGINT;",
            "ALTER TABLE message ALTER COLUMN conversation_id TYPE BIGINT;",
            "ALTER TABLE file_upload ALTER COLUMN conversation_id TYPE BIGINT;",
            "ALTER TABLE ai_conversation ALTER COLUMN id TYPE BIGINT;",
        ]
        
        for q in queries:
            try:
                cur.execute(q)
                print(f"Executed: {q}")
            except Exception as e:
                print(f"Error executing {q}: {e}")
                
        cur.close()
        conn.close()
        print("Done replacing IDs with BIGINT")
    except Exception as e:
        print(f"Failed to connect to database: {e}")

if __name__ == "__main__":
    alter_to_bigint()
