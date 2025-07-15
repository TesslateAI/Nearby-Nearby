from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import uuid
import traceback

from app import crud, schemas
from app.database import get_db
from app.core.security import create_access_token, get_current_user
from app.core.config import settings

router = APIRouter()

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    try:
        print(f"DEBUG: Received login attempt for username: {form_data.username}")
        print(f"DEBUG: Form data grant_type: {getattr(form_data, 'grant_type', 'Not provided')}")
        
        # Check if user exists first
        user_exists = crud.get_user_by_email(db, form_data.username)
        if not user_exists:
            print(f"DEBUG: User {form_data.username} does not exist in database")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = crud.authenticate_user(db, form_data.username, form_data.password)
        if not user:
            print(f"DEBUG: Authentication failed for user: {form_data.username} - wrong password")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        print(f"DEBUG: Successfully authenticated user: {form_data.username}")
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: Unexpected error during login: {str(e)}")
        print(f"DEBUG: Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during login"
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/users/", response_model=schemas.User, status_code=201)
def create_user(
    user: schemas.UserCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@router.get("/users/me", response_model=schemas.User)
def read_users_me(current_user_email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=current_user_email)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/debug/users")
def debug_list_users(db: Session = Depends(get_db)):
    """Debug endpoint to list all users - REMOVE IN PRODUCTION"""
    try:
        users = crud.get_users(db)
        return {
            "users_count": len(users),
            "users": [{"email": user.email, "role": user.role} for user in users]
        }
    except Exception as e:
        print(f"DEBUG: Error listing users: {str(e)}")
        return {"error": str(e)}

@router.post("/debug/create-test-user")
def debug_create_test_user(db: Session = Depends(get_db)):
    """Debug endpoint to create a test user - REMOVE IN PRODUCTION"""
    try:
        # Check if test user already exists
        existing_user = crud.get_user_by_email(db, "admin@test.com")
        if existing_user:
            return {"message": "Test user already exists", "email": "admin@test.com"}
        
        # Create test user
        from app.core.security import get_password_hash
        from app.models.user import User
        
        test_user = User(
            email="admin@test.com",
            hashed_password=get_password_hash("password123"),
            role="admin"
        )
        
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        return {
            "message": "Test user created successfully",
            "email": "admin@test.com",
            "password": "password123"
        }
    except Exception as e:
        print(f"DEBUG: Error creating test user: {str(e)}")
        return {"error": str(e)}