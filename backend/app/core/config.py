from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Provide a default value for safety, though it will be overridden by docker-compose
    DATABASE_URL: str = "postgresql://user:pass@localhost/db"

    class Config:
        env_file = ".env"

settings = Settings()