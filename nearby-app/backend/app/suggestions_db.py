# app/suggestions_db.py
"""
Separate SQLite database for place suggestions.
Mirrors the waitlist_db.py pattern.
"""
import sqlite3
from pathlib import Path
from datetime import datetime
import os

DB_DIR = Path(os.getenv("SUGGESTIONS_DB_DIR", "/app/data"))
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "suggestions.db"


def get_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS place_suggestions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            poi_type TEXT,
            address_or_description TEXT,
            submitter_email TEXT,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def add_suggestion(name: str, poi_type: str = None,
                   address_or_description: str = None,
                   submitter_email: str = None) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO place_suggestions (name, poi_type, address_or_description, submitter_email, created_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (name.strip(), poi_type, address_or_description, submitter_email, datetime.utcnow().isoformat())
        )
        conn.commit()
        return True
    except Exception:
        return False
    finally:
        conn.close()


def get_count() -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM place_suggestions")
    count = cursor.fetchone()[0]
    conn.close()
    return count


def get_all_suggestions() -> list:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM place_suggestions ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


# Initialize on import
init_db()
