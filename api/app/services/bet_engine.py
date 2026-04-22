"""Bet lifecycle and item-effect logic.

All balance mutations flow through :func:`adjust_balance` which writes a paired
``transactions`` row. Callers are responsible for committing the outer session.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Bet, Item, Transaction, User, UserItem


Claim = Literal["creator_wins", "opponent_wins", "draw"]

DEFAULT_STAKE_CAP_CENTS = 50000
WHALE_STAKE_CAP_CENTS = 500000


def adjust_balance(
    db: Session,
    user: User,
    delta_cents: int,
    kind: str,
    reference_type: Optional[str] = None,
    reference_id: Optional[int] = None,
    note: Optional[str] = None,
) -> Transaction:
    user.balance_cents += delta_cents
    if user.balance_cents < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient balance"
        )
    tx = Transaction(
        user_id=user.id,
        delta_cents=delta_cents,
        kind=kind,
        reference_type=reference_type,
        reference_id=reference_id,
        note=note,
    )
    db.add(tx)
    return tx


def _stake_cap_for(db: Session, user: User) -> int:
    has_whale = (
        db.execute(
            select(UserItem)
            .join(Item)
            .where(UserItem.user_id == user.id, Item.effect_type == "whale_license")
        ).first()
        is not None
    )
    return WHALE_STAKE_CAP_CENTS if has_whale else DEFAULT_STAKE_CAP_CENTS


def create_bet(
    db: Session, creator: User, title: str, description: str, stake_cents: int
) -> Bet:
    cap = _stake_cap_for(db, creator)
    if stake_cents > cap:
        raise HTTPException(
            status_code=400,
            detail=f"Stake exceeds your cap of {cap} cents (buy a Whale License to raise it)",
        )
    if creator.balance_cents < stake_cents:
        raise HTTPException(status_code=400, detail="Insufficient balance to stake")

    bet = Bet(
        creator_id=creator.id,
        title=title,
        description=description,
        stake_cents=stake_cents,
        status="open",
    )
    db.add(bet)
    db.flush()
    adjust_balance(
        db,
        creator,
        -stake_cents,
        kind="stake_hold",
        reference_type="bet",
        reference_id=bet.id,
        note="Created bet stake",
    )
    return bet


def accept_bet(db: Session, opponent: User, bet: Bet) -> Bet:
    if bet.status != "open":
        raise HTTPException(status_code=400, detail="Bet is not open")
    if bet.creator_id == opponent.id:
        raise HTTPException(status_code=400, detail="Cannot accept your own bet")
    cap = _stake_cap_for(db, opponent)
    if bet.stake_cents > cap:
        raise HTTPException(
            status_code=400, detail=f"Stake exceeds your cap of {cap} cents"
        )
    if opponent.balance_cents < bet.stake_cents:
        raise HTTPException(status_code=400, detail="Insufficient balance to accept")

    bet.opponent_id = opponent.id
    bet.status = "active"
    bet.accepted_at = datetime.now(timezone.utc)
    adjust_balance(
        db,
        opponent,
        -bet.stake_cents,
        kind="stake_hold",
        reference_type="bet",
        reference_id=bet.id,
        note="Accepted bet stake",
    )
    return bet


def cancel_bet(db: Session, user: User, bet: Bet) -> Bet:
    if bet.creator_id != user.id:
        raise HTTPException(status_code=403, detail="Only the creator can cancel")
    if bet.status != "open":
        raise HTTPException(status_code=400, detail="Only open bets can be canceled")
    bet.status = "canceled"
    adjust_balance(
        db,
        user,
        bet.stake_cents,
        kind="refund",
        reference_type="bet",
        reference_id=bet.id,
        note="Canceled own bet",
    )
    return bet


def submit_claim(db: Session, user: User, bet: Bet, claim: Claim) -> Bet:
    if bet.status not in ("active", "pending_resolution"):
        raise HTTPException(status_code=400, detail="Bet is not awaiting claims")
    if user.id == bet.creator_id:
        bet.creator_claim = claim
    elif user.id == bet.opponent_id:
        bet.opponent_claim = claim
    else:
        raise HTTPException(status_code=403, detail="Not a participant")

    if bet.creator_claim and bet.opponent_claim:
        if bet.creator_claim == bet.opponent_claim:
            _resolve(db, bet, winner_claim=bet.creator_claim, resolved_by="mutual")
        else:
            bet.status = "disputed"
    else:
        bet.status = "pending_resolution"
    return bet


def admin_resolve(db: Session, admin: User, bet: Bet, winner: Claim) -> Bet:
    if bet.status not in ("disputed", "pending_resolution", "active"):
        raise HTTPException(status_code=400, detail="Bet not resolvable")
    _resolve(db, bet, winner_claim=winner, resolved_by="admin")
    return bet


def _first_unused_item(db: Session, user_id: int, effect_type: str) -> Optional[UserItem]:
    return (
        db.execute(
            select(UserItem)
            .join(Item)
            .where(
                UserItem.user_id == user_id,
                UserItem.uses_remaining > 0,
                UserItem.consumed_in_bet_id.is_(None),
                Item.effect_type == effect_type,
                Item.is_consumable.is_(True),
            )
            .limit(1)
        )
        .scalars()
        .first()
    )


def _consume_item(ui: UserItem, bet_id: int) -> None:
    ui.uses_remaining -= 1
    if ui.uses_remaining <= 0:
        ui.consumed_in_bet_id = bet_id


def _resolve(db: Session, bet: Bet, *, winner_claim: Claim, resolved_by: str) -> None:
    creator = db.get(User, bet.creator_id)
    opponent = db.get(User, bet.opponent_id) if bet.opponent_id else None
    assert creator and opponent

    bet.resolved_by = resolved_by
    bet.resolved_at = datetime.now(timezone.utc)

    if winner_claim == "draw":
        for u in (creator, opponent):
            adjust_balance(
                db,
                u,
                bet.stake_cents,
                kind="stake_release",
                reference_type="bet",
                reference_id=bet.id,
                note="Draw refund",
            )
        bet.winner_id = None
        bet.status = "resolved"
        return

    if winner_claim == "creator_wins":
        winner, loser = creator, opponent
    else:
        winner, loser = opponent, creator
    bet.winner_id = winner.id

    payout = bet.stake_cents * 2
    winnings = bet.stake_cents

    lucky = _first_unused_item(db, winner.id, "lucky_charm")
    if lucky:
        bonus_pct = int(lucky.item.effect_payload.get("bonus_pct", 10))
        bonus = winnings * bonus_pct // 100
        payout += bonus
        _consume_item(lucky, bet.id)
        adjust_balance(
            db,
            winner,
            0,
            kind="bet_win",
            reference_type="bet",
            reference_id=bet.id,
            note=f"Lucky Charm +{bonus_pct}% applied",
        )

    adjust_balance(
        db,
        winner,
        payout,
        kind="bet_win",
        reference_type="bet",
        reference_id=bet.id,
        note="Bet win payout",
    )
    winner.xp += 10

    insurance = _first_unused_item(db, loser.id, "insurance")
    if insurance:
        refund_pct = int(insurance.item.effect_payload.get("refund_pct", 50))
        refund = bet.stake_cents * refund_pct // 100
        _consume_item(insurance, bet.id)
        adjust_balance(
            db,
            loser,
            refund,
            kind="refund",
            reference_type="bet",
            reference_id=bet.id,
            note=f"Insurance payout ({refund_pct}% of stake)",
        )
    loser.xp += 2

    bet.status = "resolved"


def scout_opponent(db: Session, opponent_id: int) -> dict:
    """Return W/L/D and avg stake for a user based on resolved bets."""
    bets = db.execute(
        select(Bet).where(
            Bet.status == "resolved",
            (Bet.creator_id == opponent_id) | (Bet.opponent_id == opponent_id),
        )
    ).scalars().all()

    wins = losses = draws = 0
    total_stake = 0
    for b in bets:
        total_stake += b.stake_cents
        if b.winner_id is None:
            draws += 1
        elif b.winner_id == opponent_id:
            wins += 1
        else:
            losses += 1
    total = len(bets)
    avg = (total_stake // total) if total else 0
    return {
        "wins": wins,
        "losses": losses,
        "draws": draws,
        "avg_stake_cents": avg,
        "total_bets": total,
    }


def buy_item(db: Session, user: User, item: Item) -> UserItem:
    if user.balance_cents < item.price_cents:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    if item.effect_type == "whale_license":
        existing = db.execute(
            select(UserItem)
            .join(Item)
            .where(UserItem.user_id == user.id, Item.effect_type == "whale_license")
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Already owned")

    adjust_balance(
        db,
        user,
        -item.price_cents,
        kind="item_purchase",
        reference_type="item",
        reference_id=item.id,
        note=f"Bought {item.name}",
    )
    uses = 1 if item.is_consumable else 999_999
    ui = UserItem(user_id=user.id, item_id=item.id, uses_remaining=uses)
    db.add(ui)
    db.flush()
    return ui
