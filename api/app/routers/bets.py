from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, or_, select
from sqlalchemy.orm import Session

from app.auth import current_user
from app.db import get_db
from app.models import Bet, Item, User, UserItem
from app.schemas import BetCreate, BetOut, ClaimRequest, ScoutReport
from app.services import bet_engine


router = APIRouter(prefix="/bets", tags=["bets"])


def _to_out(db: Session, bet: Bet) -> BetOut:
    creator = db.get(User, bet.creator_id)
    opponent = db.get(User, bet.opponent_id) if bet.opponent_id else None
    return BetOut(
        id=bet.id,
        creator_id=bet.creator_id,
        creator_username=creator.username if creator else "?",
        opponent_id=bet.opponent_id,
        opponent_username=opponent.username if opponent else None,
        title=bet.title,
        description=bet.description,
        stake_cents=bet.stake_cents,
        status=bet.status,
        creator_claim=bet.creator_claim,
        opponent_claim=bet.opponent_claim,
        winner_id=bet.winner_id,
        resolved_by=bet.resolved_by,
        created_at=bet.created_at,
        accepted_at=bet.accepted_at,
        resolved_at=bet.resolved_at,
    )


@router.get("", response_model=list[BetOut])
def list_bets(
    scope: str = Query("open", pattern="^(open|mine|all|history)$"),
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> list[BetOut]:
    stmt = select(Bet).order_by(desc(Bet.created_at))
    if scope == "open":
        stmt = stmt.where(Bet.status == "open", Bet.creator_id != user.id)
    elif scope == "mine":
        stmt = stmt.where(
            or_(Bet.creator_id == user.id, Bet.opponent_id == user.id)
        )
    elif scope == "history":
        stmt = stmt.where(
            or_(Bet.creator_id == user.id, Bet.opponent_id == user.id),
            Bet.status.in_(("resolved", "canceled")),
        )
    rows = db.execute(stmt.limit(200)).scalars().all()
    return [_to_out(db, b) for b in rows]


@router.post("", response_model=BetOut)
def create_bet(
    payload: BetCreate,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> BetOut:
    bet = bet_engine.create_bet(
        db, user, payload.title, payload.description, payload.stake_cents
    )
    db.commit()
    db.refresh(bet)
    return _to_out(db, bet)


@router.get("/{bet_id}", response_model=BetOut)
def get_bet(
    bet_id: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> BetOut:
    bet = db.get(Bet, bet_id)
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")
    return _to_out(db, bet)


@router.post("/{bet_id}/accept", response_model=BetOut)
def accept_bet(
    bet_id: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> BetOut:
    bet = db.get(Bet, bet_id)
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")
    bet_engine.accept_bet(db, user, bet)
    db.commit()
    db.refresh(bet)
    return _to_out(db, bet)


@router.post("/{bet_id}/cancel", response_model=BetOut)
def cancel_bet(
    bet_id: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> BetOut:
    bet = db.get(Bet, bet_id)
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")
    bet_engine.cancel_bet(db, user, bet)
    db.commit()
    db.refresh(bet)
    return _to_out(db, bet)


@router.post("/{bet_id}/claim-winner", response_model=BetOut)
def claim_winner(
    bet_id: int,
    payload: ClaimRequest,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> BetOut:
    bet = db.get(Bet, bet_id)
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")
    bet_engine.submit_claim(db, user, bet, payload.claim)
    db.commit()
    db.refresh(bet)
    return _to_out(db, bet)


@router.post("/{bet_id}/scout", response_model=ScoutReport)
def scout_bet(
    bet_id: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> ScoutReport:
    bet = db.get(Bet, bet_id)
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")
    if bet.creator_id == user.id:
        raise HTTPException(status_code=400, detail="You cannot scout yourself")

    scout = (
        db.execute(
            select(UserItem)
            .join(Item)
            .where(
                UserItem.user_id == user.id,
                UserItem.uses_remaining > 0,
                Item.effect_type == "scout",
            )
            .limit(1)
        )
        .scalars()
        .first()
    )
    if not scout:
        raise HTTPException(status_code=400, detail="No Scout Report available")

    target = db.get(User, bet.creator_id)
    report = bet_engine.scout_opponent(db, bet.creator_id)
    scout.uses_remaining -= 1
    if scout.uses_remaining <= 0:
        scout.consumed_in_bet_id = bet.id
    db.commit()
    return ScoutReport(username=target.username, **report)
