from __future__ import annotations

from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


Claim = Literal["creator_wins", "opponent_wins", "draw"]
BetStatus = Literal[
    "open", "active", "pending_resolution", "resolved", "disputed", "canceled"
]


class LoginRequest(BaseModel):
    username: str = Field(min_length=2, max_length=40, pattern=r"^[A-Za-z0-9_]+$")


class LoginResponse(BaseModel):
    token: str
    user: "UserOut"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    balance_cents: int
    is_admin: bool
    daily_streak: int
    last_daily_bonus_date: Optional[date]
    xp: int


class DailyBonusResult(BaseModel):
    awarded_cents: int
    new_balance_cents: int
    streak: int
    message: str


class BetCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(default="", max_length=2000)
    stake_cents: int = Field(ge=100)


class BetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    creator_id: int
    creator_username: str
    opponent_id: Optional[int]
    opponent_username: Optional[str]
    title: str
    description: str
    stake_cents: int
    status: str
    creator_claim: Optional[str]
    opponent_claim: Optional[str]
    winner_id: Optional[int]
    resolved_by: Optional[str]
    created_at: datetime
    accepted_at: Optional[datetime]
    resolved_at: Optional[datetime]


class ClaimRequest(BaseModel):
    claim: Claim


class ItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str
    description: str
    price_cents: int
    effect_type: str
    is_consumable: bool


class UserItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item: ItemOut
    uses_remaining: int
    acquired_at: datetime


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    delta_cents: int
    kind: str
    reference_type: Optional[str]
    reference_id: Optional[int]
    note: Optional[str]
    created_at: datetime


class AdminResolveRequest(BaseModel):
    winner: Claim


class ScoutReport(BaseModel):
    username: str
    wins: int
    losses: int
    draws: int
    avg_stake_cents: int
    total_bets: int


class EventIn(BaseModel):
    name: str = Field(min_length=1, max_length=64)
    path: Optional[str] = Field(default=None, max_length=500)
    session_id: Optional[str] = Field(default=None, max_length=64)
    properties: dict = Field(default_factory=dict)


class EventBatchIn(BaseModel):
    events: list[EventIn] = Field(min_length=1, max_length=50)
