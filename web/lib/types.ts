export type Claim = "creator_wins" | "opponent_wins" | "draw";

export type BetStatus =
  | "open"
  | "active"
  | "pending_resolution"
  | "resolved"
  | "disputed"
  | "canceled";

export type User = {
  id: number;
  username: string;
  balance_cents: number;
  is_admin: boolean;
  daily_streak: number;
  last_daily_bonus_date: string | null;
  xp: number;
};

export type Bet = {
  id: number;
  creator_id: number;
  creator_username: string;
  opponent_id: number | null;
  opponent_username: string | null;
  title: string;
  description: string;
  stake_cents: number;
  status: BetStatus;
  creator_claim: Claim | null;
  opponent_claim: Claim | null;
  winner_id: number | null;
  resolved_by: "mutual" | "admin" | null;
  created_at: string;
  accepted_at: string | null;
  resolved_at: string | null;
};

export type Item = {
  id: number;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  effect_type: string;
  is_consumable: boolean;
};

export type UserItem = {
  id: number;
  item: Item;
  uses_remaining: number;
  acquired_at: string;
};

export type Transaction = {
  id: number;
  delta_cents: number;
  kind: string;
  reference_type: string | null;
  reference_id: number | null;
  note: string | null;
  created_at: string;
};

export type DailyBonusResult = {
  awarded_cents: number;
  new_balance_cents: number;
  streak: number;
  message: string;
};

export type ScoutReport = {
  username: string;
  wins: number;
  losses: number;
  draws: number;
  avg_stake_cents: number;
  total_bets: number;
};
