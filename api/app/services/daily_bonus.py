"""Daily login bonus with streak tracking and Streak Freeze integration."""

from __future__ import annotations

from datetime import date, timedelta

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Item, User, UserItem
from app.services.bet_engine import adjust_balance


BASE_BONUS_CENTS = 5000
PER_DAY_STREAK_BONUS_CENTS = 1000
MAX_STREAK_FOR_BONUS = 7


def _streak_freeze(db: Session, user_id: int) -> UserItem | None:
    return (
        db.execute(
            select(UserItem)
            .join(Item)
            .where(
                UserItem.user_id == user_id,
                UserItem.uses_remaining > 0,
                UserItem.consumed_in_bet_id.is_(None),
                Item.effect_type == "streak_freeze",
            )
            .limit(1)
        )
        .scalars()
        .first()
    )


def claim_daily_bonus(db: Session, user: User) -> dict:
    today = date.today()
    if user.last_daily_bonus_date == today:
        raise HTTPException(status_code=400, detail="Daily bonus already claimed today")

    yesterday = today - timedelta(days=1)
    consumed_note = None
    if user.last_daily_bonus_date is None:
        user.daily_streak = 1
    elif user.last_daily_bonus_date == yesterday:
        user.daily_streak += 1
    else:
        freeze = _streak_freeze(db, user.id)
        gap = (today - user.last_daily_bonus_date).days
        if freeze and gap == 2:
            freeze.uses_remaining -= 1
            if freeze.uses_remaining <= 0:
                freeze.consumed_in_bet_id = None
            user.daily_streak += 1
            consumed_note = "Streak Freeze consumed to preserve streak"
        else:
            user.daily_streak = 1

    effective_streak_days = min(user.daily_streak, MAX_STREAK_FOR_BONUS)
    awarded = BASE_BONUS_CENTS + (effective_streak_days - 1) * PER_DAY_STREAK_BONUS_CENTS

    adjust_balance(
        db,
        user,
        awarded,
        kind="daily_bonus",
        reference_type="daily_bonus",
        reference_id=None,
        note=consumed_note or f"Daily bonus day {user.daily_streak}",
    )
    user.last_daily_bonus_date = today

    msg = f"Awarded {awarded} cents (streak: {user.daily_streak})"
    if consumed_note:
        msg = f"{msg}. {consumed_note}."
    return {
        "awarded_cents": awarded,
        "new_balance_cents": user.balance_cents,
        "streak": user.daily_streak,
        "message": msg,
    }
