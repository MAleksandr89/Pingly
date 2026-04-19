from http import HTTPStatus

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies.auth import get_current_user
from api.dependencies.db import get_db
from models.user import User
from schemas.monitor import MonitorCreate, MonitorResponse, MonitorUpdate
from services import monitor_service

router = APIRouter(prefix="/monitors", tags=["monitors"])


@router.get(
    "/",
    response_model=list[MonitorResponse],
    status_code=HTTPStatus.OK,
    summary="Список мониторов",
    description="Возвращает все мониторы текущего пользователя.",
)
async def list_monitors(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MonitorResponse]:
    return await monitor_service.list_monitors(db, current_user)


@router.post(
    "/",
    response_model=MonitorResponse,
    status_code=HTTPStatus.CREATED,
    summary="Создать монитор",
    description="Создаёт новый монитор для текущего пользователя.",
)
async def create_monitor(
    data: MonitorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MonitorResponse:
    return await monitor_service.create_monitor(db, current_user, data)


@router.get(
    "/{monitor_id}",
    response_model=MonitorResponse,
    status_code=HTTPStatus.OK,
    summary="Детали монитора",
    description="Возвращает монитор по ID. Доступен только владельцу.",
)
async def get_monitor(
    monitor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MonitorResponse:
    return await monitor_service.get_monitor(db, monitor_id, current_user)


@router.put(
    "/{monitor_id}",
    response_model=MonitorResponse,
    status_code=HTTPStatus.OK,
    summary="Обновить монитор",
    description="Обновляет поля монитора. Переданы только изменяемые поля.",
)
async def update_monitor(
    monitor_id: str,
    data: MonitorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MonitorResponse:
    return await monitor_service.update_monitor(db, monitor_id, current_user, data)


@router.delete(
    "/{monitor_id}",
    status_code=HTTPStatus.NO_CONTENT,
    summary="Удалить монитор",
    description="Удаляет монитор и все связанные данные (checks, incidents).",
)
async def delete_monitor(
    monitor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    await monitor_service.delete_monitor(db, monitor_id, current_user)
