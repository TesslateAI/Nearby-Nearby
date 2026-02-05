# Authorization System

## Overview

The nearby-admin application implements Role-Based Access Control (RBAC) with three roles: Admin, Editor, and Viewer. Each role has specific permissions that control what actions users can perform.

**Key Files:**
- `nearby-admin/backend/app/core/permissions.py` - Permission definitions and checks
- `nearby-admin/backend/app/models/user.py` - User model with role field

---

## Roles

| Role | Description | Typical Use |
|------|-------------|-------------|
| **Admin** | Full access to all features | System administrators |
| **Editor** | Create/update content, no user management | Content managers |
| **Viewer** | Read-only access | Stakeholders, reviewers |

---

## Permissions

### Permission Types

```python
# nearby-admin/backend/app/core/permissions.py

class Permission:
    # POI Permissions
    CREATE_POI = "create_poi"
    READ_POI = "read_poi"
    UPDATE_POI = "update_poi"
    DELETE_POI = "delete_poi"

    # Category Permissions
    CREATE_CATEGORY = "create_category"
    READ_CATEGORY = "read_category"
    UPDATE_CATEGORY = "update_category"
    DELETE_CATEGORY = "delete_category"

    # Image Permissions
    CREATE_IMAGE = "create_image"
    READ_IMAGE = "read_image"
    UPDATE_IMAGE = "update_image"
    DELETE_IMAGE = "delete_image"

    # Attribute Permissions
    CREATE_ATTRIBUTE = "create_attribute"
    READ_ATTRIBUTE = "read_attribute"
    UPDATE_ATTRIBUTE = "update_attribute"
    DELETE_ATTRIBUTE = "delete_attribute"

    # Relationship Permissions
    CREATE_RELATIONSHIP = "create_relationship"
    READ_RELATIONSHIP = "read_relationship"
    DELETE_RELATIONSHIP = "delete_relationship"

    # User Permissions
    CREATE_USER = "create_user"
    READ_USER = "read_user"
    UPDATE_USER = "update_user"
    DELETE_USER = "delete_user"
```

### Role-Permission Mapping

```python
# nearby-admin/backend/app/core/permissions.py

ROLE_PERMISSIONS = {
    "admin": [
        # Full access to everything
        Permission.CREATE_POI, Permission.READ_POI,
        Permission.UPDATE_POI, Permission.DELETE_POI,
        Permission.CREATE_CATEGORY, Permission.READ_CATEGORY,
        Permission.UPDATE_CATEGORY, Permission.DELETE_CATEGORY,
        Permission.CREATE_IMAGE, Permission.READ_IMAGE,
        Permission.UPDATE_IMAGE, Permission.DELETE_IMAGE,
        Permission.CREATE_ATTRIBUTE, Permission.READ_ATTRIBUTE,
        Permission.UPDATE_ATTRIBUTE, Permission.DELETE_ATTRIBUTE,
        Permission.CREATE_RELATIONSHIP, Permission.READ_RELATIONSHIP,
        Permission.DELETE_RELATIONSHIP,
        Permission.CREATE_USER, Permission.READ_USER,
        Permission.UPDATE_USER, Permission.DELETE_USER,
    ],
    "editor": [
        # Content management only
        Permission.CREATE_POI, Permission.READ_POI,
        Permission.UPDATE_POI,  # No DELETE_POI
        Permission.READ_CATEGORY,  # Can read but not modify
        Permission.CREATE_IMAGE, Permission.READ_IMAGE,
        Permission.UPDATE_IMAGE, Permission.DELETE_IMAGE,
        Permission.READ_ATTRIBUTE,
        Permission.CREATE_RELATIONSHIP, Permission.READ_RELATIONSHIP,
        Permission.DELETE_RELATIONSHIP,
    ],
    "viewer": [
        # Read-only access
        Permission.READ_POI,
        Permission.READ_CATEGORY,
        Permission.READ_IMAGE,
        Permission.READ_ATTRIBUTE,
        Permission.READ_RELATIONSHIP,
    ],
}
```

---

## Implementation

### Permission Check Function

```python
# nearby-admin/backend/app/core/permissions.py

from fastapi import HTTPException, status

def has_permission(user, permission: str) -> bool:
    """Check if user has a specific permission."""
    user_permissions = ROLE_PERMISSIONS.get(user.role, [])
    return permission in user_permissions

def require_permission(permission: str):
    """Dependency that requires a specific permission."""
    def permission_checker(current_user = Depends(get_current_user)):
        if not has_permission(current_user, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission} required"
            )
        return current_user
    return permission_checker
```

### Using in Endpoints

```python
# nearby-admin/backend/app/api/endpoints/pois.py

from app.core.permissions import require_permission, Permission

@router.post("/")
async def create_poi(
    poi: POICreate,
    current_user = Depends(require_permission(Permission.CREATE_POI)),
    db: Session = Depends(get_db)
):
    """Create a new POI. Requires CREATE_POI permission."""
    return crud_poi.create(db, poi)

@router.delete("/{poi_id}")
async def delete_poi(
    poi_id: UUID,
    current_user = Depends(require_permission(Permission.DELETE_POI)),
    db: Session = Depends(get_db)
):
    """Delete a POI. Requires DELETE_POI permission (Admin only)."""
    return crud_poi.delete(db, poi_id)
```

### Role-Based UI (Frontend)

```jsx
// nearby-admin/frontend/src/components/POIList.jsx

import { useAuth } from '../utils/AuthContext';

function POIList() {
  const { user } = useAuth();

  const canEdit = ['admin', 'editor'].includes(user?.role);
  const canDelete = user?.role === 'admin';

  return (
    <Table>
      {pois.map(poi => (
        <tr key={poi.id}>
          <td>{poi.name}</td>
          <td>
            {canEdit && (
              <Button onClick={() => editPoi(poi.id)}>Edit</Button>
            )}
            {canDelete && (
              <Button color="red" onClick={() => deletePoi(poi.id)}>
                Delete
              </Button>
            )}
          </td>
        </tr>
      ))}
    </Table>
  );
}
```

---

## Permission Matrix

### POI Operations

| Operation | Admin | Editor | Viewer |
|-----------|-------|--------|--------|
| View POIs | Yes | Yes | Yes |
| Create POI | Yes | Yes | No |
| Edit POI | Yes | Yes | No |
| Delete POI | Yes | No | No |
| Publish POI | Yes | Yes | No |

### Category Operations

| Operation | Admin | Editor | Viewer |
|-----------|-------|--------|--------|
| View Categories | Yes | Yes | Yes |
| Create Category | Yes | No | No |
| Edit Category | Yes | No | No |
| Delete Category | Yes | No | No |

### Image Operations

| Operation | Admin | Editor | Viewer |
|-----------|-------|--------|--------|
| View Images | Yes | Yes | Yes |
| Upload Image | Yes | Yes | No |
| Edit Metadata | Yes | Yes | No |
| Delete Image | Yes | Yes | No |

### User Operations

| Operation | Admin | Editor | Viewer |
|-----------|-------|--------|--------|
| View Users | Yes | No | No |
| Create User | Yes | No | No |
| Edit User | Yes | No | No |
| Delete User | Yes | No | No |

---

## User Model

```python
# nearby-admin/backend/app/models/user.py

from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="viewer")
    created_at = Column(DateTime, default=datetime.utcnow)
```

---

## API Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success - authorized and completed |
| 401 | Unauthorized - not logged in |
| 403 | Forbidden - logged in but lacks permission |

### Error Response Format

```json
{
  "detail": "Permission denied: delete_poi required"
}
```

---

## Adding New Permissions

1. Add permission constant to `Permission` class
2. Add to appropriate roles in `ROLE_PERMISSIONS`
3. Use `require_permission()` in endpoint
4. Update frontend to check role/permission

```python
# Example: Adding a new "EXPORT_DATA" permission

# 1. Add constant
class Permission:
    EXPORT_DATA = "export_data"

# 2. Add to roles
ROLE_PERMISSIONS = {
    "admin": [..., Permission.EXPORT_DATA],
    "editor": [..., Permission.EXPORT_DATA],
    "viewer": [],  # Viewers cannot export
}

# 3. Use in endpoint
@router.get("/export")
async def export_data(
    current_user = Depends(require_permission(Permission.EXPORT_DATA))
):
    return generate_export()
```

---

## Best Practices

1. **Principle of Least Privilege**: Grant minimum permissions needed
2. **Default to Viewer**: New users should be viewers by default
3. **Audit Trail**: Log permission-related actions (future improvement)
4. **Regular Review**: Periodically review user roles
5. **Separation of Concerns**: Keep permission logic in `permissions.py`
