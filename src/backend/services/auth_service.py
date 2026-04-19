import logging
from datetime import datetime, timedelta, timezone
from http import HTTPStatus

import bcrypt
from fastapi import HTTPException
from jwt import PyJWTError as JWTError
from jwt import decode as jwt_decode
from jwt import encode as jwt_encode
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from models.user import User
from schemas.auth import RegisterRequest, TokenResponse, UserResponse

logger = logging.getLogger(__name__)


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {"sub": subject, "exp": expire}
    return jwt_encode(payload, settings.secret_key, algorithm=settings.algorithm)


async def register_user(db: AsyncSession, data: RegisterRequest) -> UserResponse:
    result = await db.execute(select(User).where(User.email == data.email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=HTTPStatus.CONFLICT, detail="Email уже зарегистрирован")

    user = User(
        email=data.email,
        hashed_password=_hash_password(data.password),
    )
    db.add(user)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=HTTPStatus.CONFLICT, detail="Email уже зарегистрирован")
    await db.refresh(user)
    logger.info("Registered new user: %s", user.email)
    return UserResponse.model_validate(user)


async def login_user(db: AsyncSession, email: str, password: str) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not _verify_password(password, user.hashed_password):
        raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED, detail="Неверный email или пароль")

    if not user.is_active:
        raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail="Аккаунт деактивирован")

    token = _create_access_token(str(user.id))
    logger.info("User logged in: %s", user.email)
    return TokenResponse(access_token=token)


async def get_user_from_token(db: AsyncSession, token: str) -> User:
    credentials_exception = HTTPException(
        status_code=HTTPStatus.UNAUTHORIZED,
        detail="Не удалось проверить учётные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt_decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise credentials_exception
    return user
