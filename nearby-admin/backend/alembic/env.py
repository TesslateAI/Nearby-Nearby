import os
import sys
from logging.config import fileConfig

# FIX: Add the project root directory to the Python path
# This ensures that Alembic can find the 'app' module
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

from dotenv import load_dotenv

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Load environment variables from .env file
load_dotenv()

# Import your models' Base
from app.database import Base
from app.models import poi # Import all your models here

# Set the target metadata for autogenerate
target_metadata = Base.metadata

def get_url():
    return os.getenv("DATABASE_URL")

# FIX: Add this function to ignore tables that are not part of our models
# This prevents Alembic from trying to drop PostGIS's internal tables.
def include_object(object, name, type_, reflected, compare_to):
    if type_ == "table" and name not in target_metadata.tables:
        return False
    return True

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        # Add the include_object function here for offline mode
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    ini_config = config.get_section(config.config_ini_section)
    ini_config['sqlalchemy.url'] = get_url()
    
    connectable = engine_from_config(
        ini_config,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata,
            # Add the include_object function here for online mode
            include_object=include_object,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()