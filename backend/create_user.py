#!/usr/bin/env python3
"""
Script to create a user in the Nearby Nearby database.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import user as models
from app.schemas import user as schemas
from app.crud import crud_user
from app.core.security import get_password_hash

def create_user(email: str, password: str, role: str = "admin"):
    """Create a user with the given credentials."""
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = crud_user.get_user_by_email(db, email=email)
        if existing_user:
            print(f"User {email} already exists!")
            return existing_user
        
        # Create user schema
        user_create = schemas.UserCreate(
            email=email,
            password=password,
            role=role
        )
        
        # Create user in database
        user = crud_user.create_user(db=db, user=user_create)
        print(f"✅ Successfully created user: {email}")
        print(f"   Role: {user.role}")
        print(f"   ID: {user.id}")
        return user
        
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        return None
    finally:
        db.close()

if __name__ == "__main__":
    # Create the specific user you requested
    email = "josephma345@gmail.com"
    password = "asdfqwer1234"
    role = "admin"
    
    print(f"Creating user: {email}")
    print(f"Password: {password}")
    print(f"Role: {role}")
    print("-" * 50)
    
    user = create_user(email, password, role)
    
    if user:
        print("\n🎉 User creation completed!")
        print("You can now log in with these credentials.")
    else:
        print("\n❌ User creation failed!") 