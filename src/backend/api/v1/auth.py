from http import HTTPStatus

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies.db import get_db
from api.dependencies.rate_limit import limiter
from schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=HTTPStatus.CREATED,
    summary="Регистрация пользователя",
    description="Создаёт новый аккаунт. Email должен быть уникальным.",
)
@limiter.limit("5/minute")
async def register(
    request: Request,
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    return await auth_service.register_user(db, data)


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=HTTPStatus.OK,
    summary="Авторизация",
    description="Возвращает JWT access token по email и паролю.",
)
@limiter.limit("5/minute")
async def login(
    request: Request,
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    return await auth_service.login_user(db, data.email, data.password)
