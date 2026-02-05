#!/usr/bin/env python3
"""
Environment Configuration Validator for Nearby-Nearby

This script validates your .env configuration and helps ensure
all required variables are properly set.
"""

import os
import sys
from pathlib import Path

def check_file_exists(filename):
    """Check if a file exists"""
    return Path(filename).exists()

def validate_env_file():
    """Validate the .env file configuration"""
    print("🔍 Validating Nearby-Nearby Environment Configuration\n")
    
    # Check if .env file exists
    if not check_file_exists('.env'):
        print("❌ .env file not found!")
        print("📝 Please copy .envexample to .env and configure your values:")
        print("   cp .envexample .env")
        return False
    
    # Load environment variables from .env file
    from dotenv import load_dotenv
    load_dotenv()
    
    errors = []
    warnings = []
    
    # Required variables
    required_vars = {
        'DATABASE_URL': 'Database connection URL',
        'SECRET_KEY': 'JWT secret key for token signing',
        'POSTGRES_USER': 'PostgreSQL username',
        'POSTGRES_PASSWORD': 'PostgreSQL password',
        'POSTGRES_DB': 'PostgreSQL database name'
    }
    
    # Optional but recommended variables
    optional_vars = {
        'ACCESS_TOKEN_EXPIRE_MINUTES': 'JWT token expiration time (default: 30)',
        'ENVIRONMENT': 'Application environment (default: development)',
        'ALLOWED_ORIGINS': 'CORS allowed origins',
        'ALLOWED_HOSTS': 'Allowed hostnames',
        'PRODUCTION_DOMAIN': 'Production domain name'
    }
    
    print("✅ Required Variables:")
    for var, description in required_vars.items():
        value = os.getenv(var)
        if not value:
            errors.append(f"❌ {var} is required - {description}")
            print(f"   ❌ {var}: NOT SET")
        else:
            # Special validation for certain variables
            if var == 'SECRET_KEY':
                if value == 'your_generated_secret_key_here_minimum_32_characters':
                    errors.append(f"❌ {var} is using the default example value - generate a new one!")
                elif len(value) < 32:
                    errors.append(f"❌ {var} must be at least 32 characters long")
                else:
                    print(f"   ✅ {var}: SET (length: {len(value)})")
            elif var == 'POSTGRES_PASSWORD':
                if value in ['nearby', 'password', '123456', 'admin']:
                    warnings.append(f"⚠️  {var} appears to be a weak password")
                print(f"   ✅ {var}: SET")
            else:
                print(f"   ✅ {var}: {value}")
    
    print(f"\n📋 Optional Variables:")
    for var, description in optional_vars.items():
        value = os.getenv(var)
        if value:
            print(f"   ✅ {var}: {value}")
        else:
            print(f"   ⏭️  {var}: NOT SET (will use default) - {description}")
    
    # Environment-specific checks
    environment = os.getenv('ENVIRONMENT', 'development').lower()
    print(f"\n🌍 Environment: {environment}")
    
    if environment == 'production':
        production_checks = [
            ('SECRET_KEY', 'Must be a strong, unique secret'),
            ('POSTGRES_PASSWORD', 'Must be a strong password'),
            ('ALLOWED_ORIGINS', 'Should be restricted to your domain'),
            ('ALLOWED_HOSTS', 'Should be restricted to your domain'),
            ('PRODUCTION_DOMAIN', 'Should be set to your production domain')
        ]
        
        print("🔒 Production Security Checks:")
        for var, requirement in production_checks:
            value = os.getenv(var)
            if not value:
                errors.append(f"❌ Production: {var} must be set - {requirement}")
            elif var == 'ALLOWED_ORIGINS' and 'localhost' in value:
                warnings.append(f"⚠️  Production: {var} contains localhost - remove for production")
            elif var == 'ALLOWED_HOSTS' and value == '*':
                warnings.append(f"⚠️  Production: {var} is wildcard - specify exact hosts for security")
    
    # Summary
    print(f"\n📊 Validation Summary:")
    if errors:
        print("❌ Configuration has critical errors:")
        for error in errors:
            print(f"   {error}")
    
    if warnings:
        print("⚠️  Configuration has warnings:")
        for warning in warnings:
            print(f"   {warning}")
    
    if not errors and not warnings:
        print("✅ Configuration looks good!")
    elif not errors:
        print("✅ Configuration is valid but has some warnings to review.")
    
    print(f"\n💡 Tips:")
    print("   • Generate SECRET_KEY with: openssl rand -hex 32")
    print("   • Use strong passwords for production")
    print("   • Restrict CORS origins in production")
    print("   • Never commit .env files to version control")
    
    return len(errors) == 0

def generate_secret_key():
    """Generate a secure secret key"""
    import secrets
    return secrets.token_hex(32)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "generate-key":
        print("🔑 Generated SECRET_KEY:")
        print(generate_secret_key())
    else:
        success = validate_env_file()
        sys.exit(0 if success else 1)
