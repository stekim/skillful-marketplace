# Skillful Marketplace

A betting marketplace where users post "bets", others take them, winners split the pot, and
everyone starts with $1000 of virtual currency. Earn more with daily logins and wins,
then spend it on game-like power-ups in the shop.

- **Web** — Next.js App Router + TypeScript + Tailwind v4 (`web/`)
- **API** — FastAPI + SQLAlchemy + Alembic (`api/`)
- **DB** — local PostgreSQL (no Docker)

## Features

- Pick a username to sign in (stub auth, JWT). New users get $1000.
- Daily login bonus: $50 base, +$10 per consecutive day up to a 7-day streak.
- Post bets (title, description, stake). Stake is escrowed from your balance.
- Accept bets. Winner takes 2× stake. Draws refund both sides.
- **Mutual resolution**: both parties submit a winner claim. If they agree, the bet pays
  out. If they disagree, it flips to `disputed` and an admin decides.
- **Shop of power-ups**:
  - Lucky Charm — +10% winnings on next win
  - Insurance Policy — refund 50% of stake on next loss
  - Scout Report — reveal an opponent's W/L record before accepting
  - Streak Freeze — preserve your daily streak through one missed day
  - Double-or-Nothing Token — offer to double the stake mid-bet
  - Whale License — permanent; raises stake cap from $500 to $5000
  - House Edge Coupon — tiebreak resolves in your favor on disputes
  - XP Boost — 2× XP on next 3 bets

## Prerequisites (macOS)

- Homebrew
- Node.js 20+ with npm
- Python 3.11+
- PostgreSQL (any v14+)

## One-time setup

### 1. PostgreSQL

```bash
# Install and start if needed
brew install postgresql@14
brew services start postgresql@14

# Create the database (runs as your macOS user by default with Homebrew)
psql -d postgres -c "CREATE DATABASE skillful_marketplace;"
```

### 2. API

```bash
cd api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env   # already exists in dev; edit DATABASE_URL if your PG user differs

alembic upgrade head   # create tables
python seed_items.py   # seed the shop
```

The default `DATABASE_URL` assumes your macOS user owns the DB:
`postgresql+psycopg://<your-user>@localhost:5432/skillful_marketplace`.
Edit `api/.env` if yours differs.

### 3. Web

```bash
cd web
npm install
cp .env.local.example .env.local   # already set to http://127.0.0.1:8000
```

## Run it

In two terminals:

```bash
# Terminal 1 — API
cd api && source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

```bash
# Terminal 2 — Web
cd web && npm run dev
```

Open http://localhost:3000, pick a username, and you're in.

## Smoke test

```bash
# API health
curl http://127.0.0.1:8000/healthz
# -> {"status":"ok"}

# Create a user + get a token
curl -X POST http://127.0.0.1:8000/auth/login \
  -H 'content-type: application/json' -d '{"username":"alice"}'
```

## Grant admin

Log in once as a user (this creates the row), then:

```bash
cd api && source .venv/bin/activate
python make_admin.py alice            # grant
python make_admin.py alice --revoke   # revoke
```

Admins see an `Admin` link in the header and can resolve disputed bets at `/admin`.

## Data model (high level)

| Table | Purpose |
|-------|---------|
| `users` | username, `balance_cents`, `daily_streak`, `xp`, `is_admin` |
| `bets` | creator, opponent, stake, status (`open`/`active`/`pending_resolution`/`resolved`/`disputed`/`canceled`), claims, winner |
| `items` | shop catalog with `effect_type` + `effect_payload` JSON |
| `user_items` | user inventory with `uses_remaining` |
| `transactions` | append-only audit log of every balance change |

All money is tracked in integer cents. Balance mutations and `transactions`
inserts happen in the same DB transaction via
`api/app/services/bet_engine.py::adjust_balance`.

## Directory tree

```
skillful-marketplace/
├── api/                  # FastAPI + SQLAlchemy + Alembic
│   ├── alembic/
│   ├── app/
│   │   ├── routers/      # auth, me, bets, items, admin
│   │   └── services/     # bet_engine, daily_bonus
│   ├── seed_items.py
│   ├── make_admin.py
│   └── requirements.txt
├── web/                  # Next.js App Router + Tailwind
│   ├── app/              # /, /login, /bets/new, /bets/[id], /shop, /me, /admin
│   ├── components/
│   └── lib/              # api client, types, formatters
└── README.md
```

## Deploying

The repo is set up to deploy as **two Vercel projects** sharing the same git
repo: a Next.js front-end and a FastAPI Python Serverless Function back-end.
A managed Postgres lives separately (Neon free tier works well).

### 1. Provision Postgres on Neon

1. Sign up at https://console.neon.tech and create a project.
2. From the dashboard, copy the **pooled** connection string (uses PgBouncer,
   friendlier for serverless). Replace the leading `postgresql://` with
   `postgresql+psycopg://` so SQLAlchemy uses psycopg3.
3. Run migrations + seed against Neon from your laptop:

   ```bash
   cd api && source .venv/bin/activate
   DATABASE_URL='postgresql+psycopg://...neon-pooler...?sslmode=require' alembic upgrade head
   DATABASE_URL='postgresql+psycopg://...neon-pooler...?sslmode=require' python seed_items.py
   ```

### 2. Deploy the API to Vercel

1. Vercel → **Add New → Project** → import this repo.
2. Set **Root Directory** to `api`. Framework Preset can stay on auto.
3. Under **Environment Variables**, set (Production, Preview, Development):
   - `DATABASE_URL` — the Neon pooled URL (with `postgresql+psycopg://`)
   - `JWT_SECRET` — a random 32+ char secret
   - `CORS_ORIGINS` — comma-separated, e.g.
     `https://skillful-marketplace-six.vercel.app,https://skillful-marketplace-git-main-<team>.vercel.app`
4. Deploy. Note the API's URL (e.g. `https://skillful-marketplace-api.vercel.app`).
5. Verify: `curl https://<api-url>/healthz` should return `{"status":"ok"}`.

`api/vercel.json` rewrites every request to `api/api/index.py`, which exposes
the FastAPI ASGI app. `api/app/db.py` automatically uses `NullPool` when
`VERCEL=1` is set so cold-started function instances don't leak connections.

### 3. Wire the web project to the deployed API

1. Vercel → web project → **Settings → Environment Variables**.
2. Set `NEXT_PUBLIC_API_BASE` to your API's URL (no trailing slash) for all
   three environments. Redeploy.

### Granting admin in production

Open a Neon SQL console and run:

```sql
UPDATE users SET is_admin = true WHERE username = 'alice';
```

## Next improvements (not in v1)

- Real auth (password or OAuth), email verification
- External event oracles (sports APIs, crypto prices)
- Chat / comments on bets
- Anti-collusion and rate limiting
- Real money / payments
