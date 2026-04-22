from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import create_token
from app.db import get_db
from app.models import User
from app.schemas import LoginRequest, LoginResponse, UserOut


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    username = payload.username.strip()
    user = db.query(User).filter(User.username == username).one_or_none()
    if user is None:
        user = User(username=username, balance_cents=100000)
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_token(user.id)
    return LoginResponse(token=token, user=UserOut.model_validate(user))
