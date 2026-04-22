---
name: fastapi
description: Conventions for the FastAPI API in api/. Use when adding routers, models, migrations, or business logic on the Python side.
---

# FastAPI conventions

- Always work inside the `api/.venv` virtualenv. Never install deps globally.
- App is split into:
  - `app/main.py` — FastAPI app, CORS, router includes
  - `app/config.py` — `pydantic-settings`, reads `.env`
  - `app/db.py` — SQLAlchemy engine, `SessionLocal`, `Base`, `get_db` dep
  - `app/models.py` — ORM models (SQLAlchemy 2.0 Mapped style)
  - `app/schemas.py` — Pydantic v2 request/response models
  - `app/auth.py` — JWT stub auth; `current_user` / `require_admin` deps
  - `app/routers/*.py` — one router per resource
  - `app/services/*.py` — business logic; DO NOT commit inside services, the router commits once at the end
- Currency is integer cents. Every balance change goes through `services.bet_engine.adjust_balance`, which also writes a `transactions` row.
- Migrations: `alembic revision --autogenerate -m "…"` then `alembic upgrade head`. Seed idempotently via `python seed_items.py`.
- Grant admin via `python make_admin.py <username>`.
- Env vars: `DATABASE_URL`, `JWT_SECRET`, `JWT_ALGORITHM`, `CORS_ORIGIN`.
