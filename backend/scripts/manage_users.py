#!/usr/bin/env python3
"""
User management script for Nearby Nearby Admin Portal
Usage: python manage_users.py [command] [options]

Commands:
  create <email> <password> [role]  - Create a new user
  list                              - List all users
  delete <email>                    - Delete a user
  test-user                         - Create the test user (test@nearbynearby.com / 1234)

IMPORTANT: This script requires access to the PostgreSQL database.
If you get connection errors, make sure:
1. The Docker containers are running: docker-compose up -d
2. Run this script inside the Docker container: docker-compose exec backend python scripts/manage_users.py [command]
3. Or set up a .env file with: DATABASE_URL=postgresql://nearby:nearby@localhost/nearbynearby
"""

import sys
import os
import argparse
from sqlalchemy.orm import Session

# Add the parent directory (backend) to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine
from app.models.user import User
from app.core.security import get_password_hash
from app.crud.crud_user import get_user_by_email, get_users, delete_user

def create_user(email: str, password: str, role: str = "admin"):
    """Create a new user"""
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = get_user_by_email(db, email)
        if existing_user:
            print(f"❌ User {email} already exists!")
            return False
        
        # Create new user
        hashed_password = get_password_hash(password)
        new_user = User(
            email=email,
            hashed_password=hashed_password,
            role=role
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print("✅ User created successfully!")
        print(f"Email: {email}")
        print(f"Role: {role}")
        print(f"User ID: {new_user.id}")
        return True
        
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def list_users():
    """List all users"""
    db = SessionLocal()
    try:
        users = get_users(db)
        if not users:
            print("No users found in the database.")
            return
        
        print("\n📋 Users in database:")
        print("-" * 100)
        print(f"{'Email':<40} {'Role':<15} {'Created At':<20} {'ID'}")
        print("-" * 100)
        
        for user in users:
            created_at = user.created_at.strftime("%Y-%m-%d %H:%M:%S") if user.created_at else "N/A"
            # Truncate email if too long, but keep it readable
            email_display = user.email[:37] + "..." if len(user.email) > 40 else user.email
            print(f"{email_display:<40} {user.role:<15} {created_at:<20} {user.id}")
        
        print("-" * 100)
        print(f"Total users: {len(users)}")
        
    except Exception as e:
        print(f"❌ Error listing users: {e}")
        print("\n💡 Troubleshooting tips:")
        print("1. Make sure Docker containers are running: docker-compose up -d")
        print("2. Run this script inside Docker: docker-compose exec backend python scripts/manage_users.py list")
        print("3. Check if the database is accessible and credentials are correct")
    finally:
        db.close()

def delete_user_by_email(email: str):
    """Delete a user by email"""
    db = SessionLocal()
    try:
        user = get_user_by_email(db, email)
        if not user:
            print(f"❌ User {email} not found!")
            return False
        
        delete_user(db, user.id)
        print(f"✅ User {email} deleted successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error deleting user: {e}")
        return False
    finally:
        db.close()

def create_test_user():
    """Create the test user"""
    return create_user("test@nearbynearby.com", "1234", "admin")

def main():
    parser = argparse.ArgumentParser(description="Manage users for Nearby Nearby Admin Portal")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Create user command
    create_parser = subparsers.add_parser("create", help="Create a new user")
    create_parser.add_argument("email", help="User email")
    create_parser.add_argument("password", help="User password")
    create_parser.add_argument("--role", default="admin", help="User role (default: admin)")
    
    # List users command
    subparsers.add_parser("list", help="List all users")
    
    # Delete user command
    delete_parser = subparsers.add_parser("delete", help="Delete a user")
    delete_parser.add_argument("email", help="User email to delete")
    
    # Test user command
    subparsers.add_parser("test-user", help="Create the test user (test@nearbynearby.com / 1234)")
    
    args = parser.parse_args()
    
    if args.command == "create":
        create_user(args.email, args.password, args.role)
    elif args.command == "list":
        list_users()
    elif args.command == "delete":
        delete_user_by_email(args.email)
    elif args.command == "test-user":
        create_test_user()
    else:
        parser.print_help()

if __name__ == "__main__":
    main() 