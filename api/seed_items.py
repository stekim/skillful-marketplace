"""Seed the shop with game-like power-up items. Idempotent."""

from __future__ import annotations

from sqlalchemy import select

from app.db import SessionLocal
from app.models import Item


ITEMS = [
    {
        "slug": "lucky_charm",
        "name": "Lucky Charm",
        "description": "+10% winnings on your next bet win.",
        "price_cents": 15000,
        "effect_type": "lucky_charm",
        "effect_payload": {"bonus_pct": 10},
        "is_consumable": True,
    },
    {
        "slug": "insurance",
        "name": "Insurance Policy",
        "description": "Refund 50% of your stake if you lose your next bet.",
        "price_cents": 12000,
        "effect_type": "insurance",
        "effect_payload": {"refund_pct": 50},
        "is_consumable": True,
    },
    {
        "slug": "scout",
        "name": "Scout Report",
        "description": "Reveal an opponent's W/L record and average stake before accepting their bet.",
        "price_cents": 4000,
        "effect_type": "scout",
        "effect_payload": {},
        "is_consumable": True,
    },
    {
        "slug": "streak_freeze",
        "name": "Streak Freeze",
        "description": "Preserve your daily-login streak for one missed day.",
        "price_cents": 8000,
        "effect_type": "streak_freeze",
        "effect_payload": {},
        "is_consumable": True,
    },
    {
        "slug": "double_or_nothing",
        "name": "Double-or-Nothing Token",
        "description": "Offer to double the stake on an active bet; the other side must accept or forfeit 10%.",
        "price_cents": 10000,
        "effect_type": "double_or_nothing",
        "effect_payload": {"forfeit_pct": 10},
        "is_consumable": True,
    },
    {
        "slug": "whale_license",
        "name": "Whale License",
        "description": "Permanent. Raises your per-bet stake cap from $500 to $5000.",
        "price_cents": 50000,
        "effect_type": "whale_license",
        "effect_payload": {},
        "is_consumable": False,
    },
    {
        "slug": "house_edge",
        "name": "House Edge Coupon",
        "description": "If a bet goes to admin dispute, the tiebreak resolves in your favor.",
        "price_cents": 25000,
        "effect_type": "house_edge",
        "effect_payload": {},
        "is_consumable": True,
    },
    {
        "slug": "xp_boost",
        "name": "XP Boost",
        "description": "Next 3 bets grant 2x XP. Levels unlock extra item slots and cosmetic flair.",
        "price_cents": 6000,
        "effect_type": "xp_boost",
        "effect_payload": {"multiplier": 2, "uses": 3},
        "is_consumable": True,
    },
]


def seed() -> None:
    db = SessionLocal()
    try:
        for data in ITEMS:
            existing = db.execute(
                select(Item).where(Item.slug == data["slug"])
            ).scalar_one_or_none()
            if existing:
                existing.name = data["name"]
                existing.description = data["description"]
                existing.price_cents = data["price_cents"]
                existing.effect_type = data["effect_type"]
                existing.effect_payload = data["effect_payload"]
                existing.is_consumable = data["is_consumable"]
            else:
                db.add(Item(**data))
        db.commit()
        print(f"Seeded {len(ITEMS)} items")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
