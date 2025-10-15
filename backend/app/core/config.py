from pydantic_settings import BaseSettings
from pydantic import ConfigDict, field_validator
from typing import List, Optional
import secrets

class Settings(BaseSettings):
    # Database settings
    DATABASE_URL: str
    
    # Security settings
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 360
    ENVIRONMENT: str = "development"
    
    # CORS and networking
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    ALLOWED_HOSTS: str = "*"
    PRODUCTION_DOMAIN: Optional[str] = None
    
    # Database credentials (for Docker Compose)
    POSTGRES_USER: str = "nearby"
    POSTGRES_PASSWORD: str = "nearby"
    POSTGRES_DB: str = "nearbynearby"
    
    # Test database settings
    TEST_POSTGRES_USER: Optional[str] = None
    TEST_POSTGRES_PASSWORD: Optional[str] = None
    TEST_POSTGRES_DB: Optional[str] = None
    TEST_DATABASE_URL: Optional[str] = None
    TESTING: bool = False

    model_config = ConfigDict(env_file=".env")
    
    @field_validator('SECRET_KEY')
    @classmethod
    def validate_secret_key(cls, v):
        if not v or v == "your_generated_secret_key_here_minimum_32_characters":
            raise ValueError(
                "SECRET_KEY is required and cannot be the default value. "
                "Generate one with: openssl rand -hex 32"
            )
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        return v
    
    @field_validator('ENVIRONMENT')
    @classmethod
    def validate_environment(cls, v):
        valid_environments = ['development', 'staging', 'production']
        if v.lower() not in valid_environments:
            raise ValueError(f"ENVIRONMENT must be one of: {valid_environments}")
        return v.lower()
    
    @field_validator('ACCESS_TOKEN_EXPIRE_MINUTES')
    @classmethod
    def validate_token_expiration(cls, v):
        if v < 5 or v > 1440:  # 5 minutes to 24 hours
            raise ValueError("ACCESS_TOKEN_EXPIRE_MINUTES must be between 5 and 1440 (24 hours)")
        return v
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Convert ALLOWED_ORIGINS string to list"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    @property
    def allowed_hosts_list(self) -> List[str]:
        """Convert ALLOWED_HOSTS string to list"""
        if self.ALLOWED_HOSTS == "*":
            return ["*"]
        return [host.strip() for host in self.ALLOWED_HOSTS.split(",")]
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.ENVIRONMENT == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development environment"""
        return self.ENVIRONMENT == "development"

# Initialize settings and validate on import
try:
    settings = Settings()
except Exception as e:
    # Check if we're in a testing environment
    import os
    if os.getenv('TESTING', 'false').lower() == 'true':
        # For testing, create a minimal configuration
        print("⚠️  Testing mode: Using minimal configuration")
        
        # Create a test settings object with minimal required values
        class TestSettings:
            DATABASE_URL = os.getenv('TEST_DATABASE_URL', 'postgresql://test:test@test-db/test')
            SECRET_KEY = 'test-secret-key-for-testing-only-32-chars'
            ACCESS_TOKEN_EXPIRE_MINUTES = 30
            ENVIRONMENT = 'development'
            ALLOWED_ORIGINS = 'http://localhost:5173'
            ALLOWED_HOSTS = '*'
            PRODUCTION_DOMAIN = None
            POSTGRES_USER = 'test'
            POSTGRES_PASSWORD = 'test'
            POSTGRES_DB = 'test'
            TEST_POSTGRES_USER = None
            TEST_POSTGRES_PASSWORD = None
            TEST_POSTGRES_DB = None
            TEST_DATABASE_URL = None
            TESTING = True
            
            @property
            def allowed_origins_list(self):
                return self.ALLOWED_ORIGINS.split(',')
            
            @property
            def allowed_hosts_list(self):
                return ['*'] if self.ALLOWED_HOSTS == '*' else self.ALLOWED_HOSTS.split(',')
            
            @property
            def is_production(self):
                return False
            
            @property
            def is_development(self):
                return True
        
        settings = TestSettings()
    else:
        print(f"❌ Configuration Error: {e}")
        print("📝 Please check your .env file and ensure all required variables are set.")
        print("💡 Copy .envexample to .env and fill in the required values.")
        print("🔑 Generate SECRET_KEY with: openssl rand -hex 32")
        raise