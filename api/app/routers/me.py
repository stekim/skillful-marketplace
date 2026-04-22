from fastapi import APIRouter, Depends
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.auth import current_user
from app.db import get_db
from app.models import Transaction, User, UserItem
from app.schemas import (
    DailyBonusResult,
    ItemOut,
    TransactionOut,
    UserItemOut,
    UserOut,
)
from app.services.daily_bonus import claim_daily_bonus


router = APIRouter(prefix="/me", tags=["me"])


@router.get("", response_model=UserOut)
def get_me(user: User = Depends(current_user)) -> UserOut:
    return UserOut.model_validate(user)


@router.post("/claim-daily", response_model=DailyBonusResult)
def claim_daily(
    user: User = Depends(current_user), db: Session = Depends(get_db)
) -> DailyBonusResult:
    result = claim_daily_bonus(db, user)
    db.commit()
    return DailyBonusResult(**result)


@router.get("/inventory", response_model=list[UserItemOut])
def inventory(
    user: User = Depends(current_user), db: Session = Depends(get_db)
) -> list[UserItemOut]:
    rows = (
        db.execute(
            select(UserItem)
            .where(UserItem.user_id == user.id, UserItem.uses_remaining > 0)
            .order_by(desc(UserItem.acquired_at))
        )
        .scalars()
        .all()
    )
    return [
        UserItemOut(
            id=r.id,
            item=ItemOut.model_validate(r.item),
            uses_remaining=r.uses_remaining,
            acquired_at=r.acquired_at,
        )
        for r in rows
    ]


@router.get("/transactions", response_model=list[TransactionOut])
def transactions(
    user: User = Depends(current_user), db: Session = Depends(get_db)
) -> list[TransactionOut]:
    rows = (
        db.execute(
            select(Transaction)
            .where(Transaction.user_id == user.id)
            .order_by(desc(Transaction.created_at))
            .limit(100)
        )
        .scalars()
        .all()
    )
    return [TransactionOut.model_validate(r) for r in rows]
