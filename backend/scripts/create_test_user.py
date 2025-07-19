#!/usr/bin/env python3
"""
Script to create a test user in the database
Usage: python create_test_user.py [--email EMAIL] [--password PASSWORD] [--role ROLE]
"""

import sys
import os
import argparse
import logging
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, OperationalError
import re

# Add the parent directory (backend) to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.core.security import get_password_hash
from app.crud.crud_user import get_user_by_email

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password: str) -> bool:
    """Validate password strength"""
    if len(password) < 4:
        return False
    return True

def ensure_database_tables():
    """Ensure all database tables exist"""
    try:
        logger.info("Checking database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables are ready")
    except Exception as e:
        logger.error(f"❌ Failed to create database tables: {e}")
        raise

def test_database_connection() -> bool:
    """Test database connection"""
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        logger.info("✅ Database connection successful")
        return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False

def create_test_user(email: str = "test@nearbynearby.com", 
                    password: str = "1234", 
                    role: str = "admin") -> bool:
    """Create a test user with specified credentials"""
    
    # Validate inputs
    if not validate_email(email):
        logger.error(f"❌ Invalid email format: {email}")
        return False
    
    if not validate_password(password):
        logger.error(f"❌ Password too weak. Must be at least 4 characters long.")
        return False
    
    if role not in ["admin", "editor", "viewer"]:
        logger.warning(f"⚠️  Unknown role '{role}', using 'admin' instead")
        role = "admin"
    
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = get_user_by_email(db, email)
        if existing_user:
            logger.info(f"ℹ️  User {email} already exists!")
            logger.info(f"   User ID: {existing_user.id}")
            logger.info(f"   Role: {existing_user.role}")
            logger.info(f"   Created: {existing_user.created_at}")
            return True
        
        # Create new user
        logger.info(f"Creating user with email: {email}")
        hashed_password = get_password_hash(password)
        new_user = User(
            email=email,
            hashed_password=hashed_password,
            role=role
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        logger.info("✅ Test user created successfully!")
        logger.info(f"   Email: {email}")
        logger.info(f"   Password: {password}")
        logger.info(f"   Role: {role}")
        logger.info(f"   User ID: {new_user.id}")
        logger.info(f"   Created: {new_user.created_at}")
        
        return True
        
    except SQLAlchemyError as e:
        logger.error(f"❌ Database error creating test user: {e}")
        db.rollback()
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error creating test user: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def main():
    """Main function to handle command line arguments and execute user creation"""
    parser = argparse.ArgumentParser(
        description="Create a test user in the Nearby Nearby database",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python create_test_user.py                    # Create default test user
  python create_test_user.py --email admin@example.com --password secret123
  python create_test_user.py --email editor@example.com --password pass123 --role editor
        """
    )
    
    parser.add_argument(
        "--email", 
        default="test@nearbynearby.com",
        help="Email address for the test user (default: test@nearbynearby.com)"
    )
    parser.add_argument(
        "--password", 
        default="1234",
        help="Password for the test user (default: 1234)"
    )
    parser.add_argument(
        "--role", 
        default="admin",
        choices=["admin", "editor", "viewer"],
        help="Role for the test user (default: admin)"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose logging"
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    logger.info("🚀 Starting test user creation...")
    
    # Test database connection first
    if not test_database_connection():
        logger.error("❌ Cannot proceed without database connection")
        sys.exit(1)
    
    # Ensure database tables exist
    try:
        ensure_database_tables()
    except Exception as e:
        logger.error(f"❌ Cannot proceed without database tables: {e}")
        sys.exit(1)
    
    # Create the test user
    success = create_test_user(args.email, args.password, args.role)
    
    if success:
        logger.info("🎉 Script completed successfully!")
        sys.exit(0)
    else:
        logger.error("💥 Script failed!")
        sys.exit(1)

if __name__ == "__main__":
    main() 