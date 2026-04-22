"""Grant or revoke admin on a user.

Usage:
    python make_admin.py <username>          # grant
    python make_admin.py <username> --revoke  # revoke
"""

from __future__ import annotations

import sys

from sqlalchemy import select

from app.db import SessionLocal
from app.models import User


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    username = sys.argv[1]
    revoke = "--revoke" in sys.argv[2:]

    db = SessionLocal()
    try:
        user = db.execute(select(User).where(User.username == username)).scalar_one_or_none()
        if not user:
            print(f"User '{username}' not found. Log in first to create the account.")
            return 2
        user.is_admin = not revoke
        db.commit()
        state = "REVOKED" if revoke else "GRANTED"
        print(f"Admin {state} for {username}")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
