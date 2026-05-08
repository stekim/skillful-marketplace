import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import NullPool

from app.config import settings


def _normalize_database_url(url: str) -> str:
    """Force SQLAlchemy to use the psycopg3 dialect.

    Cloud providers (Neon, Supabase, Render, Heroku, etc.) emit raw Postgres
    URLs that start with ``postgres://`` or ``postgresql://``. Without an
    explicit driver, SQLAlchemy tries to import ``psycopg2``, which is not in
    our requirements — that crashes the Vercel function on cold start with a
    ``ModuleNotFoundError``. Rewriting the prefix here makes the code work
    regardless of how the env var is provided.
    """
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    if url.startswith("postgresql://") and not url.startswith("postgresql+"):
        url = "postgresql+psycopg://" + url[len("postgresql://") :]
    return url


_DB_URL = _normalize_database_url(settings.database_url)

# When running on a serverless platform (Vercel, Lambda) every cold-started
# function instance gets its own engine. Default pool sizes would leak
# connections, so use NullPool to open and close one connection per request.
# In local/long-lived deployments we keep the default pool with pre-ping.
_IS_SERVERLESS = bool(
    os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME")
)

if _IS_SERVERLESS:
    engine = create_engine(_DB_URL, poolclass=NullPool, future=True)
else:
    engine = create_engine(_DB_URL, pool_pre_ping=True, future=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
