# User Management System

## Overview

The User Management System handles user accounts for the nearby-admin application. It includes user creation, authentication, role assignment, and management scripts.

**Key Files:**
- `nearby-admin/backend/app/models/user.py` - User model
- `nearby-admin/backend/app/crud/crud_user.py` - CRUD operations
- `nearby-admin/backend/scripts/manage_users.py` - CLI management tool
- `nearby-admin/backend/app/api/endpoints/auth.py` - User endpoints

---

## User Model

```python
# nearby-admin/backend/app/models/user.py

from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="viewer")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"
```

---

## Roles

| Role | Description | Capabilities |
|------|-------------|--------------|
| `admin` | Full access | All operations including user management |
| `editor` | Content manager | Create/edit POIs, images, relationships |
| `viewer` | Read-only | View all data, no modifications |

See [Authorization](authorization.md) for detailed permission mapping.

---

## CRUD Operations

```python
# nearby-admin/backend/app/crud/crud_user.py

from app.core.security import get_password_hash, verify_password

def create_user(db: Session, email: str, password: str, role: str = "viewer") -> User:
    """Create a new user with hashed password."""
    # Check if email already exists
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise ValueError(f"User with email {email} already exists")

    # Validate role
    valid_roles = ["admin", "editor", "viewer"]
    if role not in valid_roles:
        raise ValueError(f"Invalid role. Must be one of: {valid_roles}")

    user = User(
        email=email,
        hashed_password=get_password_hash(password),
        role=role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_user_by_email(db: Session, email: str) -> User:
    """Get user by email address."""
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: UUID) -> User:
    """Get user by ID."""
    return db.query(User).filter(User.id == user_id).first()

def get_all_users(db: Session) -> list[User]:
    """Get all users."""
    return db.query(User).order_by(User.created_at.desc()).all()

def update_user(db: Session, user_id: UUID, **kwargs) -> User:
    """Update user fields."""
    user = get_user_by_id(db, user_id)
    if not user:
        return None

    # Handle password update
    if "password" in kwargs:
        kwargs["hashed_password"] = get_password_hash(kwargs.pop("password"))

    for field, value in kwargs.items():
        if hasattr(user, field):
            setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, email: str) -> bool:
    """Delete user by email."""
    user = get_user_by_email(db, email)
    if not user:
        return False

    db.delete(user)
    db.commit()
    return True

def authenticate_user(db: Session, email: str, password: str) -> User:
    """Authenticate user by email and password."""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
```

---

## Management Script

The `manage_users.py` script provides CLI commands for user management.

### Script Implementation

```python
# nearby-admin/backend/scripts/manage_users.py

import argparse
import sys
from tabulate import tabulate

sys.path.insert(0, '/app')
from app.database import SessionLocal
from app.crud.crud_user import (
    create_user, get_all_users, delete_user, get_user_by_email
)

def cmd_create(args):
    """Create a new user."""
    db = SessionLocal()
    try:
        user = create_user(db, args.email, args.password, args.role)
        print(f"✓ Created user: {user.email} with role: {user.role}")
    except ValueError as e:
        print(f"✗ Error: {e}")
        sys.exit(1)
    finally:
        db.close()

def cmd_list(args):
    """List all users."""
    db = SessionLocal()
    try:
        users = get_all_users(db)
        if not users:
            print("No users found.")
            return

        table_data = [
            [u.email, u.role, u.created_at.strftime('%Y-%m-%d %H:%M')]
            for u in users
        ]
        headers = ["Email", "Role", "Created"]
        print(tabulate(table_data, headers=headers, tablefmt="grid"))
        print(f"\nTotal: {len(users)} users")
    finally:
        db.close()

def cmd_delete(args):
    """Delete a user."""
    db = SessionLocal()
    try:
        # Confirm deletion
        user = get_user_by_email(db, args.email)
        if not user:
            print(f"✗ User not found: {args.email}")
            sys.exit(1)

        if not args.force:
            confirm = input(f"Delete user {args.email}? [y/N]: ")
            if confirm.lower() != 'y':
                print("Cancelled.")
                return

        success = delete_user(db, args.email)
        if success:
            print(f"✓ Deleted user: {args.email}")
        else:
            print(f"✗ Failed to delete user: {args.email}")
    finally:
        db.close()

def cmd_test_user(args):
    """Create test user for development."""
    db = SessionLocal()
    try:
        user = create_user(db, "test@nearbynearby.com", "1234", "admin")
        print(f"✓ Created test user: {user.email}")
        print("  Password: 1234")
    except ValueError as e:
        print(f"Note: {e}")
    finally:
        db.close()

def main():
    parser = argparse.ArgumentParser(description="User management CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Create command
    create_parser = subparsers.add_parser("create", help="Create a new user")
    create_parser.add_argument("email", help="User email")
    create_parser.add_argument("password", help="User password")
    create_parser.add_argument("--role", default="viewer",
                               choices=["admin", "editor", "viewer"],
                               help="User role (default: viewer)")
    create_parser.set_defaults(func=cmd_create)

    # List command
    list_parser = subparsers.add_parser("list", help="List all users")
    list_parser.set_defaults(func=cmd_list)

    # Delete command
    delete_parser = subparsers.add_parser("delete", help="Delete a user")
    delete_parser.add_argument("email", help="User email to delete")
    delete_parser.add_argument("-f", "--force", action="store_true",
                               help="Skip confirmation")
    delete_parser.set_defaults(func=cmd_delete)

    # Test user command
    test_parser = subparsers.add_parser("test-user",
                                        help="Create test user (test@nearbynearby.com)")
    test_parser.set_defaults(func=cmd_test_user)

    args = parser.parse_args()
    args.func(args)

if __name__ == "__main__":
    main()
```

### Usage Examples

```bash
# Create admin user
docker exec nearby-admin-backend-1 python scripts/manage_users.py create admin@example.com securepassword --role admin

# Create editor user
docker exec nearby-admin-backend-1 python scripts/manage_users.py create editor@example.com password123 --role editor

# Create viewer user (default role)
docker exec nearby-admin-backend-1 python scripts/manage_users.py create viewer@example.com password123

# List all users
docker exec nearby-admin-backend-1 python scripts/manage_users.py list

# Delete user
docker exec nearby-admin-backend-1 python scripts/manage_users.py delete user@example.com

# Delete without confirmation
docker exec nearby-admin-backend-1 python scripts/manage_users.py delete user@example.com --force

# Create test user (test@nearbynearby.com / 1234)
docker exec nearby-admin-backend-1 python scripts/manage_users.py test-user
```

### Sample Output

```
$ docker exec nearby-admin-backend-1 python scripts/manage_users.py list

+------------------------+---------+------------------+
| Email                  | Role    | Created          |
+========================+=========+==================+
| admin@nearbynearby.com | admin   | 2024-01-15 10:30 |
+------------------------+---------+------------------+
| editor@example.com     | editor  | 2024-01-14 09:15 |
+------------------------+---------+------------------+
| viewer@example.com     | viewer  | 2024-01-10 14:45 |
+------------------------+---------+------------------+

Total: 3 users
```

---

## API Endpoints

### POST /api/auth/users

Create a new user (Admin only).

```python
@router.post("/users")
async def create_new_user(
    user_data: UserCreate,
    current_user = Depends(require_permission(Permission.CREATE_USER)),
    db: Session = Depends(get_db)
):
    """Create a new user. Requires admin role."""
    try:
        user = create_user(db, user_data.email, user_data.password, user_data.role)
        return {"id": user.id, "email": user.email, "role": user.role}
    except ValueError as e:
        raise HTTPException(400, str(e))
```

### GET /api/auth/users

List all users (Admin only).

```python
@router.get("/users")
async def list_users(
    current_user = Depends(require_permission(Permission.READ_USER)),
    db: Session = Depends(get_db)
):
    """List all users. Requires admin role."""
    users = get_all_users(db)
    return [
        {"id": u.id, "email": u.email, "role": u.role, "created_at": u.created_at}
        for u in users
    ]
```

### DELETE /api/auth/users/{user_id}

Delete a user (Admin only).

```python
@router.delete("/users/{user_id}")
async def remove_user(
    user_id: UUID,
    current_user = Depends(require_permission(Permission.DELETE_USER)),
    db: Session = Depends(get_db)
):
    """Delete a user. Requires admin role."""
    # Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(400, "Cannot delete your own account")

    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    db.delete(user)
    db.commit()
    return {"message": f"User {user.email} deleted"}
```

---

## Password Security

### Hashing

Passwords are hashed using bcrypt:

```python
# nearby-admin/backend/app/core/security.py

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Hash password using bcrypt."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash."""
    return pwd_context.verify(plain_password, hashed_password)
```

### Password Requirements

Consider implementing password validation:

```python
def validate_password(password: str) -> tuple[bool, str]:
    """Validate password meets requirements."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters"

    if not any(c.isupper() for c in password):
        return False, "Password must contain an uppercase letter"

    if not any(c.islower() for c in password):
        return False, "Password must contain a lowercase letter"

    if not any(c.isdigit() for c in password):
        return False, "Password must contain a number"

    return True, ""
```

---

## Best Practices

1. **Use strong passwords** - Enforce minimum requirements
2. **Hash passwords** - Never store plain text
3. **Limit admin accounts** - Only create admins when necessary
4. **Audit user creation** - Log who creates new users
5. **Regular cleanup** - Remove inactive accounts
6. **Don't allow self-deletion** - Prevent accidental lockout
7. **Use CLI for initial setup** - Create first admin via script

---

## Common Tasks

### Reset Password

```bash
# Currently requires direct database access or script modification
# Future: Add password reset endpoint

# Workaround: Delete and recreate user
docker exec nearby-admin-backend-1 python scripts/manage_users.py delete user@example.com
docker exec nearby-admin-backend-1 python scripts/manage_users.py create user@example.com newpassword --role admin
```

### Change User Role

```python
# Add to manage_users.py
def cmd_update_role(args):
    db = SessionLocal()
    try:
        user = get_user_by_email(db, args.email)
        if not user:
            print(f"User not found: {args.email}")
            return
        user.role = args.role
        db.commit()
        print(f"Updated {args.email} role to {args.role}")
    finally:
        db.close()
```

### Initial Setup

```bash
# 1. Start the application
docker compose up -d

# 2. Create admin user
docker exec nearby-admin-backend-1 python scripts/manage_users.py create admin@yourcompany.com securepassword123 --role admin

# 3. Login at http://localhost:5175
```
