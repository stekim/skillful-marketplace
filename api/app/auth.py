from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.models import User


TOKEN_TTL = timedelta(days=30)


def create_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": int(now.timestamp()),
        "exp": int((now + TOKEN_TTL).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def _token_from_request(request: Request) -> str | None:
    auth = request.headers.get("authorization")
    if auth and auth.lower().startswith("bearer "):
        return auth.split(" ", 1)[1].strip()
    return request.cookies.get("session")


def current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = _token_from_request(request)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def optional_user(request: Request, db: Session = Depends(get_db)) -> User | None:
    """Return the current user if a valid token is present, else None.

    Used by endpoints that should accept anonymous traffic (e.g. event ingestion).
    """
    token = _token_from_request(request)
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        return None
    return db.get(User, user_id)


def require_admin(user: User = Depends(current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin required")
    return user
