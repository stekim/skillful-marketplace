import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import NullPool

from app.config import settings


# When running on a serverless platform (Vercel, Lambda) every cold-started
# function instance gets its own engine. Default pool sizes would leak
# connections, so use NullPool to open and close one connection per request.
# In local/long-lived deployments we keep the default pool with pre-ping.
_IS_SERVERLESS = bool(
    os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME")
)

if _IS_SERVERLESS:
    engine = create_engine(settings.database_url, poolclass=NullPool, future=True)
else:
    engine = create_engine(settings.database_url, pool_pre_ping=True, future=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
