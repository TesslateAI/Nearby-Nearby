from enum import Enum
from typing import List
from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import get_current_user
from app import crud


class UserRole(str, Enum):
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"


class Permission(str, Enum):
    # POI permissions
    CREATE_POI = "create_poi"
    READ_POI = "read_poi"
    UPDATE_POI = "update_poi"
    DELETE_POI = "delete_poi"
    
    # Category permissions
    CREATE_CATEGORY = "create_category"
    READ_CATEGORY = "read_category"
    DELETE_CATEGORY = "delete_category"
    
    # Attribute permissions
    CREATE_ATTRIBUTE = "create_attribute"
    READ_ATTRIBUTE = "read_attribute"
    UPDATE_ATTRIBUTE = "update_attribute"
    DELETE_ATTRIBUTE = "delete_attribute"
    
    # User permissions
    CREATE_USER = "create_user"
    READ_USER = "read_user"
    UPDATE_USER = "update_user"
    DELETE_USER = "delete_user"
    
    # Relationship permissions
    CREATE_RELATIONSHIP = "create_relationship"
    READ_RELATIONSHIP = "read_relationship"
    DELETE_RELATIONSHIP = "delete_relationship"


# Role-based permissions mapping
ROLE_PERMISSIONS = {
    UserRole.ADMIN: [
        # Full access to everything
        Permission.CREATE_POI, Permission.READ_POI, Permission.UPDATE_POI, Permission.DELETE_POI,
        Permission.CREATE_CATEGORY, Permission.READ_CATEGORY, Permission.DELETE_CATEGORY,
        Permission.CREATE_ATTRIBUTE, Permission.READ_ATTRIBUTE, Permission.UPDATE_ATTRIBUTE, Permission.DELETE_ATTRIBUTE,
        Permission.CREATE_USER, Permission.READ_USER, Permission.UPDATE_USER, Permission.DELETE_USER,
        Permission.CREATE_RELATIONSHIP, Permission.READ_RELATIONSHIP, Permission.DELETE_RELATIONSHIP,
    ],
    UserRole.EDITOR: [
        # Can manage content but not users
        Permission.CREATE_POI, Permission.READ_POI, Permission.UPDATE_POI, Permission.DELETE_POI,
        Permission.CREATE_CATEGORY, Permission.READ_CATEGORY, Permission.DELETE_CATEGORY,
        Permission.CREATE_ATTRIBUTE, Permission.READ_ATTRIBUTE, Permission.UPDATE_ATTRIBUTE, Permission.DELETE_ATTRIBUTE,
        Permission.READ_USER,  # Can only read user info
        Permission.CREATE_RELATIONSHIP, Permission.READ_RELATIONSHIP, Permission.DELETE_RELATIONSHIP,
    ],
    UserRole.VIEWER: [
        # Read-only access
        Permission.READ_POI, Permission.READ_CATEGORY, Permission.READ_ATTRIBUTE,
        Permission.READ_USER, Permission.READ_RELATIONSHIP,
    ]
}


def get_current_user_with_role(
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user with role information"""
    user = crud.get_user_by_email(db, email=current_user_email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


def require_permission(required_permission: Permission):
    """Decorator factory to require specific permissions"""
    def permission_checker(
        current_user = Depends(get_current_user_with_role)
    ):
        user_role = UserRole(current_user.role)
        user_permissions = ROLE_PERMISSIONS.get(user_role, [])
        
        if required_permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {required_permission.value}"
            )
        return current_user
    
    return permission_checker


def require_role(required_roles: List[UserRole]):
    """Decorator factory to require specific roles"""
    def role_checker(
        current_user = Depends(get_current_user_with_role)
    ):
        user_role = UserRole(current_user.role)
        
        if user_role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient privileges. Required roles: {[role.value for role in required_roles]}"
            )
        return current_user
    
    return role_checker


# Convenience functions for common permission checks
def require_admin():
    return require_role([UserRole.ADMIN])

def require_admin_or_editor():
    return require_role([UserRole.ADMIN, UserRole.EDITOR])

def require_any_authenticated_user():
    return get_current_user_with_role
