import uuid
from http import HTTPStatus

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies.auth import get_current_user
from api.dependencies.db import get_db
from models.user import User
from schemas.incident import IncidentResponse
from services import incident_service, monitor_service

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.get(
    "/",
    response_model=list[IncidentResponse],
    status_code=HTTPStatus.OK,
    summary="Список инцидентов",
    description=(
        "Возвращает инциденты по мониторам текущего пользователя. "
        "Опционально фильтрует по `monitor_id`."
    ),
)
async def list_incidents(
    monitor_id: str | None = Query(default=None, description="UUID монитора для фильтрации"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[IncidentResponse]:
    user_monitor_ids = await monitor_service.get_user_monitor_ids(db, current_user)

    filter_mid: uuid.UUID | None = None
    if monitor_id is not None:
        try:
            filter_mid = uuid.UUID(monitor_id)
        except ValueError:
            return []

    return await incident_service.list_incidents(db, list(user_monitor_ids), filter_mid)
