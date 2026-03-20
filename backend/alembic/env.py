from logging.config import fileConfig

from alembic import context

from app.adapters.outgoing.persistence.database import Base

# Lazily create engine from DATABASE_URL env var if present
from sqlalchemy import create_engine
import os

database_url = os.environ.get('DATABASE_URL')
if database_url:
    engine = create_engine(database_url)
else:
    # fallback to existing engine import for SQLite
    from app.adapters.outgoing.persistence.database import engine


# ✅ Import all models so Alembic can detect them
from app.adapters.outgoing.persistence.models import *

# Alembic Config object
config = context.config

# Configure logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata for autogenerate
target_metadata = Base.metadata


def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    context.configure(
        url=str(engine.url),
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode."""
    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()