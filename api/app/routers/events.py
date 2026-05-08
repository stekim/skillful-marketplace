from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.auth import optional_user
from app.db import get_db
from app.models import Event, User
from app.schemas import EventBatchIn


router = APIRouter(prefix="/events", tags=["events"])


def _client_ip(request: Request) -> str | None:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",", 1)[0].strip()[:64] or None
    return request.client.host if request.client else None


@router.post("", status_code=status.HTTP_204_NO_CONTENT)
def ingest(
    payload: EventBatchIn,
    request: Request,
    user: User | None = Depends(optional_user),
    db: Session = Depends(get_db),
) -> Response:
    """Best-effort ingest endpoint. Accepts a batch of behavior events from the
    web client. Works for both authenticated and anonymous traffic — the JWT
    is read if present but never required."""
    ua = (request.headers.get("user-agent") or "")[:500] or None
    ip = _client_ip(request)
    rows = [
        Event(
            user_id=user.id if user else None,
            session_id=e.session_id,
            name=e.name,
            path=e.path,
            properties=e.properties,
            user_agent=ua,
            ip=ip,
        )
        for e in payload.events
    ]
    db.add_all(rows)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
