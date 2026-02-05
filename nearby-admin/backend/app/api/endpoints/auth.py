from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import uuid

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
    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
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