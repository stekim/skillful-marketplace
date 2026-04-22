from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import current_user
from app.db import get_db
from app.models import Item, User, UserItem
from app.schemas import ItemOut, UserItemOut
from app.services import bet_engine


router = APIRouter(prefix="/items", tags=["items"])


@router.get("", response_model=list[ItemOut])
def list_items(db: Session = Depends(get_db)) -> list[ItemOut]:
    rows = db.execute(select(Item).order_by(Item.price_cents)).scalars().all()
    return [ItemOut.model_validate(r) for r in rows]


@router.post("/{slug}/buy", response_model=UserItemOut)
def buy(
    slug: str,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> UserItemOut:
    item = db.execute(select(Item).where(Item.slug == slug)).scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    ui = bet_engine.buy_item(db, user, item)
    db.commit()
    db.refresh(ui)
    return UserItemOut(
        id=ui.id,
        item=ItemOut.model_validate(item),
        uses_remaining=ui.uses_remaining,
        acquired_at=ui.acquired_at,
    )
