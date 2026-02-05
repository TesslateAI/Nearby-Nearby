# app/waitlist_db.py
"""
Separate SQLite database for waitlist emails.
This keeps waitlist data isolated from the main PostgreSQL database.
"""
import sqlite3
from pathlib import Path
from datetime import datetime
from typing import Optional
import os

# Database file location
DB_DIR = Path(os.getenv("WAITLIST_DB_DIR", "/app/data"))
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "waitlist.db"


def get_connection():
    """Get a connection to the SQLite waitlist database."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row  # Allow dict-like access to rows
    return conn


def init_db():
    """Initialize the waitlist database with required tables."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS waitlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    # Create index for faster email lookups
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email)
    """)

    conn.commit()
    conn.close()


def add_email(email: str) -> bool:
    """
    Add an email to the waitlist.

    Returns:
        True if email was added successfully
        False if email already exists
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO waitlist (email, created_at) VALUES (?, ?)",
            (email.lower().strip(), datetime.utcnow().isoformat())
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        # Email already exists
        return False
    finally:
        conn.close()


def email_exists(email: str) -> bool:
    """Check if an email already exists in the waitlist."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT COUNT(*) FROM waitlist WHERE email = ?",
        (email.lower().strip(),)
    )
    count = cursor.fetchone()[0]
    conn.close()

    return count > 0


def get_all_emails() -> list:
    """Get all emails from the waitlist."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT email, created_at FROM waitlist ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()

    return [{"email": row["email"], "created_at": row["created_at"]} for row in rows]


def get_count() -> int:
    """Get the total count of emails in the waitlist."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM waitlist")
    count = cursor.fetchone()[0]
    conn.close()

    return count


def delete_email(email: str) -> bool:
    """
    Delete an email from the waitlist.

    Returns:
        True if email was deleted successfully
        False if email does not exist
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM waitlist WHERE email = ?",
        (email.lower().strip(),)
    )
    rows_deleted = cursor.rowcount
    conn.commit()
    conn.close()

    return rows_deleted > 0


# Initialize the database when this module is imported
init_db()
