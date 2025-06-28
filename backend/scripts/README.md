# Backend Scripts

This folder contains utility scripts for managing the Nearby Nearby Admin Portal backend.

## Available Scripts

### 1. `create_test_user.py`
Creates a test user in the database for development and testing.

**Usage:**
```bash
cd backend/scripts
python create_test_user.py
```

**Creates:**
- Email: `test@nearbynearby.com`
- Password: `1234`
- Role: `admin`

### 2. `manage_users.py`
Comprehensive user management script with multiple commands.

**Usage:**
```bash
cd backend/scripts
python manage_users.py [command] [options]
```

**Commands:**
- `create <email> <password> [--role <role>]` - Create a new user
- `list` - List all users in the database
- `delete <email>` - Delete a user by email
- `test-user` - Create the test user (same as create_test_user.py)

**Examples:**
```bash
# Create a new admin user
python manage_users.py create admin@example.com mypassword123 --role admin

# List all users
python manage_users.py list

# Delete a user
python manage_users.py delete user@example.com

# Create test user
python manage_users.py test-user
```

## Running Scripts

### From the scripts folder:
```bash
cd backend/scripts
python script_name.py
```

### From the backend folder:
```bash
cd backend
python scripts/script_name.py
```

### From the project root:
```bash
cd backend/scripts
python script_name.py
```

## Requirements

- Backend dependencies installed
- Database running and accessible
- Environment variables configured (if needed)

## Troubleshooting

### Import Errors
If you get import errors, make sure you're running from the correct directory:
- The scripts are designed to be run from the `backend/scripts/` folder
- They automatically add the parent directory to the Python path

### Database Connection Errors
- Ensure the database is running
- Check that the database connection settings are correct
- Verify that the database schema is up to date

### Permission Errors
- Make sure you have write permissions to the database
- Check that the database user has the necessary privileges

## Documentation

For detailed user management documentation, see `USER_MANAGEMENT.md` in this folder.

# User Management Scripts

This directory contains utility scripts for managing the Nearby Nearby application.

## manage_users.py

A command-line tool for managing users in the database.

### Prerequisites

Make sure the Docker containers are running:
```bash
docker-compose up -d
```

### Usage

**Important**: Run this script inside the Docker container to ensure proper database access:

```bash
docker-compose exec backend python scripts/manage_users.py [command]
```

### Commands

#### List all users
```bash
docker-compose exec backend python scripts/manage_users.py list
```

#### Create a new user
```bash
docker-compose exec backend python scripts/manage_users.py create <email> <password> [role]
```

Examples:
```bash
# Create admin user
docker-compose exec backend python scripts/manage_users.py create admin@example.com mypassword admin

# Create editor user
docker-compose exec backend python scripts/manage_users.py create editor@example.com mypassword editor
```

#### Delete a user
```bash
docker-compose exec backend python scripts/manage_users.py delete <email>
```

Example:
```bash
docker-compose exec backend python scripts/manage_users.py delete user@example.com
```

#### Create test user
```bash
docker-compose exec backend python scripts/manage_users.py test-user
```

This creates a test user with:
- Email: `test@nearbynearby.com`
- Password: `1234`
- Role: `admin`

### Troubleshooting

If you get database connection errors:

1. **Make sure Docker containers are running**:
   ```bash
   docker-compose up -d
   ```

2. **Run the script inside Docker** (recommended):
   ```bash
   docker-compose exec backend python scripts/manage_users.py list
   ```

3. **Alternative: Set up local environment**:
   Create a `.env` file in the backend directory with:
   ```
   DATABASE_URL=postgresql://nearby:nearby@localhost/nearbynearby
   ```

### Database Credentials

The database uses these credentials (defined in docker-compose.yml):
- **Username**: `nearby`
- **Password**: `nearby`
- **Database**: `nearbynearby`
- **Host**: `db` (inside Docker) or `localhost` (outside Docker)
- **Port**: `5432` 