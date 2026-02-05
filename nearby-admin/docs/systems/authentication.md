# Authentication System

## Overview

The nearby-admin application uses JWT (JSON Web Token) based authentication. Users authenticate with email/password and receive a token for subsequent requests.

**Key Files:**
- `nearby-admin/backend/app/core/security.py` - Token generation, password hashing
- `nearby-admin/backend/app/api/endpoints/auth.py` - Login endpoints
- `nearby-admin/frontend/src/utils/AuthContext.jsx` - Frontend auth state
- `nearby-admin/frontend/src/utils/secureStorage.js` - Token storage

---

## Backend Implementation

### Password Hashing

Uses bcrypt for secure password hashing:

```python
# nearby-admin/backend/app/core/security.py

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate bcrypt hash of password."""
    return pwd_context.hash(password)
```

### JWT Token Generation

```python
# nearby-admin/backend/app/core/security.py

from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

### Token Verification

```python
# nearby-admin/backend/app/core/security.py

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Extract and validate user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user
```

---

## API Endpoints

### POST /api/auth/login

Authenticate user and return JWT token.

**Request:**
```json
{
  "username": "admin@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Implementation:**
```python
# nearby-admin/backend/app/api/endpoints/auth.py

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}
```

### GET /api/auth/me

Get current authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "admin@example.com",
  "role": "admin"
}
```

---

## Frontend Implementation

### Auth Context

Global authentication state using React Context:

```jsx
// nearby-admin/frontend/src/utils/AuthContext.jsx

import { createContext, useState, useContext, useEffect } from 'react';
import { getToken, setToken, removeToken, isTokenExpired } from './secureStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token && !isTokenExpired(token)) {
      fetchCurrentUser(token).then(setUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: email, password }),
    });
    const data = await response.json();
    setToken(data.access_token);
    const user = await fetchCurrentUser(data.access_token);
    setUser(user);
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Secure Token Storage

```javascript
// nearby-admin/frontend/src/utils/secureStorage.js

const TOKEN_KEY = 'auth_token';

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}
```

### Protected Routes

```jsx
// nearby-admin/frontend/src/components/ProtectedRoute.jsx

import { Navigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

### API Client with Auth

```javascript
// nearby-admin/frontend/src/utils/api.js

import { getToken, isTokenExpired, removeToken } from './secureStorage';

export async function apiRequest(url, options = {}) {
  const token = getToken();

  if (token && isTokenExpired(token)) {
    removeToken();
    window.location.href = '/login';
    return;
  }

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    removeToken();
    window.location.href = '/login';
  }

  return response;
}
```

---

## Configuration

### Environment Variables

```bash
# nearby-admin/backend/.env

SECRET_KEY=your-32-character-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=1440  # 24 hours
```

### Settings

```python
# nearby-admin/backend/app/core/config.py

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## User Management Scripts

### Create User

```bash
docker exec nearby-admin-backend-1 python scripts/manage_users.py create admin@example.com password123 --role admin
```

### List Users

```bash
docker exec nearby-admin-backend-1 python scripts/manage_users.py list
```

### Delete User

```bash
docker exec nearby-admin-backend-1 python scripts/manage_users.py delete admin@example.com
```

### Create Test User

```bash
docker exec nearby-admin-backend-1 python scripts/manage_users.py test-user
# Creates: test@nearbynearby.com / 1234
```

---

## Security Best Practices

1. **Secret Key**: Use a strong, random 32+ character secret key
2. **Token Expiration**: Set appropriate expiration (default: 24 hours)
3. **HTTPS**: Always use HTTPS in production
4. **Password Requirements**: Enforce minimum password strength
5. **Rate Limiting**: Consider rate limiting login attempts
6. **Token Storage**: Use httpOnly cookies for enhanced security (future improvement)

---

## Common Issues

### Token Expired

**Symptom**: 401 Unauthorized on all requests
**Solution**: Re-login to get a new token

### Invalid Credentials

**Symptom**: "Incorrect email or password" error
**Solution**: Verify email exists and password is correct

### CORS Errors

**Symptom**: Browser blocks requests
**Solution**: Ensure frontend origin is in ALLOWED_ORIGINS
