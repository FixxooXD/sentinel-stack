import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context

# This is the Alembic Config object, which provides access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging. This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 1. IMPORT YOUR MODELS HERE SO ALEMBIC CAN SEE THE BLUEPRINT
from database.models import Base
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection):
    """The actual sync migration execution block."""
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online() -> None:
    """Run migrations in 'online' mode using an Async Engine."""
    # Create the modern asynchronous engine directly from your alembic.ini URL string
    connectable = create_async_engine(
        config.get_main_option("sqlalchemy.url"),
        poolclass=pool.NullPool,
    )

    # Open the async connection socket securely
    async with connectable.connect() as connection:
        # Run the synchronous migration controller inside the async engine wrapper safely
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()

# 2. DETERMINES EXECUTION ROUTE
if context.is_offline_mode():
    run_migrations_offline()
else:
    # Run the online migration inside Python's native asyncio runner!
    asyncio.run(run_migrations_online())