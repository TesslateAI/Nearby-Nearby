#!/usr/bin/env python3
"""
Script to create a test user in the database
Usage: python create_test_user.py
"""

import sys
import os
from sqlalchemy.orm import Session

# Add the parent directory (backend) to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine
from app.models.user import User
from app.core.security import get_password_hash
from app.crud.crud_user import get_user_by_email

def create_test_user():
    """Create a test user with email test@nearbynearby.com and password 1234"""
    
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = get_user_by_email(db, "test@nearbynearby.com")
        if existing_user:
            print("User test@nearbynearby.com already exists!")
            return
        
        # Create new user
        hashed_password = get_password_hash("1234")
        new_user = User(
            email="test@nearbynearby.com",
            hashed_password=hashed_password,
            role="admin"
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print("✅ Test user created successfully!")
        print(f"Email: test@nearbynearby.com")
        print(f"Password: 1234")
        print(f"Role: admin")
        print(f"User ID: {new_user.id}")
        
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Creating test user...")
    create_test_user() 