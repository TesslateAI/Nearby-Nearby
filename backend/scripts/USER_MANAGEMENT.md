# User Management for Nearby Nearby Admin Portal

## Overview
This document describes how to manage users in the Nearby Nearby Admin Portal database.

## Test User Created ✅
A test user has been created with the following credentials:
- **Email**: `test@nearbynearby.com`
- **Password**: `1234`
- **Role**: `admin`

## User Management Scripts

### 1. Simple Test User Creation
```bash
cd backend
python create_test_user.py
```
This script creates the test user (`test@nearbynearby.com` / `1234`) if it doesn't already exist.

### 2. Comprehensive User Management
```bash
cd backend
python manage_users.py [command] [options]
```

#### Available Commands:

**Create a new user:**
```bash
python manage_users.py create <email> <password> [--role <role>]
```
Example:
```bash
python manage_users.py create admin@nearbynearby.com mypassword123 --role admin
```

**List all users:**
```bash
python manage_users.py list
```

**Delete a user:**
```bash
python manage_users.py delete <email>
```
Example:
```bash
python manage_users.py delete test@example.com
```

**Create the test user:**
```bash
python manage_users.py test-user
```

## User Model

The User model includes the following fields:
- `id` (UUID, primary key)
- `email` (String, unique, indexed)
- `hashed_password` (String, bcrypt hashed)
- `role` (String, default: "admin")
- `created_at` (Timestamp, auto-generated)

## Authentication Flow

1. **Login**: Users authenticate via `/api/v1/auth/login` endpoint
2. **Token**: JWT token is returned and stored in frontend
3. **Authorization**: Token is included in `Authorization: Bearer <token>` header
4. **Validation**: Backend validates token and extracts user email

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens have expiration (configurable in `ACCESS_TOKEN_EXPIRE_MINUTES`)
- Email addresses must be unique
- Role-based access control is available (admin, editor, etc.)

## Testing the Login

You can now test the login with the created user:

1. **Frontend**: Navigate to the login page
2. **Credentials**: 
   - Email: `test@nearbynearby.com`
   - Password: `1234`
3. **Expected**: Successful login and access to admin panel

## Troubleshooting

### Common Issues:

1. **"User already exists"**: The user was already created
2. **Database connection errors**: Ensure the database is running
3. **Import errors**: Make sure you're running from the `backend` directory
4. **Bcrypt warnings**: These are harmless version compatibility warnings

### Reset Test User:
If you need to recreate the test user:
```bash
python manage_users.py delete test@nearbynearby.com
python manage_users.py test-user
``` 