from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.auth import require_admin
from app.db import get_db
from app.models import Bet, Item, User, UserItem
from app.schemas import AdminResolveRequest, BetOut
from app.services import bet_engine


router = APIRouter(prefix="/admin", tags=["admin"])


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


@router.get("/disputes", response_model=list[BetOut])
def list_disputes(
    admin: User = Depends(require_admin), db: Session = Depends(get_db)
) -> list[BetOut]:
    rows = (
        db.execute(
            select(Bet).where(Bet.status == "disputed").order_by(desc(Bet.created_at))
        )
        .scalars()
        .all()
    )
    return [_to_out(db, b) for b in rows]


@router.post("/bets/{bet_id}/resolve", response_model=BetOut)
def resolve_bet(
    bet_id: int,
    payload: AdminResolveRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> BetOut:
    bet = db.get(Bet, bet_id)
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")

    winner = payload.winner
    for pid in (bet.creator_id, bet.opponent_id):
        if not pid:
            continue
        coupon = (
            db.execute(
                select(UserItem)
                .join(Item)
                .where(
                    UserItem.user_id == pid,
                    UserItem.uses_remaining > 0,
                    Item.effect_type == "house_edge",
                )
                .limit(1)
            )
            .scalars()
            .first()
        )
        if coupon:
            winner = "creator_wins" if pid == bet.creator_id else "opponent_wins"
            coupon.uses_remaining -= 1
            if coupon.uses_remaining <= 0:
                coupon.consumed_in_bet_id = bet.id
            break

    bet_engine.admin_resolve(db, admin, bet, winner)
    db.commit()
    db.refresh(bet)
    return _to_out(db, bet)
