from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from pathlib import Path
import os, sys

# Provide a sane default if DATABASE_URL is missing (local dev)
fallback_url = "postgresql://postgres:postgres@localhost:5432/app"
url = os.getenv("DATABASE_URL", fallback_url)
if url.startswith("postgres://"):
    url = url.replace("postgres://", "postgresql://", 1)
from alembic import context
context.config.set_main_option("sqlalchemy.url", url)

api_root = Path(__file__).resolve().parents[1]
sys.path.append(str(api_root))
sys.path.append(str(api_root / "src"))

config = context.config
# fileConfig(config.config_file_name)

target_metadata = None # we’re using SQL files

def include_object(obj, name, type_, reflected, compare_to):
    # ignore postgres extensions
    return type_ != "extension"

def run_migrations_offline():
    url = os.getenv("DATABASE_URL")
    context.configure(url=url,
                      literal_binds=False,
                      include_object=include_object)
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    url = os.getenv("DATABASE_URL")
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        url=url,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection,
                          include_object=include_object)
        with context.begin_transaction():
            context.run_migrations()

run_migrations_offline()
