from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    # Provide a default value for safety, though it will be overridden by docker-compose
    DATABASE_URL: str = "postgresql://user:pass@localhost/db"

    model_config = ConfigDict(env_file=".env")

settings = Settings()