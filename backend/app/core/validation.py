from pydantic import BaseModel, validator, EmailStr
from typing import Optional
import re

class SecureUserCreate(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = "viewer"  # Default to least privileged role
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v
    
    @validator('role')
    def validate_role(cls, v):
        allowed_roles = ['admin', 'editor', 'viewer']
        if v not in allowed_roles:
            raise ValueError(f'Role must be one of: {allowed_roles}')
        return v
    
    @validator('email')
    def validate_email_format(cls, v):
        # Additional email validation beyond EmailStr
        if len(v) > 254:  # RFC 5321 limit
            raise ValueError('Email address too long')
        
        # Check for common injection patterns
        dangerous_patterns = ['<script', 'javascript:', 'onload=', 'onerror=']
        v_lower = v.lower()
        for pattern in dangerous_patterns:
            if pattern in v_lower:
                raise ValueError('Email contains invalid characters')
        
        return v

class SecureUserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        if v is not None:
            return SecureUserCreate.validate_password(v)
        return v
    
    @validator('role')
    def validate_role(cls, v):
        if v is not None:
            return SecureUserCreate.validate_role(v)
        return v

class SecurePOICreate(BaseModel):
    name: str
    description: Optional[str] = None
    
    @validator('name')
    def validate_name(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Name cannot be empty')
        if len(v) > 200:
            raise ValueError('Name too long (max 200 characters)')
        
        # Check for script injection
        dangerous_patterns = ['<script', 'javascript:', 'onload=', 'onerror=', 'data:']
        v_lower = v.lower()
        for pattern in dangerous_patterns:
            if pattern in v_lower:
                raise ValueError('Name contains invalid characters')
        
        return v.strip()
    
    @validator('description')
    def validate_description(cls, v):
        if v is not None:
            if len(v) > 2000:
                raise ValueError('Description too long (max 2000 characters)')
            
            # Check for script injection
            dangerous_patterns = ['<script', 'javascript:', 'onload=', 'onerror=']
            v_lower = v.lower()
            for pattern in dangerous_patterns:
                if pattern in v_lower:
                    raise ValueError('Description contains invalid characters')
        
        return v

class RateLimitSettings:
    """Rate limiting settings for different operations"""
    
    # Requests per minute
    LOGIN_ATTEMPTS = 5
    USER_CREATION = 3
    POI_CREATION = 10
    GENERAL_API = 100
    
    # Lockout periods (in minutes)
    LOGIN_LOCKOUT = 15
    USER_CREATION_LOCKOUT = 60
